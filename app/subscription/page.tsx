// app/subscription/page.tsx
import React from "react";
import { auth } from "@clerk/nextjs";
import { getUserByClerkId } from "@/lib/actions/user.actions";
import { PRICE_IDS } from "@/utils/stripe-prices"; // you said you have this

function friendlyNameFromPriceId(priceId?: string) {
    if (!priceId) return "none";
    const entry = Object.entries(PRICE_IDS).find(([, id]) => id === priceId);
    return entry ? entry[0] : priceId;
}

export default async function Page() {
    const { userId } = auth();
    if (!userId) return <div>Please sign in</div>;

    const user = await getUserByClerkId(userId);
    if (!user) return <div>No user found</div>;

    const plan = user.plan || { name: "", status: "canceled" };

    return (
        <main style={{ padding: 24 }}>
            <h1>Subscription</h1>
            <p>Plan: {friendlyNameFromPriceId(plan.name) || "none"}</p>
            <p>Price ID: {plan.name || "—"}</p>
            <p>Status: {plan.status}</p>
            <p>Current period ends: {plan.currentPeriodEnd ? new Date(plan.currentPeriodEnd).toLocaleString() : "—"}</p>
        </main>
    );
}
