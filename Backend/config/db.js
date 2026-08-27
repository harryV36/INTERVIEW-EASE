import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("✅ MongoDB Connected (Local)");
    } catch (error) {
        console.log("❌ MongoDB Error:", error);
        process.exit(1);
    }
};

export default connectDB;

// This code connects to a MongoDB database using Mong