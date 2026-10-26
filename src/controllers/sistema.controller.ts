import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { sendSuccessResponse } from "../utils/JSONResponse";

/** Healthcheck público: verifica que la API y la conexión a la base de datos estén activas. */
export const healthCheckController = async (_req: Request, res: Response) => {
    let db = "ok";
    try {
        await prisma.$queryRaw`SELECT 1`;
    } catch {
        db = "error";
    }

    return sendSuccessResponse(res, 200, "Servicio activo", {
        api: "ok",
        db,
        timestamp: new Date().toISOString(),
    });
};
