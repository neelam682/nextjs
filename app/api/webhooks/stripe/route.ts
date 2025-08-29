import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPlan {
    name: string | null;          // e.g., "Pro", "Basic"
    status: "active" | "trialing" | "past_due" | "canceled" | "incomplete" | "incomplete_expired" | "unpaid" | "paused";
    currentPeriodEnd?: Date | null;
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
        name: { type: String, default: null },
        status: {
            type: String,
            enum: ["active", "trialing", "past_due", "canceled", "incomplete", "incomplete_expired", "unpaid", "paused"],
            default: "canceled",
        },
        currentPeriodEnd: { type: Date, default: null },
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
        plan: { type: PlanSchema, default: () => ({ name: null, status: "canceled", currentPeriodEnd: null }) },
    },
    { timestamps: true }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default User;
