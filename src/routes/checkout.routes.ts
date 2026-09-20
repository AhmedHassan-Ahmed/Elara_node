import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware.js";
import { createCheckoutHandler } from "../controllers/checkout.controller.js";

const router = Router();

router.post("/", authenticate, createCheckoutHandler);

export default router;
