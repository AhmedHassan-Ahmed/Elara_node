import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  registerSchema,
  registerSellerSchema,
  loginSchema,
  googleAuthInitiateSchema,
  googleAuthCallbackSchema,
  confirmEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  resendVerificationSchema,
} from "../validations/auth.validation.js";

const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post(
  "/register-seller",
  validate(registerSellerSchema),
  authController.registerSeller,
);
router.post("/login", validate(loginSchema), authController.login);
router.get(
  "/google",
  validate(googleAuthInitiateSchema),
  authController.initiateGoogleAuth,
);
router.get(
  "/google/callback",
  validate(googleAuthCallbackSchema),
  authController.handleGoogleCallback,
);
router.post(
  "/confirm-email",
  validate(confirmEmailSchema),
  authController.confirmEmail,
);
router.get("/me", authenticate, authController.me);
router.post("/logout", authenticate, authController.logout);

router.post(
  "/refresh",
  validate(refreshTokenSchema),
  authController.refreshToken,
);
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  authController.resetPassword,
);
router.post(
  "/resend-verification",
  validate(resendVerificationSchema),
  authController.resendVerification,
);

export default router;
