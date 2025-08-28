"use server";

import { connectToDatabase } from "@/database/mongoose";
import User from "@/database/models/user.model";

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

export async function updateUser(clerkId: string, updateData: any) {
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
