import { Category } from "../models/category.model.js";
import AppError from "../error/AppError.js";
import { escapeRegex } from "../utils/helpers.js";
import {
  parsePagination,
  buildPaginatedResponse,
} from "../utils/pagination.js";

export interface CreateCategoryInput {
  name: string;
  description?: string;
  image?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  image?: string;
  isActive?: boolean;
}

export interface ListCategoriesQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: "active" | "inactive";
}

export const createCategory = async (data: CreateCategoryInput) => {
  const safeName = escapeRegex(data.name.trim());
  const existing = await Category.findOne({
    name: { $regex: `^${safeName}$`, $options: "i" },
  });
  if (existing) {
    throw new AppError(
      409,
      "CATEGORY_ALREADY_EXISTS",
      "Category with this name already exists",
    );
  }

  const category = await Category.create({
    name: data.name.trim(),
    description: data.description?.trim(),
    image: data.image?.trim(),
    isActive: true,
  });

  return category;
};

export const updateCategory = async (
  categoryId: string,
  data: UpdateCategoryInput,
) => {
  const category = await Category.findById(categoryId);
  if (!category)
    throw new AppError(404, "CATEGORY_NOT_FOUND", "Category not found");

  if (data.name) {
    const trimmedName = data.name.trim();
    if (trimmedName.toLowerCase() !== category.name.toLowerCase()) {
      const safeName = escapeRegex(trimmedName);
      const existing = await Category.findOne({
        _id: { $ne: categoryId },
        name: { $regex: `^${safeName}$`, $options: "i" },
      });
      if (existing) {
        throw new AppError(
          409,
          "CATEGORY_ALREADY_EXISTS",
          "Category with this name already exists",
        );
      }
    }
    category.name = trimmedName;
  }

  if (data.description !== undefined)
    category.description = data.description.trim();
  if (data.image !== undefined) category.image = data.image.trim();
  if (data.isActive !== undefined) category.isActive = data.isActive;

  await category.save();
  return category;
};

export const deleteCategory = async (categoryId: string) => {
  const category = await Category.findById(categoryId);
  if (!category)
    throw new AppError(404, "CATEGORY_NOT_FOUND", "Category not found");

  category.isActive = false;
  await category.save();
  return category;
};

export const getCategoryById = async (categoryId: string) => {
  const category = await Category.findById(categoryId);
  if (!category || !category.isActive)
    throw new AppError(404, "CATEGORY_NOT_FOUND", "Category not found");
  return category;
};

export const listCategories = async (query: ListCategoriesQuery) => {
  const { page, limit, skip } = parsePagination(query);
  const filter: Record<string, any> = {};

  if (query.status === "inactive") {
    filter.isActive = false;
  } else {
    filter.isActive = true;
  }

  if (query.search) {
    const safeSearch = escapeRegex(query.search);
    filter.$or = [
      { name: { $regex: safeSearch, $options: "i" } },
      { description: { $regex: safeSearch, $options: "i" } },
    ];
  }

  const [categories, total] = await Promise.all([
    Category.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
    Category.countDocuments(filter),
  ]);

  return buildPaginatedResponse(categories, total, page, limit, "categories");
};
