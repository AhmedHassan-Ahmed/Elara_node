import { Request, Response } from "express";
import * as orderService from "../services/order.service.js";
import { sendSuccess } from "../utils/response.js";
import AppError from "../error/AppError.js";

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
