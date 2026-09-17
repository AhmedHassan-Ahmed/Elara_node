import { Router } from "express";
import * as orderController from "../controllers/order.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import {
  listSellerOrdersSchema,
  getSellerOrderByIdSchema,
} from "../validations/order.validation.js";

const router = Router();

router.use(authenticate, authorize("seller"));

router.get(
  "/",
  validate(listSellerOrdersSchema),
  orderController.getSellerOrders,
);
router.get(
  "/:orderId",
  validate(getSellerOrderByIdSchema),
  orderController.getSellerOrderById,
);

export default router;
