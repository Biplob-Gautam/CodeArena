import { Router } from "express";
import { z } from "zod";
import { getProblem, listProblems } from "../controllers/problemController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validationMiddleware.js";

const router = Router();

const listQuerySchema = z.object({
  page: z.string().regex(/^[1-9]\d*$/).optional(),
  limit: z.string().regex(/^[1-9]\d*$/).optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "easy", "medium", "hard"]).optional(),
  tag: z.string().trim().min(1).max(50).optional(),
}).passthrough();

router.use(authenticate);
router.get("/", validate(listQuerySchema, "query"), listProblems);
router.get("/:problemId", getProblem);

export default router;