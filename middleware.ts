// middleware.ts (at project root)
import { clerkMiddleware } from "@clerk/nextjs/server";

// 1️⃣ Export Clerk middleware
export default clerkMiddleware({
    // Optional hooks: afterAuth, beforeAuth, etc.
    // Example:
    // afterAuth: (req) => {
    //   console.log("User is authenticated:", req.auth.userId);
    // },
});

// 2️⃣ Configure matcher and public routes
export const config = {
    matcher: [
        // Protect everything except _next internals, static files, favicon, and public routes
        '/((?!_next/static|_next/image|favicon.ico|api/webhooks/clerk|$).*)',
        // Always run for API routes (optional, if you want all other APIs protected)
        '/(api|trpc)(.*)',
    ],
};
