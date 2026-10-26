import { ROL_ADMIN } from "../constants/rolesSistema.constants";
import { AppError } from "./AppError";

export const esUsuarioAdministrador = (roles: { nombre: string }[]): boolean =>
    roles.some((rol) => rol.nombre === ROL_ADMIN);

export const assertUsuarioAdministrador = (roles: { nombre: string }[], mensaje = "Solo un administrador puede realizar esta acción."): void => {
    if (!esUsuarioAdministrador(roles)) {
        throw new AppError(mensaje, 403);
    }
};
