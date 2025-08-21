import { NextResponse } from "next/server";
import Stripe from "stripe";
import { PRICE_IDS } from "@/utils/stripe-prices";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as { plan: string; clerkUserId: string };
        const { plan, clerkUserId } = body;



        // Map frontend plan names to Stripe price IDs
        const priceMap: Record<string, string> = {
            Starter: PRICE_IDS.starter,
            Pro: PRICE_IDS.pro,
            Enterprise: PRICE_IDS.enterprise,
        };

        const priceId = priceMap[plan];
        if (!priceId) {
            return NextResponse.json(
                { error: "Invalid plan selected" },
                { status: 400 }
            );
        }

        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,

            // Clerk User ID
            client_reference_id: clerkUserId,

            // Put in metadata too (so subscription carries it forward)
            subscription_data: {
                metadata: { clerkUserId },
            },
        });


        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error("Stripe checkout error:", error.message);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
