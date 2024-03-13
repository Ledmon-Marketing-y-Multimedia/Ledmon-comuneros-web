import { Comunero } from "../comuneros/comuneros.types";

export interface Lugar
{
    id: string;
    address: string;
    zona: string;
    poblacion: string;
    provincia: string;
    cp: string;
    comuneros: Comunero[];
    status: string;
}
