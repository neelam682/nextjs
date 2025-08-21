'use client';

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Naveitems from "./Naveitems";
import {
    SignInButton,
    SignedIn,
    SignedOut,
    UserButton,
    useUser,
} from "@clerk/nextjs";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const Navbar = () => {
    const { user } = useUser();
    const [plan, setPlan] = useState<string>("Starter"); // default plan
    const supabase = createClientComponentClient();

    useEffect(() => {
        if (!user) return;

        const fetchSubscription = async () => {
            const { data, error } = await supabase
                .from("subscriptions")
                .select("plan")
                .eq("clerk_user_id", user.id)
                .maybeSingle(); // single because we expect 1 row per user

            if (error) {
                console.error("Error fetching subscription:", error.message);
            } else if (data?.plan) {
                setPlan(data.plan);
            }
        };

        fetchSubscription();
    }, [user]);

    return (
        <nav className="navbar">
            <Link href="/">
                <div className="flex items-center gap-2.5 cursor-pointer">
                    <Image src="/images/logo.svg" alt="logo" width={46} height={44} />
                </div>
            </Link>

            <div className="flex items-center gap-8">
                <Naveitems />

                {/* Show dynamic plan from Supabase */}
                <div className="text-sm font-semibold text-orange-500">
                    Plan: {plan}
                </div>

                <SignedOut>
                    <SignInButton>
                        <button className="btn-signin">Sign In</button>
                    </SignInButton>
                </SignedOut>

                <SignedIn>
                    <UserButton afterSignOutUrl="/" />
                </SignedIn>
            </div>
        </nav>
    );
};

export default Navbar;



