import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";

import { createUser, CreateUserParams } from "@/lib/actions/user.action";
import { connectToDatabase } from "@/lib/database/mongoose"; // ✅ import connectToDatabase

export async function POST(req: Request) {
    const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    if (!CLERK_WEBHOOK_SECRET) {
        throw new Error("CLERK_WEBHOOK_SECRET is not defined");
    }

    const payload = await req.text();
    const h = await headers(); // headers() returns Promise<ReadonlyHeaders>
    const svix_id = h.get("svix-id");
    const svix_timestamp = h.get("svix-timestamp");
    const svix_signature = h.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return NextResponse.json({ message: "Missing svix headers" }, { status: 400 });
    }

    const wh = new Webhook(CLERK_WEBHOOK_SECRET);
    let evt: WebhookEvent;

    try {
        evt = wh.verify(payload, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent;
    } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
    }

    try {
        const eventType = evt.type;

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

            // ✅ ensure DB connection before saving user
            await connectToDatabase();
            await createUser(newUser);

            return NextResponse.json({ message: "User created" }, { status: 200 });
        }

        if (eventType === "user.updated") {
            return NextResponse.json({ message: "User updated" }, { status: 200 });
        }

        if (eventType === "user.deleted") {
            return NextResponse.json({ message: "User deleted" }, { status: 200 });
        }

        return NextResponse.json({ message: "Unhandled event" }, { status: 200 });
    } catch (error) {
        console.error("Error handling Clerk webhook:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}
