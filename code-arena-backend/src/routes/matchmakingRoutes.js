import { Router } from "express";
import {
  cancelMatch,
  findMatch,
} from "../controllers/matchmakingController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(authenticate);
router.post("/find", findMatch);
router.post("/cancel", cancelMatch);

export default router;