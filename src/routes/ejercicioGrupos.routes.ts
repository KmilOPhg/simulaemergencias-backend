import { Router } from "express";
import { body, param } from "express-validator";
import asyncWrapper from "../utils/AsyncWrapper";
import { authenticateToken, checkPermissions, validateRequest } from "../middlewares/auth.middleware";
import { listarGruposSeleccionadosController, seleccionarGrupoController } from "../controllers/ejercicios.controller";

const router = Router({ mergeParams: true });

// GET /api/ejercicios/:ejercicioId/grupos — HU-06 y HU-14
router.get("/", [
    param("ejercicioId").isInt({ min: 1 }).withMessage("El id del ejercicio debe ser un entero mayor o igual a 1"),
], validateRequest, authenticateToken, checkPermissions(["ejercicios.consultar"]), asyncWrapper(listarGruposSeleccionadosController));

// POST /api/ejercicios/:ejercicioId/grupos — HU-06
router.post("/", [
    param("ejercicioId").isInt({ min: 1 }).withMessage("El id del ejercicio debe ser un entero mayor o igual a 1"),
    body("grupoId")
        .exists({ values: "falsy" }).withMessage("El grupo es obligatorio. Selecciona el grupo que estás verificando.").bail()
        .isInt({ min: 1 }).withMessage("El grupo debe ser un id válido")
        .toInt(),
], validateRequest, authenticateToken, checkPermissions(["ejercicios.seleccionarGrupo"]), asyncWrapper(seleccionarGrupoController));

export default router;
