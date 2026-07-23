"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { Lugar } from "@/types/domain";

const LUGAR_URL = "/lugar";
const COMUNIDAD_ID = "a09b25f2-897b-4e33-bac5-d5e34f7245ce";

async function fetchLugares(address?: string): Promise<Lugar[]> {
  const params: Record<string, string> = {};
  if (address) params.address = address;
  const lugares = await api.get<Lugar[]>(LUGAR_URL + "/search/marcon", {
    params,
  });
  // getLugares ordena por address; searchLugares no ordena. Mantenemos orden por address.
  if (!address) {
    return [...lugares].sort((a, b) =>
      (a.address ?? "").localeCompare(b.address ?? ""),
    );
  }
  return lugares;
}

export function useLugares(address = "") {
  return useQuery({
    queryKey: queryKeys.lugares.list(address),
    queryFn: () => fetchLugares(address),
  });
}

export function useLugar(id: string) {
  const lugares = useLugares();
  const lugar = lugares.data?.find((item) => item.id === id) ?? null;
  return { ...lugares, lugar };
}

export function useCreateLugar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<Lugar>(LUGAR_URL, { comunidadId: COMUNIDAD_ID }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.lugares.all }),
  });
}

export function useUpdateLugar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, lugar }: { id: string; lugar: Lugar }) =>
      api.patch<Lugar>(LUGAR_URL + "/" + id, lugar),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.lugares.all }),
  });
}

export function useDeleteLugar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<boolean>(LUGAR_URL + "/" + id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.lugares.all }),
  });
}
