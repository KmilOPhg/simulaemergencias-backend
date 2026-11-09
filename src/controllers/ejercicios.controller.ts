import { Request, Response } from "express";
import { sendSuccessResponse } from "../utils/JSONResponse";
import { AppError } from "../utils/AppError";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import {
    crearEjercicio,
    listarEjercicios,
    listarGruposSeleccionados,
    obtenerEjercicio,
    seleccionarGrupoEjercicio,
} from "../services/ejercicios";

const usuarioId = (req: Request) => {
    const id = (req as AuthenticatedRequest).user?.id;
    if (!id) {
        throw new AppError("Usuario no autenticado", 401);
    }
    return id;
};

export const listarEjerciciosController = async (req: Request, res: Response) => {
    const data = await listarEjercicios({
        page: req.query.page,
        limit: req.query.limit,
        tipoEscenario: req.query.tipoEscenario,
        fecha: req.query.fecha,
    });
    return sendSuccessResponse(res, 200, "Ejercicios obtenidos correctamente", data);
};

export const obtenerEjercicioController = async (req: Request, res: Response) => {
    const data = await obtenerEjercicio(Number(req.params.id));
    return sendSuccessResponse(res, 200, "Ejercicio obtenido correctamente", data);
};

export const crearEjercicioController = async (req: Request, res: Response) => {
    const data = await crearEjercicio(usuarioId(req), req.body);
    return sendSuccessResponse(res, 201, "Ejercicio de emergencia registrado correctamente", data);
};

export const seleccionarGrupoController = async (req: Request, res: Response) => {
    const data = await seleccionarGrupoEjercicio(
        Number(req.params.ejercicioId),
        Number(req.body.grupoId),
        usuarioId(req)
    );
    return sendSuccessResponse(res, 201, "Grupo seleccionado para el ejercicio", data);
};

export const listarGruposSeleccionadosController = async (req: Request, res: Response) => {
    const data = await listarGruposSeleccionados(Number(req.params.ejercicioId));
    const msg = data.grupos.length === 0
        ? "Este ejercicio no tiene un grupo seleccionado."
        : "Grupos seleccionados del ejercicio";
    return sendSuccessResponse(res, 200, msg, data);
};
