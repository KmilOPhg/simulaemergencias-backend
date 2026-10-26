import { Router } from "express";
import { body } from "express-validator";
import asyncWrapper from "../utils/AsyncWrapper";
import { authenticateToken, checkPermissions, validateRequest } from "../middlewares/auth.middleware";
import { TIPOS_ESCENARIO, parsearFechaEjercicio } from "../constants/emergencias.constants";
import { crearEjercicioController } from "../controllers/ejercicios.controller";

const router = Router();

// POST /api/ejercicios — HU-04
router.post("/", [
    body("nombre")
        .exists({ values: "falsy" }).withMessage("El nombre del ejercicio es obligatorio").bail()
        .isString().withMessage("El nombre del ejercicio debe ser texto").bail()
        .trim()
        .isLength({ min: 3, max: 150 }).withMessage("El nombre debe tener entre 3 y 150 caracteres"),
    body("fecha")
        .exists({ values: "falsy" }).withMessage("La fecha del ejercicio es obligatoria").bail()
        .custom((valor) => {
            if (typeof valor !== "string" || !parsearFechaEjercicio(valor.trim())) {
                throw new Error("La fecha debe ser un día válido con formato AAAA-MM-DD");
            }
            return true;
        }),
    body("tipoEscenario")
        .exists({ values: "falsy" }).withMessage("El tipo de escenario es obligatorio").bail()
        .isString().withMessage("El tipo de escenario debe ser texto").bail()
        .customSanitizer((valor: string) => valor.trim().toUpperCase())
        .isIn([...TIPOS_ESCENARIO]).withMessage("El tipo de escenario debe ser SISMO, INCENDIO o INTRUSO"),
    body("horaInicio")
        .optional({ values: "falsy" })
        .matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage("La hora de inicio debe tener formato HH:mm"),
    body("lugar")
        .optional({ values: "falsy" })
        .isString().withMessage("El lugar debe ser texto").bail()
        .trim()
        .isLength({ max: 200 }).withMessage("El lugar no puede superar 200 caracteres"),
    body("descripcion")
        .optional({ values: "falsy" })
        .isString().withMessage("La descripción debe ser texto").bail()
        .trim()
        .isLength({ max: 2000 }).withMessage("La descripción no puede superar 2000 caracteres"),
], validateRequest, authenticateToken, checkPermissions(["ejercicios.crear"]), asyncWrapper(crearEjercicioController));

export default router;
