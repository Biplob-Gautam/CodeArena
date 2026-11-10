import { Router } from "express";
import { z } from "zod";
import {
  getMyProfile,
  getMyStats,
  getUserById,
  updateMyProfile,
} from "../controllers/userController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validationMiddleware.js";

const router = Router();

const profileSchema = z.object({
  displayName: z.string().trim().max(120).nullable().optional(),
  avatarUrl: z.union([
    z.string().trim().url().max(2048),
    z.literal(""),
  ]).nullable().optional(),
  bio: z.string().trim().max(500).nullable().optional(),
  leetcodeUsername: z.string().trim().max(120).nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "Provide at least one profile field.",
});

router.use(authenticate);
router.get("/me", getMyProfile);
router.get("/me/stats", getMyStats);
router.put("/me", validate(profileSchema), updateMyProfile);
router.get("/:userId", getUserById);

export default router;