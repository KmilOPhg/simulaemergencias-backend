import { Request, Response } from "express";
import { sendSuccessResponse } from "../utils/JSONResponse";
import { buscarEstudiantePorCodigo, listarEstudiantes } from "../services/estudiantes";

export const listarEstudiantesController = async (req: Request, res: Response) => {
    const data = await listarEstudiantes({ page: req.query.page, limit: req.query.limit });
    return sendSuccessResponse(res, 200, "Listado de estudiantes obtenido correctamente", data);
};

export const buscarEstudiantePorCodigoController = async (req: Request, res: Response) => {
    const codigo = Array.isArray(req.params.codigoUnico) ? req.params.codigoUnico[0] : req.params.codigoUnico;
    const data = await buscarEstudiantePorCodigo(codigo ?? "");
    return sendSuccessResponse(res, 200, "Estudiante encontrado", data);
};
