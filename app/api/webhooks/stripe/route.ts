// app/api/webhooks/stripe/route.ts
"use server";

import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { connectToDatabase } from "@/database/mongoose";
import { upsertUserByClerkId } from "@/lib/actions/user.actions";
import { Buffer } from "buffer";
import Stripe from "stripe";

export const runtime = "nodejs";

type SubscriptionMetadata = { clerkId?: string };

export async function POST(req: Request) {
    const sig = req.headers.get("stripe-signature") ?? "";
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error("Missing STRIPE_WEBHOOK_SECRET");
        return new Response("Webhook not configured", { status: 500 });
    }

    // raw buffer required for signature verification
    const buf = await req.arrayBuffer();
    const raw = Buffer.from(buf);

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(raw, sig, webhookSecret);
    } catch (err: unknown) {
        const message =
            err instanceof Error ? err.message : "Invalid signature";
        console.error("Stripe signature verification failed:", message);
        return new Response(`Webhook Error: ${message}`, { status: 400 });
    }

    await connectToDatabase();

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                const expanded = await stripe.checkout.sessions.retrieve(session.id, {
                    expand: ["line_items.data.price", "subscription"],
                });

                const clerkId =
                    expanded.metadata?.clerkId ?? expanded.client_reference_id ?? "";
                const subscriptionId =
                    typeof expanded.subscription === "string"
                        ? expanded.subscription
                        : expanded.subscription?.id;
                const customerId =
                    typeof expanded.customer === "string" ? expanded.customer : undefined;

                const priceId = expanded.line_items?.data?.[0]?.price?.id ?? "";

                if (clerkId) {
                    await upsertUserByClerkId(clerkId, {
                        stripeCustomerId: customerId,
                        stripeSubscriptionId: subscriptionId,
                        plan: {
                            name: priceId,
                            status: "active",
                            currentPeriodEnd: undefined,
                        },
                    });
                } else if (customerId) {
                    const User = (await import("@/database/models/user.model")).default;
                    await User.findOneAndUpdate(
                        { stripeCustomerId: customerId },
                        {
                            $set: {
                                stripeSubscriptionId: subscriptionId,
                                "plan.name": priceId,
                                "plan.status": "active",
                            },
                        },
                        { upsert: false }
                    );
                }

                break;
            }

            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                const metadata = subscription.metadata as SubscriptionMetadata;
                let clerkId = metadata?.clerkId;

                if (!clerkId && typeof subscription.customer === "string") {
                    const cust = (await stripe.customers.retrieve(
                        subscription.customer
                    )) as Stripe.Customer;
                    clerkId = cust.metadata?.clerkId;
                }

                const firstItem = subscription.items?.data?.[0];
                const priceId =
                    firstItem && typeof firstItem.price !== "string"
                        ? firstItem.price.id
                        : firstItem?.price ?? "";

                const currentPeriodEnd = subscription.current_period_end
                    ? new Date(subscription.current_period_end * 1000)
                    : undefined;

                const planUpdate = {
                    name: priceId,
                    status: subscription.status,
                    currentPeriodEnd,
                };

                if (clerkId) {
                    await upsertUserByClerkId(clerkId, {
                        stripeCustomerId:
                            typeof subscription.customer === "string"
                                ? subscription.customer
                                : undefined,
                        stripeSubscriptionId: subscription.id,
                        plan: planUpdate,
                    });
                } else {
                    const User = (await import("@/database/models/user.model")).default;
                    const filter =
                        typeof subscription.customer === "string"
                            ? { stripeCustomerId: subscription.customer }
                            : { stripeSubscriptionId: subscription.id };

                    const res = await User.findOneAndUpdate(filter, {
                        $set: {
                            stripeSubscriptionId: subscription.id,
                            "plan.name": planUpdate.name,
                            "plan.status": planUpdate.status,
                            "plan.currentPeriodEnd": planUpdate.currentPeriodEnd,
                        },
                    });

                    if (!res) {
                        await User.findOneAndUpdate(
                            { stripeSubscriptionId: subscription.id },
                            {
                                $set: {
                                    stripeSubscriptionId: subscription.id,
                                    "plan.name": planUpdate.name,
                                    "plan.status": planUpdate.status,
                                    "plan.currentPeriodEnd": planUpdate.currentPeriodEnd,
                                },
                            },
                            { upsert: true }
                        );
                    }
                }

                break;
            }

            case "invoice.payment_succeeded": {
                const invoice = event.data.object as Stripe.Invoice;
                const subscriptionId =
                    typeof invoice.subscription === "string" ? invoice.subscription : undefined;

                if (subscriptionId) {
                    const sub = await stripe.subscriptions.retrieve(subscriptionId);
                    const priceId = sub.items?.data?.[0]?.price?.id ?? "";
                    const currentPeriodEnd = sub.current_period_end
                        ? new Date(sub.current_period_end * 1000)
                        : undefined;

                    const User = (await import("@/database/models/user.model")).default;
                    await User.findOneAndUpdate(
                        { stripeSubscriptionId: subscriptionId },
                        {
                            $set: {
                                "plan.name": priceId,
                                "plan.status": sub.status,
                                "plan.currentPeriodEnd": currentPeriodEnd,
                            },
                        },
                        { upsert: true }
                    );
                }
                break;
            }

            default:
                break;
        }

        return new Response(JSON.stringify({ received: true }), { status: 200 });
    } catch (err: unknown) {
        console.error("Webhook processing error:", err);
        return new Response("internal error", { status: 500 });
    }
}
