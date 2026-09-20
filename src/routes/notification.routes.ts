import { Router } from "express";
import * as notificationController from "../controllers/notification.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  notificationIdSchema,
  listNotificationsSchema,
  subscribePushSchema,
} from "../validations/notification.validation.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  validate(listNotificationsSchema),
  notificationController.getNotifications,
);
router.patch(
  "/:id/read",
  validate(notificationIdSchema),
  notificationController.markAsRead,
);
router.patch("/read-all", notificationController.markAllAsRead);

router.post(
  "/push/subscribe",
  validate(subscribePushSchema),
  notificationController.subscribeToPush,
);
router.post("/push/unsubscribe", notificationController.unsubscribeFromPush);

export default router;
