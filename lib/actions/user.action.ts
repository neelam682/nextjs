"use server";

import { revalidatePath } from "next/cache";

import User from "../database/models/user.model";
import { connectToDatabase } from "../database/mongoose";


// CREATE
export async function createUser(user: any) {
    try {
        await connectToDatabase();

        const newUser = await User.create(user);

        return JSON.parse(JSON.stringify(newUser));
    } catch (error) {
        console.log(error);
    }
}

