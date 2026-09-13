import { User } from "../models/user.model.js";
import AppError from "../error/AppError.js";
import { escapeRegex } from "../utils/helpers.js";
import {
  parsePagination,
  buildPaginatedResponse,
} from "../utils/pagination.js";
import { ListUsersQuery, ListSellersQuery } from "../types/admin.types.js";

export const listUsers = async (query: ListUsersQuery) => {
  const { page, limit, skip } = parsePagination(query);
  const filter: Record<string, any> = { isDeleted: { $ne: true } };

  if (query.role) filter.role = query.role;
  if (query.status) filter.isActive = query.status === "active";
  if (query.search) {
    const safeSearch = escapeRegex(query.search);
    filter.$or = [
      { name: { $regex: safeSearch, $options: "i" } },
      { email: { $regex: safeSearch, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return buildPaginatedResponse(users, total, page, limit, "users");
};

export const getUserById = async (userId: string) => {
  const user = await User.findOne({
    _id: userId,
    isDeleted: { $ne: true },
  }).select("-password");

  if (!user) throw new AppError(404, "USER_NOT_FOUND", "User not found");
  return user;
};

export const updateUserStatus = async (
  currentAdminId: string,
  targetUserId: string,
  isActive: boolean,
) => {
  if (currentAdminId === targetUserId && !isActive) {
    throw new AppError(
      400,
      "CANNOT_DEACTIVATE_SELF",
      "Administrators cannot deactivate their own account",
    );
  }

  const user = await User.findOne({
    _id: targetUserId,
    isDeleted: { $ne: true },
  });
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "User not found");

  user.isActive = isActive;
  await user.save();

  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
};

export const softDeleteUser = async (
  currentAdminId: string,
  targetUserId: string,
) => {
  if (currentAdminId === targetUserId) {
    throw new AppError(
      400,
      "CANNOT_DELETE_SELF",
      "Administrators cannot delete or deactivate their own account",
    );
  }

  const user = await User.findOne({
    _id: targetUserId,
    isDeleted: { $ne: true },
  });
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "User not found");

  user.isDeleted = true;
  user.deletedAt = new Date();
  user.isActive = false;
  await user.save();

  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
};

export const listSellers = async (query: ListSellersQuery) => {
  const { page, limit, skip } = parsePagination(query);
  const filter: Record<string, any> = {
    role: "seller",
    isDeleted: { $ne: true },
  };

  if (query.status) filter.isActive = query.status === "active";
  if (query.search) {
    const safeSearch = escapeRegex(query.search);
    filter.$or = [
      { name: { $regex: safeSearch, $options: "i" } },
      { email: { $regex: safeSearch, $options: "i" } },
    ];
  }

  const [sellers, total] = await Promise.all([
    User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return buildPaginatedResponse(sellers, total, page, limit, "sellers");
};

export const getSellerById = async (sellerId: string) => {
  const seller = await User.findOne({
    _id: sellerId,
    role: "seller",
    isDeleted: { $ne: true },
  }).select("-password");

  if (!seller) throw new AppError(404, "SELLER_NOT_FOUND", "Seller not found");
  return seller;
};

export const updateSellerStatus = async (
  sellerId: string,
  isActive: boolean,
) => {
  const seller = await User.findOne({
    _id: sellerId,
    role: "seller",
    isDeleted: { $ne: true },
  });
  if (!seller) throw new AppError(404, "SELLER_NOT_FOUND", "Seller not found");

  seller.isActive = isActive;
  await seller.save();

  const sellerObj = seller.toObject();
  delete sellerObj.password;
  return sellerObj;
};

export const softDeleteSeller = async (sellerId: string) => {
  const seller = await User.findOne({
    _id: sellerId,
    role: "seller",
    isDeleted: { $ne: true },
  });
  if (!seller) throw new AppError(404, "SELLER_NOT_FOUND", "Seller not found");

  seller.isDeleted = true;
  seller.deletedAt = new Date();
  seller.isActive = false;
  await seller.save();

  const sellerObj = seller.toObject();
  delete sellerObj.password;
  return sellerObj;
};
