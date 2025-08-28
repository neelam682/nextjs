import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createUser, deleteUser, updateUser } from "@/lib/actions/user.actions";

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        console.error("❌ Missing Clerk signing secret");
        return new NextResponse("Server error", { status: 500 });
    }

    const payload = await req.text();
    const headerPayload = await headers();
    console.log("📩 Payload received:", payload);
    const svix_id = headerPayload.get("svix-id")!;
    const svix_timestamp = headerPayload.get("svix-timestamp")!;
    const svix_signature = headerPayload.get("svix-signature")!;

    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEvent;

    try {
        evt = wh.verify(payload, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,

        }) as WebhookEvent;
    } catch (err) {
        return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }

    const eventType = evt.type;

    if (eventType === "user.created") {
        const { id, email_addresses, username, first_name, last_name } = evt.data;

        await createUser({
            clerkId: id,
            email: email_addresses[0].email_address,
            username: username || "",
            firstName: first_name || "",
            lastName: last_name || "",
        });
    }

    if (eventType === "user.updated") {
        const { id, email_addresses, username, first_name, last_name } = evt.data;
        console.log("🔄 Updating user:", evt.data.id);
        await updateUser(id, {
            email: email_addresses[0].email_address,
            username: username || "",
            firstName: first_name || "",
            lastName: last_name || "",
        });
    }

    if (eventType === "user.deleted") {
        const { id } = evt.data as { id: string }; // 👈 cast to expected shape
        console.log("🔄 Updating user:", evt.data.id);
        await deleteUser(id);
    }


    return NextResponse.json({ status: "ok" });
}
