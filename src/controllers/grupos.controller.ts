import { Request, Response } from "express";
import { sendSuccessResponse } from "../utils/JSONResponse";
import { listarGrupos } from "../services/grupos";

export const listarGruposController = async (_req: Request, res: Response) => {
    const data = await listarGrupos();
    return sendSuccessResponse(res, 200, "Grupos obtenidos correctamente", data);
};
