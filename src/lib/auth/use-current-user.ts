"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth/use-auth";
import { queryKeys } from "@/lib/query-keys";
import type { CurrentAccount } from "@/types/domain";

/**
 * Equivalente a AuthService.userCheck(): valida la sesión contra el backend
 * (GET /login/check) y devuelve la cuenta. Un 401 lo gestiona el cliente API
 * (descarta el token y lleva al login). Solo se ejecuta si hay token.
 */
export function useCurrentUser() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.loginCheck,
    queryFn: () => api.get<CurrentAccount>("/login/check"),
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

/**
 * `true` solo cuando se sabe que la cuenta es administradora. Mientras la
 * comprobación está en vuelo devuelve `false`: es preferible no ofrecer el panel
 * un instante que ofrecerlo a quien luego recibirá un 403.
 */
export function useIsAdmin(): boolean {
  const { data } = useCurrentUser();

  return data?.isAdmin === true;
}
