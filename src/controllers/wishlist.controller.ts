import { Request, Response } from "express";
import * as wishlistService from "../services/wishlist.service.js";
import { sendSuccess } from "../utils/response.js";
import AppError from "../error/AppError.js";

export const addToWishlist = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user)
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  const { productId } = req.body;
  const result = await wishlistService.addToWishlist(req.user.id, productId);
  sendSuccess(
    res,
    200,
    result.added ? "Product added to wishlist" : "Product already in wishlist",
    result,
  );
};

export const removeFromWishlist = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user)
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  const productId = req.params.productId as string;
  await wishlistService.removeFromWishlist(req.user.id, productId);
  sendSuccess(res, 200, "Product removed from wishlist");
};

export const getWishlist = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user)
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  const result = await wishlistService.getWishlist(req.user.id, req.query);
  sendSuccess(res, 200, "Wishlist retrieved successfully", result);
};
