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

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, "Category name is required").trim(),
    description: z.string().trim().optional(),
    image: safeUrlSchema.optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    categoryId: objectIdSchema,
  }),
  body: z.object({
    name: z.string().min(1).trim().optional(),
    description: z.string().trim().optional(),
    image: safeUrlSchema.optional(),
    isActive: zodCoerceBoolean.optional(),
  }),
});

export const getCategoryByIdSchema = z.object({
  params: z.object({
    categoryId: objectIdSchema,
  }),
});

export const deleteCategorySchema = z.object({
  params: z.object({
    categoryId: objectIdSchema,
  }),
});

export const listCategoriesSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().trim().optional(),
    status: z.enum(["active", "inactive"]).optional(),
  }),
});
