export interface Comunero
{
    id: string;
    user?: User;
    background?: string | null;
    lugar?: Announcement;
    code?: string;
    role?: ComuneroRole;
}

export enum ComuneroRole{
    AUTHORIZED = 'AUTHORIZED',
    HOLDER = 'HOLDER',
}

export interface Announcement
{
    id: string;
    address: string;
    zona: string;
    poblacion: string;
    provincia: string;
    cp: string;
}


export interface User
{
    id?: string;
    name?: string;
    email?: string;
    dni?: string;
    username?: string;
    phones?: string;
    createdAt?: string;
    phoneNumbers?: {
        country: string;
        phoneNumber: string;
        label: string;
    }[];
}

export interface NewComunero {
    name: string;
    email?: string;
    username: string;
    dni?: string;
    code: string;
    fechaAlta?: string;
    phoneNumbers?: {
        country: string;
        phoneNumber: string;
        label: string;
    }[];
    lugarId?: string;
    role: string;
}

export interface Country
{
    id: string;
    iso: string;
    name: string;
    code: string;
    flagImagePos: string;
}

export interface Tag
{
    id?: string;
    title?: string;
}
