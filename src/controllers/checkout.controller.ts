import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import AppError from "../error/AppError.js";
import * as stripeService from "../services/stripe.service.js";
import * as promoService from "../services/promo.service.js";
import { Order } from "../models/order.model.js";
import { sendSuccess } from "../utils/response.js";

const SHIPPING_FLAT = 50;
const TAX_RATE = 0.14;

export const previewCheckout = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }

    const { orderId, promoCode } = req.body;

    if (!orderId || !Types.ObjectId.isValid(orderId)) {
      throw new AppError(400, "INVALID_ORDER_ID", "Invalid order id");
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.user.id,
    });

    if (!order) {
      throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
    }

    if (promoCode) {
      if (order.status !== "pending") {
        throw new AppError(
          409,
          "ORDER_NOT_PAYABLE",
          `Order cannot be modified while its status is "${order.status}"`,
        );
      }

      const subtotal = order.items.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0,
      );

      const { discount } = await promoService.validatePromoForOrder(
        promoCode,
        subtotal,
      );

      const shipping = SHIPPING_FLAT;
      const tax = +(subtotal * TAX_RATE).toFixed(2);
      const newTotal = +(subtotal + shipping + tax - discount).toFixed(2);

      order.totalAmount = newTotal;
      await order.save();
    }

    sendSuccess(res, 200, "Checkout preview generated successfully", {
      order,
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
};