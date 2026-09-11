import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { User, UserRole } from "../models/user.model.js";
import { Session } from "../models/session.model.js";
import AppError from "../error/AppError.js";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(
      new AppError(
        401,
        "UNAUTHORIZED",
        "Authentication required. Please provide a valid Bearer token.",
      ),
    );
  }

  const token = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    return next(
      new AppError(401, "INVALID_TOKEN", "Invalid or expired access token"),
    );
  }

  if (decoded.sessionId) {
    const session = await Session.findById(decoded.sessionId);
    if (!session || session.revoked_at || session.expires_at <= new Date()) {
      return next(
        new AppError(401, "INVALID_SESSION", "Session expired or revoked"),
      );
    }
  }

  const user = await User.findById(decoded.userId);
  if (!user || !user.isActive) {
    return next(
      new AppError(
        401,
        "USER_INACTIVE",
        "User account is invalid or deactivated",
      ),
    );
  }

  const userIdStr = user._id.toString();
  req.auth = {
    userId: userIdStr,
    role: user.role,
    sessionId: decoded.sessionId,
  };

  req.user = {
    id: userIdStr,
    email: user.email,
    name: user.name,
    role: user.role,
    isEmailConfirmed: user.isEmailConfirmed,
    isActive: user.isActive,
  };

  next();
};

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, "UNAUTHORIZED", "Authentication required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          403,
          "FORBIDDEN",
          `Forbidden. Access restricted to: ${allowedRoles.join(", ")}`,
        ),
      );
    }

    next();
  };
};
