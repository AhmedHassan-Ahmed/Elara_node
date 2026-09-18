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


export interface ValidatePromoResult {
  promo: {
    _id: string;
    code: string;
    discountType: PromoDiscountType;
    discountValue: number;
  };
  discount: number;
  finalTotal: number;
}

export const validatePromoForOrder = async (
  code: string,
  orderTotal: number,
): Promise<ValidatePromoResult> => {
  if (!code || !code.trim()) {
    throw new AppError(400, "PROMO_REQUIRED", "Promo code is required");
  }

  const formattedCode = code.trim().toUpperCase();
  const promo = await Promo.findOne({ code: formattedCode });

  if (!promo) {
    throw new AppError(404, "PROMO_NOT_FOUND", "Promo code not found");
  }

  if (!promo.isActive) {
    throw new AppError(
      422,
      "PROMO_INACTIVE",
      "This promo code is no longer active",
    );
  }

  const now = new Date();

  if (promo.startsAt && promo.startsAt > now) {
    throw new AppError(
      422,
      "PROMO_NOT_STARTED",
      "This promo code is not yet active",
    );
  }

  if (promo.expiresAt && promo.expiresAt < now) {
    throw new AppError(422, "PROMO_EXPIRED", "This promo code has expired");
  }

  if (promo.usageLimit !== undefined && promo.usedCount >= promo.usageLimit) {
    throw new AppError(
      422,
      "PROMO_USAGE_LIMIT_REACHED",
      "This promo code has reached its usage limit",
    );
  }

  if (promo.minOrderAmount !== undefined && orderTotal < promo.minOrderAmount) {
    throw new AppError(
      422,
      "PROMO_MIN_ORDER_NOT_MET",
      `Minimum order amount for this promo is ${promo.minOrderAmount}`,
    );
  }

  let discount = 0;
  if (promo.discountType === "percentage") {
    discount = (orderTotal * promo.discountValue) / 100;
    if (
      promo.maxDiscountAmount !== undefined &&
      discount > promo.maxDiscountAmount
    ) {
      discount = promo.maxDiscountAmount;
    }
  } else {
    discount = promo.discountValue;
  }

  if (discount > orderTotal) discount = orderTotal;
  discount = +discount.toFixed(2);

  return {
    promo: {
      _id: promo._id.toString(),
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
    },
    discount,
    finalTotal: +(orderTotal - discount).toFixed(2),
  };
};

export const incrementPromoUsage = async (promoId: string) => {
  await Promo.findByIdAndUpdate(promoId, { $inc: { usedCount: 1 } });
};
