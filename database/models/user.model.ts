import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
    clerkId: string;
    email: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    stripeCustomerId?: string;
    plan?: {
        name: string; // e.g., "basic", "pro", "enterprise"
        status: string; // "active", "canceled", "trialing"
        currentPeriodEnd?: Date; // when the plan ends
    };
}

const UserSchema = new Schema<IUser>(
    {
        clerkId: { type: String, required: true, unique: true },
        email: { type: String, required: true },
        username: { type: String },
        firstName: { type: String },
        lastName: { type: String },
        stripeCustomerId: { type: String },
        plan: {
            name: { type: String, default: "free" },
            status: { type: String, default: "inactive" },
            currentPeriodEnd: { type: Date },
        },
    },
    { timestamps: true }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default User;

