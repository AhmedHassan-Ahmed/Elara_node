import { Request, Response } from "express";
import * as promoService from "../services/promo.service.js";
import { sendSuccess } from "../utils/response.js";

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
