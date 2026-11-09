import { ESTADO_VERIFICACION_REGISTRADA } from "../constants/emergencias.constants";

export type VerificacionCreate = {
    estudianteId: number;
    grupoId: number;
    observacion?: string | null;
};

export type VerificacionRespuesta = {
    id: number;
    estado: typeof ESTADO_VERIFICACION_REGISTRADA;
    observacion: string | null;
    verificadoEn: Date;
    estudiante: {
        id: number;
        codigoUnico: string;
        nombres: string;
        apellidos: string;
    };
    grupo: {
        id: number;
        codigo: string;
        nombre: string;
    };
    ejercicio: {
        id: number;
        nombre: string;
        fecha: string;
        tipoEscenario: string;
    };
    registradoPor: {
        id: number;
        nombre: string;
    };
};
