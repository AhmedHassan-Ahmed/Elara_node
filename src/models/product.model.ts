import { Schema, model, Document, Types } from "mongoose";

export interface IProduct extends Document {
  seller: Types.ObjectId;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: Types.ObjectId;
  images: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    images: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export const Product = model<IProduct>("Product", productSchema);
