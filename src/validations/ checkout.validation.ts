import { z } from "zod";

const promoCodeSchema = z.string().trim().min(1).max(50).optional();

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

export const previewCheckoutSchema = z.object({
  body: z.object({
    promoCode: promoCodeSchema,
  }),
});

export const createCheckoutSchema = z.object({
  body: z.object({
    orderId: objectId,
  }),
});
