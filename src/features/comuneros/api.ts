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

/**
 * Comunero por id contra `GET /comunero/{id}`.
 *
 * El Angular lo resolvía desde la lista en memoria, pero el listado son los
 * HOLDER de la comunidad **a través de su dirección** (`lugar.comunidad`): un
 * comunero sin dirección asignada no sale, y el recién creado tampoco hasta que
 * refresca. Con el endpoint por id el detalle no depende del listado — y además
 * trae las asistencias, que la búsqueda no incluye.
 */
export function useComunero(id: string) {
  const query = useQuery({
    queryKey: queryKeys.comuneros.detail(id),
    queryFn: () => api.get<Comunero>(COMUNEROS_URL + "/" + id),
    enabled: id !== "",
  });

  return { ...query, comunero: query.data ?? null };
}

export function useCreateComunero() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (comunero: NewComunero) =>
      api.post<Comunero>(COMUNEROS_URL, comunero),
    onSuccess: (creado) => {
      // El detalle se abre inmediatamente: se deja a mano para que pinte sin
      // esperar a la petición (como el `_comuneros.next([nuevo, ...])` del
      // Angular).
      qc.setQueryData(queryKeys.comuneros.detail(creado.id), creado);
      void qc.invalidateQueries({ queryKey: queryKeys.comuneros.all });
    },
  });
}

export function useUpdateComunero() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comunero }: { id: string; comunero: Comunero }) =>
      api.patch<Comunero>(COMUNEROS_URL + "/" + id, comunero),
    onSuccess: (actualizado, { id }) => {
      qc.setQueryData(queryKeys.comuneros.detail(id), actualizado);
      void qc.invalidateQueries({ queryKey: queryKeys.comuneros.all });
    },
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
    onSuccess: (actualizado, { id }) => {
      qc.setQueryData(queryKeys.comuneros.detail(id), actualizado);
      void qc.invalidateQueries({ queryKey: queryKeys.comuneros.all });
    },
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
