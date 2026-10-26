import { Router } from "express";
import { body } from "express-validator";
import asyncWrapper from "../utils/AsyncWrapper";
import { validateRequest } from "../middlewares/auth.middleware";
import {
    solicitarRecuperacionController,
    restablecerContrasenaController,
} from "../controllers/recuperacion.controller";

const router = Router();

// POST /api/recuperacion/solicitar — pública, no requiere autenticación
router.post(
    "/solicitar",
    [
        body("email").isEmail().withMessage("Email inválido.").normalizeEmail(),
        body("html")
            .isString()
            .notEmpty()
            .withMessage("La plantilla HTML del correo es obligatoria.")
            .isLength({ max: 50000 })
            .withMessage("La plantilla HTML no puede superar 50000 caracteres."),
        body("subject")
            .optional()
            .isString()
            .isLength({ max: 200 })
            .withMessage("El asunto no puede superar 200 caracteres."),
    ],
    validateRequest,
    asyncWrapper(solicitarRecuperacionController)
);

// POST /api/recuperacion/restablecer — pública, no requiere autenticación
router.post(
    "/restablecer",
    [
        body("token").isString().notEmpty().withMessage("El token es obligatorio."),
        body("nuevaContrasena")
            .isString()
            .isLength({ min: 8 })
            .withMessage("La contraseña debe tener al menos 8 caracteres."),
    ],
    validateRequest,
    asyncWrapper(restablecerContrasenaController)
);

export default router;
