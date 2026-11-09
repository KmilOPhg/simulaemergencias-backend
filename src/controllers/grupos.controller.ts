import { Request, Response } from "express";
import { sendSuccessResponse } from "../utils/JSONResponse";
import { listarEstudiantesDeGrupo } from "../services/estudiantes";
import { listarGrupos } from "../services/grupos";

export const listarGruposController = async (req: Request, res: Response) => {
    const data = await listarGrupos({ page: req.query.page, limit: req.query.limit });
    const msg = data.total === 0
        ? "No hay grupos disponibles."
        : "Grupos obtenidos correctamente";
    return sendSuccessResponse(res, 200, msg, data);
};

export const listarEstudiantesDeGrupoController = async (req: Request, res: Response) => {
    const data = await listarEstudiantesDeGrupo(Number(req.params.grupoId), {
        page: req.query.page,
        limit: req.query.limit,
    });
    const msg = data.total === 0
        ? "El grupo no tiene estudiantes asociados."
        : "Estudiantes del grupo obtenidos correctamente";
    return sendSuccessResponse(res, 200, msg, data);
};
