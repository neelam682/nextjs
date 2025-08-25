"use server";

import { revalidatePath } from "next/cache";
import User from "../database/models/user.model";
import { connectToDatabase } from "../database/mongoose";

// Define the type for a new user
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

// CREATE
export async function createUser(user: CreateUserParams) {
    try {
        await connectToDatabase();

        const newUser = await User.create(user);

        return JSON.parse(JSON.stringify(newUser));
    } catch (error) {
        console.error(error);
        throw error; // Re-throw to propagate the error properly
    }
}
