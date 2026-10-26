export type RecursoParams = {
    id: number;
};

export type RecursoBody = {
    nombre: string;
    descripcion?: string;
    activo?: boolean;
};

export type RecursoCreate = Omit<RecursoBody, "activo">;

export type RecursoUpdate = Partial<RecursoBody>;
