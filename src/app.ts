import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import errorHandler from "./middleware/errorHandler.js";
import AppError from "./error/AppError.js";
import { execFile } from "child_process";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
  }),
);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "server is running",
  });
});

app.use(errorHandler);

export default app;
