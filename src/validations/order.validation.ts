import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

const cartItemSchema = z.object({
  product: objectId,
  quantity: z
    .number({ message: "quantity is required" })
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1"),
});

const shippingAddressSchema = z.object({
  street: z.string().trim().min(1, "street is required"),
  city: z.string().trim().min(1, "city is required"),
  state: z.string().trim().optional(),
  country: z.string().trim().min(1, "country is required"),
  postalCode: z.string().trim().optional(),
});

export const createOrderSchema = z.object({
  body: z.object({
    cartId: objectId,
    shippingAddress: shippingAddressSchema,
    promoCode: z.string().trim().min(1).max(50).optional(),
  }),
});

export const getOrderByIdSchema = z.object({
  params: z.object({
    orderId: objectId,
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    orderId: objectId,
  }),
  body: z.object({
    status: z.enum(["processing", "shipped", "delivered", "cancelled"]),
  }),
});

export const listSellerOrdersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
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
    user: objectId.optional(),
  }),
});

export const listOrdersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),

    limit: z.coerce.number().int().min(1).max(50).optional(),

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

    user: objectId.optional(),
  }),
});
