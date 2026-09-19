import { z } from "zod";
import { Types } from "mongoose";

const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: "Invalid ID format",
});

export const createOrderSchema = z.object({
  body: z.object({
    cartItems: z
      .array(
        z.object({
          product: objectIdSchema,
          quantity: z.coerce
            .number()
            .int()
            .min(1, "Quantity must be at least 1"),
        }),
      )
      .min(1, "cartItems must contain at least one item"),

    shippingAddress: z.object({
      street: z.string().min(1, "Street is required").trim(),
      city: z.string().min(1, "City is required").trim(),
      state: z.string().trim().optional(),
      country: z.string().min(1, "Country is required").trim(),
      postalCode: z.string().trim().optional(),
    }),
  }),
});

export const getOrderHistorySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

export const getOrderByIdSchema = z.object({
  params: z.object({
    orderId: objectIdSchema,
  }),
});

export const listAllOrdersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),

    status: z
      .enum([
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "failed",
      ])
      .optional(),

    user: objectIdSchema.optional(),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    orderId: objectIdSchema,
  }),

  body: z.object({
    status: z.enum(["processing", "shipped", "delivered", "cancelled"]),
  }),
});

export const listSellerOrdersSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),

    status: z
      .enum([
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "failed",
      ])
      .optional(),
  }),
});

export const getSellerOrderByIdSchema = z.object({
  params: z.object({
    orderId: objectIdSchema,
  }),
});
