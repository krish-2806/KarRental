import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            return;
        }

        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI environment variable is missing");
        }

        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        throw error;
    }
};
