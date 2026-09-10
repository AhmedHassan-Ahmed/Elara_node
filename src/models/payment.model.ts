import { Schema, model, Document, Types } from "mongoose";

export type PaymentStatus = "pending" | "succeeded" | "failed" | "cancelled";

export interface IPayment extends Document {
  order: Types.ObjectId;
  stripePaymentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
    stripePaymentId: { type: String, required: true, unique: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, lowercase: true, default: "usd" },
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed", "cancelled"],
      default: "pending",
      index: true,
    },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

export const Payment = model<IPayment>("Payment", paymentSchema);
