import webpush from "web-push";
import { PushSubscription } from "../models/pushSubscription.model.js";
import { env } from "../config/env.js";

webpush.setVapidDetails(
  env.vapidSubject,
  env.vapidPublicKey,
  env.vapidPrivateKey,
);

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<void> {
  const subscriptions = await PushSubscription.find({ user: userId });

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          JSON.stringify(payload),
        );
      } catch (err: any) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: sub._id });
        } else {
          console.error("[Push Service] Failed to send push:", err);
        }
      }
    }),
  );
}

// What the frontend will call ..
export async function saveSubscription(
  userId: string,
  subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  },
) {
  await PushSubscription.findOneAndUpdate(
    { endpoint: subscription.endpoint },
    { user: userId, endpoint: subscription.endpoint, keys: subscription.keys },
    { upsert: true, new: true },
  );
}

export async function removeSubscription(endpoint: string) {
  await PushSubscription.deleteOne({ endpoint });
}
