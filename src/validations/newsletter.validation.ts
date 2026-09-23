import { z } from "zod";

export const subscribeSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
  }),
});

export const unsubscribeSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
  }),
});

export const sendCampaignSchema = z.object({
  body: z.object({
    subject: z
      .string({ message: "subject is required" })
      .trim()
      .min(1, "subject is required")
      .max(200, "subject is too long"),
    html: z
      .string({ message: "html is required" })
      .trim()
      .min(1, "html is required"),
  }),
});