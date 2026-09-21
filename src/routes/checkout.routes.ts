import { Router } from "express";
import {
  previewCheckout,
  createCheckoutHandler,
} from "../controllers/checkout.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import {
  previewCheckoutSchema,
  createCheckoutSchema,
} from "../validations/checkout.validation.js";

const router = Router();

router.post(
  "/preview",
  authenticate,
  validate(previewCheckoutSchema),
  previewCheckout,
);

router.post(
  "/",
  authenticate,
  validate(createCheckoutSchema),
  createCheckoutHandler,
);

export default router;
