import { Request, Response } from "express";
import * as adminService from "../services/admin.service.js";
import { sendSuccess } from "../utils/response.js";
import AppError from "../error/AppError.js";

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  const result = await adminService.listUsers(req.query);
  sendSuccess(res, 200, "Users retrieved successfully", result);
};

export const getUserById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.params.userId as string;
  const user = await adminService.getUserById(userId);
  sendSuccess(res, 200, "User retrieved successfully", { user });
};

export const updateUserStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  }
  const userId = req.params.userId as string;
  const user = await adminService.updateUserStatus(
    req.user.id,
    userId,
    req.body.isActive,
  );
  sendSuccess(res, 200, "User status updated successfully", { user });
};

export const deactivateUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  }
  const userId = req.params.userId as string;
  const user = await adminService.softDeleteUser(req.user.id, userId);
  sendSuccess(res, 200, "User soft-deleted successfully", { user });
};

export const getSellers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await adminService.listSellers(req.query);
  sendSuccess(res, 200, "Sellers retrieved successfully", result);
};

export const getSellerById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const sellerId = req.params.sellerId as string;
  const seller = await adminService.getSellerById(sellerId);
  sendSuccess(res, 200, "Seller retrieved successfully", { seller });
};

export const updateSellerStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const sellerId = req.params.sellerId as string;
  const seller = await adminService.updateSellerStatus(
    sellerId,
    req.body.isActive,
  );
  sendSuccess(res, 200, "Seller status updated successfully", { seller });
};

export const deactivateSeller = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const sellerId = req.params.sellerId as string;
  const seller = await adminService.softDeleteSeller(sellerId);
  sendSuccess(res, 200, "Seller soft-deleted successfully", { seller });
};
