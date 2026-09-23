import { Router } from "express";
import { getMyRewards } from "../controllers/loyalty.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authenticate, authorize("customer"), getMyRewards);

export default router;