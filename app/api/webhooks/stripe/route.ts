import { NextResponse } from "next/server";
import Stripe from "stripe";
import { connectToDatabase } from "@/database/mongoose";
import User, { IUser } from "@/database/models/user.model";

// Initialize Stripe with API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {

});

// Helper type for Stripe subscription metadata
interface SubscriptionMetadata {
    clerkUserId?: string;
}

export async function POST(req: Request) {
    const sig = req.headers.get("stripe-signature");
    const body = await req.text();

    if (!sig) {
        return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err) {
        console.error("❌ Stripe webhook signature verification failed", err);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    try {
        await connectToDatabase();

        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;

                // Expand line_items to get price.id
                const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
                    expand: ["line_items.data.price"]
                });

                const clerkId = expandedSession.metadata?.clerkUserId;
                if (!clerkId) break;

                const lineItemPriceId =
                    (expandedSession.line_items?.data[0]?.price?.id as string) || null;

                await User.findOneAndUpdate(
                    { clerkId },
                    {
                        stripeCustomerId: expandedSession.customer as string,
                        stripeSubscriptionId: expandedSession.subscription as string,
                        plan: {
                            name: lineItemPriceId,
                            status: "active",
                            currentPeriodEnd: null, // will update on subscription update
                        },
                    },
                    { upsert: true, new: true }
                );

                break;
            }

            case "customer.subscription.created":
            case "customer.subscription.updated": {
                const subscription = event.data.object as Stripe.Subscription;
                const metadata = subscription.metadata as SubscriptionMetadata;
                const clerkId = metadata.clerkUserId;

                if (!clerkId) break;

                await User.findOneAndUpdate(
                    { clerkId },
                    {
                        stripeCustomerId: subscription.customer as string,
                        stripeSubscriptionId: subscription.id,
                        plan: {
                            name: subscription.items.data[0]?.price.id || null,
                            status: subscription.status as IUser["plan"]["status"],
                            currentPeriodEnd: subscription.current_period_end
                                ? new Date(subscription.current_period_end * 1000)
                                : null,
                        },
                    },
                    { upsert: true, new: true }
                );
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                const metadata = subscription.metadata as SubscriptionMetadata;
                const clerkId = metadata.clerkUserId;

                if (!clerkId) break;

                await User.findOneAndUpdate(
                    { clerkId },
                    {
                        plan: { name: null, status: "canceled", currentPeriodEnd: null },
                        stripeSubscriptionId: null,
                    }
                );
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("❌ Stripe webhook processing error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
