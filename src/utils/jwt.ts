import jwt, { Secret, SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { Response } from "express";
import { env } from "../config/env.js";

export interface JwtUserPayload {
  userId: string;
  role: "customer" | "seller" | "admin";
  sessionId?: string;
  [key: string]: unknown;
}

export const generateAccessToken = (payload: JwtUserPayload): string => {
  const secret: Secret = env.jwtSecret;
  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as unknown as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, secret, options);
};

export const verifyAccessToken = (token: string): JwtUserPayload => {
  const secret: Secret = env.jwtSecret;
  return jwt.verify(token, secret) as JwtUserPayload;
};

export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const generateSecurityToken = (): {
  rawToken: string;
  hashedToken: string;
} => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = hashToken(rawToken);
  return { rawToken, hashedToken };
};

export const setRefreshCookie = (res: Response, refreshToken: string): void => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
    priority: "high",
    maxAge: env.refreshTokenExpiresInMs,
  });
};

export const clearRefreshCookie = (res: Response): void => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
  });
};
