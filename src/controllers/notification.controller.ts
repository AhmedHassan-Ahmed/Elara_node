import { Request, Response } from "express";
import * as notificationService from "../services/notification.service.js";
import * as pushSubscriptionService from "../services/pushSubscription.service.js";
import { sendSuccess } from "../utils/response.js";
import AppError from "../error/AppError.js";

const checkUser = (req: Request) => {
  if (!req.user) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  }
};

// export const createNotification = async (req: Request, res: Response) => {
//   checkUser(req);
//   const result = await notificationService.createNotification({
//     userId: req.user!.id,
//     ...req.body,
//   });
//   sendSuccess(res, 201, "Notification created", result);
// };

export const getNotifications = async (req: Request, res: Response) => {
  checkUser(req);
  const result = await notificationService.getMyNotifications(
    req.user!.id,
    req.query,
  );
  sendSuccess(res, 200, "Notifications retrieved successfully", result);
};

export const markAsRead = async (req: Request, res: Response) => {
  checkUser(req);
  const notificationId = req.params.id as string;
  const result = await notificationService.markAsRead(
    notificationId,
    req.user!.id,
  );
  sendSuccess(res, 200, "Notification marked as read", result);
};

export const markAllAsRead = async (req: Request, res: Response) => {
  checkUser(req);
  await notificationService.markAllAsRead(req.user!.id);
  sendSuccess(res, 200, "All Notifications marked as read");
};

export const subscribeToPush = async (req: Request, res: Response) => {
  checkUser(req);
  await pushSubscriptionService.saveSubscription(req.user!.id, req.body);
  sendSuccess(res, 200, "Subscribed to push notifications");
};

export const unsubscribeFromPush = async (req: Request, res: Response) => {
  checkUser(req);
  await pushSubscriptionService.removeSubscription(req.body.endpoint);
  sendSuccess(res, 200, "Unsubscribed from push notifications");
};
