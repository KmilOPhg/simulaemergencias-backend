import { Router } from "express";
import { body, param } from 'express-validator'
import {
    deshabilitarUsuarioController,
    loginController,
    logoutController,
    anadirUsuarioController,
    actualizarUsuarioController,
    obtenerUsuariosController,
    obtenerUsuarioController,
    obtenerPermisosSesionController,
    cambiarContrasenaPropioController,
} from "../controllers/auth.controller";
import { validateRequest, validateUniqueFields, authenticateToken, checkPermissions, checkConsultarUsuarioOPropio } from "../middlewares/auth.middleware";
import { prisma } from '../../lib/prisma'
import asyncWrapper from "../utils/AsyncWrapper";

const router = Router();

// POST /api/auth/login — endpoint público
router.post("/login", [
  body('email', 'El email es obligatorio').isEmail().withMessage('El email no es válido'),
  body('password', 'La contraseña es obligatoria').notEmpty(),
], validateRequest, asyncWrapper(loginController));

// POST /api/auth/logout — requiere Bearer válido; el cliente borra el JWT al recibir éxito
router.post("/logout", authenticateToken, asyncWrapper(logoutController));

// GET /api/auth/me/permisos — permisos del usuario autenticado (solo requiere JWT válido)
router.get("/me/permisos", authenticateToken, asyncWrapper(obtenerPermisosSesionController));

// PATCH /api/auth/me/contrasena — cambio de contraseña del usuario autenticado
router.patch("/me/contrasena", [
  body("passwordActual").notEmpty().withMessage("La contraseña actual es obligatoria"),
  body("passwordNueva")
    .isString()
    .isLength({ min: 8 })
    .withMessage("La nueva contraseña debe tener al menos 8 caracteres"),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.passwordNueva) {
      throw new Error("Las contraseñas no coinciden");
    }
    return true;
  }),
], validateRequest, authenticateToken, asyncWrapper(cambiarContrasenaPropioController));

// GET /api/auth/users
router.get("/users", authenticateToken, checkPermissions(["usuarios.consultar"]), asyncWrapper(obtenerUsuariosController));

// GET /api/auth/users/:id
router.get("/users/:id", [
  param("id", "El id debe ser numérico").isInt({ min: 1 }),
], validateRequest, authenticateToken, checkConsultarUsuarioOPropio(), asyncWrapper(obtenerUsuarioController));

// POST /api/auth/register
router.post("/register", [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres'),

  body('email').trim().notEmpty().withMessage('El email es obligatorio').isEmail().withMessage('El email no es válido').normalizeEmail(),

  body('password').notEmpty().withMessage('La contraseña es obligatoria')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener mínimo 6 caracteres')
    .matches(/[A-Z]/).withMessage('Debe contener al menos una mayúscula')
    .matches(/[a-z]/).withMessage('Debe contener al menos una minúscula')
    .matches(/[0-9]/).withMessage('Debe contener al menos un número'),

  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Las contraseñas no coinciden');
    }
    return true;
  }),

  // Roles: multi-rol (rolIds) o rolId singular por compatibilidad
  body('rolIds').optional().isArray({ min: 1 }).withMessage('rolIds debe ser un arreglo con al menos un rol'),
  body('rolIds.*').optional().isInt({ min: 1 }).withMessage('Cada rolId debe ser un entero positivo'),
  body('rolId').optional().isInt({ min: 1 }).withMessage('rolId debe ser un entero positivo'),
  body('rolIds').custom((_value, { req }) => {
    if (req.body.rolIds === undefined && req.body.rolId === undefined) {
      throw new Error('Debe indicar al menos un rol (rolIds)');
    }
    return true;
  }),
], validateRequest, validateUniqueFields(prisma.usuario, ['email']), authenticateToken, checkPermissions(["usuarios.crear", "usuarios.consultar"]), asyncWrapper(anadirUsuarioController));

// PUT /api/auth/users/:id
router.put("/users/:id", [
  param("id", "El id debe ser numérico").isInt({ min: 1 }),

  body("nombre").optional().trim().isLength({ min: 3, max: 100 }).withMessage("El nombre debe tener entre 3 y 100 caracteres"),

  body("email").optional().trim().isEmail().withMessage("El email no es válido").normalizeEmail(),

  body("rolIds").optional().isArray({ min: 1 }).withMessage("rolIds debe ser un arreglo con al menos un rol"),
  body("rolIds.*").optional().isInt({ min: 1 }).withMessage("Cada rolId debe ser un entero positivo"),
  body("rolId").optional().isInt({ min: 1 }).withMessage("El rolId debe ser numérico"),
], validateRequest, authenticateToken, checkPermissions(["usuarios.actualizar", "usuarios.consultar"]), asyncWrapper(actualizarUsuarioController));

// PATCH /api/auth/users/:id/disable
router.patch("/users/:id/disable", [
  param("id", "El id debe ser numérico").isInt({ min: 1 }),
], validateRequest, authenticateToken, checkPermissions(["usuarios.deshabilitar", "usuarios.consultar"]), asyncWrapper(deshabilitarUsuarioController));

export default router;
