import { z } from "zod";

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

export const createReviewSchema = z.object({
  params: z.object({
    productId: objectId,
  }),
  body: z.object({
    rating: z
      .number({ message: "rating is required" })
      .int("Rating must be an integer")
      .min(1, "Rating must be between 1 and 5")
      .max(5, "Rating must be between 1 and 5"),
    comment: z
      .string()
      .trim()
      .max(1000, "Comment must be at most 1000 characters")
      .optional(),
  }),
});

export const updateReviewSchema = z.object({
  params: z.object({
    reviewId: objectId,
  }),
  body: z
    .object({
      rating: z
        .number()
        .int("Rating must be an integer")
        .min(1, "Rating must be between 1 and 5")
        .max(5, "Rating must be between 1 and 5")
        .optional(),
      comment: z
        .string()
        .trim()
        .max(1000, "Comment must be at most 1000 characters")
        .optional(),
    })
    .refine(
      (data) => data.rating !== undefined || data.comment !== undefined,
      { message: "At least one of rating or comment must be provided" },
    ),
});

export const reviewIdParamSchema = z.object({
  params: z.object({
    reviewId: objectId,
  }),
});

export const listProductReviewsSchema = z.object({
  params: z.object({
    productId: objectId,
  }),
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
    sort: z.enum(["newest", "oldest", "highest", "lowest"]).optional(),
  }),
});

export const moderateReviewSchema = z.object({
  params: z.object({
    reviewId: objectId,
  }),
  body: z.object({
    isActive: z.boolean({ message: "isActive is required" }),
  }),
});