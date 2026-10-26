import { Router } from "express";
import { body, param } from "express-validator";
import asyncWrapper from "../utils/AsyncWrapper";
import { validateRequest, authenticateToken, checkPermissions } from "../middlewares/auth.middleware";
import {
    obtenerRecursosController,
    obtenerRecursoController,
    crearRecursoController,
    actualizarRecursoController,
    inhabilitarRecursoController,
} from "../controllers/recursos.controller";

const router = Router();

// GET /api/recursos
router.get("/", authenticateToken, checkPermissions(["recursos.consultar"]), asyncWrapper(obtenerRecursosController));

// GET /api/recursos/:id
router.get("/:id", [
    param("id", "El id debe ser numérico").isInt({ min: 1 }),
], validateRequest, authenticateToken, checkPermissions(["recursos.consultar"]), asyncWrapper(obtenerRecursoController));

// POST /api/recursos
router.post("/", [
    body("nombre", "El nombre es obligatorio").notEmpty().isLength({ max: 200 }),
    body("descripcion").optional().isString(),
], validateRequest, authenticateToken, checkPermissions(["recursos.crear"]), asyncWrapper(crearRecursoController));

// PUT /api/recursos/:id
router.put("/:id", [
    param("id", "El id debe ser numérico").isInt({ min: 1 }),
    body("nombre").optional().isLength({ max: 200 }),
    body("descripcion").optional().isString(),
], validateRequest, authenticateToken, checkPermissions(["recursos.actualizar"]), asyncWrapper(actualizarRecursoController));

// PATCH /api/recursos/:id/disable
router.patch("/:id/disable", [
    param("id", "El id debe ser numérico").isInt({ min: 1 }),
], validateRequest, authenticateToken, checkPermissions(["recursos.deshabilitar"]), asyncWrapper(inhabilitarRecursoController));

export default router;
