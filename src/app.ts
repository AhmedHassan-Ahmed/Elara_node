import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import wishlistRoutes from "./routes/wishlist.routes.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import productRoutes from "./routes/product.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import orderRoutes, { sellerOrderRouter } from "./routes/order.routes.js";
import notificationRoute from "./routes/notification.routes.js";
import errorHandler from "./middleware/errorHandler.js";
import cartRoutes from "./routes/cart.routes.js";
import checkoutRoutes from "./routes/checkout.routes.js";


import promoRoutes from "./routes/promo.routes.js";
import reviewRoutes from "./routes/review.routes.js";

import paymentRoutes from "./routes/payment.routes.js";

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  }),
);
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());

app.use("/api/webhooks", paymentRoutes);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }));

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "server is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/notification", notificationRoute);
app.use("/api/cart", cartRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/seller/orders", sellerOrderRouter);
app.use("/api/promos", promoRoutes);
app.use("/api/reviews", reviewRoutes);

app.use(errorHandler);

export default app;
