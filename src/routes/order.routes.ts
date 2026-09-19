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

export const sellerOrderRouter = Router();

sellerOrderRouter.use(authenticate, authorize("seller"));

sellerOrderRouter.get("/", validate(listSellerOrdersSchema), getSellerOrders);
sellerOrderRouter.get(
  "/:orderId",
  validate(getSellerOrderByIdSchema),
  getSellerOrderById,
);
