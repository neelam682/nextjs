// database/models/user.model.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export type PlanStatus =
    | "active"
    | "trialing"
    | "past_due"
    | "canceled"
    | "cancel_at_period_end"
    | "incomplete"
    | "incomplete_expired"
    | "unpaid"
    | "paused";

export interface IPlan {
    name: string; // price id or product id or friendly slug
    status: PlanStatus;
    currentPeriodEnd?: Date | undefined;
}

export interface IUser extends Document {
    clerkId: string;
    email: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    plan?: IPlan;
}

const PlanSchema = new Schema<IPlan>(
    {
        name: { type: String, default: "" },
        status: {
            type: String,
            enum: [
                "active",
                "trialing",
                "past_due",
                "canceled",
                "cancel_at_period_end",
                "incomplete",
                "incomplete_expired",
                "unpaid",
                "paused",
            ],
            default: "canceled",
        },
        currentPeriodEnd: { type: Date, default: undefined },
    },
    { _id: false }
);

const UserSchema = new Schema<IUser>(
    {
        clerkId: { type: String, required: true, unique: true },
        email: { type: String, required: true },
        username: String,
        firstName: String,
        lastName: String,
        stripeCustomerId: String,
        stripeSubscriptionId: String,
        plan: { type: PlanSchema, default: () => ({ name: "", status: "canceled" }) },
    },
    { timestamps: true }
);

// IMPORTANT: force collection name to "test" so we don't change where data sits
const collectionName = "test";

// use existing compiled model if present (prevents overwrite in dev/hot reload)
const User: Model<IUser> = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>("User", UserSchema, collectionName);

export default User;
