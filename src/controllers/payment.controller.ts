import { Request, Response, NextFunction } from "express";
import Stripe from "stripe";

import { stripeWebhookSecret, getStripe } from "../config/stripe.js";
import AppError from "../error/AppError.js";
import * as stripeService from "../services/stripe.service.js";
import { sendSuccess } from "../utils/response.js";

export const createStripeCheckoutSessionHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }

    const result = await stripeService.createCheckoutSession(
      String(req.body.orderId),
      req.user.id,
    );

    sendSuccess(res, 201, "Stripe checkout session created successfully", {
      checkoutSessionId: result.checkoutSessionId,
      checkoutUrl: result.checkoutUrl,
      orderId: result.order._id,
      paymentId: result.payment._id,
    });
  } catch (err) {
    next(err);
  }
};

export const getStripePaymentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }

    const payment = await stripeService.getPaymentForOrder(
      String(req.params.orderId),
      req.user.id,
    );

    sendSuccess(res, 200, "Stripe payment retrieved successfully", { payment });
  } catch (err) {
    next(err);
  }
};

export const stripeWebhookHandler = async (
  req: Request,
  res: Response,
) => {
  if (!stripeWebhookSecret) {
    return res.status(503).json({
      success: false,
      error: {
        code: "STRIPE_WEBHOOK_NOT_CONFIGURED",
        message: "Stripe webhook secret is not configured",
        details: [],
      },
    });
  }

  const signature = req.headers["stripe-signature"];
  if (typeof signature !== "string") {
    return res.status(400).json({
      success: false,
      error: {
        code: "STRIPE_SIGNATURE_MISSING",
        message: "Stripe signature is required",
        details: [],
      },
    });
  }

  if (!Buffer.isBuffer(req.body)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "STRIPE_RAW_BODY_REQUIRED",
        message: "Stripe webhook requires the raw request body",
        details: [],
      },
    });
  }

  try {
    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      stripeWebhookSecret,
    );

    await stripeService.handleStripeEvent(event);

    return res.status(200).json({ received: true });
  } catch (err) {
    if (err instanceof Stripe.errors.StripeSignatureVerificationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_STRIPE_SIGNATURE",
          message: "Invalid Stripe webhook signature",
          details: [],
        },
      });
    }

    console.error("Stripe webhook processing error:", err);
    return res.status(500).json({
      success: false,
      error: {
        code: "STRIPE_WEBHOOK_PROCESSING_FAILED",
        message: "Stripe webhook processing failed",
        details: [],
      },
    });
  }
};
