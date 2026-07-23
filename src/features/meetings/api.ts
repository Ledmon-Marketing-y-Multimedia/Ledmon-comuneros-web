"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type {
  Announcement,
  Comunero,
  Meeting,
  MeetingAttendance,
} from "@/types/domain";

const MEETING_URL = "/meeting";
const ATTENDANCE_URL = "/attendance";
const COMUNIDAD_URL = "/comunidad/";
export const COMUNIDAD_ID = "a09b25f2-897b-4e33-bac5-d5e34f7245ce";

async function fetchMeetings(query?: string): Promise<Meeting[]> {
  const params: Record<string, string> = {};
  if (query) params.query = query;
  return api.get<Meeting[]>(MEETING_URL + "/search/marcon", { params });
}

export function useMeetings(query = "") {
  return useQuery({
    queryKey: queryKeys.meetings.list(query),
    queryFn: () => fetchMeetings(query),
  });
}

export function useMeeting(id: string) {
  return useQuery({
    queryKey: queryKeys.meetings.detail(id),
    queryFn: () => api.get<Meeting>(MEETING_URL + "/" + id),
    enabled: !!id,
  });
}

export function useCreateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (meeting: Meeting) => api.post<Meeting>(MEETING_URL, meeting),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.meetings.all }),
  });
}

export function useUpdateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, meeting }: { id: string; meeting: Meeting }) =>
      api.patch<Meeting>(MEETING_URL + "/" + id, meeting),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.meetings.all });
      qc.invalidateQueries({ queryKey: queryKeys.meetings.detail(vars.id) });
    },
  });
}

export function useDeleteMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<boolean>(MEETING_URL + "/" + id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.meetings.all }),
  });
}

export function useUploadDocument() {
  return useMutation({
    mutationFn: ({ meetingId, formData }: { meetingId: string; formData: FormData }) =>
      api.post<Record<string, unknown>>(
        MEETING_URL + "/" + meetingId + "/document",
        formData,
      ),
  });
}

export function useDeleteDocument() {
  return useMutation({
    mutationFn: ({ meetingId, documentId }: { meetingId: string; documentId: string }) =>
      api.delete<boolean>(
        MEETING_URL + "/" + meetingId + "/document/" + documentId,
      ),
  });
}

// -------- Funciones imperativas (usadas por el overlay de escaneo) --------

export function getAnnouncementAttendance(meetingId: string, lugarId: string) {
  return api.get<MeetingAttendance[]>(
    ATTENDANCE_URL + "/" + meetingId + "/lugar/" + lugarId,
  );
}

export function getAttendancesByName(meetingId: string, name: string) {
  return api.get<MeetingAttendance[]>(
    ATTENDANCE_URL + "/" + meetingId + "/search",
    { params: { name } },
  );
}

export function registerAttendance(attendance: MeetingAttendance) {
  return api.patch<MeetingAttendance[]>(
    ATTENDANCE_URL + "/register",
    attendance,
  );
}

export function getSuspendedComuneros(comunidadId: string) {
  return api.get<Comunero[]>(COMUNIDAD_URL + comunidadId + "/absents");
}

export function suspendComuneros(comunidadId: string, comuneros: Comunero[]) {
  return api.post<Announcement>(COMUNIDAD_URL + comunidadId + "/suspend", {
    comuneros,
  });
}
