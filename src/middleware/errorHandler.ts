import { Request, Response, NextFunction } from "express";

import AppError from "../error/AppError.js";

export default function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof AppError)
    return res.status(err.status).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });

  console.error("Unexpected error:", err);

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal Server Error",
      details: [],
    },
  });
}
