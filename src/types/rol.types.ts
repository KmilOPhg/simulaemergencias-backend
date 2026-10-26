export type RolParams = {
    id: number;
}

export type RolBody = {
    nombre: string;
    descripcion: string;
    activo: boolean;
    permisos: string[];
}

export type RolCreate = Omit<RolBody, 'activo'>;

export type RolUpdate = Partial<RolBody>;
