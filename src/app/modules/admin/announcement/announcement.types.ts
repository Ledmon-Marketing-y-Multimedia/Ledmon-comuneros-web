import { Comunero } from "../comuneros/comuneros.types";
import { Meeting } from "../meeting/meeting.types";

export interface Announcement
{
    id?: string;
    title?: string;
    description?: string;
    createdAt?: Date;
    content?: string;
    meeting?: Meeting;
    comunidad?: any;
    comuneros?: Comunero[];
}
