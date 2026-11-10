import { Router } from "express";
import { z } from "zod";
import { getLeaderboard } from "../controllers/leaderboardController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validationMiddleware.js";

const router = Router();

const querySchema = z.object({
  page: z.string().regex(/^[1-9]\d*$/).optional(),
  limit: z.string().regex(/^[1-9]\d*$/).optional(),
}).passthrough();

router.get("/", authenticate, validate(querySchema, "query"), getLeaderboard);

export default router;