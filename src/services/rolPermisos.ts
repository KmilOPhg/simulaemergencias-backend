import { prisma } from "../../lib/prisma";
import { RolCreate, RolUpdate } from "../types/rol.types";
import { AppError } from "../utils/AppError";
import { leerPaginaMaestros, listaPaginada, QueryPagina } from "../utils/paginacion";

export type PermisoCatalogo = {
    id: number;
    codigo: string;
    nombre: string;
    modulo: string;
};

export type PermisosAgrupadosPorModulo = {
    modulo: string;
    permisos: PermisoCatalogo[];
};

/** Catálogo de permisos agrupado por módulo (útil para checkboxes en formularios de rol). */
export const listarPermisosAgrupadosPorModulo = async (): Promise<PermisosAgrupadosPorModulo[]> => {
    const filas = await prisma.permiso.findMany({
        select: { id: true, codigo: true, nombre: true, modulo: true },
        orderBy: [{ modulo: "asc" }, { codigo: "asc" }],
    });

    const porModulo = new Map<string, PermisoCatalogo[]>();
    for (const row of filas) {
        const lista = porModulo.get(row.modulo) ?? [];
        lista.push({ id: row.id, codigo: row.codigo, nombre: row.nombre, modulo: row.modulo });
        porModulo.set(row.modulo, lista);
    }

    return [...porModulo.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([modulo, permisos]) => ({ modulo, permisos }));
};

// Obtener roles con sus permisos
export const obtenerRolesConPermisos = async (q?: QueryPagina) => {
    const { pagina, limite, salto } = leerPaginaMaestros(q);
    const [roles, total] = await Promise.all([
        prisma.rol.findMany({
            skip: salto,
            take: limite,
            select: {
                id: true,
                nombre: true,
                descripcion: true,
                activo: true,
                rolPermisos: {
                    select: {
                        permiso: { select: { id: true, codigo: true, nombre: true } },
                    },
                },
            },
        }),
        prisma.rol.count(),
    ]);

    const datos = roles.map((rol) => ({
        id: rol.id,
        nombre: rol.nombre,
        descripcion: rol.descripcion,
        activo: rol.activo,
        permisos: rol.rolPermisos.map((rolPermiso) => ({
            id: rolPermiso.permiso.id,
            codigo: rolPermiso.permiso.codigo,
            nombre: rolPermiso.permiso.nombre,
        })),
    }));

    return listaPaginada(datos, total, pagina, limite);
};

// Obtener rol con sus permisos
export const obtenerRolConPermisos = async (rolId: number) => {
    const rol = await prisma.rol.findUnique({
        where: { id: rolId },
        select: {
            id: true,
            nombre: true,
            descripcion: true,
            activo: true,
            rolPermisos: {
                select: {
                    permiso: { select: { id: true, codigo: true, nombre: true } },
                },
            },
        },
    });

    if (!rol) {
        throw new AppError("El rol no existe", 404);
    }

    return rol;
}

// Crear rol con sus permisos
export const crearRolConPermisos = async (data: RolCreate) => {
    const { permisos, ...rolData } = data;

    return await prisma.$transaction(async (tx) => {
        const rolCreado = await tx.rol.create({ data: rolData });

        if (permisos.length > 0) {
            const permisosExistentes = await tx.permiso.findMany({
                where: { codigo: { in: permisos } },
            });

            if (permisosExistentes.length !== [...new Set(permisos)].length) {
                throw new AppError("Algunos permisos no existen", 404);
            }

            await tx.rolPermiso.createMany({
                data: permisosExistentes.map((permisoExistente) => ({
                    rolId: rolCreado.id,
                    permisoId: permisoExistente.id,
                })),
            });
        }
        return rolCreado;
    });
};

// Actualizar rol con sus permisos
export const actualizarRolConPermisos = async (rolId: number, data: RolUpdate) => {
    if (isNaN(rolId)) {
        throw new AppError("El id del rol no es válido", 400);
    }

    return await prisma.$transaction(async (tx) => {
        const { permisos, ...rolData } = data;
        const rolActualizado = await tx.rol.update({
            where: { id: rolId },
            data: rolData,
            select: { id: true, nombre: true, descripcion: true, activo: true },
        });

        if (permisos) {
            const permisosExistentes = await tx.permiso.findMany({
                where: { codigo: { in: permisos } },
            });

            if (permisosExistentes.length !== permisos.length) {
                throw new AppError("Algunos permisos no existen", 404);
            }

            await tx.rolPermiso.deleteMany({ where: { rolId } });
            await tx.rolPermiso.createMany({
                data: permisosExistentes.map((permisoExistente) => ({ rolId, permisoId: permisoExistente.id })),
            });
        }
        return rolActualizado;
    })
}

// Inhabilitar / habilitar rol (toggle). No se puede desactivar el rol con el que está autenticado el solicitante.
export const inhabilitarRol = async (rolId: number, solicitanteRolIds?: number[]) => {
    const rol = await prisma.rol.findUnique({ where: { id: rolId } });
    if (!rol) {
        throw new AppError("El rol no existe", 404);
    }

    const nuevaActiva = !rol.activo;

    if (!nuevaActiva && solicitanteRolIds?.includes(rolId)) {
        throw new AppError("No puedes desactivar el rol con el que estás autenticado.", 400);
    }

    return prisma.rol.update({
        where: { id: rolId },
        data: { activo: nuevaActiva },
        select: { id: true, nombre: true, descripcion: true, activo: true },
    });
}
