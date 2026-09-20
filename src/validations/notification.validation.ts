import { Types } from "mongoose";
import { z } from "zod";

const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: "Invalid ID format",
});

export const listNotificationsSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
  }),
});

export const notificationIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const subscribePushSchema = z.object({
  body: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
});
