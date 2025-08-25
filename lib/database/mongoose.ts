import mongoose, { Mongoose } from "mongoose";

const MONGODB_URL = process.env.MONGODB_URL;

interface MongooseConnection {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
}

// Use a global variable to persist connection across hot reloads
declare global {
    // eslint-disable-next-line no-var
    var mongoose: MongooseConnection | undefined;
}

let chaged: MongooseConnection = global.mongoose ?? { conn: null, promise: null };

if (!global.mongoose) {
    global.mongoose = chaged;
}

export const connectToDatabase = async (): Promise<Mongoose> => {
    if (chaged.conn) return chaged.conn;

    if (!MONGODB_URL) {
        throw new Error("Please define the MONGODB_URI environment variable");
    }

    chaged.promise =
        chaged.promise ??
        mongoose.connect(MONGODB_URL, {
            dbName: "nextjs",
            bufferCommands: false,
        });

    chaged.conn = await chaged.promise;
    return chaged.conn;
};
