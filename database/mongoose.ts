import mongoose, { Mongoose } from "mongoose";

const MONGODB_URL = process.env.MONGODB_URL as string;

if (!MONGODB_URL) {
    throw new Error("Please add MONGODB_URL in .env.local");
}

interface MongooseConnection {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
}

// Extend NodeJS.Global type so TS knows about our cached connection
declare global {
    // eslint-disable-next-line no-var
    var mongooseCache: MongooseConnection | undefined;
}

let cached: MongooseConnection = global.mongooseCache || {
    conn: null,
    promise: null,
};

export async function connectToDatabase(): Promise<Mongoose> {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URL).then((mongoose) => mongoose);
    }

    cached.conn = await cached.promise;
    global.mongooseCache = cached; // store in global to reuse across hot reloads

    return cached.conn;
}
