import { prisma } from "../../lib/prisma";
import { AppError } from "./AppError";

export type RolConPermisos = {
    id: number;
    nombre: string;
    activo: boolean;
    permisos: { codigo: string; nombre: string }[];
};

/** Carga roles con sus permisos; lanza 404 si alguno no existe. */
export const cargarRolesConPermisos = async (rolIds: number[]): Promise<RolConPermisos[]> => {
    const unicos = [...new Set(rolIds)];
    if (unicos.length === 0) return [];

    const roles = await prisma.rol.findMany({
        where: { id: { in: unicos } },
        select: {
            id: true,
            nombre: true,
            activo: true,
            rolPermisos: {
                select: { permiso: { select: { codigo: true, nombre: true } } },
            },
        },
    });

    if (roles.length !== unicos.length) {
        const encontrados = new Set(roles.map((r) => r.id));
        const faltantes = unicos.filter((id) => !encontrados.has(id));
        throw new AppError(`Uno o más roles indicados no existen (ids: ${faltantes.join(", ")}).`, 404);
    }

    return roles.map((rol) => ({
        id: rol.id,
        nombre: rol.nombre,
        activo: rol.activo,
        permisos: rol.rolPermisos.map((rp) => ({ codigo: rp.permiso.codigo, nombre: rp.permiso.nombre })),
    }));
};
