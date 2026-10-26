import { Router } from "express";
import { query } from "express-validator";
import asyncWrapper from "../utils/AsyncWrapper";
import { authenticateToken, checkPermissions, validateRequest } from "../middlewares/auth.middleware";
import { listarEstudiantesController } from "../controllers/estudiantes.controller";

const router = Router();

// GET /api/estudiantes — HU-01
router.get("/", [
    query("page").optional().isInt({ min: 1 }).withMessage("La página debe ser un entero mayor o igual a 1"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("El límite debe estar entre 1 y 100"),
], validateRequest, authenticateToken, checkPermissions(["estudiantes.consultar"]), asyncWrapper(listarEstudiantesController));

export default router;
