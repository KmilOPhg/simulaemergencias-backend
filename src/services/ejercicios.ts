import { prisma } from "../../lib/prisma";
import { TipoEscenario } from "../generated/prisma/client";
import { AppError } from "../utils/AppError";
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
