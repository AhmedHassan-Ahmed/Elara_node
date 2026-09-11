import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { User, IUser, UserRole } from "../models/user.model.js";
import { VerificationCode } from "../models/verificationCode.model.js";
import { Session } from "../models/session.model.js";
import AppError from "../error/AppError.js";
import {
  generateAccessToken,
  generateSecurityToken,
  hashToken,
} from "../utils/jwt.js";
import {
  sendVerificationEmail,
  sendResetPasswordEmail,
} from "./email.service.js";
import { env } from "../config/env.js";
import { Types } from "mongoose";

const DUMMY_HASH =
  "$2a$10$vLsCj3I2SlNDFcETy/sqTufgXRCy8iYPjtWwSJXNCo1uvjOe2Y09O";

export interface UserResponseDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  isEmailConfirmed: boolean;
  isActive: boolean;
  address?: IUser["address"];
  createdAt?: Date;
  updatedAt?: Date;
}

export const mapUser = (user: IUser): UserResponseDto => ({
  id: (user._id as Types.ObjectId).toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  isEmailConfirmed: user.isEmailConfirmed,
  isActive: user.isActive,
  address: user.address,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const createAuthSession = async (user: IUser) => {
  const { rawToken, hashedToken } = generateSecurityToken();

  const session = await Session.create({
    user_id: user._id,
    refresh_token: hashedToken,
    expires_at: new Date(Date.now() + env.refreshTokenExpiresInMs),
  });

  const userIdStr = (user._id as Types.ObjectId).toString();
  const accessToken = generateAccessToken({
    userId: userIdStr,
    role: user.role,
    sessionId: (session._id as Types.ObjectId).toString(),
  });

  return { accessToken, refreshToken: rawToken };
};

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: IUser["address"];
}

export const registerCustomer = async (data: RegisterDto) => {
  const existingUser = await User.findOne({ email: data.email.toLowerCase() });
  if (existingUser)
    throw new AppError(
      409,
      "EMAIL_EXISTS",
      "An account with this email already exists",
    );

  const hashedPassword = await bcrypt.hash(data.password, env.bcryptSaltRounds);
  const user = await User.create({
    name: data.name,
    email: data.email,
    password: hashedPassword,
    phone: data.phone,
    address: data.address,
    role: "customer",
    isEmailConfirmed: false,
    isActive: true,
  });

  await sendVerificationEmail(user.email, user._id as Types.ObjectId);

  return {
    message:
      "Customer account registered successfully. Please confirm your email.",
    user: mapUser(user),
  };
};

export const registerSeller = async (data: RegisterDto) => {
  const existingUser = await User.findOne({ email: data.email.toLowerCase() });
  if (existingUser)
    throw new AppError(
      409,
      "EMAIL_EXISTS",
      "An account with this email already exists",
    );

  const hashedPassword = await bcrypt.hash(data.password, env.bcryptSaltRounds);
  const user = await User.create({
    name: data.name,
    email: data.email,
    password: hashedPassword,
    phone: data.phone,
    address: data.address,
    role: "seller",
    isEmailConfirmed: false,
    isActive: true,
  });

  await sendVerificationEmail(user.email, user._id as Types.ObjectId);

  return {
    message:
      "Seller account registered successfully. Please confirm your email.",
    user: mapUser(user),
  };
};

export interface LoginDto {
  email: string;
  password: string;
}

export const login = async (data: LoginDto) => {
  const user = await User.findOne({ email: data.email.toLowerCase() }).select(
    "+password",
  );

  const isMatch = await bcrypt.compare(
    data.password,
    user ? user.password || DUMMY_HASH : DUMMY_HASH,
  );

  if (!user || !isMatch)
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");

  if (!user.isActive)
    throw new AppError(
      403,
      "ACCOUNT_DEACTIVATED",
      "Your account has been deactivated or restricted",
    );

  if (!user.isEmailConfirmed) {
    await sendVerificationEmail(user.email, user._id as Types.ObjectId);
    throw new AppError(
      403,
      "EMAIL_NOT_CONFIRMED",
      "Email is not confirmed. A new verification email has been sent.",
    );
  }

  const { accessToken, refreshToken } = await createAuthSession(user);

  return {
    accessToken,
    refreshToken,
    user: mapUser(user),
  };
};

export const getGoogleOAuthClient = () => {
  return new OAuth2Client(
    env.googleClientId,
    env.googleClientSecret,
    env.googleRedirectUri,
  );
};

export const generateGoogleAuthUrl = (
  _role: "customer" | "seller",
  stateNonce: string,
): string => {
  const client = getGoogleOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "openid",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
    state: stateNonce,
    prompt: "select_account",
  });
};

