import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { sendErrorResponse } from "./JSONResponse";
import { Response } from "express";

/**
 * Diccionario de campos técnicos -> nombre amigable para mostrar en errores de FK/unicidad.
 * Agrega aquí los campos de tus propios modelos según los vayas creando.
 */
const diccionarioRelaciones: Record<string, string> = {
    rolId: "El Rol",
    usuarioId: "El Usuario",
    estudianteId: "El estudiante",
    grupoId: "El grupo",
    ejercicioId: "El ejercicio",
    registradoPorId: "El usuario",
};

const diccionarioUnicos: Record<string, string> = {
    email: "Correo Electrónico",
    documento: "Documento de Identidad",
    nombre: "Nombre",
    codigo: "Código",
    codigoUnico: "código único",
};

export const errorPrisma = (res: Response, error: PrismaClientKnownRequestError) => {
    switch (error.code) {
        // error de clave foránea
        case "P2003": {
            const meta = error.meta as Record<string, unknown> | undefined;
            const field = typeof meta?.field_name === "string" ? meta.field_name : "";
            const modelName = typeof meta?.modelName === "string" ? meta.modelName : "";
            const mensajePrisma = typeof error.message === "string" ? error.message : "";
            const contextoError = `${field} ${modelName} ${mensajePrisma}`.toLowerCase();

            const campoEncontrado = Object.keys(diccionarioRelaciones).find((key) =>
                contextoError.includes(key.toLowerCase())
            );
            const entidad = campoEncontrado ? diccionarioRelaciones[campoEncontrado] : "El registro relacionado";

            return sendErrorResponse(res, 400, `${entidad} especificado no existe`);
        }
        // error de duplicado
        case "P2002": {
            const campo = error.meta?.target;

            if (Array.isArray(campo) && campo.length >= 1) {
                const primerCampo = campo[0];
                const campoTraducido = diccionarioUnicos[primerCampo] || primerCampo;
                return sendErrorResponse(res, 409, `El ${campoTraducido} ya está registrado`);
            }

            return sendErrorResponse(res, 409, "Ya existe un registro con esos datos");
        }
        // error de no encontrado
        case "P2025":
            return sendErrorResponse(res, 404, "El registro especificado no existe");
        default:
            return sendErrorResponse(res, 500, error.message || "Error desconocido");
    }
}
