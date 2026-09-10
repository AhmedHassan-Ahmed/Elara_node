import { Schema, model, Document, Types } from "mongoose";

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface IOrderItem {
  product: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
}

export interface IOrder extends Document {
  user: Types.ObjectId;
  orderNumber: string;
  items: IOrderItem[];
  totalAmount: number;
  shippingAddress: {
    street: string;
    city: string;
    state?: string;
    country: string;
    postalCode?: string;
  };
  status: OrderStatus;
  paymentId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderNumber: { type: String, required: true, unique: true, index: true },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [
        (v: IOrderItem[]) => v.length > 0,
        "Order must contain at least one item",
      ],
    },
    totalAmount: { type: Number, required: true, min: 0 },
    shippingAddress: {
      street: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, trim: true },
      country: { type: String, required: true, trim: true },
      postalCode: { type: String, trim: true },
    },
    status: {
      type: String,
      enum: [
        "pending",
        "paid",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment" },
  },
  { timestamps: true },
);

export const Order = model<IOrder>("Order", orderSchema);
