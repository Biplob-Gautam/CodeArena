import { z } from "zod";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const registerSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "Email is required.")
      .max(254, "Email is too long.")
      .regex(emailPattern, "A valid email address is required."),
    username: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters.")
      .max(30, "Username cannot exceed 30 characters.")
      .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores.")
      .optional(),
    name: z.string().trim().min(1).max(120).optional(),
    displayName: z.string().trim().min(1).max(120).optional(),
    password: z.string().min(8).max(72, "Password must be no longer than 72 characters."),
  })
  .refine((value) => {
    if (value.username) {
      return true;
    }

    const safeName = (value.name ?? "").toLowerCase().replace(/[^a-z0-9_]/g, "");
    const emailDerived = value.email.split("@")[0].replace(/[^a-z0-9_]/gi, "");
    const derived = safeName || emailDerived;
    return /^[a-zA-Z0-9_]{3,30}$/.test(derived);
  }, {
    message: "Username, display name, or a valid email-derived username is required.",
    path: ["username"],
  });

export const loginSchema = z
  .object({
    email: z.string().trim().min(1).max(254).optional(),
    username: z.string().trim().min(1).max(30).optional(),
    password: z.string().min(1).max(72),
  })
  .refine((value) => Boolean(value.email || value.username), {
    message: "Email or username is required.",
    path: ["email"],
  });

export default {
  registerSchema,
  loginSchema,
};
