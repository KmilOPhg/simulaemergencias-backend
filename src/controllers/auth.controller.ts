import { Request, Response } from "express";
import { loginUser, anadirUsuario, actualizarUsuario, deshabilitarUsuario, obtenerUsuarios, obtenerUsuario, obtenerPermisosSesion, cambiarContrasenaPropio } from "../services/auth";
import { sendSuccessResponse } from "../utils/JSONResponse";
import bcrypt from "bcrypt";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { AppError } from "../utils/AppError";

// Acepta rolIds (multi-rol) o rolId singular por compatibilidad
const leerRolIdsBody = (body: { rolIds?: unknown; rolId?: unknown }): number[] | undefined => {
    if (body.rolIds !== undefined) {
        if (!Array.isArray(body.rolIds)) {
            throw new AppError("rolIds debe ser un arreglo de enteros.", 400);
        }
        return (body.rolIds as unknown[]).map((raw) => {
            const id = Number(raw);
            if (!Number.isInteger(id) || id < 1) {
                throw new AppError("rolIds debe contener enteros positivos.", 400);
            }
            return id;
        });
    }
    if (body.rolId === undefined || body.rolId === null) return undefined;
    const id = Number(body.rolId);
    if (!Number.isInteger(id) || id < 1) {
        throw new AppError("rolId inválido.", 400);
    }
    return [id];
};

// Login
export const loginController = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const data = await loginUser(email as string, password as string);

    return sendSuccessResponse(res, 200, "Login correcto", data);
};

/**
 * Cierre de sesión del lado servidor (JWT stateless).
 * El cliente debe eliminar el token al recibir 200; aquí solo se confirma identidad y se responde OK.
 */
export const logoutController = async (req: AuthenticatedRequest, res: Response) => {
    const id = req.user?.id;
    const nombre = req.user?.nombre ?? "";
    return sendSuccessResponse(res, 200, "Sesión cerrada correctamente", {
        usuarioId: id,
        nombre,
    });
};

// Permisos de la sesión actual
export const obtenerPermisosSesionController = async (req: AuthenticatedRequest, res: Response) => {
    const data = await obtenerPermisosSesion(req.user!.id);

    return sendSuccessResponse(res, 200, "Permisos obtenidos correctamente", data);
};

// Obtener usuarios
export const obtenerUsuariosController = async (req: AuthenticatedRequest, res: Response) => {
    const data = await obtenerUsuarios({ page: req.query.page, limit: req.query.limit });

    return sendSuccessResponse(res, 200, "Usuarios obtenidos correctamente", data);
};

// Obtener usuario
export const obtenerUsuarioController = async (req: AuthenticatedRequest, res: Response) => {
    const userId = Number(req.params.id);

    const data = await obtenerUsuario(userId as number);

    return sendSuccessResponse(res, 200, "Usuario obtenido correctamente", data);
};

// Register
export const anadirUsuarioController = async (req: AuthenticatedRequest, res: Response) => {
    const { nombre, email, password } = req.body;
    const rolIds = leerRolIdsBody(req.body);

    if (!rolIds?.length) {
        throw new AppError("Debe indicar al menos un rol (rolIds).", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const data = await anadirUsuario(nombre, email, hashedPassword, rolIds);

    return sendSuccessResponse(res, 200, "Registro correcto", data);
};

// Editar usuario
export const actualizarUsuarioController = async (req: AuthenticatedRequest, res: Response) => {
    const userId = Number(req.params.id);
    const { nombre, email, estado, password } = req.body;
    const rolIds = leerRolIdsBody(req.body);

    if (password !== undefined || req.body.confirmPassword !== undefined) {
        throw new AppError("La contraseña solo puede cambiarse desde tu propio perfil con tu contraseña actual.", 400);
    }

    const data = await actualizarUsuario(userId as number, {
        nombre,
        email,
        estado,
        ...(rolIds !== undefined ? { rolIds } : {}),
    });

    return sendSuccessResponse(res, 200, "Usuario actualizado correctamente", data);
};

// Deshabilitar usuario
export const deshabilitarUsuarioController = async (req: AuthenticatedRequest, res: Response) => {
    const userId = Number(req.params.id);

    const data = await deshabilitarUsuario(userId as number, req.user?.id);

    return sendSuccessResponse(res, 200, "Usuario deshabilitado correctamente", data);
};

export const cambiarContrasenaPropioController = async (req: AuthenticatedRequest, res: Response) => {
    const { passwordActual, passwordNueva } = req.body;
    const data = await cambiarContrasenaPropio(req.user!.id, passwordActual, passwordNueva);
    return sendSuccessResponse(res, 200, "Contraseña actualizada correctamente", data);
};
