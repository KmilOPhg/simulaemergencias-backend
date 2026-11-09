import { Router } from "express";
import { body, param, query } from "express-validator";
import asyncWrapper from "../utils/AsyncWrapper";
import { authenticateToken, checkPermissions, validateRequest } from "../middlewares/auth.middleware";
import { listarVerificacionesController, registrarVerificacionController } from "../controllers/verificaciones.controller";

const router = Router({ mergeParams: true });

// GET /api/ejercicios/:ejercicioId/verificaciones — HU-14
router.get("/", [
    param("ejercicioId").isInt({ min: 1 }).withMessage("El id del ejercicio debe ser un entero mayor o igual a 1"),
    query("page").optional().isInt({ min: 1 }).withMessage("La página debe ser un entero mayor o igual a 1"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("El límite debe estar entre 1 y 100"),
], validateRequest, authenticateToken, checkPermissions(["verificaciones.consultar"]), asyncWrapper(listarVerificacionesController));

// POST /api/ejercicios/:ejercicioId/verificaciones — HU-07
router.post("/", [
    param("ejercicioId").isInt({ min: 1 }).withMessage("El id del ejercicio debe ser un entero mayor o igual a 1"),
    body("estudianteId")
        .exists({ values: "falsy" }).withMessage("El estudiante es obligatorio").bail()
        .isInt({ min: 1 }).withMessage("El estudiante debe ser un id válido")
        .toInt(),
    body("grupoId")
        .exists({ values: "falsy" }).withMessage("El grupo es obligatorio. Selecciona el grupo que estás verificando.").bail()
        .isInt({ min: 1 }).withMessage("El grupo debe ser un id válido")
        .toInt(),
    body("observacion")
        .optional({ values: "falsy" })
        .isString().withMessage("La observación debe ser texto").bail()
        .trim()
        .isLength({ max: 500 }).withMessage("La observación no puede superar 500 caracteres"),
], validateRequest, authenticateToken, checkPermissions(["verificaciones.registrar"]), asyncWrapper(registrarVerificacionController));

export default router;
