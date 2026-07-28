"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth/use-auth";
import { queryKeys } from "@/lib/query-keys";
import type { User } from "@/types/domain";

/**
 * Equivalente a AuthService.userCheck(): valida la sesión contra el backend
 * (GET /login/check) y devuelve el usuario. Un 401 lo gestiona el cliente API
 * (descarta el token y lleva al login). Solo se ejecuta si hay token.
 */
export function useCurrentUser() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.loginCheck,
    queryFn: () => api.get<User>("/login/check"),
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
    retry: false,
  });
}
