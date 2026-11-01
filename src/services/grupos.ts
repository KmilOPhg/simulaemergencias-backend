import { prisma } from "../../lib/prisma";

/**
 * HU-06. Grupos activos disponibles para seleccionar en un ejercicio.
 */
export const listarGrupos = async () => {
    return prisma.grupo.findMany({
        where: { activo: true },
        orderBy: { codigo: "asc" },
        select: { id: true, codigo: true, nombre: true },
    });
};
