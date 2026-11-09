import { Router } from "express";
import { param, query } from "express-validator";
import asyncWrapper from "../utils/AsyncWrapper";
import { authenticateToken, checkPermissions, validateRequest } from "../middlewares/auth.middleware";
import { listarEstudiantesDeGrupoController, listarGruposController } from "../controllers/grupos.controller";

const router = Router();
const pagina = [
    query("page").optional().isInt({ min: 1 }).withMessage("La página debe ser un entero mayor o igual a 1"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("El límite debe estar entre 1 y 100"),
];

// GET /api/grupos — HU-06, consulta de grupos disponibles
router.get("/", pagina, validateRequest, authenticateToken, checkPermissions(["grupos.consultar"]), asyncWrapper(listarGruposController));

// GET /api/grupos/:grupoId/estudiantes — HU-03
router.get("/:grupoId/estudiantes", [
    param("grupoId").isInt({ min: 1 }).withMessage("El id del grupo debe ser un entero mayor o igual a 1"),
    ...pagina,
], validateRequest, authenticateToken, checkPermissions(["estudiantes.consultar"]), asyncWrapper(listarEstudiantesDeGrupoController));

export default router;
