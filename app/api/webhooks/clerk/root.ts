import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";

import { createUser, CreateUserParams } from "@/lib/actions/user.action";

export async function POST(req: Request) {
    console.log("Webhook POST hit"); // ✅ log entry point

    const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    if (!CLERK_WEBHOOK_SECRET) {
        console.error("CLERK_WEBHOOK_SECRET is not defined");
        return NextResponse.json({ message: "CLERK_WEBHOOK_SECRET not set" }, { status: 500 });
    }

    try {
        // 1. Read request body
        const payload = await req.text();
        console.log("Payload received:", payload);

        // 2. Get headers synchronously
        const h = await headers();
        const svix_id = h.get("svix-id");
        const svix_timestamp = h.get("svix-timestamp");
        const svix_signature = h.get("svix-signature");

        if (!svix_id || !svix_timestamp || !svix_signature) {
            console.error("Missing Svix headers", { svix_id, svix_timestamp, svix_signature });
            return NextResponse.json({ message: "Missing svix headers" }, { status: 400 });
        }

        // 3. Verify webhook signature
        const wh = new Webhook(CLERK_WEBHOOK_SECRET);
        let evt: WebhookEvent;

        try {
            evt = wh.verify(payload, {
                "svix-id": svix_id,
                "svix-timestamp": svix_timestamp,
                "svix-signature": svix_signature,
            }) as WebhookEvent;
            console.log("Signature verified successfully");
        } catch (err) {
            console.error("Webhook signature verification failed:", err);
            return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
        }

        // 4. Handle different Clerk events
        const eventType = evt.type;
        console.log("Event type:", eventType);

        if (eventType === "user.created") {
            const { id, email_addresses, username, image_url } = evt.data as {
                id: string;
                email_addresses?: { email_address: string }[];
                username?: string;
                image_url?: string;
            };

            const newUser: CreateUserParams = {
                clerkId: id,
                email: email_addresses?.[0]?.email_address || "",
                username: username || "",
                photo: image_url || "",
            };

            try {
                const result = await createUser(newUser);
                console.log("User created successfully:", result);
            } catch (err) {
                console.error("Error creating user in DB:", err);
                return NextResponse.json({ message: "DB error" }, { status: 500 });
            }

            return NextResponse.json({ message: "User created" }, { status: 200 });
        }

        // other events
        console.log("Unhandled event type:", eventType);
        return NextResponse.json({ message: "Unhandled event" }, { status: 200 });

    } catch (error) {
        console.error("Error handling Clerk webhook:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}
