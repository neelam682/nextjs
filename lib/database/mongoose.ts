import mongoose, { Mongoose } from "mongoose";

const MONGODB_URL = process.env.MONGODB_URL;

interface MongooseConnection {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
}

let chaged: MongooseConnection = (global as any).mongoose;

if (!chaged) {
    chaged = (global as any).mongoose = { conn: null, promise: null };
}

export const connectToDatabase = async () => {
    if (chaged.conn) {
        return chaged.conn;
    }

    if (!chaged.promise) return chaged.conn;

    if (!MONGODB_URL) {
        throw new Error("Please define the MONGODB_URI environment variable");
    }

    chaged.promise =
        chaged.promise ||
        mongoose.connect(MONGODB_URL, {
            dbName: "nextjs",
            bufferCommands: false
        })

    chaged.conn = await chaged.promise;

    return chaged.conn;
}
