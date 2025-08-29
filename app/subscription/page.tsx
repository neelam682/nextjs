"use client";

import { useState } from "react";

const plans = [
    { name: "starter", price: "$10/mo", description: "Good for starters" },
    { name: "pro", price: "$30/mo", description: "For professionals" },
    { name: "enterprise", price: "$99/mo", description: "Best for big teams" },
];

export default function SubscriptionPage() {
    const [loading, setLoading] = useState<string | null>(null);

    const handleSubscribe = async (plan: string) => {
        try {
            setLoading(plan);

            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    plan,
                    clerkUserId: (window as any).Clerk?.user?.id, // or pass via server side
                }),
            });

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("Something went wrong");
            }
        } catch (err) {
            console.error(err);
            alert("Checkout failed");
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-12">
            <h1 className="text-3xl font-bold text-center mb-8">Choose a Plan</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <div
                        key={plan.name}
                        className="p-6 rounded-2xl shadow-md border flex flex-col items-center"
                    >
                        <h2 className="text-xl font-semibold capitalize">{plan.name}</h2>
                        <p className="text-gray-600">{plan.description}</p>
                        <p className="text-2xl font-bold mt-4">{plan.price}</p>
                        <button
                            onClick={() => handleSubscribe(plan.name)}
                            disabled={loading === plan.name}
                            className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading === plan.name ? "Redirecting..." : "Subscribe"}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
