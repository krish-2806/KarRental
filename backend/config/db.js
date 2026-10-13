import mongoose from "mongoose";

let connectionPromise;

export const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return;
    }

    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is missing from environment variables");
    }

    if (!connectionPromise) {
        connectionPromise = mongoose.connect(process.env.MONGO_URI).catch((error) => {
            connectionPromise = undefined;
            throw error;
        });
    }

    await connectionPromise;
    console.log("MongoDB connected successfully");
};
