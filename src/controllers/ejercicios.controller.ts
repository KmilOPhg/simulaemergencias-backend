import { Request, Response } from "express";
import { sendSuccessResponse } from "../utils/JSONResponse";
import { AppError } from "../utils/AppError";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { crearEjercicio, listarEjercicios } from "../services/ejercicios";

export const crearEjercicioController = async (req: Request, res: Response) => {
    const usuarioId = (req as AuthenticatedRequest).user?.id;
    if (!usuarioId) {
        throw new AppError("Usuario no autenticado", 401);
    }

    const data = await crearEjercicio(usuarioId, req.body);
    return sendSuccessResponse(res, 201, "Ejercicio de emergencia registrado correctamente", data);
};

export const listarEjerciciosController = async (req: Request, res: Response) => {
    const data = await listarEjercicios({ page: req.query.page, limit: req.query.limit });
    if (data.total === 0) {
        return sendSuccessResponse(res, 200, "Todavía no existen ejercicios registrados", data);
    }
    return sendSuccessResponse(res, 200, "Ejercicios obtenidos correctamente", data);
};
