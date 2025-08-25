import { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
    {
        clerkId: { type: String, required: true, unique: true }, // from Clerk auth
        email: { type: String, required: true, unique: true },

        // Profile info (optional but useful)
        username: { type: String },
        photo: { type: String },

        // Subscription info
        plan: {
            type: String,
            enum: ["basic", "pro", "enterprise"], // your 3 plans
            default: "basic",
        },
        subscriptionStatus: {
            type: String,
            enum: ["active", "canceled", "trialing", "past_due", "incomplete"],
            default: "basic", // if free plan, treat as "free"
        },
        subscriptionId: { type: String }, // from Stripe/your billing provider
        currentPeriodEnd: { type: Date }, // when their billing cycle ends

    },
    { timestamps: true }
);

const User = models.User || model("User", UserSchema);

export default User;
