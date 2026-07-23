"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "react-oidc-context";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { User } from "@/types/domain";

/**
 * Equivalente a AuthService.userCheck(): valida la sesión contra el backend
 * (GET /login/check) y devuelve el usuario. Un 401 lo gestiona el cliente API
 * (logout). Se ejecuta solo cuando hay sesión OIDC válida.
 */
export function useCurrentUser() {
  const auth = useAuth();
  return useQuery({
    queryKey: queryKeys.loginCheck,
    queryFn: () => api.get<User>("/login/check"),
    enabled: auth.isAuthenticated,
    staleTime: 5 * 60_000,
    retry: false,
  });
}
