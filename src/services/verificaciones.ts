import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../utils/AppError";
import { ESTADO_VERIFICACION_REGISTRADA, formatearFechaEjercicio } from "../constants/emergencias.constants";
import { VerificacionCreate, VerificacionRespuesta } from "../types/verificacion.types";

const MENSAJE_DUPLICADA = "Este estudiante ya tiene una verificación registrada en este ejercicio.";

const verificacionSelect = {
    id: true,
    observacion: true,
    verificadoEn: true,
    estudiante: {
        select: { id: true, codigoUnico: true, nombres: true, apellidos: true },
    },
    grupo: {
        select: { id: true, codigo: true, nombre: true },
    },
    ejercicio: {
        select: { id: true, nombre: true, fecha: true, tipoEscenario: true },
    },
    registradoPor: {
        select: { id: true, nombre: true },
    },
} as const;

/**
 * HU-07. Registra la verificación de un estudiante dentro de un ejercicio.
 * La combinación ejercicio + estudiante es única.
 * El grupo enviado debe ser el grupo actual del estudiante, para no asociar
 * el registro a participantes de otro salón.
 * El estado VERIFICADO se deriva de la existencia del registro: no se guarda
 * "pendiente" y este registro no significa ausencia física.
 */
export const registrarVerificacion = async (
    ejercicioId: number,
    registradoPorId: number,
    data: VerificacionCreate
): Promise<VerificacionRespuesta> => {
    if (!Number.isInteger(ejercicioId) || ejercicioId < 1) {
        throw new AppError("El ejercicio indicado no es válido.", 400);
    }
    if (!Number.isInteger(data.estudianteId) || data.estudianteId < 1) {
        throw new AppError("El estudiante es obligatorio.", 400);
    }
    if (!Number.isInteger(data.grupoId) || data.grupoId < 1) {
        throw new AppError("El grupo es obligatorio.", 400);
    }

    const observacion = typeof data.observacion === "string" ? data.observacion.trim() : "";
    if (observacion.length > 500) {
        throw new AppError("La observación no puede superar 500 caracteres.", 400);
    }

    const ejercicio = await prisma.ejercicioEmergencia.findUnique({
        where: { id: ejercicioId },
        select: { id: true },
    });
    if (!ejercicio) {
        throw new AppError("El ejercicio de emergencia no existe.", 404);
    }

    const [estudiante, grupo] = await Promise.all([
        prisma.estudiante.findUnique({
            where: { id: data.estudianteId },
            select: { id: true, grupoId: true, activo: true },
        }),
        prisma.grupo.findUnique({
            where: { id: data.grupoId },
            select: { id: true, activo: true },
        }),
    ]);

    if (!estudiante || !estudiante.activo) {
        throw new AppError("El estudiante no existe.", 404);
    }
    if (!grupo || !grupo.activo) {
        throw new AppError("El grupo no existe.", 404);
    }
    if (estudiante.grupoId !== grupo.id) {
        throw new AppError("El estudiante no pertenece al grupo indicado.", 400);
    }

    const existente = await prisma.verificacionEstudiante.findUnique({
        where: {
            ejercicioId_estudianteId: {
                ejercicioId,
                estudianteId: estudiante.id,
            },
        },
        select: { id: true },
    });
    if (existente) {
        throw new AppError(MENSAJE_DUPLICADA, 409);
    }

    try {
        const verificacion = await prisma.verificacionEstudiante.create({
            data: {
                ejercicioId,
                estudianteId: estudiante.id,
                grupoId: grupo.id,
                observacion: observacion.length > 0 ? observacion : null,
                registradoPorId,
            },
            select: verificacionSelect,
        });

        return {
            id: verificacion.id,
            estado: ESTADO_VERIFICACION_REGISTRADA,
            observacion: verificacion.observacion,
            verificadoEn: verificacion.verificadoEn,
            estudiante: verificacion.estudiante,
            grupo: verificacion.grupo,
            ejercicio: {
                ...verificacion.ejercicio,
                fecha: formatearFechaEjercicio(verificacion.ejercicio.fecha),
            },
            registradoPor: verificacion.registradoPor,
        };
    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
            throw new AppError(MENSAJE_DUPLICADA, 409);
        }
        throw error;
    }
};
