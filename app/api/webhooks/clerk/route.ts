// app/api/webhooks/stripe/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { connectToDatabase } from "@/database/mongoose";
import { upsertUserByClerkId } from "@/lib/actions/user.actions";
import User, { IUser } from "@/database/models/user.model";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {

});

type SubscriptionMetadata = { clerkUserId?: string };

export async function POST(req: Request) {
    // get raw body string
    const raw = await req.text();
    // get signature header
    const sig = req.headers.get("stripe-signature");
    if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET as string);
    } catch (err) {
        console.error("Stripe signature verification failed:", err);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // connect DB
    await connectToDatabase();

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;

                // expand to get line_items + subscription data if needed
                const expanded = await stripe.checkout.sessions.retrieve(session.id as string, {
                    expand: ["line_items.data.price", "subscription"],
                });

                // clerk id can be in session.metadata, client_reference_id, or subscription metadata
                const clerkFromSession = expanded.metadata?.clerkUserId ?? expanded.client_reference_id ?? "";
                const subscriptionId = expanded.subscription as string | undefined;
                const customerId = typeof expanded.customer === "string" ? expanded.customer : undefined;

                if (!clerkFromSession) break;

                // create or update user with customer & basic plan info
                const priceId = expanded.line_items?.data?.[0]?.price?.id ?? "";
                const planUpdate: IUser["plan"] = {
                    name: priceId,
                    status: "active",
                    currentPeriodEnd: undefined,
                };

                await upsertUserByClerkId(clerkFromSession, {
                    stripeCustomerId: customerId,
                    stripeSubscriptionId: subscriptionId,
                    plan: planUpdate,
                });

                break;
            }

            case "customer.subscription.created":
            case "customer.subscription.updated": {
                const subscription = event.data.object as Stripe.Subscription;
                // subscription.metadata is where we set clerkUserId in subscription_data.metadata at checkout
                const metadata = (subscription.metadata ?? {}) as SubscriptionMetadata;
                let clerkId = metadata.clerkUserId;

                // If clerkId not on subscription metadata, try to get it from customer metadata
                if (!clerkId && subscription.customer) {
                    const customer = (await stripe.customers.retrieve(subscription.customer as string)) as Stripe.Customer;
                    clerkId = (customer.metadata as Record<string, string> | undefined)?.clerkUserId;
                }

                if (!clerkId) break;

                // careful extraction of first price id:
                const firstItem = subscription.items?.data && subscription.items.data.length > 0 ? subscription.items.data[0] : undefined;
                const priceId = firstItem && typeof firstItem.price === "object" && "id" in firstItem.price ? firstItem.price.id : "";

                // current_period_end possibly number | null; coerce safely
                const currentPeriodNumber = (subscription as unknown as { current_period_end?: number }).current_period_end;
                const planUpdate: IUser["plan"] = {
                    name: priceId,
                    status: subscription.status as IUser["plan"]["status"],
                    currentPeriodEnd: currentPeriodNumber ? new Date(currentPeriodNumber * 1000) : undefined,
                };

                await upsertUserByClerkId(clerkId, {
                    stripeCustomerId: subscription.customer as string,
                    stripeSubscriptionId: subscription.id,
                    plan: planUpdate,
                });

                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                const metadata = (subscription.metadata ?? {}) as SubscriptionMetadata;
                let clerkId = metadata.clerkUserId;
                if (!clerkId && subscription.customer) {
                    const customer = (await stripe.customers.retrieve(subscription.customer as string)) as Stripe.Customer;
                    clerkId = (customer.metadata as Record<string, string> | undefined)?.clerkUserId;
                }
                if (!clerkId) break;

                const planUpdate: IUser["plan"] = { name: "", status: "canceled", currentPeriodEnd: undefined };

                await upsertUserByClerkId(clerkId, {
                    stripeSubscriptionId: undefined,
                    plan: planUpdate,
                });

                break;
            }

            default:
                // ignore other events
                break;
        }

        return NextResponse.json({ received: true });
    } catch (err) {
        console.error("Webhook processing error:", err);
        return NextResponse.json({ error: "Webhook handler error" }, { status: 500 });
    }
}
