import { Types } from "mongoose";
import { Request, Response } from "express";
import { Review } from "../models/review.model.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import AppError from "../error/AppError.js";
import { sendSuccess } from "../utils/response.js";
import {
  parsePagination,
  buildPaginatedResponse,
} from "../utils/pagination.js";


const ELIGIBLE_ORDER_STATUSES = [
  "confirmed",
  "processing",
  "shipped",
  "delivered",
] as const;


const hasPurchasedProduct = async (
  userId: string,
  productId: string,
): Promise<boolean> => {
  const order = await Order.findOne({
    user: userId,
    "items.product": productId,
    status: { $in: ELIGIBLE_ORDER_STATUSES },
  }).select("_id");

  return Boolean(order);
};


export const createReview = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user!.id;
  const { productId } = req.params;
  const { rating, comment } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }


  const eligible = await hasPurchasedProduct(userId, productId);
  if (!eligible) {
    throw new AppError(
      403,
      "REVIEW_NOT_ELIGIBLE",
      "You can only review products you have successfully purchased",
    );
  }


  const existing = await Review.findOne({ user: userId, product: productId });
  if (existing) {
    throw new AppError(
      409,
      "REVIEW_ALREADY_EXISTS",
      "You have already reviewed this product",
    );
  }

  const review = await Review.create({
    user: userId,
    product: productId,
    rating,
    comment,
  });

  sendSuccess(res, 201, "Review created successfully", { review });
};


export const listProductReviews = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { productId } = req.params;
  const { sort } = req.query as { sort?: string };

  const { page, limit, skip } = parsePagination(req.query);

  const product = await Product.findById(productId).select("_id");
  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  const filter = { product: productId, isActive: true };

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    highest: { rating: -1, createdAt: -1 },
    lowest: { rating: 1, createdAt: -1 },
  };
  const sortOption = sortMap[sort ?? "newest"] ?? sortMap.newest;

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate("user", "name")
      .sort(sortOption)
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  const result = buildPaginatedResponse(
    reviews,
    total,
    page,
    limit,
    "reviews",
  );

  sendSuccess(res, 200, "Reviews retrieved successfully", result);
};


export const updateReview = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user!.id;
  const { reviewId } = req.params;
  const { rating, comment } = req.body;

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new AppError(404, "REVIEW_NOT_FOUND", "Review not found");
  }

  if (review.user.toString() !== userId) {
    throw new AppError(
      403,
      "REVIEW_FORBIDDEN",
      "You can only update your own review",
    );
  }

  if (rating !== undefined) review.rating = rating;
  if (comment !== undefined) review.comment = comment;

  await review.save();

  sendSuccess(res, 200, "Review updated successfully", { review });
};


export const deleteReview = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user!.id;
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new AppError(404, "REVIEW_NOT_FOUND", "Review not found");
  }

  if (review.user.toString() !== userId) {
    throw new AppError(
      403,
      "REVIEW_FORBIDDEN",
      "You can only delete your own review",
    );
  }

  await review.deleteOne();

  sendSuccess(res, 200, "Review deleted successfully");
};

export const moderateReview = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { reviewId } = req.params;
  const { isActive } = req.body;

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new AppError(404, "REVIEW_NOT_FOUND", "Review not found");
  }

  review.isActive = isActive;
  await review.save();

  sendSuccess(res, 200, "Review moderated successfully", { review });
};