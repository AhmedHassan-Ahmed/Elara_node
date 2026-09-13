import { Router } from "express";
import * as productController from "../controllers/product.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import { uploadMultipleImages } from "../middleware/upload.middleware.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import {
  createProductSchema,
  updateProductSchema,
  getProductByIdSchema,
  deleteProductSchema,
  listProductsSchema,
} from "../validations/product.validation.js";

const router = Router();

router.get("/", validate(listProductsSchema), productController.getProducts);
router.get(
  "/:productId",
  validate(getProductByIdSchema),
  productController.getProductById,
);

router.post(
  "/",
  authenticate,
  authorize("admin", "seller"),
  uploadMultipleImages("images", 5),
  validate(createProductSchema),
  productController.createProduct,
);
router.patch(
  "/:productId",
  authenticate,
  authorize("admin", "seller"),
  uploadMultipleImages("images", 5),
  validate(updateProductSchema),
  productController.updateProduct,
);
router.delete(
  "/:productId",
  authenticate,
  authorize("admin", "seller"),
  validate(deleteProductSchema),
  productController.deleteProduct,
);

export default router;
