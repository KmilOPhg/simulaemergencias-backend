import { prisma } from "../../lib/prisma";
import { leerPagina, listaPaginada, QueryPagina } from "../utils/paginacion";

const grupoSelect = {
    id: true,
    codigo: true,
    nombre: true,
} as const;

/** HU-06. Grupos disponibles para seleccionar en un ejercicio. */
export const listarGrupos = async (q?: QueryPagina) => {
    const { pagina, limite, salto } = leerPagina(q);
    const where = { activo: true };

    const [grupos, total] = await Promise.all([
        prisma.grupo.findMany({
            where,
            skip: salto,
            take: limite,
            orderBy: [{ codigo: "asc" }, { id: "asc" }],
            select: grupoSelect,
        }),
        prisma.grupo.count({ where }),
    ]);

    return listaPaginada(grupos, total, pagina, limite);
};
