import { Request, Response } from "express";
import * as authService from "../services/auth.service.js";
import { sendSuccess } from "../utils/response.js";
import { setRefreshCookie, clearRefreshCookie } from "../utils/jwt.js";
import AppError from "../error/AppError.js";
import { env } from "../config/env.js";

export const register = async (req: Request, res: Response): Promise<void> => {
  const result = await authService.registerCustomer(req.body);
  sendSuccess(res, 201, result.message, { user: result.user });
};

export const registerSeller = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await authService.registerSeller(req.body);
  sendSuccess(res, 201, result.message, { user: result.user });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const result = await authService.login(req.body);
  setRefreshCookie(res, result.refreshToken);
  sendSuccess(res, 200, "Login successful", {
    accessToken: result.accessToken,
    user: result.user,
  });
};

export const initiateGoogleAuth = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const role = (req.query.role as "customer" | "seller") || "customer";
  const nonce = (await import("crypto")).randomBytes(16).toString("hex");

  const stateData = JSON.stringify({
    nonce,
    role,
    createdAt: Date.now(),
  });

  res.cookie("g_oauth_state", stateData, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: env.oauthStateExpiresInMs,
  });

  const authUrl = authService.generateGoogleAuthUrl(role, nonce);
  res.redirect(authUrl);
};

export const handleGoogleCallback = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (req.query.error) {
    const errorMsg = req.query.error as string;
    if (req.headers.accept?.includes("application/json")) {
      throw new AppError(
        400,
        "OAUTH_DENIED",
        `Google OAuth access denied: ${errorMsg}`,
      );
    }
    return res.redirect(
      `${env.frontendUrl || "http://localhost:3000"}/login?error=${encodeURIComponent(errorMsg)}`,
    );
  }

  const code = req.query.code as string;
  const state = req.query.state as string;

  const rawStateCookie = req.cookies?.g_oauth_state;
  if (!rawStateCookie)
    throw new AppError(
      400,
      "INVALID_STATE",
      "OAuth state session cookie missing or expired",
    );

  let stateData: {
    nonce: string;
    role: "customer" | "seller";
    createdAt: number;
  };
  try {
    stateData =
      typeof rawStateCookie === "string"
        ? JSON.parse(rawStateCookie)
        : rawStateCookie;
  } catch {
    throw new AppError(400, "INVALID_STATE", "OAuth state format is invalid");
  }

  if (
    !stateData ||
    stateData.nonce !== state ||
    Date.now() - stateData.createdAt > env.oauthStateExpiresInMs
  )
    throw new AppError(
      400,
      "INVALID_STATE",
      "OAuth state parameter mismatch or expired",
    );

  res.clearCookie("g_oauth_state");

  const result = await authService.processGoogleOAuthCallback(
    code,
    stateData.role,
  );

  setRefreshCookie(res, result.refreshToken);

  if (req.headers.accept?.includes("application/json")) {
    sendSuccess(res, 200, "Google authentication successful", {
      accessToken: result.accessToken,
      user: result.user,
    });
    return;
  }

  const configuredFrontendUrl = env.frontendUrl || "http://localhost:3000";
  let baseUrl = `${configuredFrontendUrl.replace(/\/$/, "")}/login-success`;

  if (process.env.NODE_ENV !== "production") {
    if (configuredFrontendUrl.includes("dev-success")) {
      baseUrl = configuredFrontendUrl;
    } else if (
      configuredFrontendUrl.includes("localhost:3000") ||
      configuredFrontendUrl.includes("127.0.0.1:3000")
    ) {
      baseUrl = "/dev-success.html";
    }
  }

  res.redirect(baseUrl);
};

export const confirmEmail = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { token } = req.body;
  const result = await authService.confirmEmail(token);
  sendSuccess(res, 200, result.message);
};

export const me = async (req: Request, res: Response): Promise<void> => {
  if (!req.user)
    throw new AppError(401, "UNAUTHORIZED", "Unauthenticated request");

  const user = await authService.getMe(req.user.id);
  sendSuccess(res, 200, "User profile retrieved successfully", { user });
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  const refreshTokenCookie = req.cookies?.refreshToken;
  const sessionId = req.auth?.sessionId;

  await authService.logout(sessionId, refreshTokenCookie);
  clearRefreshCookie(res);

  sendSuccess(res, 200, "Logout successful");
};

export const refreshToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const token = (req.cookies?.refreshToken || req.body?.refreshToken) as string;
  const result = await authService.refreshAuthToken(token);
  setRefreshCookie(res, result.refreshToken);

  sendSuccess(res, 200, "Token refreshed successfully", {
    accessToken: result.accessToken,
    user: result.user,
  });
};

export const forgotPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { email } = req.body;
  const result = await authService.requestPasswordReset(email);
  sendSuccess(res, 200, result.message);
};

export const resetPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { token, password } = req.body;
  const result = await authService.submitNewPassword(token, password);
  sendSuccess(res, 200, result.message);
};

export const resendVerification = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { email } = req.body;
  const result = await authService.resendVerification(email);
  sendSuccess(res, 200, result.message);
};
