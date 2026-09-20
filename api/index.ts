import "dotenv/config";
import app from "../src/app.js";
import connectDB from "../src/config/db.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

let isConnected = false;

export default async function handler(req: any, res: any) {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
  return app(req, res);
}
