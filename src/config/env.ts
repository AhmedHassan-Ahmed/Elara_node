import "dotenv/config";

export const env = {
  port: process.env.PORT || "5000",
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
};
