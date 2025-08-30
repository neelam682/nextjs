// lib/plans.ts
import { connectToDatabase } from "@/database/mongoose";
import mongoose from "mongoose";

export async function getFriendlyPlanNameByPriceId(priceId?: string) {
    if (!priceId) return null;
    await connectToDatabase();
    const db = mongoose.connection.db;
    const coll = db.collection("test");
    const p = await coll.findOne({ stripePriceId: priceId });
    return p?.name ?? null;
}
