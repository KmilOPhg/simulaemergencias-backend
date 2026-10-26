import { prisma } from "../../lib/prisma";
import { AppError } from "../utils/AppError";
import { leerPagina, listaPaginada, QueryPagina } from "../utils/paginacion";
import { RecursoCreate, RecursoUpdate } from "../types/recurso.types";

/**
 * Módulo de ejemplo (CRUD) — úsalo como plantilla al crear tus propios módulos:
 * service -> controller -> routes -> permisos en el seed -> paths en swagger.
 */

// Listar recursos (paginado)
export const obtenerRecursos = async (q?: QueryPagina) => {
    const { pagina, limite, salto } = leerPagina(q);

    const [recursos, total] = await Promise.all([
        prisma.recurso.findMany({
            skip: salto,
            take: limite,
            orderBy: { creadoEn: "desc" },
        }),
        prisma.recurso.count(),
    ]);

    return listaPaginada(recursos, total, pagina, limite);
};

// Obtener un recurso por id
export const obtenerRecurso = async (id: number) => {
    const recurso = await prisma.recurso.findUnique({ where: { id } });
    if (!recurso) {
        throw new AppError("El recurso no existe", 404);
    }
    return recurso;
};

// Crear recurso
export const crearRecurso = async (data: RecursoCreate) => {
    return prisma.recurso.create({ data });
};

// Actualizar recurso
export const actualizarRecurso = async (id: number, data: RecursoUpdate) => {
    await obtenerRecurso(id);
    return prisma.recurso.update({ where: { id }, data });
};

// Inhabilitar / habilitar recurso (toggle)
export const inhabilitarRecurso = async (id: number) => {
    const recurso = await obtenerRecurso(id);
    return prisma.recurso.update({
        where: { id },
        data: { activo: !recurso.activo },
    });
};
