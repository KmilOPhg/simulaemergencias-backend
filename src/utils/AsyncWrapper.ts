import { Request, Response, NextFunction } from "express";

type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<void>;

const asyncWrapper = (fn: AsyncFunction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Ejecuta la función y si falla (catch), pasa el error a next()
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncWrapper;
