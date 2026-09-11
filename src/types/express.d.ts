import { IUser } from "../models/user.model.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: "customer" | "seller" | "admin";
        isEmailConfirmed?: boolean;
        isActive?: boolean;
      };
      auth?: {
        userId: string;
        role: string;
        sessionId?: string;
      };
    }
  }
}
