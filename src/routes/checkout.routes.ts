import { Router } from "express";
<<<<<<< HEAD
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
=======

import { authenticate } from "../middleware/auth.middleware.js";
import { createCheckoutHandler } from "../controllers/checkout.controller.js";
>>>>>>> origin/dev

const router = Router();

router.post("/", authenticate, createCheckoutHandler);

<<<<<<< HEAD
router.post("/preview", validate(previewCheckoutSchema), previewCheckout);

router.post("/", validate(createCheckoutSchema), createCheckoutHandler);

export default router;
=======
export default router;
>>>>>>> origin/dev
