import { Comunero } from "../comuneros/comuneros.types";

export interface Meeting
{
    id?: string;
    name?: string;
    description?: string;
    attendance?: MeetingAttendance[];
    status?: string;
    date?: Date;
    documents?: any[];
    announcementId?: string;
}

export interface MeetingAttendance
{
    id?: string;
    status: string;
    entryDate: Date;
    meeting?: Meeting;
    comunero?: Comunero;
    representation?: string;
}
