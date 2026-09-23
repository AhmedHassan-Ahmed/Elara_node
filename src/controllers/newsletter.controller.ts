import { Request, Response } from "express";
import { Newsletter } from "../models/newsletter.model.js";
import AppError from "../error/AppError.js";
import { sendSuccess } from "../utils/response.js";
import * as emailService from "../services/email.service.js";
import {
  parsePagination,
  buildPaginatedResponse,
} from "../utils/pagination.js";

export const subscribe = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { email } = req.body;

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await Newsletter.findOne({ email: normalizedEmail });

  if (existing) {
    if (existing.subscribed) {
      throw new AppError(
        409,
        "ALREADY_SUBSCRIBED",
        "This email is already subscribed",
      );
    }

    existing.subscribed = true;
    existing.userId = req.user ? (req.user.id as any) : existing.userId;
    await existing.save();

    sendSuccess(res, 200, "Re-subscribed successfully", {
      newsletter: existing,
    });
    return;
  }

  const newsletter = await Newsletter.create({
    email: normalizedEmail,
    userId: req.user?.id,
    subscribed: true,
  });

  sendSuccess(res, 201, "Subscribed successfully", { newsletter });
};

export const unsubscribe = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { email } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  const newsletter = await Newsletter.findOne({ email: normalizedEmail });

  if (!newsletter) {
    throw new AppError(404, "SUBSCRIPTION_NOT_FOUND", "Email not subscribed");
  }

  if (!newsletter.subscribed) {
    sendSuccess(res, 200, "Already unsubscribed");
    return;
  }

  newsletter.subscribed = false;
  await newsletter.save();

  sendSuccess(res, 200, "Unsubscribed successfully");
};

export const sendCampaign = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { subject, html } = req.body;

  const subscribers = await Newsletter.find({ subscribed: true });

  if (!subscribers.length) {
    throw new AppError(422, "NO_SUBSCRIBERS", "No active subscribers");
  }

  let sent = 0;
  let failed = 0;

  for (const sub of subscribers) {
    const ok = await emailService
      .sendEmail({ to: sub.email, subject, html })
      .catch(() => false);

    if (ok) sent++;
    else failed++;
  }

  sendSuccess(res, 200, "Campaign sent", {
    total: subscribers.length,
    sent,
    failed,
  });
};

export const listSubscribers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { page, limit, skip } = parsePagination(req.query);

  const filter: Record<string, any> = {};
  if (req.query.status === "active") filter.subscribed = true;
  if (req.query.status === "inactive") filter.subscribed = false;

  const [subs, total] = await Promise.all([
    Newsletter.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Newsletter.countDocuments(filter),
  ]);

  const result = buildPaginatedResponse(
    subs,
    total,
    page,
    limit,
    "subscribers",
  );

  sendSuccess(res, 200, "Subscribers retrieved successfully", result);
};