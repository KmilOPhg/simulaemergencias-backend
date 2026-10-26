import { Router } from "express";
import asyncWrapper from "../utils/AsyncWrapper";
import { obtenerRolesConPermisosController, obtenerRolConPermisosController, crearRolConPermisosController, actualizarRolConPermisosController, inhabilitarRolController, listarPermisosAgrupadosPorModuloController } from "../controllers/rolPermisos.controller";
import { authenticateToken, checkPermissions, validateRequest, validateUniqueFields } from "../middlewares/auth.middleware";
import { body, param } from "express-validator";
import { prisma } from "../../lib/prisma";

const router = Router();

// GET /api/rol/permisos — catálogo agrupado por módulo (checkboxes en formularios de rol)
router.get("/permisos", authenticateToken, checkPermissions(["roles.consultar"]), asyncWrapper(listarPermisosAgrupadosPorModuloController));

// GET /api/rol/roles
router.get("/roles", authenticateToken, checkPermissions(["roles.consultar"]), asyncWrapper(obtenerRolesConPermisosController));

// GET /api/rol/roles/:id
router.get("/roles/:id", [
    param("id", "El id debe ser numérico").isInt({ min: 1 }),
], validateRequest, authenticateToken, checkPermissions(["roles.consultar"]), asyncWrapper(obtenerRolConPermisosController));

// POST /api/rol/roles
router.post("/roles", [
    body("nombre", "El nombre es obligatorio").notEmpty(),
    body("descripcion", "La descripcion es obligatoria").notEmpty(),
    body("permisos", "Los permisos son obligatorios").notEmpty(),
], validateRequest, authenticateToken, checkPermissions(["roles.crear", "roles.consultar"]), asyncWrapper(crearRolConPermisosController));

// PUT /api/rol/roles/:id
router.put("/roles/:id", [
    param("id", "El id debe ser numérico").isInt({ min: 1 }),
    body("nombre", "El nombre es obligatorio").notEmpty(),
    body("descripcion", "La descripcion es obligatoria").notEmpty(),
    body("permisos", "Los permisos son obligatorios").notEmpty(),
], validateRequest, validateUniqueFields(prisma.rol, ["nombre"], { excludeIdParam: "id" }), authenticateToken, checkPermissions(["roles.actualizar", "roles.consultar"]), asyncWrapper(actualizarRolConPermisosController));

// PATCH /api/rol/roles/:id/disable
router.patch("/roles/:id/disable", [
    param("id", "El id debe ser numérico").isInt({ min: 1 }),
], validateRequest, authenticateToken, checkPermissions(["roles.inhabilitar", "roles.consultar"]), asyncWrapper(inhabilitarRolController));

export default router;
