import { Promo, PromoDiscountType } from "../models/promo.model.js";
import AppError from "../error/AppError.js";
import {
  parsePagination,
  buildPaginatedResponse,
} from "../utils/pagination.js";

export interface CreatePromoInput {
  code: string;
  discountType: PromoDiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startsAt: Date;
  expiresAt: Date;
  usageLimit?: number;
  isActive?: boolean;
}

export interface UpdatePromoInput {
  code?: string;
  discountType?: PromoDiscountType;
  discountValue?: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startsAt?: Date;
  expiresAt?: Date;
  usageLimit?: number;
  isActive?: boolean;
}

export interface ListPromosQuery {
  page?: number;
  limit?: number;
  status?: "active" | "inactive";
}

export const createPromo = async (data: CreatePromoInput) => {
  const formattedCode = data.code.trim().toUpperCase();
  const existing = await Promo.findOne({ code: formattedCode });
  if (existing) {
    throw new AppError(
      409,
      "PROMO_ALREADY_EXISTS",
      "Promotion with this code already exists",
    );
  }

  const promo = await Promo.create({
    code: formattedCode,
    discountType: data.discountType,
    discountValue: data.discountValue,
    minOrderAmount: data.minOrderAmount ?? 0,
    maxDiscountAmount: data.maxDiscountAmount,
    startsAt: data.startsAt,
    expiresAt: data.expiresAt,
    usageLimit: data.usageLimit,
    isActive: data.isActive ?? true,
  });

  return promo;
};

export const updatePromo = async (promoId: string, data: UpdatePromoInput) => {
  const promo = await Promo.findById(promoId);
  if (!promo) throw new AppError(404, "PROMO_NOT_FOUND", "Promotion not found");

  if (data.code) {
    const formattedCode = data.code.trim().toUpperCase();
    if (formattedCode !== promo.code) {
      const existing = await Promo.findOne({
        _id: { $ne: promoId },
        code: formattedCode,
      });
      if (existing) {
        throw new AppError(
          409,
          "PROMO_ALREADY_EXISTS",
          "Promotion with this code already exists",
        );
      }
    }
    promo.code = formattedCode;
  }

  if (data.discountType !== undefined) promo.discountType = data.discountType;
  if (data.discountValue !== undefined)
    promo.discountValue = data.discountValue;
  if (data.minOrderAmount !== undefined)
    promo.minOrderAmount = data.minOrderAmount;
  if (data.maxDiscountAmount !== undefined)
    promo.maxDiscountAmount = data.maxDiscountAmount;
  if (data.startsAt !== undefined) promo.startsAt = data.startsAt;
  if (data.expiresAt !== undefined) promo.expiresAt = data.expiresAt;
  if (data.usageLimit !== undefined) promo.usageLimit = data.usageLimit;
  if (data.isActive !== undefined) promo.isActive = data.isActive;

  await promo.save();
  return promo;
};

export const deletePromo = async (promoId: string) => {
  const promo = await Promo.findById(promoId);
  if (!promo) throw new AppError(404, "PROMO_NOT_FOUND", "Promotion not found");

  promo.isActive = false;
  await promo.save();
  return promo;
};

export const getPromoById = async (promoId: string) => {
  const promo = await Promo.findById(promoId);
  if (!promo) throw new AppError(404, "PROMO_NOT_FOUND", "Promotion not found");
  return promo;
};

export const listPromos = async (query: ListPromosQuery) => {
  const { page, limit, skip } = parsePagination(query);
  const filter: Record<string, any> = {};

  if (query.status) filter.isActive = query.status === "active";

  const [promos, total] = await Promise.all([
    Promo.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Promo.countDocuments(filter),
  ]);

  return buildPaginatedResponse(promos, total, page, limit, "promos");
};
