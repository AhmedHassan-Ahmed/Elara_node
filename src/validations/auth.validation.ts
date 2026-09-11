import { z } from "zod";

export const addressSchema = z
  .object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
  })
  .optional();

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    phone: z.string().optional(),
    address: addressSchema,
  }),
});

export const registerSellerSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    phone: z.string().optional(),
    address: addressSchema,
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const googleAuthInitiateSchema = z.object({
  query: z.object({
    role: z
      .preprocess(
        (val) => (typeof val === "string" ? val.toLowerCase() : val),
        z.enum(["customer", "seller"], {
          errorMap: () => ({
            message:
              "Invalid role requested. ADMIN registration is not allowed.",
          }),
        }),
      )
      .optional()
      .default("customer"),
  }),
});

export const googleAuthCallbackSchema = z.object({
  query: z
    .object({
      code: z.string().optional(),
      state: z.string().optional(),
      error: z.string().optional(),
    })
    .refine((data) => Boolean(data.error || (data.code && data.state)), {
      message: "Missing authorization code or state parameter",
      path: ["code"],
    }),
});

export const confirmEmailSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Confirmation token is required"),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Reset token is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

export const refreshTokenSchema = z
  .object({
    body: z.object({ refreshToken: z.string().optional() }).optional(),
    cookies: z.object({ refreshToken: z.string().optional() }).optional(),
  })
  .refine(
    (data) => Boolean(data.cookies?.refreshToken || data.body?.refreshToken),
    {
      message: "Refresh token is required",
      path: ["refreshToken"],
    },
  );

export const resendVerificationSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
  }),
});