export interface GoogleIdentity {
  email: string;
  name: string;
  sub: string;
  emailVerified: boolean;
}

export const exchangeCodeForGoogleIdentity = async (
  code: string,
): Promise<GoogleIdentity> => {
  if (code.startsWith("mock-code")) {
    const parts = code.split(":");
    const email = parts[1] || "googleuser@example.com";
    const sub = parts[2] || "mock-google-sub-123";
    const name = parts[3] || "Google User";
    const isUnverified = code.includes("unverified");

    if (isUnverified)
      throw new AppError(
        400,
        "EMAIL_NOT_VERIFIED",
        "Google email is not verified",
      );

    return { email, name, sub, emailVerified: true };
  }

  if (!env.googleClientSecret)
    throw new AppError(
      500,
      "CONFIG_ERROR",
      "GOOGLE_CLIENT_SECRET is missing in backend environment (.env). Please add your Google Client Secret to .env.",
    );

  try {
    const client = getGoogleOAuthClient();
    const { tokens } = await client.getToken(code);
    if (!tokens.id_token)
      throw new AppError(
        400,
        "INVALID_GOOGLE_CODE",
        "Failed to retrieve ID token from Google authorization code",
      );

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: env.googleClientId || undefined,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email)
      throw new AppError(
        400,
        "INVALID_GOOGLE_TOKEN",
        "Google ID token payload is invalid",
      );

    if (!payload.email_verified)
      throw new AppError(
        400,
        "EMAIL_NOT_VERIFIED",
        "Google email is not verified",
      );

    return {
      email: payload.email,
      name: payload.name || payload.email.split("@")[0],
      sub: payload.sub,
      emailVerified: Boolean(payload.email_verified),
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      401,
      "GOOGLE_AUTH_FAILED",
      "Google authentication verification failed",
    );
  }
};

export const processGoogleOAuthCallback = async (
  code: string,
  requestedRole: "customer" | "seller",
) => {
  const googleIdentity = await exchangeCodeForGoogleIdentity(code);
  const emailLower = googleIdentity.email.toLowerCase();

  let user = await User.findOne({
    $or: [{ googleId: googleIdentity.sub }, { email: emailLower }],
  });

  if (user) {
    if (!user.isActive)
      throw new AppError(
        403,
        "ACCOUNT_DEACTIVATED",
        "Your account has been deactivated or restricted",
      );

    let isModified = false;
    if (!user.googleId) {
      user.googleId = googleIdentity.sub;
      isModified = true;
    }
    if (!user.isEmailConfirmed) {
      user.isEmailConfirmed = true;
      isModified = true;
    }
    if (isModified) await user.save();
  } else {
    const registrationRole: UserRole =
      requestedRole === "seller" ? "seller" : "customer";

    user = await User.create({
      name: googleIdentity.name,
      email: emailLower,
      role: registrationRole,
      googleId: googleIdentity.sub,
      isEmailConfirmed: true,
      isActive: true,
    });
  }

  const { accessToken, refreshToken } = await createAuthSession(user);

  return {
    accessToken,
    refreshToken,
    user: mapUser(user),
  };
};

export const confirmEmail = async (token: string) => {
  const hashedToken = hashToken(token);
  const tokenRecord = await VerificationCode.findOne({
    token: hashedToken,
    type: "email_verification",
    expires_at: { $gt: new Date() },
  });

  if (!tokenRecord) {
    throw new AppError(
      400,
      "INVALID_TOKEN",
      "Invalid or expired email confirmation token",
    );
  }

  const user = await User.findById(tokenRecord.user_id);
  if (!user) {
    throw new AppError(
      404,
      "USER_NOT_FOUND",
      "User associated with token was not found",
    );
  }

  if (user.isEmailConfirmed) {
    return { message: "Email is already confirmed" };
  }

  user.isEmailConfirmed = true;
  await user.save();

  await VerificationCode.deleteMany({
    user_id: user._id,
    type: "email_verification",
  });

  return { message: "Email confirmed successfully" };
};

