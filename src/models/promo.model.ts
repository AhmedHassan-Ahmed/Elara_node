import { Schema, model, Document } from "mongoose";

export type PromoDiscountType = "percentage" | "fixed";

export interface IPromo extends Document {
  code: string;
  discountType: PromoDiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startsAt: Date;
  expiresAt: Date;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const promoSchema = new Schema<IPromo>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ["percentage", "fixed"], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, min: 0 },
    maxDiscountAmount: { type: Number, min: 0 },
    startsAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    usageLimit: { type: Number, min: 1 },
    usedCount: { type: Number, min: 0, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Promo = model<IPromo>("Promo", promoSchema);
