import { Router } from "express";
import asyncWrapper from "../utils/AsyncWrapper";
import { authenticateToken, checkPermissions } from "../middlewares/auth.middleware";
import { listarGruposController } from "../controllers/grupos.controller";

const router = Router();

// GET /api/grupos — HU-06
router.get("/", authenticateToken, checkPermissions(["grupos.consultar"]), asyncWrapper(listarGruposController));

export default router;
