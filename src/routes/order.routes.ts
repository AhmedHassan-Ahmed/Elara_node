import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import {
  createOrderHandler,
  getOrderHistoryHandler,
  getOrderByIdHandler,
  listAllOrdersHandler,
  updateOrderStatusHandler,
  getSellerOrders,
  getSellerOrderById,
} from "../controllers/order.controller.js";
import {
  createOrderSchema,
  getOrderHistorySchema,
  getOrderByIdSchema,
  listAllOrdersSchema,
  updateOrderStatusSchema,
  listSellerOrdersSchema,
  getSellerOrderByIdSchema,
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
router.get(
  "/",
  authenticate,
  validate(getOrderHistorySchema),
  getOrderHistoryHandler,
);
router.get(
  "/:orderId",
  authenticate,
  validate(getOrderByIdSchema),
  getOrderByIdHandler,
);

export default router;

// Seller Orders — separate router, own auth scope, mounted at its own path in app.ts
export const sellerOrderRouter = Router();

sellerOrderRouter.use(authenticate, authorize("seller"));

sellerOrderRouter.get("/", validate(listSellerOrdersSchema), getSellerOrders);
sellerOrderRouter.get(
  "/:orderId",
  validate(getSellerOrderByIdSchema),
  getSellerOrderById,
);
