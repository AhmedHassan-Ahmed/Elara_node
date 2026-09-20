import mongoose from "mongoose";
import { env } from "./env.js";

export default async function connectDB() {
  const mongoUri = env.mongodbUri?.trim();

  if (!mongoUri) {
    throw new Error(
      "MONGODB_URI / MONGO_URL is not set. Add your MongoDB connection string to the server environment.",
    );
  }

  mongoose.set("bufferCommands", false);
  mongoose.set("strictQuery", true);

  try {
    console.log("MongoDB: connecting...");

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
    });

    console.log("MongoDB: connected");
  } catch (error) {
    console.error("MongoDB: CONNECTION FAILED");
    console.error(error);
    throw error;
  }
}
