import {
  Notification,
  NotificationType,
} from "../models/notification.model.js";
import AppError from "../error/AppError.js";
import {
  buildPaginatedResponse,
  parsePagination,
} from "../utils/pagination.js";
import * as pushSubscriptionService from "../services/pushSubscription.service.js";

interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
}

export const createNotification = async ({
  userId,
  type,
  title,
  content,
}: NotifyInput) => {
  const notification = await Notification.create({
    user_id: userId,
    type,
    title,
    content,
  });
  return notification;
};

export const getMyNotifications = async (
  userId: string,
  query: { page?: number; limit?: number },
) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = { user_id: userId };

  const [items, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
  ]);

  return buildPaginatedResponse(items, total, page, limit, "notifications");
};

export const markAsRead = async (id: string, userId: string) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: id, user_id: userId },
    { $set: { is_read: true, read_at: new Date() } },
    { new: true },
  );
  if (!notification) {
    throw new AppError(404, "NOT_FOUND", "Notification not found");
  }
  return notification;
};

export const markAllAsRead = async (userId: string) => {
  await Notification.updateMany(
    { user_id: userId, is_read: false },
    { $set: { is_read: true, read_at: new Date() } },
  );
};

export const notifyUser = async (input: {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
}) => {
  const notification = await createNotification(input);

  await pushSubscriptionService
    .sendPushToUser(input.userId, {
      title: input.title,
      body: input.content,
    })
    .catch((err) => {
      console.error("[Notification Service] Push delivery failed:", err);
    });

  return notification;
};
