import { Request, Response } from "express";
import { sendSuccessResponse } from "../utils/JSONResponse";
import { obtenerRolesConPermisos, obtenerRolConPermisos, actualizarRolConPermisos, crearRolConPermisos, inhabilitarRol, listarPermisosAgrupadosPorModulo } from "../services/rolPermisos";
import { RolCreate, RolUpdate } from "../types/rol.types";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";

// Catálogo de permisos agrupado por módulo
export const listarPermisosAgrupadosPorModuloController = async (req: Request, res: Response) => {
    const data = await listarPermisosAgrupadosPorModulo();
    return sendSuccessResponse(res, 200, "Permisos por módulo obtenidos correctamente", data);
};

// Obtener roles con permisos
export const obtenerRolesConPermisosController = async (req: Request, res: Response) => {
    const data = await obtenerRolesConPermisos({ page: req.query.page, limit: req.query.limit });
    return sendSuccessResponse(res, 200, "Roles con permisos obtenidos correctamente", data);
}

// Obtener rol con permisos
export const obtenerRolConPermisosController = async (req: Request, res: Response) => {
    const rolId = Number(req.params.id);
    const data = await obtenerRolConPermisos(rolId);
    return sendSuccessResponse(res, 200, "Rol con permisos obtenido correctamente", data);
}

// Crear rol con permisos
export const crearRolConPermisosController = async (req: Request, res: Response) => {
    const { nombre, descripcion, permisos }: RolCreate = req.body;
    const data = await crearRolConPermisos({ nombre, descripcion, permisos });
    return sendSuccessResponse(res, 200, "Rol con permisos creado correctamente", data);
}

// Actualizar rol con permisos
export const actualizarRolConPermisosController = async (req: Request, res: Response) => {
    const rolId = Number(req.params.id);
    const { nombre, descripcion, permisos }: RolUpdate = req.body;
    const data = await actualizarRolConPermisos(rolId, { nombre, descripcion, permisos });
    return sendSuccessResponse(res, 200, "Rol con permisos actualizado correctamente", data);
}

// Inhabilitar / activar rol (toggle)
export const inhabilitarRolController = async (req: AuthenticatedRequest, res: Response) => {
    const rolId = Number(req.params.id);
    const data = await inhabilitarRol(rolId, req.user?.rolIds);
    return sendSuccessResponse(res, 200, "Rol actualizado correctamente", data);
}
