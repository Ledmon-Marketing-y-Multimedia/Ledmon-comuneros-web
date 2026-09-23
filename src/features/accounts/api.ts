"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { Account } from "@/types/domain";

const ACCOUNT_URL = "/account";

/** Campos que el panel envía en un alta. */
export interface NewAccount {
  name: string;
  email: string;
  password: string;
  isAdmin: boolean;
  active: boolean;
}

/** Campos editables de una cuenta (la contraseña va por su propio endpoint). */
export type AccountChanges = Partial<Pick<Account, "name" | "email" | "isAdmin" | "active">>;

export function useAccounts() {
  return useQuery({
    queryKey: queryKeys.accounts.list(),
    queryFn: () => api.get<Account[]>(ACCOUNT_URL),
  });
}

/**
 * Cuenta por id. La API no tiene `GET /account/{id}` (el panel siempre trae la
 * lista completa: son un puñado de filas), así que se resuelve contra ella.
 */
export function useAccount(id: string) {
  const accounts = useAccounts();

  return {
    ...accounts,
    account: accounts.data?.find((item) => item.id === id) ?? null,
  };
}

export function useCreateAccount() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (account: NewAccount) => api.post<Account>(ACCOUNT_URL, account),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.accounts.all }),
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: AccountChanges }) =>
      api.patch<Account>(`${ACCOUNT_URL}/${id}`, changes),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.accounts.all }),
  });
}

/**
 * Reseteo de contraseña por un administrador. La API revoca los tokens de esa
 * cuenta, así que quien la estuviera usando tendrá que volver a entrar.
 */
export function useSetAccountPassword() {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      api.patch<void>(`${ACCOUNT_URL}/${id}/password`, { newPassword }),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`${ACCOUNT_URL}/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.accounts.all }),
  });
}
