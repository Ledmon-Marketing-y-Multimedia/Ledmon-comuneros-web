"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { Comunero, NewComunero } from "@/types/domain";

const COMUNEROS_URL = "/comunero";

/** Lista/búsqueda de comuneros (getComuneros + searchComuneros del servicio). */
async function fetchComuneros(
  name?: string,
  status?: string,
): Promise<Comunero[]> {
  const params: Record<string, string> = {};
  if (name) params.name = name;
  if (status && status !== "all" && status !== "") params.status = status;
  const comuneros = await api.get<Comunero[]>(
    COMUNEROS_URL + "/search/marcon",
    { params },
  );
  // Mismo orden que el servicio Angular: por nombre.
  return [...comuneros].sort((a, b) =>
    (a.user?.name ?? "").localeCompare(b.user?.name ?? ""),
  );
}

export function useComuneros(name = "", status = "") {
  return useQuery({
    queryKey: queryKeys.comuneros.list(name, status),
    queryFn: () => fetchComuneros(name, status),
  });
}

/** Comunero por id: se resuelve desde la lista base (como getComuneroById). */
export function useComunero(id: string) {
  const comuneros = useComuneros();
  const comunero =
    comuneros.data?.find((item) => item.id === id) ?? null;
  return { ...comuneros, comunero };
}

export function useCreateComunero() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (comunero: NewComunero) =>
      api.post<Comunero>(COMUNEROS_URL, comunero),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.comuneros.all }),
  });
}

export function useUpdateComunero() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comunero }: { id: string; comunero: Comunero }) =>
      api.patch<Comunero>(COMUNEROS_URL + "/" + id, comunero),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.comuneros.all }),
  });
}

export function useUpdateComuneroStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      comunero,
    }: {
      id: string;
      comunero: { comments?: string; status: string };
    }) => api.patch<Comunero>(COMUNEROS_URL + "/" + id + "/status", comunero),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.comuneros.all }),
  });
}

export function useDeleteComunero() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<boolean>(COMUNEROS_URL + "/" + id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.comuneros.all }),
  });
}
