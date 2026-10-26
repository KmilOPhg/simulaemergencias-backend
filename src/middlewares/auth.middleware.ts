import { Request, Response, NextFunction } from "express";
import { validationResult } from 'express-validator';
import { sendErrorResponse } from "../utils/JSONResponse";
import jwt from "jsonwebtoken";
import type { JwtUserPayload } from "../services/auth";
import { cargarPermisosUsuario, PermisoUsuarioError } from "../utils/permisosUsuario";
import { esUsuarioAdministrador } from "../utils/rolesUsuario";

export type AuthenticatedRequest = Request & {
    user?: JwtUserPayload;
}

// Verificamos si hay errores de validación (express-validator)
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return sendErrorResponse(res, 400, "Error de validación", errors.array());
    }
    next();
}

type ValidateUniqueFieldsOptions = {
    /** para excluir el registro actual en updates se pasa el id por la ruta y se excluye */
    excludeIdParam?: string;
};

// Validar que ciertos campos no estén ya registrados en la base de datos (email, código, etc.)
export const validateUniqueFields = (model: any, fields: string[], options?: ValidateUniqueFieldsOptions) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            let excludeId: number | undefined;
            if (options?.excludeIdParam) {
                const raw = req.params[options.excludeIdParam];
                const parsed = Number(raw);
                if (!Number.isNaN(parsed) && parsed > 0) {
                    excludeId = parsed;
                }
            }

            for (const field of fields) {
                if (req.body[field]) {
                    const existing = await model.findFirst({
                        where: {
                            [field]: req.body[field],
                            ...(excludeId !== undefined
                                ? { id: { not: excludeId } }
                                : {}),
                        },
                    });

                    if (existing) {
                        return sendErrorResponse(
                            res,
                            400,
                            `El ${field} ya está registrado`
                        );
                    }
                }
            }
            next();
        } catch (error) {
            console.error("Error en validateUniqueFields():", error);
            return sendErrorResponse(res, 500, "Error en el servidor");
        }
    }
}

// Autenticar token JWT
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer token

    if (!token) {
        return sendErrorResponse(res, 401, "Token no proporcionado");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as Partial<JwtUserPayload> & {
            id: number;
            rolId?: number | null;
        };

        // Compatibilidad: tokens antiguos podían traer rolId singular en lugar de rolIds
        const rolIds = Array.isArray(decoded.rolIds)
            ? decoded.rolIds.filter((id) => Number.isInteger(id) && id >= 1)
            : decoded.rolId != null && decoded.rolId >= 1
              ? [decoded.rolId]
              : [];

        req.user = {
            id: decoded.id,
            nombre: decoded.nombre ?? "",
            email: decoded.email ?? null,
            rolIds,
            estado: (decoded.estado as JwtUserPayload["estado"]) ?? "ACTIVO",
        };
        next();
    } catch (error) {
        return sendErrorResponse(res, 401, "Token inválido o expirado");
    }
}

const sincronizarUsuarioDesdePermisos = (req: AuthenticatedRequest, datos: Awaited<ReturnType<typeof cargarPermisosUsuario>>) => {
    if (!req.user) return;
    req.user.rolIds = datos.rolIds;
    req.user.estado = datos.estado;
};

const manejarErrorPermisos = (res: Response, error: unknown, contexto: string) => {
    if (error instanceof PermisoUsuarioError) {
        return sendErrorResponse(res, error.status, error.message);
    }
    console.error(`Error en ${contexto}():`, error);
    return sendErrorResponse(res, 500, "Error en el servidor");
};

// Verificar permisos de usuario (todos requeridos)
export const checkPermissions = (permisosRequeridos: string[]) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) {
                return sendErrorResponse(res, 403, "Usuario no autenticado");
            }

            const datos = await cargarPermisosUsuario(req.user.id);
            sincronizarUsuarioDesdePermisos(req, datos);

            const tienePermisos = permisosRequeridos.every((permiso) => datos.permisos.includes(permiso));

            if (!tienePermisos) {
                return sendErrorResponse(res, 403, "No tienes permisos para acceder a este recurso");
            }

            next();
        } catch (error) {
            return manejarErrorPermisos(res, error, "checkPermissions");
        }
    };
};

// Verificar que el usuario tenga al menos uno de los permisos indicados
export const checkAnyPermissions = (permisosAceptados: string[]) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) {
                return sendErrorResponse(res, 403, "Usuario no autenticado");
            }

            const datos = await cargarPermisosUsuario(req.user.id);
            sincronizarUsuarioDesdePermisos(req, datos);

            const tieneAlguno = permisosAceptados.some((permiso) => datos.permisos.includes(permiso));

            if (!tieneAlguno) {
                return sendErrorResponse(res, 403, "No tienes permisos para acceder a este recurso");
            }

            next();
        } catch (error) {
            return manejarErrorPermisos(res, error, "checkAnyPermissions");
        }
    };
};

/** Solo rol fijo `admin` (no es un permiso asignable en otros roles). */
export const requireAdministrador = (mensaje = "Solo un administrador puede realizar esta acción.") => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) {
                return sendErrorResponse(res, 403, "Usuario no autenticado");
            }

            const datos = await cargarPermisosUsuario(req.user.id);
            sincronizarUsuarioDesdePermisos(req, datos);

            if (!esUsuarioAdministrador(datos.roles)) {
                return sendErrorResponse(res, 403, mensaje);
            }

            next();
        } catch (error) {
            return manejarErrorPermisos(res, error, "requireAdministrador");
        }
    };
};

/** Consultar usuario: requiere `usuarios.consultar` o que el :id sea el usuario autenticado. */
export const checkConsultarUsuarioOPropio = () => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) {
                return sendErrorResponse(res, 403, "Usuario no autenticado");
            }

            const datos = await cargarPermisosUsuario(req.user.id);
            sincronizarUsuarioDesdePermisos(req, datos);

            const userId = Number(req.params.id);
            if (datos.permisos.includes("usuarios.consultar")) {
                return next();
            }
            if (Number.isInteger(userId) && userId === req.user.id) {
                return next();
            }

            return sendErrorResponse(res, 403, "No tienes permisos para acceder a este recurso");
        } catch (error) {
            return manejarErrorPermisos(res, error, "checkConsultarUsuarioOPropio");
        }
    };
};
