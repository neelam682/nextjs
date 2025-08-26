"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type SubscriptionEvent = {
    id: number;
    type: string;
    data: any;
    created_at: string;
};

export function useSubscription() {
    const { user } = useUser();
    const [plan, setPlan] = useState<string>("Starter");
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState<SubscriptionEvent[]>([]);
    const supabase = createClientComponentClient();

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchSubscriptionData = async () => {
            setLoading(true);

            try {
                // Fetch current subscription plan
                const { data: subscriptionData, error: subscriptionError } = await supabase
                    .from("subscriptions")
                    .select("plan")
                    .eq("clerk_user_id", user.id)
                    .maybeSingle();

                if (!subscriptionError && subscriptionData?.plan) {
                    setPlan(subscriptionData.plan);
                }

                // Fetch recent subscription events for this user
                const { data: eventsData, error: eventsError } = await supabase
                    .from("webhook_events")
                    .select("*")
                    .or(`type.eq.customer.subscription.created,type.eq.customer.subscription.updated,type.eq.customer.subscription.deleted`)
                    .contains('data', { customer: user.id }) // Assumes customer ID matches Clerk user ID
                    .order("created_at", { ascending: false })
                    .limit(10);

                if (!eventsError && eventsData) {
                    setEvents(eventsData);
                } else if (eventsError) {
                    console.error("Error fetching subscription events:", eventsError);
                }
            } catch (err) {
                console.error("Error in subscription hook:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSubscriptionData();
    }, [user, supabase]);

    return {
        plan,
        loading,
        events,
        isSubscribed: plan !== "Starter" && plan !== "Pro" && plan !== "Enterprise", // Adjust based on your plans
    };
}