import { Router } from "express";
import * as adminController from "../controllers/admin.controller.js";
import * as bannerController from "../controllers/banner.controller.js";
import * as promoController from "../controllers/promo.controller.js";
import * as reviewController from "../controllers/review.controller.js";
import * as newsletterController from "../controllers/newsletter.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { uploadSingleImage } from "../middleware/upload.middleware.js";

import {
  listUsersSchema,
  getUserByIdSchema,
  updateUserStatusSchema,
  listSellersSchema,
  getSellerByIdSchema,
  updateSellerStatusSchema,
} from "../validations/admin.validation.js";

import {
  createBannerSchema,
  updateBannerSchema,
  getBannerByIdSchema,
  deleteBannerSchema,
  listBannersSchema,
} from "../validations/banner.validation.js";

import {
  createPromoSchema,
  updatePromoSchema,
  getPromoByIdSchema,
  deletePromoSchema,
  listPromosSchema,
} from "../validations/promo.validation.js";

import { moderateReviewSchema } from "../validations/review.validation.js";
import { sendCampaignSchema } from "../validations/newsletter.validation.js";

const router = Router();

router.use(authenticate, authorize("admin"));


router.get("/users", validate(listUsersSchema), adminController.getUsers);
router.get(
  "/users/:userId",
  validate(getUserByIdSchema),
  adminController.getUserById,
);
router.patch(
  "/users/:userId/status",
  validate(updateUserStatusSchema),
  adminController.updateUserStatus,
);
router.delete(
  "/users/:userId",
  validate(getUserByIdSchema),
  adminController.deactivateUser,
);


router.get("/sellers", validate(listSellersSchema), adminController.getSellers);
router.get(
  "/sellers/:sellerId",
  validate(getSellerByIdSchema),
  adminController.getSellerById,
);
router.patch(
  "/sellers/:sellerId/status",
  validate(updateSellerStatusSchema),
  adminController.updateSellerStatus,
);
router.delete(
  "/sellers/:sellerId",
  validate(getSellerByIdSchema),
  adminController.deactivateSeller,
);


router.get(
  "/banners",
  validate(listBannersSchema),
  bannerController.getBanners,
);
router.get(
  "/banners/:bannerId",
  validate(getBannerByIdSchema),
  bannerController.getBannerById,
);
router.post(
  "/banners",
  uploadSingleImage("image"),
  validate(createBannerSchema),
  bannerController.createBanner,
);
router.patch(
  "/banners/:bannerId",
  uploadSingleImage("image"),
  validate(updateBannerSchema),
  bannerController.updateBanner,
);
router.delete(
  "/banners/:bannerId",
  validate(deleteBannerSchema),
  bannerController.deleteBanner,
);


router.get("/promos", validate(listPromosSchema), promoController.getPromos);
router.get(
  "/promos/:promoId",
  validate(getPromoByIdSchema),
  promoController.getPromoById,
);
router.post(
  "/promos",
  validate(createPromoSchema),
  promoController.createPromo,
);
router.patch(
  "/promos/:promoId",
  validate(updatePromoSchema),
  promoController.updatePromo,
);
router.delete(
  "/promos/:promoId",
  validate(deletePromoSchema),
  promoController.deletePromo,
);


router.patch(
  "/reviews/:reviewId",
  validate(moderateReviewSchema),
  reviewController.moderateReview,
);


router.get("/newsletters", newsletterController.listSubscribers);

router.post(
  "/newsletters/send",
  validate(sendCampaignSchema),
  newsletterController.sendCampaign,
);

export default router;