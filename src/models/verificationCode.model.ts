import { Schema, model, Document, Types } from "mongoose";

export type TokenType = "email_verification" | "password_reset";

export interface IVerificationCode extends Document {
  user_id: Types.ObjectId;
  type: TokenType;
  token: string;
  expires_at: Date;
  used_at?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const verificationCodeSchema = new Schema<IVerificationCode>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["email_verification", "password_reset"],
      required: true,
    },
    token: {
      type: String,
      required: true,
      index: true,
    },
    expires_at: {
      type: Date,
      required: true,
    },
    used_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
).index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export const VerificationCode = model<IVerificationCode>(
  "VerificationCode",
  verificationCodeSchema,
);
