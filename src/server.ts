import "dotenv/config";

import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log("server is online on port " + PORT);
    });
  } catch (error) {
    console.error("Server startup failed because MongoDB could not connect");
    process.exit(1);
  }
}

startServer();
