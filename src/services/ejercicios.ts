import { prisma } from "../../lib/prisma";
import { TipoEscenario } from "../generated/prisma/client";
import { AppError } from "../utils/AppError";
import { leerPagina, listaPaginada, QueryPagina } from "../utils/paginacion";
import {
    esTipoEscenario,
    formatearFechaEjercicio,
    parsearFechaEjercicio,
} from "../constants/emergencias.constants";
import { EjercicioCreate, EjercicioRespuesta } from "../types/ejercicio.types";

const textoOpcional = (valor: string | null | undefined): string | null => {
    if (typeof valor !== "string") return null;
    const limpio = valor.trim();
    return limpio.length > 0 ? limpio : null;
};

const ejercicioSelect = {
    id: true,
    nombre: true,
    fecha: true,
    horaInicio: true,
    tipoEscenario: true,
    lugar: true,
    descripcion: true,
    creadoEn: true,
    registradoPor: {
        select: { id: true, nombre: true },
    },
} as const;

const presentarEjercicio = (
    ejercicio: {
        id: number;
        nombre: string;
        fecha: Date;
        horaInicio: string | null;
        tipoEscenario: TipoEscenario;
        lugar: string | null;
        descripcion: string | null;
        creadoEn: Date;
        registradoPor: { id: number; nombre: string };
    }
): EjercicioRespuesta => ({
    ...ejercicio,
    fecha: formatearFechaEjercicio(ejercicio.fecha),
});

/**
 * HU-04. Registra un ejercicio de emergencia.
 * El responsable queda tomado de la sesión; no se acepta en el cuerpo de la petición.
 */
export const crearEjercicio = async (registradoPorId: number, data: EjercicioCreate): Promise<EjercicioRespuesta> => {
    const nombre = data.nombre?.trim() ?? "";
    if (nombre.length < 3 || nombre.length > 150) {
        throw new AppError("El nombre del ejercicio debe tener entre 3 y 150 caracteres.", 400);
    }

    const fecha = parsearFechaEjercicio(typeof data.fecha === "string" ? data.fecha.trim() : "");
    if (!fecha) {
        throw new AppError("La fecha debe ser un día válido con formato AAAA-MM-DD.", 400);
    }

    const tipo = typeof data.tipoEscenario === "string" ? data.tipoEscenario.trim().toUpperCase() : "";
    if (!esTipoEscenario(tipo)) {
        throw new AppError("El tipo de escenario debe ser SISMO, INCENDIO o INTRUSO.", 400);
    }

    const lugar = textoOpcional(data.lugar);
    if (lugar && lugar.length > 200) {
        throw new AppError("El lugar no puede superar 200 caracteres.", 400);
    }

    const descripcion = textoOpcional(data.descripcion);
    if (descripcion && descripcion.length > 2000) {
        throw new AppError("La descripción no puede superar 2000 caracteres.", 400);
    }

    const horaInicio = textoOpcional(data.horaInicio);
    if (horaInicio && !/^([01]\d|2[0-3]):[0-5]\d$/.test(horaInicio)) {
        throw new AppError("La hora de inicio debe tener formato HH:mm.", 400);
    }

    const ejercicio = await prisma.ejercicioEmergencia.create({
        data: {
            nombre,
            fecha,
            horaInicio,
            tipoEscenario: tipo,
            lugar,
            descripcion,
            registradoPorId,
        },
        select: ejercicioSelect,
    });

    return presentarEjercicio(ejercicio);
};

export type FiltroEjercicios = QueryPagina & {
    tipoEscenario?: unknown;
    fecha?: unknown;
};

/** HU-14. Los ejercicios confirmados siguen disponibles para consulta. */
export const listarEjercicios = async (filtro?: FiltroEjercicios) => {
    const { pagina, limite, salto } = leerPagina(filtro);
    const where: { tipoEscenario?: TipoEscenario; fecha?: Date } = {};

    if (typeof filtro?.tipoEscenario === "string" && filtro.tipoEscenario.trim() !== "") {
        const tipo = filtro.tipoEscenario.trim().toUpperCase();
        if (!esTipoEscenario(tipo)) {
            throw new AppError("El tipo de escenario debe ser SISMO, INCENDIO o INTRUSO.", 400);
        }
        where.tipoEscenario = tipo;
    }

    if (typeof filtro?.fecha === "string" && filtro.fecha.trim() !== "") {
        const fecha = parsearFechaEjercicio(filtro.fecha.trim());
        if (!fecha) {
            throw new AppError("La fecha debe ser un día válido con formato AAAA-MM-DD.", 400);
        }
        where.fecha = fecha;
    }

    const [ejercicios, total] = await Promise.all([
        prisma.ejercicioEmergencia.findMany({
            where,
            skip: salto,
            take: limite,
            orderBy: [{ fecha: "desc" }, { id: "desc" }],
            select: ejercicioSelect,
        }),
        prisma.ejercicioEmergencia.count({ where }),
    ]);

    return listaPaginada(ejercicios.map(presentarEjercicio), total, pagina, limite);
};

