import { Request, Response } from "express";
import * as promoService from "../services/promo.service.js";
import { sendSuccess } from "../utils/response.js";
import AppError from "../error/AppError.js";
import { Cart } from "../models/cart.model.js";

export const createPromo = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const promo = await promoService.createPromo(req.body);
  sendSuccess(res, 201, "Promotion created successfully", { promo });
};

export const updatePromo = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const promoId = req.params.promoId as string;
  const promo = await promoService.updatePromo(promoId, req.body);
  sendSuccess(res, 200, "Promotion updated successfully", { promo });
};

export const deletePromo = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const promoId = req.params.promoId as string;
  const promo = await promoService.deletePromo(promoId);
  sendSuccess(res, 200, "Promotion deactivated successfully", { promo });
};

export const getPromoById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const promoId = req.params.promoId as string;
  const promo = await promoService.getPromoById(promoId);
  sendSuccess(res, 200, "Promotion retrieved successfully", { promo });
};

export const getPromos = async (req: Request, res: Response): Promise<void> => {
  const result = await promoService.listPromos(req.query);
  sendSuccess(res, 200, "Promotions retrieved successfully", result);
};

export const validatePromo = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user!.id;
  const { code } = req.body;

  const cart = await Cart.findOne({ user: userId }).populate(
    "items.product",
    "price stock isActive name",
  );

  if (!cart || cart.items.length === 0) {
    throw new AppError(422, "EMPTY_CART", "Your cart is empty");
  }

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
        `Product "${product.name}" is not available`,
      );
    }
    if (item.quantity > product.stock) {
      throw new AppError(
        422,
        "INSUFFICIENT_STOCK",
        `Insufficient stock for "${product.name}"`,
      );
    }
    subtotal += product.price * item.quantity;
  }

  const { promo, discount, finalTotal } =
    await promoService.validatePromoForOrder(code, subtotal);

  sendSuccess(res, 200, "Promo code applied successfully", {
    promo,
    subtotal: +subtotal.toFixed(2),
    discount,
    finalTotal,
  });
};