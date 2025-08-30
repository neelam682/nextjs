"use server"; // add this at the top

import { connectToDatabase } from "@/database/mongoose";

export async function getFriendlyPlanNameByPriceId(priceId?: string) {
    if (!priceId) return null;
    const db = (await connectToDatabase()).connection?.db ?? (await connectToDatabase()).db;
    const coll = (await connectToDatabase()).connection?.db?.collection("test") || (await connectToDatabase()).db.collection("test");
    const p = await coll.findOne({ stripePriceId: priceId });
    return p?.name ?? null;
}
