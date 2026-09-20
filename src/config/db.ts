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

  mongoose.connection.on("error", (error) => {
    console.error("MongoDB connection error:", error);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
    });

    console.log("database connected");
  } catch (err) {
    console.error("database connection error", err);
    throw err;
  }
}
