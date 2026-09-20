import mongoose from "mongoose";

let cached = (global as any).mongooseConn;

if (!cached) {
  cached = (global as any).mongooseConn = {
    conn: null,
    promise: null,
  };
}

const connectDB = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URL!)
      .then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

export default connectDB;
