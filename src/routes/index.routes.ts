import { Router } from "express";
import authRoutes from "./auth.routes";
import rolRoutes from "./rol.routes";
import recuperacionRoutes from "./recuperacion.routes";
import sistemaRoutes from "./sistema.routes";
import recursosRoutes from "./recursos.routes";
import estudiantesRoutes from "./estudiantes.routes";
import ejerciciosRoutes from "./ejercicios.routes";
import verificacionesRoutes from "./verificaciones.routes";

const router = Router();

// Rutas de autenticación y usuarios (login, register, permisos de sesión, etc.)
router.use("/auth", authRoutes);

// Rutas de roles y permisos
router.use("/rol", rolRoutes);

// Recuperación de contraseña por correo
router.use("/recuperacion", recuperacionRoutes);

// Sistema / monitoreo (healthcheck)
router.use("/sistema", sistemaRoutes);

// Módulo de ejemplo — bórralo o renómbralo cuando crees tus propios módulos
router.use("/recursos", recursosRoutes);

// HU-01. Listado de estudiantes
router.use("/estudiantes", estudiantesRoutes);

// HU-04. Registro de ejercicios de emergencia
router.use("/ejercicios", ejerciciosRoutes);

// HU-07. Verificación de un estudiante dentro de un ejercicio
router.use("/ejercicios/:ejercicioId/verificaciones", verificacionesRoutes);

export default router;
