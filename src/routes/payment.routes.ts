import { Router } from "express";
import express from "express";

import { authenticate } from "../middleware/auth.middleware.js";
import {
  createStripeCheckoutSessionHandler,
  getStripePaymentHandler,
  stripeWebhookHandler,
} from "../controllers/payment.controller.js";

const router = Router();

router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhookHandler,
);
router.use(authenticate);
router.post("/checkout-session", createStripeCheckoutSessionHandler);
router.get("/order/:orderId", getStripePaymentHandler);

export default router;
