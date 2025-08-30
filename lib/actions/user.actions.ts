// lib/actions/user.actions.ts
"use server";

import { connectToDatabase } from "@/database/mongoose";
import User, { IUser } from "@/database/models/user.model";

type UpdateUserData = {
    email?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
};

// createUser (existing)
export async function createUser(data: {
    clerkId: string;
    email: string;
    username?: string;
    firstName?: string;
    lastName?: string;
}) {
    await connectToDatabase();
    const user = await User.create(data);
    return user;
}

export async function updateUser(clerkId: string, updateData: UpdateUserData) {
    await connectToDatabase();
    const user = await User.findOneAndUpdate({ clerkId }, updateData, {
        new: true,
    });
    return user;
}

export async function deleteUser(clerkId: string) {
    await connectToDatabase();
    await User.findOneAndDelete({ clerkId });
    return { success: true };
}

export async function getUserByClerkId(clerkId: string) {
    await connectToDatabase();
    return User.findOne({ clerkId });
}

export async function setStripeCustomerForUser(clerkId: string, stripeCustomerId: string) {
    await connectToDatabase();
    return User.findOneAndUpdate({ clerkId }, { $set: { stripeCustomerId } }, { new: true, upsert: true });
}

/**
 * Upsert user by clerkId with subscription/customer info.
 * Accepts partial updates. This is used by the webhook.
 */
export async function upsertUserByClerkId(
    clerkId: string,
    update: Partial<{
        stripeCustomerId?: string | undefined;
        stripeSubscriptionId?: string | undefined;
        plan?: IUser["plan"] | undefined;
    }>
) {
    await connectToDatabase();
    const setObj:  = {};
    if (update.stripeCustomerId !== undefined) setObj.stripeCustomerId = update.stripeCustomerId;
    if (update.stripeSubscriptionId !== undefined) setObj.stripeSubscriptionId = update.stripeSubscriptionId;
    if (update.plan !== undefined) setObj.plan = update.plan;

    // upsert so user doc exists
    return User.findOneAndUpdate({ clerkId }, { $set: setObj }, { new: true, upsert: true });
}
