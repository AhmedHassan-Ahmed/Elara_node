import { Router } from "express";
import {
  subscribe,
  unsubscribe,
} from "../controllers/newsletter.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import {
  subscribeSchema,
  unsubscribeSchema,
} from "../validations/newsletter.validation.js";

const router = Router();

router.post(
  "/subscribe",
  authenticate,
  validate(subscribeSchema),
  subscribe,
);

router.post(
  "/unsubscribe",
  validate(unsubscribeSchema),
  unsubscribe,
);

export default router;