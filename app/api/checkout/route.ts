import { NextResponse } from "next/server";
import Stripe from "stripe";
import { PRICE_IDS } from "@/utils/stripe-prices";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
});

type CheckoutBody = {
    plan: string;
    clerkUserId: string;
};

export async function POST(req: Request) {
    try {
        const body: CheckoutBody = await req.json();
        const { plan, clerkUserId } = body;

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

        const session: Stripe.Checkout.Session = await stripe.checkout.sessions.create({
            mode: "subscription",
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
            client_reference_id: clerkUserId,
            subscription_data: {
                metadata: { clerkUserId },
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Stripe checkout error:", error.message);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }
        console.error("Unknown Stripe checkout error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
