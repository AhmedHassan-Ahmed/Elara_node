import mongoose from "mongoose";
import { env } from "./env.js";

export default function connectDB() {
  mongoose
    .connect(env.mongodbUri as string)
    .then(() => console.log("database connected"))
    .catch((err) => console.log("database connection error", err));
}
