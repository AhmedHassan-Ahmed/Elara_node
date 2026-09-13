import { Banner } from "../models/banner.model.js";
import AppError from "../error/AppError.js";
import {
  parsePagination,
  buildPaginatedResponse,
} from "../utils/pagination.js";
import * as mediaService from "./media.service.js";

export interface CreateBannerInput {
  title: string;
  image?: string;
  link?: string;
  sortOrder?: number;
  startsAt?: Date;
  endsAt?: Date;
  isActive?: boolean;
}

export interface UpdateBannerInput {
  title?: string;
  image?: string;
  link?: string;
  sortOrder?: number;
  startsAt?: Date;
  endsAt?: Date;
  isActive?: boolean;
}

export interface ListBannersQuery {
  page?: number;
  limit?: number;
  status?: "active" | "inactive";
}

export const createBanner = async (
  data: CreateBannerInput,
  file?: Express.Multer.File,
) => {
  let imageUrl = data.image?.trim() || "";

  if (file && file.buffer) {
    const uploadResult = await mediaService.uploadImage(file.buffer, "banners");
    imageUrl = uploadResult.url;
  }

  if (!imageUrl) {
    throw new AppError(
      400,
      "IMAGE_REQUIRED",
      "Banner image is required (either file upload or image URL)",
    );
  }

  const banner = await Banner.create({
    title: data.title.trim(),
    image: imageUrl,
    link: data.link?.trim(),
    sortOrder: data.sortOrder ?? 0,
    startsAt: data.startsAt,
    endsAt: data.endsAt,
    isActive: data.isActive ?? true,
  });

  return banner;
};

export const updateBanner = async (
  bannerId: string,
  data: UpdateBannerInput,
  file?: Express.Multer.File,
) => {
  const banner = await Banner.findById(bannerId);
  if (!banner) throw new AppError(404, "BANNER_NOT_FOUND", "Banner not found");

  if (file && file.buffer) {
    const uploadResult = await mediaService.replaceImage(
      banner.image,
      file.buffer,
      "banners",
    );
    banner.image = uploadResult.url;
  } else if (data.image !== undefined) {
    banner.image = data.image.trim();
  }

  if (data.title !== undefined) banner.title = data.title.trim();
  if (data.link !== undefined) banner.link = data.link.trim();
  if (data.sortOrder !== undefined) banner.sortOrder = data.sortOrder;
  if (data.startsAt !== undefined) banner.startsAt = data.startsAt;
  if (data.endsAt !== undefined) banner.endsAt = data.endsAt;
  if (data.isActive !== undefined) banner.isActive = data.isActive;

  await banner.save();
  return banner;
};

export const deleteBanner = async (bannerId: string) => {
  const banner = await Banner.findById(bannerId);
  if (!banner) throw new AppError(404, "BANNER_NOT_FOUND", "Banner not found");

  if (banner.image) {
    await mediaService.deleteImage(banner.image);
  }

  banner.isActive = false;
  await banner.save();
  return banner;
};

export const getBannerById = async (bannerId: string) => {
  const banner = await Banner.findById(bannerId);
  if (!banner) throw new AppError(404, "BANNER_NOT_FOUND", "Banner not found");
  return banner;
};

export const listBanners = async (query: ListBannersQuery) => {
  const { page, limit, skip } = parsePagination(query);
  const filter: Record<string, any> = {};

  if (query.status) filter.isActive = query.status === "active";

  const [banners, total] = await Promise.all([
    Banner.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Banner.countDocuments(filter),
  ]);

  return buildPaginatedResponse(banners, total, page, limit, "banners");
};
