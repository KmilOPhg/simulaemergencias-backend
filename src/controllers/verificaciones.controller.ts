import { Request, Response } from "express";
import { sendSuccessResponse } from "../utils/JSONResponse";
import { AppError } from "../utils/AppError";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { listarVerificaciones, registrarVerificacion } from "../services/verificaciones";

export const listarVerificacionesController = async (req: Request, res: Response) => {
    const data = await listarVerificaciones(Number(req.params.ejercicioId), {
        page: req.query.page,
        limit: req.query.limit,
    });
    const msg = data.total === 0
        ? "El ejercicio no tiene verificaciones registradas."
        : "Verificaciones obtenidas correctamente";
    return sendSuccessResponse(res, 200, msg, data);
};

export const registrarVerificacionController = async (req: Request, res: Response) => {
    const usuarioId = (req as AuthenticatedRequest).user?.id;
    if (!usuarioId) {
        throw new AppError("Usuario no autenticado", 401);
    }

    const data = await registrarVerificacion(Number(req.params.ejercicioId), usuarioId, {
        estudianteId: Number(req.body.estudianteId),
        grupoId: Number(req.body.grupoId),
        observacion: req.body.observacion,
    });
    return sendSuccessResponse(res, 201, "Verificación del estudiante registrada correctamente", data);
};
