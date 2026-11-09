import { Request, Response } from "express";
import { sendSuccessResponse } from "../utils/JSONResponse";
import { AppError } from "../utils/AppError";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { registrarVerificacion } from "../services/verificaciones";

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
