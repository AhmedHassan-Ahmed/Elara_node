import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import {
  createOrderHandler,
  getOrderHistoryHandler,
  getOrderByIdHandler,
  listAllOrdersHandler,
  updateOrderStatusHandler,
} from "../controllers/order.controller.js";
import {
  createOrderSchema,
  getOrderHistorySchema,
  getOrderByIdSchema,
  listAllOrdersSchema,
  updateOrderStatusSchema,
} from "../validations/order.validation.js";

const router = Router();

// Admin routes — must be declared before "/:orderId"
router.get(
  "/admin",
  authenticate,
  authorize("admin"),
  validate(listAllOrdersSchema),
  listAllOrdersHandler,
);
router.patch(
  "/admin/:orderId/status",
  authenticate,
  authorize("admin"),
  validate(updateOrderStatusSchema),
  updateOrderStatusHandler,
);

// Customer routes
router.post("/", authenticate, validate(createOrderSchema), createOrderHandler);
router.get("/", authenticate, validate(getOrderHistorySchema), getOrderHistoryHandler);
router.get("/:orderId", authenticate, validate(getOrderByIdSchema), getOrderByIdHandler);

export default router;