import { Request, Response, NextFunction } from "express";
import AppError from "../error/AppError.js";
import * as stripeService from "../services/stripe.service.js";
import { buildBreakdownFromCart } from "../services/checkout.service.js";
import { sendSuccess } from "../utils/response.js";


export const previewCheckout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }

    const { promoCode } = req.body;
    const userId = req.user.id;

    const breakdown = await buildBreakdownFromCart(userId, promoCode as string);

    sendSuccess(res, 200, "Checkout preview generated successfully", {
      breakdown,
    });
  } catch (err) {
    next(err);
  }
};


export const createCheckoutHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }

    const { orderId } = req.body;

    if (!orderId) {
      throw new AppError(400, "ORDER_ID_REQUIRED", "orderId is required");
    }

    const result = await stripeService.createCheckoutSession(
      String(orderId),
      req.user.id,
    );

    sendSuccess(res, 201, "Checkout session created successfully", {
      checkoutSessionId: result.checkoutSessionId,
      checkoutUrl: result.checkoutUrl,
      orderId: result.order._id,
      paymentId: result.payment._id,
    });
  } catch (err) {
    next(err);
  }
}
};