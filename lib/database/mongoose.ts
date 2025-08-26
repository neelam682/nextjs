import mongoose, { Mongoose } from "mongoose";

const MONGODB_URL = process.env.MONGODB_URL;

if (!MONGODB_URL) {
    throw new Error("Please define the MONGODB_URL environment variable");
}

interface MongooseConnection {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
}

// Use a global variable to persist connection across hot reloads in development
declare global {
    // eslint-disable-next-line no-var
    var mongooseGlobal: MongooseConnection | undefined;
}

const globalMongoose: MongooseConnection = global.mongooseGlobal ?? { conn: null, promise: null };

if (!global.mongooseGlobal) {
    global.mongooseGlobal = globalMongoose;
}

export const connectToDatabase = async (): Promise<Mongoose> => {
    if (globalMongoose.conn) return globalMongoose.conn;

    globalMongoose.promise = globalMongoose.promise ?? mongoose.connect(MONGODB_URL, {
        dbName: "nextjsd", // ✅ changed database name to match your cluster
        bufferCommands: false,
    });

    globalMongoose.conn = await globalMongoose.promise;
    return globalMongoose.conn;
};
