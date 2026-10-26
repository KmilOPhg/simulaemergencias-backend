import { prisma } from "../../lib/prisma";
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
export const listarEstudiantes = async (q?: QueryPagina) => {
    const { pagina, limite, salto } = leerPagina(q);
    const where = { activo: true };

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
