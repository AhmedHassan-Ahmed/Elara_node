import { Request, Response } from "express";
import * as categoryService from "../services/category.service.js";
import { sendSuccess } from "../utils/response.js";

export const createCategory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const category = await categoryService.createCategory(req.body);
  sendSuccess(res, 201, "Category created successfully", { category });
};

export const updateCategory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const categoryId = req.params.categoryId as string;
  const category = await categoryService.updateCategory(categoryId, req.body);
  sendSuccess(res, 200, "Category updated successfully", { category });
};

export const deleteCategory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const categoryId = req.params.categoryId as string;
  const category = await categoryService.deleteCategory(categoryId);
  sendSuccess(res, 200, "Category deactivated successfully", { category });
};

export const getCategoryById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const categoryId = req.params.categoryId as string;
  const category = await categoryService.getCategoryById(categoryId);
  sendSuccess(res, 200, "Category retrieved successfully", { category });
};

export const getCategories = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await categoryService.listCategories(req.query);
  sendSuccess(res, 200, "Categories retrieved successfully", result);
};
