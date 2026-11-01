import { Request, Response } from "express";
import { sendSuccessResponse } from "../utils/JSONResponse";
import { buscarEstudiantePorCodigo, listarEstudiantes } from "../services/estudiantes";

export const listarEstudiantesController = async (req: Request, res: Response) => {
    const grupoId = req.query.grupoId ? Number(req.query.grupoId) : undefined;
    const data = await listarEstudiantes({ page: req.query.page, limit: req.query.limit, grupoId });
    if (grupoId && data.total === 0) {
        return sendSuccessResponse(res, 200, "El grupo no tiene estudiantes registrados", data);
    }
    return sendSuccessResponse(res, 200, "Listado de estudiantes obtenido correctamente", data);
};

export const buscarEstudiantePorCodigoController = async (req: Request, res: Response) => {
    const data = await buscarEstudiantePorCodigo(String(req.params.codigo));
    return sendSuccessResponse(res, 200, "Estudiante encontrado correctamente", data);
};
