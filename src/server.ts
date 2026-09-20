import "dotenv/config";

import app from "./app.js";
import connectDB from "./config/db.js";

const handler = async (req: any, res: any) => {
  try {
    await connectDB();

    return app(req, res);
  } catch (error) {
    console.error("MongoDB connection failed:", error);

    return res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
};

export default handler;
