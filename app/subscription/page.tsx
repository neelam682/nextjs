"use client"; // make this a client component

import React from "react";

const plans = [
    { name: "Starter", price: "$9/mo", features: ["Basic features", "Email support", "Single user"] },
    { name: "Pro", price: "$29/mo", features: ["All Starter features", "Priority support", "Up to 5 users"], popular: true },
    { name: "Enterprise", price: "$99/mo", features: ["All Pro features", "Dedicated manager", "Unlimited users"] },
];

export default function PricingPlans() {
    const handleCheckout = async (planName: string) => {
        const res = await fetch("/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plan: planName }),
        });
        const data = await res.json();
        if (data.url) {
            window.location.href = data.url;
        } else {
            alert("Checkout failed");
        }
    };

    return (
        <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Choose Your Plan</h2>
            <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {plans.map((plan) => (
                    <div key={plan.name} className={`bg-white rounded-2xl shadow-lg p-8 flex flex-col justify-between hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 relative ${plan.popular ? "border-2 border-orange-500" : ""}`}>
                        {plan.popular && (
                            <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-orange-500 text-white text-sm font-semibold px-4 py-1 rounded-full shadow-md">
                                Most Popular
                            </span>
                        )}
                        <div>
                            <h3 className="text-xl font-semibold mb-4">{plan.name}</h3>
                            <p className="text-4xl font-bold mb-6">{plan.price}</p>
                            <ul className="space-y-3 mb-8">
                                {plan.features.map((f, i) => (
                                    <li key={i} className="text-gray-600 flex items-center">
                                        <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <button onClick={() => handleCheckout(plan.name)} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg w-full transition-colors">
                            Choose Plan
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

