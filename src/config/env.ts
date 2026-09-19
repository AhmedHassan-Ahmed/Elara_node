import "dotenv/config";

export const env = {
  port: process.env.PORT || "5000",
  mongodbUri:
    process.env.MONGODB_URI ||
    process.env.MONGO_URL ||
    "mongodb://127.0.0.1:27017/e-commerce",
  jwtSecret: process.env.JWT_SECRET || "default_super_secret_jwt_key_ean_stack",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  refreshTokenExpiresInMs: 7 * 24 * 60 * 60 * 1000,
  bcryptSaltRounds: process.env.BCRYPT_SALT_ROUNDS
    ? parseInt(process.env.BCRYPT_SALT_ROUNDS, 10)
    : 12,
  emailVerificationExpiresInMs: 24 * 60 * 60 * 1000,
  passwordResetExpiresInMs: 15 * 60 * 1000,
  oauthStateExpiresInMs: 10 * 60 * 1000,
  googleClientId: (process.env.GOOGLE_CLIENT_ID || "")
    .replace(/^["']|["']$/g, "")
    .trim(),
  googleClientSecret: (process.env.GOOGLE_CLIENT_SECRET || "")
    .replace(/^["']|["']$/g, "")
    .trim(),
  googleRedirectUri: (
    process.env.GOOGLE_REDIRECT_URI ||
    `http://localhost:${process.env.PORT || "5000"}/api/auth/google/callback`
  )
    .replace(/^["']|["']$/g, "")
    .trim(),


    
  smtpHost: process.env.EMAIL_HOST || "",
  smtpPort: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 587,
  smtpUser: process.env.EMAIL_USER || process.env.SMTP_USER || "",
  smtpPass: process.env.EMAIL_PASSWORD || process.env.SMTP_PASS || "",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  stripeSecretKey: (process.env.STRIPE_SECRET_KEY || "").replace(/^["']|["']$/g, "").trim(),
  stripeWebhookSecret: (process.env.STRIPE_WEBHOOK_SECRET || "").replace(/^["']|["']$/g, "").trim(),
  stripeCurrency: (process.env.STRIPE_CURRENCY || "usd").trim().toLowerCase(),
  adminEmail: process.env.ADMIN_EMAIL || "admin@example.com",
  adminPassword: process.env.ADMIN_PASSWORD || "Admin123!@#",
  cloudinaryCloudName: (process.env.CLOUDINARY_CLOUD_NAME || "").trim(),
  cloudinaryApiKey: (process.env.CLOUDINARY_API_KEY || "").trim(),
  cloudinaryApiSecret: (process.env.CLOUDINARY_API_SECRET || "").trim(),
};
