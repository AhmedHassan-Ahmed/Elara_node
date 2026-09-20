import { Request, Response, NextFunction } from "express";

import AppError from "../error/AppError.js";
import * as stripeService from "../services/stripe.service.js";
import { sendSuccess } from "../utils/response.js";

export const createCheckoutHandler = async (
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

    sendSuccess(res, 201, "Checkout session created successfully", {
      checkoutSessionId: result.checkoutSessionId,
      checkoutUrl: result.checkoutUrl,
      orderId: result.order._id,
      paymentId: result.payment._id,
    });
  } catch (err) {
    next(err);
  }
};
