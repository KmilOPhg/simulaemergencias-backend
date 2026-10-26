import { Router } from "express";
import asyncWrapper from "../utils/AsyncWrapper";
import { healthCheckController } from "../controllers/sistema.controller";

const router = Router();

// GET /api/sistema/health — público, útil para balanceadores/monitoreo
router.get("/health", asyncWrapper(healthCheckController));

export default router;
