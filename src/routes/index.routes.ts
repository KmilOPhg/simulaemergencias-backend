import { Router } from "express";
import authRoutes from "./auth.routes";
import rolRoutes from "./rol.routes";
import recuperacionRoutes from "./recuperacion.routes";
import sistemaRoutes from "./sistema.routes";
import recursosRoutes from "./recursos.routes";
import estudiantesRoutes from "./estudiantes.routes";
import ejerciciosRoutes from "./ejercicios.routes";
import verificacionesRoutes from "./verificaciones.routes";
import gruposRoutes from "./grupos.routes";
import ejercicioGruposRoutes from "./ejercicioGrupos.routes";

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

// HU-01, HU-02 y HU-03. Listado, búsqueda y filtro por grupo
router.use("/estudiantes", estudiantesRoutes);

// HU-03 y HU-06. Grupos disponibles y estudiantes de un grupo
router.use("/grupos", gruposRoutes);

// HU-04 y HU-14. Registro y consulta de ejercicios
router.use("/ejercicios", ejerciciosRoutes);

// HU-06. Selección del grupo que se está verificando
router.use("/ejercicios/:ejercicioId/grupos", ejercicioGruposRoutes);

// HU-07 y HU-14. Registro y consulta de verificaciones
router.use("/ejercicios/:ejercicioId/verificaciones", verificacionesRoutes);

export default router;
