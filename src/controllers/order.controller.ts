import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import * as orderService from "../services/order.service.js";
import { sendSuccess } from "../utils/response.js";
import AppError from "../error/AppError.js";

export const createOrderHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }

    const { cartItems, shippingAddress } = req.body;

    const order = await orderService.createOrder({
      userId: new Types.ObjectId(req.user.id),
      cartItems,
      shippingAddress,
    });

    sendSuccess(res, 201, "Order created successfully", order);
  } catch (err) {
    next(err);
  }
};

export const getOrderHistoryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }

    const result = await orderService.getOrderHistory(
      new Types.ObjectId(req.user.id),
      req.query,
    );

    sendSuccess(res, 200, "Order history retrieved successfully", result);
  } catch (err) {
    next(err);
  }
};

export const getOrderByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }

    const order = await orderService.getOrderById(req.user, String(req.params.orderId));

    sendSuccess(res, 200, "Order retrieved successfully", order);
  } catch (err) {
    next(err);
  }
};

export const listAllOrdersHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await orderService.listAllOrders(req.query);
    sendSuccess(res, 200, "Orders retrieved successfully", result);
  } catch (err) {
    next(err);
  }
};

export const updateOrderStatusHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const order = await orderService.updateOrderStatus(
      String(req.params.orderId),
      req.body.status,
    );
    sendSuccess(res, 200, "Order status updated successfully", order);
  } catch (err) {
    next(err);
  }
};

// Seller Orders

export const getSellerOrders = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user)
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  const result = await orderService.listSellerOrders(req.user.id, req.query);
  sendSuccess(res, 200, "Orders retrieved successfully", result);
};

export const getSellerOrderById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user)
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  const orderId = req.params.orderId as string;
  const order = await orderService.getSellerOrderById(req.user.id, orderId);
  sendSuccess(res, 200, "Order retrieved successfully", { order });
};