export const obtenerEjercicio = async (id: number) => {
    if (!Number.isInteger(id) || id < 1) {
        throw new AppError("El ejercicio indicado no es válido.", 400);
    }

    const ejercicio = await prisma.ejercicioEmergencia.findUnique({
        where: { id },
        select: {
            ...ejercicioSelect,
            gruposSeleccionados: {
                orderBy: { creadoEn: "asc" },
                select: seleccionGrupoSelect,
            },
        },
    });
    if (!ejercicio) {
        throw new AppError("El ejercicio de emergencia no existe.", 404);
    }

    const { gruposSeleccionados, ...resto } = ejercicio;
    return {
        ...presentarEjercicio(resto),
        grupos: gruposSeleccionados.map(presentarSeleccion),
    };
};

const seleccionGrupoSelect = {
    id: true,
    creadoEn: true,
    grupo: { select: { id: true, codigo: true, nombre: true } },
    seleccionadoPor: { select: { id: true, nombre: true } },
} as const;

const presentarSeleccion = (seleccion: {
    id: number;
    creadoEn: Date;
    grupo: { id: number; codigo: string; nombre: string };
    seleccionadoPor: { id: number; nombre: string };
}) => ({
    id: seleccion.id,
    seleccionadoEn: seleccion.creadoEn,
    grupo: seleccion.grupo,
    seleccionadoPor: seleccion.seleccionadoPor,
});

/**
 * HU-06. Deja identificado el grupo que se está verificando en el ejercicio.
 * La selección queda guardada y puede consultarse después.
 */
export const seleccionarGrupoEjercicio = async (ejercicioId: number, grupoId: number, seleccionadoPorId: number) => {
    if (!Number.isInteger(ejercicioId) || ejercicioId < 1) {
        throw new AppError("El ejercicio indicado no es válido.", 400);
    }
    if (!Number.isInteger(grupoId) || grupoId < 1) {
        throw new AppError("El grupo es obligatorio. Selecciona el grupo que estás verificando.", 400);
    }

    const [ejercicio, grupo] = await Promise.all([
        prisma.ejercicioEmergencia.findUnique({ where: { id: ejercicioId }, select: { id: true, nombre: true } }),
        prisma.grupo.findFirst({
            where: { id: grupoId, activo: true },
            select: { id: true, codigo: true, nombre: true },
        }),
    ]);
    if (!ejercicio) {
        throw new AppError("El ejercicio de emergencia no existe.", 404);
    }
    if (!grupo) {
        throw new AppError("El grupo no existe.", 404);
    }

    const yaSeleccionado = await prisma.ejercicioGrupo.findUnique({
        where: { ejercicioId_grupoId: { ejercicioId, grupoId: grupo.id } },
        select: { id: true },
    });
    if (yaSeleccionado) {
        throw new AppError("Ese grupo ya está seleccionado para este ejercicio.", 409);
    }

    const seleccion = await prisma.ejercicioGrupo.create({
        data: { ejercicioId, grupoId: grupo.id, seleccionadoPorId },
        select: {
            ...seleccionGrupoSelect,
            ejercicio: { select: { id: true, nombre: true } },
        },
    });

    return {
        ...presentarSeleccion(seleccion),
        ejercicio: seleccion.ejercicio,
    };
};

export const listarGruposSeleccionados = async (ejercicioId: number) => {
    const ejercicio = await prisma.ejercicioEmergencia.findUnique({
        where: { id: ejercicioId },
        select: { id: true, nombre: true },
    });
    if (!ejercicio) {
        throw new AppError("El ejercicio de emergencia no existe.", 404);
    }

    const grupos = await prisma.ejercicioGrupo.findMany({
        where: { ejercicioId },
        orderBy: { creadoEn: "asc" },
        select: seleccionGrupoSelect,
    });

    return {
        ejercicio,
        grupos: grupos.map(presentarSeleccion),
    };
};
