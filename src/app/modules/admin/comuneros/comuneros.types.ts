export interface Comunero
{
    id: string;
    user?: User;
    background?: string | null;
    name?: string;
    lugar?: Lugar;
    emails?: {
        email: string;
        label: string;
    }[];
    phoneNumbers?: {
        country: string;
        phoneNumber: string;
        label: string;
    }[];
    code?: string;
    role?: string;
}

export interface Lugar
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
    id: string;
    name: string;
    email: string;
    username: string;
    phones: string;
    createdAt: string;
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
