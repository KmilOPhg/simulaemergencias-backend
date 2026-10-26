import { prisma } from "../../lib/prisma";
import type { EstadoUsuario } from "../generated/prisma/client";

export class PermisoUsuarioError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

export type PermisosUsuarioResuelto = {
    /** Unión (sin duplicados) de los códigos de permiso de todos los roles activos del usuario */
    permisos: string[];
    rolIds: number[];
    roles: { id: number; nombre: string }[];
    estado: EstadoUsuario;
};

export const cargarPermisosUsuario = async (usuarioId: number): Promise<PermisosUsuarioResuelto> => {
    const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: {
            estado: true,
            usuarioRoles: {
                select: {
                    rol: {
                        select: {
                            id: true,
                            nombre: true,
                            activo: true,
                            rolPermisos: {
                                select: { permiso: { select: { codigo: true } } },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!usuario) {
        throw new PermisoUsuarioError(403, "Usuario no encontrado");
    }

    if (usuario.estado === "INACTIVO") {
        throw new PermisoUsuarioError(403, "Usuario inactivo");
    }

    const rolesActivos = usuario.usuarioRoles.map((ur) => ur.rol).filter((rol) => rol.activo);

    if (rolesActivos.length === 0) {
        throw new PermisoUsuarioError(403, "El usuario no tiene roles activos asignados");
    }

    const permisos = [
        ...new Set(rolesActivos.flatMap((rol) => rol.rolPermisos.map((rp) => rp.permiso.codigo))),
    ];

    return {
        permisos,
        rolIds: rolesActivos.map((rol) => rol.id),
        roles: rolesActivos.map((rol) => ({ id: rol.id, nombre: rol.nombre })),
        estado: usuario.estado,
    };
};
