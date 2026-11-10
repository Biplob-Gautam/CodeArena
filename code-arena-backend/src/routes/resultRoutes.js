import { Router } from "express";
import { getBattleResult } from "../controllers/resultController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/:battleId", authenticate, getBattleResult);

export default router;