import Stripe from "stripe";

import { env } from "./env.js";

let stripeClient: Stripe | undefined;

export function getStripe(): Stripe {
  if (!env.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(env.stripeSecretKey);
  }

  return stripeClient;
}

export const stripeWebhookSecret = env.stripeWebhookSecret;
