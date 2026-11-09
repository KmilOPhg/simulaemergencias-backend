export type EstudianteListado = {
    id: number;
    codigoUnico: string;
    nombres: string;
    apellidos: string;
    grupo: {
        id: number;
        codigo: string;
        nombre: string;
    };
};
