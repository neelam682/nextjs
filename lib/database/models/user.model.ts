import { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
    {
        clerkId: { type: String, required: true, unique: true }, // from Clerk
        email: { type: String, required: true, unique: true },

        // Profile info
        username: { type: String },
        photo: { type: String },

        // Plan (your logic: free/basic/pro/enterprise)
        plan: {
            type: String,
            enum: ["free", "pro", "enterprise"],
            default: "free",
        },

        // Subscription info (from Stripe)
        subscriptionStatus: {
            type: String,
            enum: [
                "active",
                "canceled",
                "trialing",
                "past_due",
                "incomplete",
                "incomplete_expired",
                "unpaid"
            ],
            default: null,
        },
        subscriptionId: { type: String },
        currentPeriodEnd: { type: Date },
    },
    { timestamps: true }
);

// ✅ explicitly specify collection "users"
const User = models.User || model("User", UserSchema, "users");

export default User;
