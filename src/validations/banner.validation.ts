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

export const createBannerSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required").trim(),
    image: safeUrlSchema.optional(),
    link: safeUrlSchema.optional(),
    sortOrder: z.coerce.number().int().optional().default(0),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
    isActive: zodCoerceBoolean.optional().default(true),
  }),
});

export const updateBannerSchema = z.object({
  params: z.object({
    bannerId: objectIdSchema,
  }),
  body: z.object({
    title: z.string().min(1).trim().optional(),
    image: safeUrlSchema.optional(),
    link: safeUrlSchema.optional(),
    sortOrder: z.coerce.number().int().optional(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
    isActive: zodCoerceBoolean.optional(),
  }),
});

export const getBannerByIdSchema = z.object({
  params: z.object({
    bannerId: objectIdSchema,
  }),
});

export const deleteBannerSchema = z.object({
  params: z.object({
    bannerId: objectIdSchema,
  }),
});

export const listBannersSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    status: z.enum(["active", "inactive"]).optional(),
  }),
});
