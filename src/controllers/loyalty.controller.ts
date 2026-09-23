import { Request, Response } from "express";
import { User } from "../models/user.model.js";
import AppError from "../error/AppError.js";
import { sendSuccess } from "../utils/response.js";

export const getMyRewards = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const user = await User.findById(req.user!.id).select(
    "rewardPoints name email",
  );

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }

  sendSuccess(res, 200, "Rewards retrieved successfully", {
    rewardPoints: user.rewardPoints ?? 0,
  });
};

export const awardPointsForOrder = async (
  userId: string,
  orderTotal: number,
): Promise<number> => {
  const points = Math.floor(orderTotal / 10);
  if (points <= 0) return 0;

  await User.findByIdAndUpdate(userId, { $inc: { rewardPoints: points } });

  return points;
};

export const redeemPoints = async (
  userId: string,
  points: number,
): Promise<number> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }

  if ((user.rewardPoints ?? 0) < points) {
    throw new AppError(
      422,
      "INSUFFICIENT_REWARD_POINTS",
      "Not enough reward points",
    );
  }

  user.rewardPoints -= points;
  await user.save();

  return user.rewardPoints;
};