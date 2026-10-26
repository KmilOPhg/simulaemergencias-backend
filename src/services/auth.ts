import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma";
import { AppError } from "../utils/AppError";
import { EstadoUsuario, Prisma } from "../generated/prisma/client";
import { leerPaginaMaestros, listaPaginada, QueryPagina } from "../utils/paginacion";
import { cargarPermisosUsuario } from "../utils/permisosUsuario";
import { cargarRolesConPermisos } from "../utils/choquePermisosRoles";

export type JwtUserPayload = {
    id: number;
    nombre: string;
    email: string | null;
    rolIds: number[];
    estado: EstadoUsuario;
};

const mapearUsuarioRespuesta = (usuario: {
    id: number;
    nombre: string;
    email: string | null;
    estado: EstadoUsuario;
    usuarioRoles: { rol: { id: number; nombre: string } }[];
}) => {
    const roles = usuario.usuarioRoles.map((ur) => ({ id: ur.rol.id, nombre: ur.rol.nombre }));
    return {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rolIds: roles.map((r) => r.id),
        roles,
        estado: usuario.estado,
    };
};

const normalizarRolIds = (rolIds: number[] | null | undefined): number[] => {
    if (!rolIds?.length) return [];
    return [...new Set(rolIds.filter((id) => Number.isInteger(id) && id >= 1))];
};

/** Valida que los roles existan. Los permisos efectivos del usuario son la unión de todos sus roles. */
const validarRolesUsuario = async (rolIds: number[]): Promise<number[]> => {
    const ids = normalizarRolIds(rolIds);
    if (ids.length === 0) {
        throw new AppError("El usuario debe tener al menos un rol.", 400);
    }
    await cargarRolesConPermisos(ids);
    return ids;
};

const syncUsuarioRoles = async (
    tx: Prisma.TransactionClient,
    usuarioId: number,
    rolIds: number[]
) => {
    await tx.usuarioRol.deleteMany({ where: { usuarioId } });
    await tx.usuarioRol.createMany({
        data: rolIds.map((rolId) => ({ usuarioId, rolId })),
    });
};

const includeUsuarioCompleto = {
    usuarioRoles: { select: { rol: { select: { id: true, nombre: true } } } },
} as const;

// Login de usuario
export const loginUser = async (email: string, password: string) => {
    if (!email || !password) {
        throw new AppError("El email y la contraseña son requeridos", 400);
    }

    const user = await prisma.usuario.findUnique({
        where: { email },
        include: { usuarioRoles: { select: { rol: { select: { id: true, nombre: true, activo: true } } } } },
    });

    if (!user) {
        throw new AppError("El usuario no existe", 404);
    }

    if (user.estado === "INACTIVO") {
        throw new AppError("La cuenta está deshabilitada", 403);
    }

    const rolesActivos = user.usuarioRoles.map((ur) => ur.rol).filter((rol) => rol.activo);

    if (rolesActivos.length === 0) {
        throw new AppError("El usuario no tiene roles activos asignados", 403);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
        throw new AppError("La contraseña es incorrecta", 401);
    }

    const rolIds = rolesActivos.map((rol) => rol.id);

    const payload: JwtUserPayload = {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rolIds,
        estado: user.estado,
    };

    const token = jwt.sign(
        payload,
        process.env.JWT_SECRET || "secret",
        { expiresIn: "8h" }
    );

    const sesion = await cargarPermisosUsuario(user.id);

    return {
        token,
        user: {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rolIds,
            roles: rolesActivos.map((rol) => ({ id: rol.id, nombre: rol.nombre })),
            estado: user.estado,
        },
        permisos: sesion.permisos,
    };
};

// Permisos del usuario autenticado (sesión actual)
export const obtenerPermisosSesion = async (usuarioId: number) => {
    const datos = await cargarPermisosUsuario(usuarioId);

    return {
        rolIds: datos.rolIds,
        roles: datos.roles,
        permisos: datos.permisos,
    };
};

