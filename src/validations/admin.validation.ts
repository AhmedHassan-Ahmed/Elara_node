import { z } from "zod";
import { Types } from "mongoose";
import { zodCoerceBoolean } from "./helpers.js";

const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: "Invalid ID format",
});

export const listUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    role: z.enum(["customer", "seller", "admin"]).optional(),
    search: z.string().trim().optional(),
    status: z.enum(["active", "inactive"]).optional(),
  }),
});

export const getUserByIdSchema = z.object({
  params: z.object({
    userId: objectIdSchema,
  }),
});

export const updateUserStatusSchema = z.object({
  params: z.object({
    userId: objectIdSchema,
  }),
  body: z
    .object({
      isActive: zodCoerceBoolean,
    })
    .strict(),
});

export const listSellersSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().trim().optional(),
    status: z.enum(["active", "inactive"]).optional(),
  }),
});

export const getSellerByIdSchema = z.object({
  params: z.object({
    sellerId: objectIdSchema,
  }),
});

export const updateSellerStatusSchema = z.object({
  params: z.object({
    sellerId: objectIdSchema,
  }),
  body: z
    .object({
      isActive: zodCoerceBoolean,
    })
    .strict(),
});
