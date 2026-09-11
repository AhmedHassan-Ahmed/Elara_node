import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import {
  VerificationCode,
  TokenType,
} from "../models/verificationCode.model.js";
import { generateSecurityToken } from "../utils/jwt.js";
import { Types } from "mongoose";

const createTransporter = () => {
  if (env.smtpHost && env.smtpUser && env.smtpPass) {
    return nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    });
  }
  return null;
};

const transporter = createTransporter();

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailOptions): Promise<boolean> {
  if (transporter) {
    try {
      await transporter.sendMail({
        from: env.smtpUser || "noreply@ecommerce.com",
        to,
        subject,
        html,
      });
      return true;
    } catch (error) {
      console.error("Nodemailer sendMail failed:", error);
      return false;
    }
  } else {
    console.log(`[Email Service Mock] To: ${to} | Subject: ${subject}`);
    console.log(`[Email Service Mock] Body: ${html}`);
    return true;
  }
}

export async function issueVerificationToken(
  userId: Types.ObjectId | string,
  type: TokenType,
  expiresInMs: number = 10 * 60 * 1000,
): Promise<string> {
  const existing = await VerificationCode.findOne({
    user_id: userId,
    type,
    expires_at: { $gt: new Date() },
  });

  if (existing) {
    await VerificationCode.deleteOne({ _id: existing._id });
  }

  const { rawToken, hashedToken } = generateSecurityToken();

  await VerificationCode.create({
    user_id: userId,
    type,
    token: hashedToken,
    expires_at: new Date(Date.now() + expiresInMs),
  });

  return rawToken;
}

export async function sendVerificationEmail(
  to: string,
  userId: Types.ObjectId | string,
): Promise<string> {
  const token = await issueVerificationToken(
    userId,
    "email_verification",
    env.emailVerificationExpiresInMs,
  );
  const url = `${env.frontendUrl}/confirm-email?token=${token}`;

  await sendEmail({
    to,
    subject: "Confirm your E-Commerce Account Email",
    html: `
      <h2>Welcome to E-Commerce Platform</h2>
      <p>Thank you for registering. Please click the link below to confirm your account email address:</p>
      <p><a href="${url}" target="_blank">Confirm Email Address</a></p>
      <p>Or use this token directly in your request: <strong>${token}</strong></p>
      <p>This link/token will expire in 24 hours.</p>
    `,
  });

  return token;
}

export async function sendResetPasswordEmail(
  to: string,
  userId: Types.ObjectId | string,
): Promise<string> {
  const token = await issueVerificationToken(
    userId,
    "password_reset",
    env.passwordResetExpiresInMs,
  );
  const url = `${env.frontendUrl}/reset-password?token=${token}`;

  await sendEmail({
    to,
    subject: "Reset your E-Commerce Account Password",
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Click the link below to set a new password:</p>
      <p><a href="${url}" target="_blank">Reset Password</a></p>
      <p>Or use token: <strong>${token}</strong></p>
      <p>This token is valid for 15 minutes.</p>
    `,
  });

  return token;
}
