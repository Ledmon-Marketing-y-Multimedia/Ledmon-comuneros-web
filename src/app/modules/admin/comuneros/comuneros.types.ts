import { MeetingAttendance } from "../meeting/meeting.types";

export interface Comunero
{
    id: string;
    user?: User;
    background?: string | null;
    lugar?: Lugar;
    code?: string;
    role?: ComuneroRole;
    status?: ComuneroStatus;
    comments?: string;
    unsubscribedDate?: Date;
    emailCommunication?: boolean;
    attendances?: MeetingAttendance[];
}

export enum ComuneroStatus{
    ACTIVE = 'ACTIVE',
    UNSUBSCRIBED = 'UNSUBSCRIBED',
}

export enum ComuneroRole{
    AUTHORIZED = 'AUTHORIZED',
    HOLDER = 'HOLDER',
}

export interface Lugar
{
    id: string;
    address: string;
    zona: string;
    poblacion: string;
    provincia: string;
    status: LugarStatus
    cp: string;
    unsubscribedDate?: Date;
    suspendedDate?: Date;
}

export enum LugarStatus{
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
    UNSUBSCRIBED = 'UNSUBSCRIBED',
}


export interface User
{
    id?: string;
    name?: string;
    email?: string;
    dni?: string;
    username?: string;
    fechaAlta?: Date;
    createdAt?: string;
    phones?: {
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
    phones?: {
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
