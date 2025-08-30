// app/api/webhooks/stripe/route.ts
"use server";

import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { connectToDatabase } from "@/database/mongoose";
import { upsertUserByClerkId } from "@/lib/actions/user.actions";
import { Buffer } from "buffer";

export const runtime = "nodejs";

type SubscriptionMetadata = { clerkId?: string };

export async function POST(req: Request) {
    const sig = req.headers.get("stripe-signature") || "";
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error("Missing STRIPE_WEBHOOK_SECRET");
        return new Response("Webhook not configured", { status: 500 });
    }

    // raw buffer required for signature verification
    const buf = await req.arrayBuffer();
    const raw = Buffer.from(buf);

    let event;
    try {
        event = stripe.webhooks.constructEvent(raw, sig, webhookSecret);
    } catch (err: any) {
        console.error("Stripe signature verification failed:", err?.message ?? err);
        return new Response(`Webhook Error: ${err?.message ?? "invalid signature"}`, { status: 400 });
    }

    await connectToDatabase();

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;

                // retrieve with expand to get line_items + subscription (safer)
                const expanded = await stripe.checkout.sessions.retrieve(session.id as string, {
                    expand: ["line_items.data.price", "subscription"],
                });

                const clerkId = expanded.metadata?.clerkId ?? expanded.client_reference_id ?? "";
                const subscriptionId = typeof expanded.subscription === "string" ? expanded.subscription : undefined;
                const customerId = typeof expanded.customer === "string" ? expanded.customer : undefined;

                if (!clerkId) {
                    // Try to fallback: if customer exists try to find clerkId on customer metadata (not ideal)
                    if (customerId) {
                        const cust = await stripe.customers.retrieve(customerId);
                        if ((cust.metadata as any)?.clerkId) {
                            // set clerkId variable so upsert will find the correct document
                            // but we don't want to proceed if neither metadata nor session provide it
                            // we will still upsert by stripeCustomerId in subscription events
                        }
                    }
                }

                const priceId = expanded.line_items?.data?.[0]?.price?.id ?? "";

                // If clerkId available, upsert user doc with basic plan info
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
                    // no clerkId: try to update by stripeCustomerId to preserve data
                    // find user by stripeCustomerId and set subscription if possible
                    // (we can't upsert clerkId here because we don't know it)
                    // This keeps DB consistent even for edge-cases
                    // Note: upsertUserByClerkId requires clerkId, so fallback to direct model update:
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
                // try metadata clerkId first
                const metadata = (subscription.metadata ?? {}) as SubscriptionMetadata;
                let clerkId = metadata.clerkId;

                // fallback: try customer metadata
                if (!clerkId && subscription.customer) {
                    const cust = (await stripe.customers.retrieve(subscription.customer as string)) as Stripe.Customer;
                    clerkId = (cust.metadata as Record<string, string> | undefined)?.clerkId;
                }

                // derive priceId from first item
                const firstItem = subscription.items?.data?.[0];
                const priceId = firstItem ? (typeof firstItem.price === "string" ? firstItem.price : firstItem.price.id) : "";

                const currentPeriodNumber = (subscription as unknown as { current_period_end?: number }).current_period_end;
                const currentPeriodEnd = currentPeriodNumber ? new Date(currentPeriodNumber * 1000) : undefined;

                const planUpdate = {
                    name: priceId,
                    status: subscription.status as any,
                    currentPeriodEnd,
                };

                if (clerkId) {
                    await upsertUserByClerkId(clerkId, {
                        stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : undefined,
                        stripeSubscriptionId: subscription.id,
                        plan: planUpdate,
                    });
                } else {
                    // fallback to update by stripeCustomerId or stripeSubscriptionId
                    const User = (await import("@/database/models/user.model")).default;
                    const filter = subscription.customer
                        ? { stripeCustomerId: subscription.customer as string }
                        : { stripeSubscriptionId: subscription.id };
                    const res = await User.findOneAndUpdate(filter, {
                        $set: {
                            stripeSubscriptionId: subscription.id,
                            "plan.name": planUpdate.name,
                            "plan.status": planUpdate.status,
                            "plan.currentPeriodEnd": planUpdate.currentPeriodEnd,
                        }
                    }, { new: true });

                    if (!res) {
                        // upsert by stripeSubscriptionId so we don't lose info
                        await User.findOneAndUpdate({ stripeSubscriptionId: subscription.id }, {
                            $set: {
                                stripeSubscriptionId: subscription.id,
                                "plan.name": planUpdate.name,
                                "plan.status": planUpdate.status,
                                "plan.currentPeriodEnd": planUpdate.currentPeriodEnd,
                            }
                        }, { upsert: true });
                    }
                }

                break;
            }

            case "invoice.payment_succeeded": {
                const invoice = event.data.object as Stripe.Invoice;
                const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : undefined;
                if (subscriptionId) {
                    const sub = await stripe.subscriptions.retrieve(subscriptionId);
                    const priceId = sub.items?.data?.[0]?.price?.id ?? "";
                    const currentPeriodNumber = (sub as unknown as { current_period_end?: number }).current_period_end;
                    const currentPeriodEnd = currentPeriodNumber ? new Date(currentPeriodNumber * 1000) : undefined;

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
                // ignore other events
                break;
        }

        return new Response(JSON.stringify({ received: true }), { status: 200 });
    } catch (err) {
        console.error("Webhook processing error:", err);
        return new Response("internal error", { status: 500 });
    }
}
