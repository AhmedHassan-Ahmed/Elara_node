import { Schema, model, Types } from "mongoose";

export type NotificationType =
  | "order_created"
  | "order_status_changed"
  | "payment_succeeded"
  | "payment_failed";

export interface INotification {
  user_id: Types.ObjectId;
  type: NotificationType;
  title: string;
  content: string;
  is_read: boolean;
  read_at?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "order_created",
        "order_status_changed",
        "payment_succeeded",
        "payment_failed",
      ],
      required: true,
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    is_read: { type: Boolean, default: false },
    read_at: Date,
  },
  { timestamps: true, versionKey: false },
);

export const Notification = model<INotification>(
  "Notification",
  NotificationSchema,
);
