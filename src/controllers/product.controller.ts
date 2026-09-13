import { Request, Response } from "express";
import * as productService from "../services/product.service.js";
import { sendSuccess } from "../utils/response.js";
import AppError from "../error/AppError.js";

export const createProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  }
  const files = req.files as Express.Multer.File[] | undefined;
  const product = await productService.createProduct(req.user, req.body, files);
  sendSuccess(res, 201, "Product created successfully", { product });
};

export const updateProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  }
  const productId = req.params.productId as string;
  const files = req.files as Express.Multer.File[] | undefined;
  const product = await productService.updateProduct(
    req.user,
    productId,
    req.body,
    files,
  );
  sendSuccess(res, 200, "Product updated successfully", { product });
};

export const deleteProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  }
  const productId = req.params.productId as string;
  const product = await productService.deleteProduct(req.user, productId);
  sendSuccess(res, 200, "Product deactivated successfully", { product });
};

export const getProductById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const productId = req.params.productId as string;
  const product = await productService.getProductById(productId);
  sendSuccess(res, 200, "Product retrieved successfully", { product });
};

export const getProducts = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await productService.listProducts(req.query);
  sendSuccess(res, 200, "Products retrieved successfully", result);
};
