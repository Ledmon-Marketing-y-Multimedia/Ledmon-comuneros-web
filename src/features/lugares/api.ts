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

/**
 * Lugar por id. No hay endpoint GET /lugar/{id} (el contrato heredado no lo
 * tiene): se resuelve contra la lista, y si aún no ha llegado —caso del lugar
 * recién creado, mientras refresca— contra la copia que dejó la creación.
 */
export function useLugar(id: string) {
  const lugares = useLugares();
  const qc = useQueryClient();

  const fromList = lugares.data?.find((item) => item.id === id) ?? null;
  const cached = qc.getQueryData<Lugar>(queryKeys.lugares.detail(id)) ?? null;

  return { ...lugares, lugar: fromList ?? cached };
}

/**
 * Alta de una dirección. El lugar se crea **ya con sus datos** (antes se creaba
 * vacío al pulsar "Nueva dirección" y quedaba una fila en blanco si nadie
 * completaba el formulario).
 *
 * Ojo con el contrato heredado: `POST /lugar` solo guarda los campos escalares y
 * fuerza el estado Alta; los autorizados y un estado distinto se envían después
 * con el PATCH (ver `LugarDetails.onSubmit`).
 */
export function useCreateLugar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lugar: Lugar) =>
      api.post<Lugar>(LUGAR_URL, { ...lugar, comunidadId: COMUNIDAD_ID }),
    onSuccess: (nuevo) => {
      // El detalle se abre en cuanto responde el alta, así que se deja a mano
      // para que el panel pinte sin esperar al refetch (equivale al
      // `_lugares.next([newLugar, ...lugares])` del Angular).
      qc.setQueryData(queryKeys.lugares.detail(nuevo.id), nuevo);
      qc.setQueryData<Lugar[]>(queryKeys.lugares.list(""), (prev) =>
        prev ? [nuevo, ...prev] : [nuevo],
      );
      void qc.invalidateQueries({ queryKey: queryKeys.lugares.all });
    },
  });
}

export function useUpdateLugar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, lugar }: { id: string; lugar: Lugar }) =>
      api.patch<Lugar>(LUGAR_URL + "/" + id, lugar),
    onSuccess: (actualizado, { id }) => {
      qc.setQueryData(queryKeys.lugares.detail(id), actualizado);
      void qc.invalidateQueries({ queryKey: queryKeys.lugares.all });
    },
  });
}

export function useDeleteLugar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<boolean>(LUGAR_URL + "/" + id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.lugares.all }),
  });
}
