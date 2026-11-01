import { prisma } from "../../lib/prisma";
import { AppError } from "../utils/AppError";
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
 * Solo devuelve código, nombre y grupo: los datos necesarios para identificar
 * al participante. No incluye información personal adicional.
 */
export const listarEstudiantes = async (q?: QueryPagina & { grupoId?: number }) => {
    const { pagina, limite, salto } = leerPagina(q);
    // HU-03. Si llega grupoId solo se traen los estudiantes de ese grupo
    const where = q?.grupoId ? { activo: true, grupoId: q.grupoId } : { activo: true };

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
 * HU-02. Búsqueda de un estudiante por su código único.
 * Devuelve los mismos campos del listado.
 */
export const buscarEstudiantePorCodigo = async (codigo: string) => {
    const estudiante = await prisma.estudiante.findFirst({
        where: { codigoUnico: codigo, activo: true },
        select: estudianteListadoSelect,
    });
    if (!estudiante) {
        throw new AppError("No se encontraron resultados para el código ingresado", 404);
    }
    return estudiante;
};
