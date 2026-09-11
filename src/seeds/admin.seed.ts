import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import { env } from "../config/env.js";

export const seedAdmin = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      console.log("Connecting to database for Admin seeding...");
      await mongoose.connect(env.mongodbUri);
    }

    const adminEmail = env.adminEmail.toLowerCase();
    const existingAdmin = await User.findOne({
      $or: [{ email: adminEmail }, { role: "admin" }],
    });

    if (existingAdmin) {
      console.log(
        `Admin account already exists (${existingAdmin.email}). Skipping seed.`,
      );
      return existingAdmin;
    }

    const hashedPassword = await bcrypt.hash(env.adminPassword, 12);

    const admin = await User.create({
      name: "System Administrator",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      isEmailConfirmed: true,
      isActive: true,
      phone: "+10000000000",
    });

    console.log(`Admin user created successfully with email: ${admin.email}`);
    return admin;
  } catch (error) {
    console.error("Error seeding Admin user:", error);
    throw error;
  }
};

if (process.argv[1] && process.argv[1].endsWith("admin.seed.ts")) {
  seedAdmin()
    .then(() => {
      console.log("Admin seed process completed.");
      process.exit(0);
    })
    .catch(() => process.exit(1));
}
