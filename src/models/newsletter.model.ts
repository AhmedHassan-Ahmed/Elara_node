import { Schema, model, Document, Types } from "mongoose";

export interface INewsletter extends Document {
  email: string;
  userId?: Types.ObjectId;
  subscribed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const newsletterSchema = new Schema<INewsletter>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    subscribed: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true },
);

export const Newsletter = model<INewsletter>("Newsletter", newsletterSchema);