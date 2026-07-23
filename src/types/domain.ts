/**
 * Tipos de dominio portados 1:1 desde los *.types.ts del Angular.
 * (comuneros, lugares, meeting, announcement, user).
 */

// ------------------------------------------------------------------
// Enums
// ------------------------------------------------------------------
export enum ComuneroStatus {
  ACTIVE = "ACTIVE",
  UNSUBSCRIBED = "UNSUBSCRIBED",
}

export enum ComuneroRole {
  AUTHORIZED = "AUTHORIZED",
  HOLDER = "HOLDER",
}

export enum LugarStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  UNSUBSCRIBED = "UNSUBSCRIBED",
}

// ------------------------------------------------------------------
// Teléfono / usuario
// ------------------------------------------------------------------
export interface Phone {
  country: string;
  phoneNumber: string;
  label: string;
}

export interface User {
  id?: string;
  name?: string;
  email?: string;
  dni?: string;
  username?: string;
  fechaAlta?: Date;
  createdAt?: string;
  phones?: Phone[];
}

// ------------------------------------------------------------------
// Comunero
// ------------------------------------------------------------------
export interface Comunero {
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

export interface NewComunero {
  name: string;
  email?: string;
  username: string;
  dni?: string;
  code: string;
  fechaAlta?: string;
  phones?: Phone[];
  lugarId?: string;
  role: string;
}

export interface Country {
  id: string;
  iso: string;
  name: string;
  code: string;
  flagImagePos: string;
}

export interface Tag {
  id?: string;
  title?: string;
}

// ------------------------------------------------------------------
// Lugar
// (unión de las dos definiciones locales del Angular: la del módulo
//  comuneros y la del módulo lugares)
// ------------------------------------------------------------------
export interface Lugar {
  id: string;
  address?: string;
  zona?: string;
  poblacion?: string;
  provincia?: string;
  cp?: string;
  status?: LugarStatus | string;
  comuneros?: Comunero[];
  unsubscribedDate?: Date;
  suspendedDate?: Date;
}

// ------------------------------------------------------------------
// Meeting / asistencia
// ------------------------------------------------------------------
export interface Meeting {
  id?: string;
  name?: string;
  description?: string;
  attendance?: MeetingAttendance[];
  status?: string;
  date?: Date;
  documents?: MeetingDocument[];
  announcementId?: string;
}

export interface MeetingAttendance {
  id?: string;
  status: string;
  entryDate: Date;
  meeting?: Meeting;
  comunero?: Comunero;
  representation?: string;
}

export interface MeetingDocument {
  id?: string;
  name?: string;
  path?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

// ------------------------------------------------------------------
// Announcement
// ------------------------------------------------------------------
export interface Announcement {
  id?: string;
  title?: string;
  description?: string;
  createdAt?: Date;
  content?: string;
  meeting?: Meeting;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  comunidad?: any;
  comuneros?: Comunero[];
  user?: User;
}

// ------------------------------------------------------------------
// Etiquetas de estado (portadas de assets/i18n/en.json — usadas en ES)
// ------------------------------------------------------------------
export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Alta",
  UNSUBSCRIBED: "Baja",
  SUSPENDED: "Suspenso",
};

export const ATTENDANCE_LABELS: Record<string, string> = {
  ABSENT: "Ausente",
  PRESENT: "Presente",
};

export function statusLabel(status?: string): string {
  if (!status) return "";
  return STATUS_LABELS[status] ?? status;
}

export function attendanceLabel(status?: string): string {
  if (!status) return "";
  return ATTENDANCE_LABELS[status] ?? status;
}
