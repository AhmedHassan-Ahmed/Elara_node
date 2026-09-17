import { z } from "zod";
import { Types } from "mongoose";

const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: "Invalid ID format",
});

export const listSellerOrdersSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    status: z
      .enum([
        "pending",
        "paid",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ])
      .optional(),
  }),
});

export const getSellerOrderByIdSchema = z.object({
  params: z.object({
    orderId: objectIdSchema,
  }),
});
