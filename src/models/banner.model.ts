import { Schema, model, Document } from "mongoose";

export interface IBanner extends Document {
  title: string;
  image: string;
  link?: string;
  isActive: boolean;
  sortOrder: number;
  startsAt?: Date;
  endsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const bannerSchema = new Schema<IBanner>(
  {
    title: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    link: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    startsAt: { type: Date },
    endsAt: { type: Date },
  },
  { timestamps: true },
);

export const Banner = model<IBanner>("Banner", bannerSchema);
