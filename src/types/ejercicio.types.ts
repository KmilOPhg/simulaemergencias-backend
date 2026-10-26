import { TipoEscenarioCodigo } from "../constants/emergencias.constants";

export type EjercicioCreate = {
    nombre: string;
    fecha: string;
    horaInicio?: string | null;
    tipoEscenario: string;
    lugar?: string | null;
    descripcion?: string | null;
};

export type EjercicioRespuesta = {
    id: number;
    nombre: string;
    fecha: string;
    horaInicio: string | null;
    tipoEscenario: TipoEscenarioCodigo;
    lugar: string | null;
    descripcion: string | null;
    creadoEn: Date;
    registradoPor: {
        id: number;
        nombre: string;
    };
};
