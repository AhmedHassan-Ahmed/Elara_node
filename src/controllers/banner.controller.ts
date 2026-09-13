import { Request, Response } from "express";
import * as bannerService from "../services/banner.service.js";
import { sendSuccess } from "../utils/response.js";

export const createBanner = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const banner = await bannerService.createBanner(req.body, req.file);
  sendSuccess(res, 201, "Banner created successfully", { banner });
};

export const updateBanner = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const bannerId = req.params.bannerId as string;
  const banner = await bannerService.updateBanner(bannerId, req.body, req.file);
  sendSuccess(res, 200, "Banner updated successfully", { banner });
};

export const deleteBanner = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const bannerId = req.params.bannerId as string;
  const banner = await bannerService.deleteBanner(bannerId);
  sendSuccess(res, 200, "Banner deactivated successfully", { banner });
};

export const getBannerById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const bannerId = req.params.bannerId as string;
  const banner = await bannerService.getBannerById(bannerId);
  sendSuccess(res, 200, "Banner retrieved successfully", { banner });
};

export const getBanners = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await bannerService.listBanners(req.query);
  sendSuccess(res, 200, "Banners retrieved successfully", result);
};
