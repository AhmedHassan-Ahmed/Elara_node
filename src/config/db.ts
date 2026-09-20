import mongoose from "mongoose";
import { env } from "./env.js";

const mongoUri = env.mongodbUri?.trim();

if (!mongoUri) {
  throw new Error(
    "MONGODB_URI / MONGO_URL is not set. Add your MongoDB connection string to the server environment.",
  );
}

mongoose.set("bufferCommands", false);
mongoose.set("strictQuery", true);

let cached = globalThis as typeof globalThis & {
  mongoose?: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

if (!cached.mongoose) {
  cached.mongoose = {
    conn: null,
    promise: null,
  };
}

export default async function connectDB() {
  if (cached.mongoose!.conn) {
    return cached.mongoose!.conn;
  }

  if (!cached.mongoose!.promise) {
    console.log("MongoDB: connecting...");

    cached.mongoose!.promise = mongoose
      .connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        retryWrites: true,
      })
      .then((mongoose) => {
        console.log("MongoDB: connected");
        return mongoose;
      })
      .catch((error) => {
        console.error("MongoDB: CONNECTION FAILED");
        console.error(error);

        cached.mongoose!.promise = null;

        throw error;
      });
  }

  cached.mongoose!.conn = await cached.mongoose!.promise;

  return cached.mongoose!.conn;
}
