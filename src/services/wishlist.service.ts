import { Types } from "mongoose";
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import AppError from "../error/AppError.js";
import {
  parsePagination,
  buildPaginatedResponse,
} from "../utils/pagination.js";

export const addToWishlist = async (userId: string, productId: string) => {
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product)
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");

  const result = await User.updateOne(
    { _id: userId },
    { $addToSet: { wishlist: productId } },
  );

  return { added: result.modifiedCount > 0 };
};

export const removeFromWishlist = async (userId: string, productId: string) => {
  const result = await User.updateOne(
    { _id: userId },
    { $pull: { wishlist: productId } },
  );

  return { removed: result.modifiedCount > 0 };
};

export interface ListWishlistQuery {
  page?: number;
  limit?: number;
}

export const getWishlist = async (userId: string, query: ListWishlistQuery) => {
  const { page, limit, skip } = parsePagination(query);

  const user = await User.findById(userId).select("wishlist");
  const wishlistIds = user?.wishlist ?? [];

  const filter = { _id: { $in: wishlistIds }, isActive: true };

  const [items, total] = await Promise.all([
    Product.find(filter).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  return buildPaginatedResponse(items, total, page, limit, "wishlist");
};
