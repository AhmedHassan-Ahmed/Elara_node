import { Router } from "express";
import {
  updateReview,
  deleteReview,
} from "../controllers/review.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import validate from "../middleware/validation.middleware.js";
import {
  updateReviewSchema,
  reviewIdParamSchema,
} from "../validations/review.validation.js";

const router = Router();


router.patch(
  "/:reviewId",
  authenticate,
  authorize("customer"),
  validate(updateReviewSchema),
  updateReview,
);


router.delete(
  "/:reviewId",
  authenticate,
  authorize("customer"),
  validate(reviewIdParamSchema),
  deleteReview,
);

export default router;