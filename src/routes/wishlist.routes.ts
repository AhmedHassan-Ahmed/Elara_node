import { Router } from "express";
import * as wishlistController from "../controllers/wishlist.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import {
  addToWishlistSchema,
  removeFromWishlistSchema,
  listWishlistSchema,
} from "../validations/wishlist.validation.js";

const router = Router();

router.use(authenticate, authorize("customer"));

router.get("/", validate(listWishlistSchema), wishlistController.getWishlist);
router.post(
  "/",
  validate(addToWishlistSchema),
  wishlistController.addToWishlist,
);
router.delete(
  "/:productId",
  validate(removeFromWishlistSchema),
  wishlistController.removeFromWishlist,
);

export default router;
