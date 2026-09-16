import { z } from "zod";
import { Types } from "mongoose";

const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: "Invalid ID format",
});

export const addToWishlistSchema = z.object({
  body: z.object({
    productId: objectIdSchema,
  }),
});

export const removeFromWishlistSchema = z.object({
  params: z.object({
    productId: objectIdSchema,
  }),
});

export const listWishlistSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
  }),
});
