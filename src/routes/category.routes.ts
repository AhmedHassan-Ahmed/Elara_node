import { Router } from "express";
import * as categoryController from "../controllers/category.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import {
  createCategorySchema,
  updateCategorySchema,
  getCategoryByIdSchema,
  deleteCategorySchema,
  listCategoriesSchema,
} from "../validations/category.validation.js";

const router = Router();

router.get(
  "/",
  validate(listCategoriesSchema),
  categoryController.getCategories,
);
router.get(
  "/:categoryId",
  validate(getCategoryByIdSchema),
  categoryController.getCategoryById,
);

router.post(
  "/",
  authenticate,
  authorize("admin"),
  validate(createCategorySchema),
  categoryController.createCategory,
);
router.patch(
  "/:categoryId",
  authenticate,
  authorize("admin"),
  validate(updateCategorySchema),
  categoryController.updateCategory,
);
router.delete(
  "/:categoryId",
  authenticate,
  authorize("admin"),
  validate(deleteCategorySchema),
  categoryController.deleteCategory,
);

export default router;
