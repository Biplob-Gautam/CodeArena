import { Router } from "express";
import { z } from "zod";
import {
  getSubmission,
  listBattleSubmissions,
  submitCode,
} from "../controllers/submissionController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validationMiddleware.js";

const router = Router();

const submissionSchema = z.object({
  language: z.string().trim().min(1).max(40),
  sourceCode: z.string().min(1).max(100_000),
});

router.use(authenticate);
router.post("/battles/:battleId", validate(submissionSchema), submitCode);
router.get("/battles/:battleId", listBattleSubmissions);
router.get("/:submissionId", getSubmission);

export default router;