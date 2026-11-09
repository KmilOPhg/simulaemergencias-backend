/** Escenarios aprobados para un ejercicio de emergencia (HU-04). */
export const TIPOS_ESCENARIO = ["SISMO", "INCENDIO", "INTRUSO"] as const;

export type TipoEscenarioCodigo = (typeof TIPOS_ESCENARIO)[number];

export const esTipoEscenario = (valor: string): valor is TipoEscenarioCodigo =>
    (TIPOS_ESCENARIO as readonly string[]).includes(valor);

/**
 * Acepta solo una fecha de calendario AAAA-MM-DD.
 * Se guarda a medianoche UTC para que el día no cambie por la zona horaria.
 */
export const parsearFechaEjercicio = (valor: string): Date | null => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
    const [anio, mes, dia] = valor.split("-").map(Number);
    const fecha = new Date(Date.UTC(anio, mes - 1, dia));
    if (
        fecha.getUTCFullYear() !== anio ||
        fecha.getUTCMonth() !== mes - 1 ||
        fecha.getUTCDate() !== dia
    ) {
        return null;
    }
    return fecha;
};

export const formatearFechaEjercicio = (fecha: Date): string => fecha.toISOString().slice(0, 10);

export const esHoraInicio = (valor: string): boolean => /^([01]\d|2[0-3]):[0-5]\d$/.test(valor);

/** La verificación registrada significa que el responsable hizo el chequeo. No describe asistencia física. */
export const ESTADO_VERIFICACION_REGISTRADA = "VERIFICADO" as const;
