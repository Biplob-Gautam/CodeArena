import { Router } from "express";
import { z } from "zod";
import {
  getCurrentUser,
  login,
  logout,
  register,
} from "../controllers/authController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validationMiddleware.js";

const router = Router();

const registerSchema = z.object({
  email: z.string().trim().email().max(254),
  username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  name: z.string().trim().max(120).optional(),
  displayName: z.string().trim().max(120).optional(),
  password: z.string().min(8).max(72),
}).refine((value) => value.username || value.name || value.email.split("@")[0].replace(/[^a-z0-9_]/gi, "").length >= 3, {
  message: "A username, name, or email prefix that produces a valid username is required.",
});

const loginSchema = z.object({
  email: z.string().trim().min(1).optional(),
  username: z.string().trim().min(1).optional(),
  password: z.string().min(1).max(72),
}).refine((value) => value.email || value.username, {
  message: "Email or username is required.",
});

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", authenticate, getCurrentUser);
router.post("/logout", authenticate, logout);

export default router;