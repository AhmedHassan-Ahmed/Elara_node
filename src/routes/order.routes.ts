import { Router } from "express";
import * as orderController from "../controllers/order.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import {
  createOrderSchema,
  getOrderByIdSchema,
  updateOrderStatusSchema,
  listOrdersSchema,
  listSellerOrdersSchema,
} from "../validations/order.validation.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("customer"),
  validate(createOrderSchema),
  orderController.createOrder,
);

router.get(
  "/",
  authenticate,
  authorize("customer"),
  orderController.getMyOrders,
);


router.get(
  "/admin",
  authenticate,
  authorize("admin"),
  validate(listOrdersSchema),
  orderController.listAllOrders,
);

router.patch(
  "/admin/:orderId/status",
  authenticate,
  authorize("admin"),
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus,
);

router.get(
  "/:orderId",
  authenticate,
  authorize("customer", "admin"),
  validate(getOrderByIdSchema),
  orderController.getOrderById,
);

router.get(
  "/seller",
  authenticate,
  authorize("seller"),
  validate(listSellerOrdersSchema),
  orderController.listSellerOrders,
);

router.get(
  "/seller/:orderId",
  authenticate,
  authorize("seller"),
  validate(getOrderByIdSchema),
  orderController.getSellerOrderById,
);

export default router;
