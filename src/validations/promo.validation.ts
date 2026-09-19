import { z } from "zod";
import { Types } from "mongoose";
import { zodCoerceBoolean } from "./helpers.js";

const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: "Invalid ID format",
});

export const createPromoSchema = z.object({
  body: z.object({
    code: z.string().min(1, "Promo code is required").trim().toUpperCase(),
    discountType: z.enum(["percentage", "fixed"], {
      required_error: "discountType must be percentage or fixed",
    }),
    discountValue: z.coerce
      .number({ required_error: "discountValue is required" })
      .min(0, "discountValue must be positive"),
    minOrderAmount: z.coerce.number().min(0).optional(),
    maxDiscountAmount: z.coerce.number().min(0).optional(),
    startsAt: z.coerce.date({ required_error: "startsAt date is required" }),
    expiresAt: z.coerce.date({ required_error: "expiresAt date is required" }),
    usageLimit: z.coerce.number().int().min(1).optional(),
    isActive: zodCoerceBoolean.optional().default(true),
  }),
});

export const updatePromoSchema = z.object({
  params: z.object({
    promoId: objectIdSchema,
  }),
  body: z.object({
    code: z.string().min(1).trim().toUpperCase().optional(),
    discountType: z.enum(["percentage", "fixed"]).optional(),
    discountValue: z.coerce.number().min(0).optional(),
    minOrderAmount: z.coerce.number().min(0).optional(),
    maxDiscountAmount: z.coerce.number().min(0).optional(),
    startsAt: z.coerce.date().optional(),
    expiresAt: z.coerce.date().optional(),
    usageLimit: z.coerce.number().int().min(1).optional(),
    isActive: zodCoerceBoolean.optional(),
  }),
});

export const getPromoByIdSchema = z.object({
  params: z.object({
    promoId: objectIdSchema,
  }),
});

export const deletePromoSchema = z.object({
  params: z.object({
    promoId: objectIdSchema,
  }),
});

export const listPromosSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    status: z.enum(["active", "inactive"]).optional(),
  }),
});
export const validatePromoSchema = z.object({
  body: z.object({
    code: z
      .string({ message: "Promo code is required" })
      .trim()
      .min(1, "Promo code is required")
      .max(50, "Promo code is too long"),
  }),
});