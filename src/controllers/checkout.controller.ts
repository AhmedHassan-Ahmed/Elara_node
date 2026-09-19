import { Request, Response } from "express";
import { Cart } from "../models/cart.model.js";
import AppError from "../error/AppError.js";
import { sendSuccess } from "../utils/response.js";
import * as promoService from "../services/promo.service.js";

const SHIPPING_FLAT = 50;
const TAX_RATE = 0.14;

interface Breakdown {
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    lineTotal: number;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  promoCode?: string;
  promoId?: string;
}


export const buildCheckoutBreakdown = async (
  userId: string,
  promoCode?: string,
): Promise<Breakdown> => {
  const cart = await Cart.findOne({ user: userId }).populate(
    "items.product",
    "name price stock isActive",
  );

  if (!cart || cart.items.length === 0) {
    throw new AppError(422, "EMPTY_CART", "Your cart is empty");
  }

  const items: Breakdown["items"] = [];
  let subtotal = 0;

  for (const item of cart.items as any[]) {
    const product = item.product;

    if (!product) {
      throw new AppError(
        404,
        "PRODUCT_NOT_FOUND",
        "One of the products in your cart no longer exists",
      );
    }

    if (!product.isActive) {
      throw new AppError(
        422,
        "PRODUCT_INACTIVE",
        `Product "${product.name}" is not available for purchase`,
      );
    }

    if (item.quantity > product.stock) {
      throw new AppError(
        422,
        "INSUFFICIENT_STOCK",
        `Only ${product.stock} item(s) of "${product.name}" are available`,
      );
    }

    const lineTotal = +(product.price * item.quantity).toFixed(2);
    subtotal += lineTotal;

    items.push({
      productId: product._id.toString(),
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      lineTotal,
    });
  }

  subtotal = +subtotal.toFixed(2);

  const shipping = SHIPPING_FLAT;
  const tax = +(subtotal * TAX_RATE).toFixed(2);

  let discount = 0;
  let promoId: string | undefined;

  if (promoCode) {
    const result = await promoService.validatePromoForOrder(
      promoCode,
      subtotal,
    );
    discount = result.discount;
    promoId = result.promo._id;
  }

  const total = +(subtotal + shipping + tax - discount).toFixed(2);

  return {
    items,
    subtotal,
    shipping,
    tax,
    discount,
    total,
    promoCode,
    promoId,
  };
};


export const previewCheckout = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user!.id;
  const { promoCode } = req.body;

  const breakdown = await buildCheckoutBreakdown(userId, promoCode);

  sendSuccess(res, 200, "Checkout preview generated successfully", {
    breakdown,
  });
};