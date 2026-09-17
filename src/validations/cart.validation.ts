import { z } from "zod";

const objectId = z
  .string({ message: "productId is required" })
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid product id");

export const addToCartSchema = z.object({
  body: z.object({
    productId: objectId,
    quantity: z
      .number({ message: "quantity is required" })
      .int("Quantity must be an integer")
      .min(1, "Quantity must be at least 1"),
  }),
});

export const updateCartItemSchema = z.object({
  params: z.object({
    productId: objectId,
  }),
  body: z.object({
    quantity: z
      .number({ message: "quantity is required" })
      .int("Quantity must be an integer")
      .min(0, "Quantity cannot be negative"),
  }),
});

export const removeCartItemSchema = z.object({
  params: z.object({
    productId: objectId,
  }),
});