// Obtener usuarios
export const obtenerUsuarios = async (q?: QueryPagina) => {
    const { pagina, limite, salto } = leerPaginaMaestros(q);

    const [usuarios, total] = await Promise.all([
        prisma.usuario.findMany({
            skip: salto,
            take: limite,
            include: includeUsuarioCompleto,
        }),
        prisma.usuario.count(),
    ]);

    const datos = usuarios.map((usuario) => mapearUsuarioRespuesta(usuario));

    return listaPaginada(datos, total, pagina, limite);
};

// Obtener usuario
export const obtenerUsuario = async (userId: number) => {
    const usuario = await prisma.usuario.findUnique({
        where: { id: userId },
        include: includeUsuarioCompleto,
    });

    if (!usuario) {
        throw new AppError("El usuario no existe", 404);
    }

    return mapearUsuarioRespuesta(usuario);
};

// Register de usuario
export const anadirUsuario = async (
    nombre: string,
    email: string,
    hashedPassword: string,
    rolIds: number[]
) => {
    const idsRoles = await validarRolesUsuario(rolIds);

    const createdUser = await prisma.$transaction(async (tx) => {
        const usuario = await tx.usuario.create({
            data: {
                nombre,
                email,
                passwordHash: hashedPassword,
            },
        });
        await syncUsuarioRoles(tx, usuario.id, idsRoles);
        return usuario;
    });

    return {
        id: createdUser.id,
        nombre: createdUser.nombre,
        email: createdUser.email,
        rolIds: idsRoles,
    };
};

// Editar usuario
export const actualizarUsuario = async (
    userId: number,
    data: {
        nombre?: string;
        email?: string;
        estado?: EstadoUsuario;
        rolIds?: number[] | null;
    }
) => {
    let idsRoles: number[] | undefined;
    if (data.rolIds !== undefined) {
        idsRoles = await validarRolesUsuario(data.rolIds ?? []);
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
        await tx.usuario.update({
            where: { id: userId },
            data: {
                ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
                ...(data.email !== undefined ? { email: data.email } : {}),
                ...(data.estado !== undefined ? { estado: data.estado } : {}),
            },
        });

        if (idsRoles !== undefined) {
            await syncUsuarioRoles(tx, userId, idsRoles);
        }

        const refreshed = await tx.usuario.findUnique({
            where: { id: userId },
            include: includeUsuarioCompleto,
        });
        if (!refreshed) throw new AppError("El usuario no existe", 404);
        return refreshed;
    });

    return mapearUsuarioRespuesta(updatedUser);
};

// Deshabilitar usuario (toggle). No se puede desactivar la cuenta con la que está autenticado el solicitante.
export const deshabilitarUsuario = async (userId: number, solicitanteId?: number) => {
    const user = await prisma.usuario.findUnique({ where: { id: userId } });
    if (!user) {
        throw new AppError("El usuario no existe", 404);
    }
    const newEstado = user.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";

    if (newEstado === "INACTIVO" && solicitanteId != null && solicitanteId === userId) {
        throw new AppError(
            "No puedes deshabilitar tu propia cuenta. Usa otra cuenta administradora.",
            400
        );
    }

    const disabledUser = await prisma.usuario.update({
        where: { id: userId },
        data: { estado: newEstado }
    });

    return {
        id: disabledUser.id,
        nombre: disabledUser.nombre,
        email: disabledUser.email,
        estado: disabledUser.estado,
    };
};

export const cambiarContrasenaPropio = async (
    usuarioId: number,
    passwordActual: string,
    passwordNueva: string,
) => {
    const user = await prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!user) throw new AppError("Usuario no encontrado.", 404);

    const coincide = await bcrypt.compare(passwordActual, user.passwordHash);
    if (!coincide) throw new AppError("La contraseña actual es incorrecta.", 400);

    if (passwordActual === passwordNueva) {
        throw new AppError("La nueva contraseña debe ser diferente a la actual.", 400);
    }

    if (!passwordNueva || passwordNueva.length < 8) {
        throw new AppError("La contraseña debe tener al menos 8 caracteres.", 400);
    }

    const passwordHash = await bcrypt.hash(passwordNueva, 10);
    await prisma.usuario.update({
        where: { id: usuarioId },
        data: { passwordHash },
    });

    return { actualizado: true };
};
