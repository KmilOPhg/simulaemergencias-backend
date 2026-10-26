/** Query típico: `?page=1&limit=20` */
export type QueryPagina = { page?: unknown; limit?: unknown };

const entero = (v: unknown, defecto: number) => {
    const n = typeof v === "string" ? parseInt(v, 10) : Number(v);
    return Number.isInteger(n) && n >= 1 ? n : defecto;
};

/** Lee `page` y `limit` del query. Defecto: página 1, 20 ítems, máximo 100 por página. */
export const leerPagina = (q?: QueryPagina, opts?: { maxLimite?: number }) => {
    const pagina = entero(q?.page, 1);
    const maxLimite = opts?.maxLimite ?? 100;
    const limite = Math.min(maxLimite, Math.max(1, entero(q?.limit, 20)));
    return { pagina, limite, salto: (pagina - 1) * limite };
};

/** Paginación para tablas maestras/catálogos pequeños: por defecto trae 500 registros en una página. */
export const leerPaginaMaestros = (q?: QueryPagina, opts?: { maxLimite?: number; defecto?: number }) => {
    const maxLimite = opts?.maxLimite ?? 2000;
    const defecto = opts?.defecto ?? 500;
    const pagina = entero(q?.page, 1);
    const limitePedido = entero(q?.limit, 0);
    const limite = limitePedido > 0 ? Math.min(maxLimite, limitePedido) : defecto;
    return { pagina, limite, salto: (pagina - 1) * limite };
};

/** Respuesta paginada estándar para el frontend */
export const listaPaginada = <T>(datos: T[], total: number, pagina: number, limite: number) => ({
    datos,
    total,
    pagina,
    limite,
    totalPaginas: Math.max(1, Math.ceil(total / limite)),
});
