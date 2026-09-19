import { z } from "zod";

const promoCodeSchema = z.string().trim().min(1).max(50).optional();

export const previewCheckoutSchema = z.object({
  body: z.object({
    promoCode: promoCodeSchema,
  }),
});
