// app/api/create-checkout-session/route.ts
"use server";

import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { connectToDatabase } from "@/database/mongoose";
import User from "@/database/models/user.model";

export async function POST(req: Request) {
    try {
        const { userId } = getAuth(); // server-side
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { priceId } = body as { priceId?: string };
        if (!priceId) return NextResponse.json({ error: "priceId required" }, { status: 400 });

        await connectToDatabase();
        const user = await User.findOne({ clerkId: userId });

        let customerId = user?.stripeCustomerId;
        if (!customerId) {
            const clerkEmail = user?.email ?? undefined;
            const customer = await stripe.customers.create({
                metadata: { clerkId: userId },
                email: clerkEmail,
            });
            customerId = customer.id;
            if (user) {
                user.stripeCustomerId = customerId;
                await user.save();
            } else {
                // create minimal user record in test collection (safe)
                await User.create({ clerkId: userId, email: clerkEmail ?? "", stripeCustomerId: customerId });
            }
        }

        const successUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/confirm?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/plans`;

        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            customer: customerId,
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: { clerkId: userId },
        });

        return NextResponse.json({ url: session.url });
    } catch (err) {
        console.error("create-checkout-session error:", err);
        return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
}
