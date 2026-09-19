import { Router } from "express";
import { validatePromo } from "../controllers/promo.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import validate from "../middleware/validation.middleware.js";
import { validatePromoSchema } from "../validations/promo.validation.js";

const router = Router();

router.post(
  "/validate",
  authenticate,
  authorize("customer"),
  validate(validatePromoSchema),
  validatePromo,
);

export default router;