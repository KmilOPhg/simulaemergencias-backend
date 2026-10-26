import { Router } from "express";
import authRoutes from "./auth.routes";
import rolRoutes from "./rol.routes";
import recuperacionRoutes from "./recuperacion.routes";
import sistemaRoutes from "./sistema.routes";
import recursosRoutes from "./recursos.routes";

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

export default router;
