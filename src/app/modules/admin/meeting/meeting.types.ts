import { Comunero } from "../comuneros/comuneros.types";

export interface Meeting
{
    id?: string;
    name?: string;
    description?: string;
    status?: string;
    date?: Date;
}

export interface MeetingAttendance
{
    id?: string;
    meeting?: Meeting;
    status: string;
    entryDate: Date;
    comunero?: Comunero;
}
