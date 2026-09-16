import { Router } from "express";
import {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../controllers/cart.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import validate from "../middleware/validation.middleware.js";
import {
  addToCartSchema,
  updateCartItemSchema,
  removeCartItemSchema,
} from "../validations/cart.validation.js";

const router = Router();


router.use(authenticate, authorize("customer"));

router.get("/", getCart);

router.post("/items", validate(addToCartSchema), addItemToCart);

router.patch(
  "/items/:productId",
  validate(updateCartItemSchema),
  updateCartItem,
);

router.delete(
  "/items/:productId",
  validate(removeCartItemSchema),
  removeCartItem,
);

router.delete("/", clearCart);

export default router;