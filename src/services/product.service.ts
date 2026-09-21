import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";
import { User } from "../models/user.model.js";
import AppError from "../error/AppError.js";
import { escapeRegex } from "../utils/helpers.js";
import {
  parsePagination,
  buildPaginatedResponse,
} from "../utils/pagination.js";
import { UserAuthContext } from "../types/common.types.js";
import * as mediaService from "./media.service.js";

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images?: string[];
  seller?: string;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: string;
  images?: string[];
  isActive?: boolean;
  seller?: string;
}

export interface ListProductsQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "price_asc" | "price_desc" | "newest" | "oldest";
  status?: "active" | "inactive";
}

export const createProduct = async (
  user: UserAuthContext,
  data: CreateProductInput,
  files?: Express.Multer.File[],
) => {
  const categoryExists = await Category.findById(data.category);
  if (!categoryExists)
    throw new AppError(404, "CATEGORY_NOT_FOUND", "Category not found");

  let sellerId = user.id;

  if (user.role === "admin" && data.seller) {
    const sellerUser = await User.findById(data.seller);
    if (!sellerUser)
      throw new AppError(404, "SELLER_NOT_FOUND", "Specified seller not found");
    sellerId = data.seller;
  }

  const uploadedImageUrls: string[] = [];
  if (files && files.length > 0) {
    for (const file of files) {
      if (file.buffer) {
        const uploadResult = await mediaService.uploadImage(
          file.buffer,
          "products",
        );
        uploadedImageUrls.push(uploadResult.url);
      }
    }
  }

  const finalImages =
    uploadedImageUrls.length > 0
      ? uploadedImageUrls
      : data.images?.map((url) => url.trim()).filter(Boolean) || [];

  const product = await Product.create({
    name: data.name.trim(),
    description: data.description.trim(),
    price: data.price,
    stock: data.stock,
    category: data.category,
    images: finalImages,
    seller: sellerId,
    isActive: true,
  });

  return product.populate([
    { path: "category", select: "name description" },
    { path: "seller", select: "name email" },
  ]);
};

export const updateProduct = async (
  user: UserAuthContext,
  productId: string,
  data: UpdateProductInput,
  files?: Express.Multer.File[],
) => {
  const product = await Product.findById(productId);
  if (!product)
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");

  if (user.role !== "admin" && product.seller.toString() !== user.id) {
    throw new AppError(
      403,
      "FORBIDDEN",
      "Forbidden. You can only update your own products",
    );
  }

  if (data.category) {
    const categoryExists = await Category.findById(data.category);
    if (!categoryExists)
      throw new AppError(404, "CATEGORY_NOT_FOUND", "Category not found");
    product.category = data.category as any;
  }

  if (data.name !== undefined) product.name = data.name.trim();
  if (data.description !== undefined)
    product.description = data.description.trim();
  if (data.price !== undefined) product.price = data.price;
  if (data.stock !== undefined) product.stock = data.stock;

  const uploadedImageUrls: string[] = [];
  if (files && files.length > 0) {
    for (const file of files) {
      if (file.buffer) {
        const uploadResult = await mediaService.uploadImage(
          file.buffer,
          "products",
        );
        uploadedImageUrls.push(uploadResult.url);
      }
    }
  }

  if (uploadedImageUrls.length > 0) {
    for (const oldImg of product.images) {
      mediaService.deleteImage(oldImg).catch((err) => {
        console.error(
          "[Product Service] Error deleting old image on update:",
          err,
        );
      });
    }
    product.images = uploadedImageUrls;
  } else if (data.images !== undefined) {
    product.images = data.images.map((url) => url.trim()).filter(Boolean);
  }

  if (data.isActive !== undefined) product.isActive = data.isActive;

  await product.save();
  return product.populate([
    { path: "category", select: "name description" },
    { path: "seller", select: "name email" },
  ]);
};

export const deleteProduct = async (
  user: UserAuthContext,
  productId: string,
) => {
  const product = await Product.findById(productId);
  if (!product)
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");

  if (user.role !== "admin" && product.seller.toString() !== user.id) {
    throw new AppError(
      403,
      "FORBIDDEN",
      "Forbidden. You can only delete your own products",
    );
  }

  product.isActive = false;
  await product.save();

  if (product.images && product.images.length > 0) {
    for (const imgUrl of product.images) {
      mediaService.deleteImage(imgUrl).catch((err) => {
        console.error(
          "[Product Service] Error deleting image on product delete:",
          err,
        );
      });
    }
  }

  return product;
};

export const getProductById = async (productId: string) => {
  const product = await Product.findById(productId)
    .populate("category", "name description")
    .populate("seller", "name email phone");

  if (!product || !product.isActive)
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  return product;
};
export const listProducts = async (query: ListProductsQuery) => {
  const { page, limit, skip } = parsePagination(query);

  const filter: Record<string, any> = {};

  if (query.status === "inactive") {
    filter.isActive = false;
  } else {
    filter.isActive = true;
  }
  filter.stock = { $gt: 0 };

  if (query.search) {
    filter.name = {
      $regex: escapeRegex(query.search),
      $options: "i",
    };
  }

  if (query.category) {
    filter.category = query.category;
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {};

    if (query.minPrice !== undefined) {
      filter.price.$gte = query.minPrice;
    }

    if (query.maxPrice !== undefined) {
      filter.price.$lte = query.maxPrice;
    }
  }

  let sortOption: Record<string, 1 | -1> = {
    createdAt: -1,
  };

  if (query.sort === "price_asc") {
    sortOption = { price: 1 };
  } else if (query.sort === "price_desc") {
    sortOption = { price: -1 };
  } else if (query.sort === "oldest") {
    sortOption = { createdAt: 1 };
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name")
      .populate("seller", "name email")
      .sort(sortOption)
      .skip(skip)
      .limit(limit),

    Product.countDocuments(filter),
  ]);

  return buildPaginatedResponse(products, total, page, limit, "products");
};
