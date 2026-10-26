import { Request, Response } from "express";
import { sendSuccessResponse } from "../utils/JSONResponse";
import { solicitarRecuperacion, restablecerContrasena } from "../services/recuperacion";

export const solicitarRecuperacionController = async (req: Request, res: Response) => {
    const { email, html, subject } = req.body;
    const data = await solicitarRecuperacion(email, { html, subject });
    return sendSuccessResponse(res, 200, data.mensaje);
};

export const restablecerContrasenaController = async (req: Request, res: Response) => {
    const { token, nuevaContrasena } = req.body;
    const data = await restablecerContrasena(token, nuevaContrasena);
    return sendSuccessResponse(res, 200, data.mensaje);
};
