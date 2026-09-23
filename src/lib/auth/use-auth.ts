"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { clearToken, getToken, onTokenChange, setToken } from "@/lib/auth/token-storage";

/** Respuesta de POST /login (contrato LoginToken del api.yml). */
interface LoginResponse {
  accessToken: string;
}

const noopSubscribe = () => () => undefined;

/**
 * `true` cuando React ya ha hidratado en el cliente. Sirve para no decidir
 * "no hay sesión" durante el render del servidor, donde localStorage no existe.
 */
function useIsHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/**
 * Sesión de la aplicación (sustituye a `useAuth` de react-oidc-context).
 *
 * El token se lee del storage con `useSyncExternalStore`, así que cualquier
 * cambio —incluido el de otra pestaña— re-renderiza a quien lo use, sin efectos
 * ni estado duplicado.
 */
export function useAuth() {
  const queryClient = useQueryClient();
  const isHydrated = useIsHydrated();
  const token = useSyncExternalStore(onTokenChange, getToken, () => null);

  /** Inicia sesión y deja el token guardado. Lanza ApiError si falla (401/422/429). */
  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      const { accessToken } = await api.post<LoginResponse>("/login", {
        email,
        password,
      });

      setToken(accessToken);
      // La caché puede traer datos de la sesión anterior.
      queryClient.clear();
    },
    [queryClient],
  );

  /**
   * Cierra sesión: revoca el token en la API (best-effort: si la llamada falla,
   * la sesión local se cierra igual) y limpia token y caché.
   */
  const logout = useCallback(async (): Promise<void> => {
    if (getToken() !== null) {
      await api.post("/logout").catch(() => undefined);
    }

    clearToken();
    queryClient.clear();
  }, [queryClient]);

  return {
    token,
    isAuthenticated: isHydrated && token !== null,
    /** Mientras no se sabe si hay sesión (render de servidor / hidratación). */
    isLoading: !isHydrated,
    login,
    logout,
  };
}
