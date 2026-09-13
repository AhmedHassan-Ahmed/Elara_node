import { z } from "zod";
import { Types } from "mongoose";
import { isValidSafeUrl } from "../utils/helpers.js";
import { zodCoerceBoolean } from "./helpers.js";

const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: "Invalid ID format",
});

const safeUrlSchema = z
  .string()
  .trim()
  .refine((val) => isValidSafeUrl(val), {
    message:
      "Invalid or unsafe URL scheme. Only http, https, or relative paths are allowed.",
  });

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").trim(),
    description: z.string().min(1, "Description is required").trim(),
    price: z.coerce.number().min(0, "Price must be greater than or equal to 0"),
    stock: z.coerce
      .number()
      .int()
      .min(0, "Stock must be non-negative integer")
      .default(0),
    category: objectIdSchema,
    images: z.array(safeUrlSchema).optional().default([]),
    seller: objectIdSchema.optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    productId: objectIdSchema,
  }),
  body: z.object({
    name: z.string().min(1).trim().optional(),
    description: z.string().min(1).trim().optional(),
    price: z.coerce.number().min(0).optional(),
    stock: z.coerce.number().int().min(0).optional(),
    category: objectIdSchema.optional(),
    images: z.array(safeUrlSchema).optional(),
    isActive: zodCoerceBoolean.optional(),
    seller: objectIdSchema.optional(),
  }),
});

export const getProductByIdSchema = z.object({
  params: z.object({
    productId: objectIdSchema,
  }),
});

export const deleteProductSchema = z.object({
  params: z.object({
    productId: objectIdSchema,
  }),
});

export const listProductsSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().trim().optional(),
    category: objectIdSchema.optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    sort: z.enum(["price_asc", "price_desc", "newest", "oldest"]).optional(),
    status: z.enum(["active", "inactive"]).optional(),
  }),
});
