import { prisma } from "../../lib/prisma";
import { AppError } from "../utils/AppError";
import { esCodigoUnico, normalizarCodigoUnico } from "../constants/emergencias.constants";
import { leerPagina, listaPaginada, QueryPagina } from "../utils/paginacion";

const estudianteListadoSelect = {
    id: true,
    codigoUnico: true,
    nombres: true,
    apellidos: true,
    grupo: {
        select: {
            id: true,
            codigo: true,
            nombre: true,
        },
    },
} as const;

/**
 * HU-01. Listado de estudiantes activos.
 * HU-03. Si llega grupoId, solo trae los estudiantes de ese grupo.
 */
export const listarEstudiantes = async (q?: QueryPagina & { grupoId?: number }) => {
    const { pagina, limite, salto } = leerPagina(q);
    const where: { activo: true; grupoId?: number } = { activo: true };

    if (q?.grupoId !== undefined) {
        if (!Number.isInteger(q.grupoId) || q.grupoId < 1) {
            throw new AppError("El grupo indicado no es válido.", 400);
        }
        const grupo = await prisma.grupo.findFirst({
            where: { id: q.grupoId, activo: true },
            select: { id: true },
        });
        if (!grupo) {
            throw new AppError("El grupo no existe.", 404);
        }
        where.grupoId = grupo.id;
    }

    const [estudiantes, total] = await Promise.all([
        prisma.estudiante.findMany({
            where,
            skip: salto,
            take: limite,
            orderBy: [{ apellidos: "asc" }, { nombres: "asc" }, { id: "asc" }],
            select: estudianteListadoSelect,
        }),
        prisma.estudiante.count({ where }),
    ]);

    return listaPaginada(estudiantes, total, pagina, limite);
};

/**
 * HU-02. Busca un estudiante por su código único.
 * Acepta AGAPE-001 y el código anterior AGP-1001. No crea registros.
 */
export const buscarEstudiantePorCodigo = async (codigo: string) => {
    const codigoUnico = normalizarCodigoUnico(codigo ?? "");
    if (!esCodigoUnico(codigoUnico)) {
        throw new AppError("El código único debe tener el formato AGAPE-001.", 400);
    }

    const estudiante = await prisma.estudiante.findFirst({
        where: { codigoUnico, activo: true },
        select: estudianteListadoSelect,
    });
    if (!estudiante) {
        throw new AppError("No se encontraron resultados para el código ingresado.", 404);
    }
    return estudiante;
};

/**
 * HU-03. Estudiantes activos de un grupo.
 * Si el grupo existe y no tiene estudiantes, la lista llega vacía.
 */
export const listarEstudiantesDeGrupo = async (grupoId: number, q?: QueryPagina) => {
    if (!Number.isInteger(grupoId) || grupoId < 1) {
        throw new AppError("El grupo indicado no es válido.", 400);
    }

    const grupo = await prisma.grupo.findFirst({
        where: { id: grupoId, activo: true },
        select: { id: true, codigo: true, nombre: true },
    });
    if (!grupo) {
        throw new AppError("El grupo no existe.", 404);
    }

    const { pagina, limite, salto } = leerPagina(q);
    const where = { activo: true, grupoId: grupo.id };
    const [estudiantes, total] = await Promise.all([
        prisma.estudiante.findMany({
            where,
            skip: salto,
            take: limite,
            orderBy: [{ apellidos: "asc" }, { nombres: "asc" }, { id: "asc" }],
            select: estudianteListadoSelect,
        }),
        prisma.estudiante.count({ where }),
    ]);

    return {
        grupo,
        ...listaPaginada(estudiantes, total, pagina, limite),
    };
};
