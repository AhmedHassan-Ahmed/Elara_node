import { Router } from "express";
import { previewCheckout } from "../controllers/checkout.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import validate from "../middleware/validation.middleware.js";
import { previewCheckoutSchema } from "../validations/checkout.validation.js";

const router = Router();

router.use(authenticate, authorize("customer"));

router.post("/preview", validate(previewCheckoutSchema), previewCheckout);

export default router;