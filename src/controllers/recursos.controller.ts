import { Request, Response } from "express";
import { sendSuccessResponse } from "../utils/JSONResponse";
import { obtenerRecursos, obtenerRecurso, crearRecurso, actualizarRecurso, inhabilitarRecurso } from "../services/recursos";

export const obtenerRecursosController = async (req: Request, res: Response) => {
    const data = await obtenerRecursos({ page: req.query.page, limit: req.query.limit });
    return sendSuccessResponse(res, 200, "Recursos obtenidos correctamente", data);
};

export const obtenerRecursoController = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const data = await obtenerRecurso(id);
    return sendSuccessResponse(res, 200, "Recurso obtenido correctamente", data);
};

export const crearRecursoController = async (req: Request, res: Response) => {
    const { nombre, descripcion } = req.body;
    const data = await crearRecurso({ nombre, descripcion });
    return sendSuccessResponse(res, 201, "Recurso creado correctamente", data);
};

export const actualizarRecursoController = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { nombre, descripcion } = req.body;
    const data = await actualizarRecurso(id, { nombre, descripcion });
    return sendSuccessResponse(res, 200, "Recurso actualizado correctamente", data);
};

export const inhabilitarRecursoController = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const data = await inhabilitarRecurso(id);
    return sendSuccessResponse(res, 200, "Recurso actualizado correctamente", data);
};
