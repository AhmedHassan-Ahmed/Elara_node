import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

const promoCodeSchema = z.string().trim().min(1).max(50).optional();

export const previewCheckoutSchema = z.object({
  body: z.object({
    orderId: objectId,
    promoCode: promoCodeSchema,
  }),
});

export const createCheckoutSchema = z.object({
  body: z.object({
    orderId: objectId,
  }),
});

export const createCheckoutWithPromoSchema = z.object({
  body: z.object({
    orderId: objectId,
    promoCode: z
      .string({ message: "promoCode is required" })
      .trim()
      .min(1, "promoCode is required")
      .max(50, "promoCode is too long"),
  }),
});