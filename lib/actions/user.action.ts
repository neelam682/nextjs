"use server";

import User from "../database/models/user.model";
import { connectToDatabase } from "../database/mongoose";

export interface CreateUserParams {
    clerkId: string;
    email: string;
    username?: string;
    photo?: string;
    plan?: "basic" | "pro" | "enterprise";
    subscriptionStatus?: "active" | "canceled" | "trialing" | "past_due" | "incomplete";
    subscriptionId?: string;
    currentPeriodEnd?: Date;
}

export async function createUser(user: CreateUserParams) {
    try {
        await connectToDatabase();

        const newUser = await User.create(user);

        return newUser.toObject(); // safer than JSON.parse(JSON.stringify())
    } catch (error) {
        console.error("Error creating user:", error);
        throw error; // propagate error properly
    }
}
