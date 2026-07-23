"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { Announcement } from "@/types/domain";

const ANNOUNCEMENT_URL = "/announcement";

async function fetchAnnouncements(query?: string): Promise<Announcement[]> {
  const params: Record<string, string> = {};
  if (query) params.address = query; // searchAnnouncement usa el parámetro 'address'
  const announcements = await api.get<Announcement[]>(
    ANNOUNCEMENT_URL + "/search/marcon",
    { params },
  );
  if (!query) {
    // getAnnouncements ordena por createdAt ascendente.
    return [...announcements].sort(
      (a, b) =>
        new Date(a.createdAt ?? 0).getTime() -
        new Date(b.createdAt ?? 0).getTime(),
    );
  }
  return announcements;
}

export function useAnnouncements(query = "") {
  return useQuery({
    queryKey: queryKeys.announcements.list(query),
    queryFn: () => fetchAnnouncements(query),
  });
}

export function useAnnouncement(id: string) {
  return useQuery({
    queryKey: queryKeys.announcements.detail(id),
    queryFn: () => api.get<Announcement>(ANNOUNCEMENT_URL + "/" + id),
    enabled: !!id,
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (announcement: Announcement) =>
      api.post<Announcement>(ANNOUNCEMENT_URL, announcement),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.announcements.all }),
  });
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      announcement,
    }: {
      id: string;
      announcement: Announcement;
    }) => api.patch<Announcement>(ANNOUNCEMENT_URL + "/" + id, announcement),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.announcements.all });
      qc.invalidateQueries({
        queryKey: queryKeys.announcements.detail(vars.id),
      });
    },
  });
}

export function useSendAnnouncementEmail() {
  return useMutation({
    mutationFn: (announcement: Announcement) =>
      api.post<Announcement>(ANNOUNCEMENT_URL + "/email", announcement),
  });
}
