import mongoose from "mongoose";

export const connectDB = async () => {
    await mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected successfully"))
    .catch((error) => console.error("Error connecting to MongoDB:", error));
}