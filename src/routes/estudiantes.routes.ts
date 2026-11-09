import { Router } from "express";
import { param, query } from "express-validator";
import asyncWrapper from "../utils/AsyncWrapper";
import { authenticateToken, checkPermissions, validateRequest } from "../middlewares/auth.middleware";
import { buscarEstudiantePorCodigoController, listarEstudiantesController } from "../controllers/estudiantes.controller";

const router = Router();

// GET /api/estudiantes — HU-01
router.get("/", [
    query("page").optional().isInt({ min: 1 }).withMessage("La página debe ser un entero mayor o igual a 1"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("El límite debe estar entre 1 y 100"),
    query("grupoId").optional().isInt({ min: 1 }).withMessage("El grupo debe ser un id válido"),
], validateRequest, authenticateToken, checkPermissions(["estudiantes.consultar"]), asyncWrapper(listarEstudiantesController));

// GET /api/estudiantes/codigo/:codigo — HU-02
router.get("/codigo/:codigo", [
    param("codigo").trim().notEmpty().withMessage("El código del estudiante es obligatorio"),
], validateRequest, authenticateToken, checkPermissions(["estudiantes.consultar"]), asyncWrapper(buscarEstudiantePorCodigoController));

export default router;
