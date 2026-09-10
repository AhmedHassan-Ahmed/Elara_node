import { Schema, model, Document, Types } from "mongoose";

export type UserRole = "customer" | "seller" | "admin";

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
  isEmailConfirmed: boolean;
  isActive: boolean;
  wishlist: Types.ObjectId[];
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["customer", "seller", "admin"], default: "customer" },
    isEmailConfirmed: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    wishlist: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
    },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);
