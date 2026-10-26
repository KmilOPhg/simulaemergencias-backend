import { NextFunction, Request, Response } from "express";
import { sendErrorResponse } from "../utils/JSONResponse";
import { AppError } from "../utils/AppError";
import { errorPrisma } from "../utils/PrismaErrors";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { MulterError } from "multer";

export const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
    //Error de tipo AppError
    if (err instanceof AppError) {
        return sendErrorResponse(res, err.statusCode as number, err.message, err.errores);
    }
    //Error de tipo PrismaClientKnownRequestError
    if (err instanceof PrismaClientKnownRequestError) {
        return errorPrisma(res, err);
    }
    //Error de tipo MulterError
    if (err instanceof MulterError && err.code === "LIMIT_FILE_SIZE") {
        return sendErrorResponse(res, 400, "El tamaño del archivo supera el límite permitido.");
    }
    // Body JSON/urlencoded demasiado grande (express body-parser)
    if (err.type === "entity.too.large") {
        const limite = process.env.BODY_JSON_LIMIT ?? "50mb";
        return sendErrorResponse(
            res,
            413,
            `El cuerpo de la petición supera el límite permitido (${limite}).`
        );
    }
    //Error desconocido
    console.error(err);
    return sendErrorResponse(res, 500, err.message || "Error interno del servidor");
}
