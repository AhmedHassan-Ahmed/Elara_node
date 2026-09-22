import { Router } from "express";
import {
  previewCheckout,
  createCheckoutHandler,
  createCheckoutWithPromoHandler,
} from "../controllers/checkout.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import {
  previewCheckoutSchema,
  createCheckoutSchema,
  createCheckoutWithPromoSchema,
} from "../validations/checkout.validation.js";

const router = Router();

router.use(authenticate, authorize("customer"));

router.post("/preview", validate(previewCheckoutSchema), previewCheckout);

router.post("/", validate(createCheckoutSchema), createCheckoutHandler);

router.post(
  "/with-promo",
  validate(createCheckoutWithPromoSchema),
  createCheckoutWithPromoHandler,
);

export default router;