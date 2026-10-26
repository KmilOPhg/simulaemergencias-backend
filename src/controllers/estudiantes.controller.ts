import { Request, Response } from "express";
import { sendSuccessResponse } from "../utils/JSONResponse";
import { listarEstudiantes } from "../services/estudiantes";

export const listarEstudiantesController = async (req: Request, res: Response) => {
    const data = await listarEstudiantes({ page: req.query.page, limit: req.query.limit });
    return sendSuccessResponse(res, 200, "Listado de estudiantes obtenido correctamente", data);
};