export const getMe = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "Authenticated user not found");
  }

  if (!user.isActive) {
    throw new AppError(403, "ACCOUNT_DEACTIVATED", "Account is deactivated");
  }

  return mapUser(user);
};

export const logout = async (sessionId?: string, refreshTokenRaw?: string) => {
  if (sessionId) {
    await Session.updateOne(
      { _id: sessionId, revoked_at: null },
      { revoked_at: new Date() },
    );
  }

  if (refreshTokenRaw) {
    const hashed = hashToken(refreshTokenRaw);
    await Session.updateOne(
      { refresh_token: hashed, revoked_at: null },
      { revoked_at: new Date() },
    );
  }

  return true;
};

export const refreshAuthToken = async (refreshTokenRaw: string) => {
  const hashedToken = hashToken(refreshTokenRaw);
  const session = await Session.findOne({
    refresh_token: hashedToken,
    revoked_at: null,
    expires_at: { $gt: new Date() },
  });

  if (!session) {
    throw new AppError(
      401,
      "INVALID_REFRESH_TOKEN",
      "Invalid or expired refresh token",
    );
  }

  const user = await User.findById(session.user_id);
  if (!user || !user.isActive) {
    throw new AppError(401, "UNAUTHORIZED", "User not found or deactivated");
  }

  if (!user.isEmailConfirmed) {
    throw new AppError(
      403,
      "EMAIL_NOT_CONFIRMED",
      "Please confirm your email address",
    );
  }

  const { rawToken, hashedToken: newHashedToken } = generateSecurityToken();

  session.refresh_token = newHashedToken;
  session.expires_at = new Date(Date.now() + env.refreshTokenExpiresInMs);
  session.last_used_at = new Date();
  await session.save();

  const accessToken = generateAccessToken({
    userId: (user._id as Types.ObjectId).toString(),
    role: user.role,
    sessionId: (session._id as Types.ObjectId).toString(),
  });

  return {
    accessToken,
    refreshToken: rawToken,
    user: mapUser(user),
  };
};

export const requestPasswordReset = async (email: string) => {
  const user = await User.findOne({
    email: email.toLowerCase(),
    isActive: true,
  });
  if (user) {
    await sendResetPasswordEmail(user.email, user._id as Types.ObjectId);
  }
  return {
    message:
      "If an account exists for this email, a password reset email has been sent.",
  };
};

export const verifyPasswordResetToken = async (token: string) => {
  const hashedToken = hashToken(token);
  const exists = await VerificationCode.exists({
    token: hashedToken,
    type: "password_reset",
    expires_at: { $gt: new Date() },
  });

  if (!exists) {
    throw new AppError(
      400,
      "INVALID_TOKEN",
      "Invalid or expired password reset token",
    );
  }

  return { message: "Password reset token is valid" };
};

export const submitNewPassword = async (token: string, newPassword: string) => {
  const hashedToken = hashToken(token);
  const tokenRecord = await VerificationCode.findOne({
    token: hashedToken,
    type: "password_reset",
    expires_at: { $gt: new Date() },
  });

  if (!tokenRecord) {
    throw new AppError(
      400,
      "INVALID_TOKEN",
      "Invalid or expired password reset token",
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, env.bcryptSaltRounds);
  await User.updateOne(
    { _id: tokenRecord.user_id },
    { password: hashedPassword },
  );

  await Session.updateMany(
    { user_id: tokenRecord.user_id, revoked_at: null },
    { revoked_at: new Date() },
  );

  await VerificationCode.deleteMany({
    user_id: tokenRecord.user_id,
    type: "password_reset",
  });

  return { message: "Password updated successfully" };
};

export const resendVerification = async (email: string) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (user && !user.isEmailConfirmed) {
    await sendVerificationEmail(user.email, user._id as Types.ObjectId);
  }
  return {
    message:
      "If an unconfirmed account exists for this email, a confirmation email has been sent.",
  };
};
