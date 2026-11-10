import { Router } from "express";
import { z } from "zod";
import { getBattle, getBattleHistory } from "../controllers/battleController.js";
import { getBattleResult } from "../controllers/resultController.js";
import { submitCode } from "../controllers/submissionController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validationMiddleware.js";

const router = Router();

const submissionSchema = z.object({
  language: z.string().trim().min(1).max(40),
  sourceCode: z.string().min(1).max(100_000),
});

router.use(authenticate);
router.get("/history", getBattleHistory);
router.get("/:battleId/result", getBattleResult);
router.post("/:battleId/submit", validate(submissionSchema), submitCode);
router.get("/:battleId", getBattle);

export default router;