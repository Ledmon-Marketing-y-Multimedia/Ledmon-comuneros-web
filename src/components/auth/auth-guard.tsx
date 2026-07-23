"use client";

import { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { SplashScreen } from "@/components/splash-screen";

/**
 * Equivalente al AuthGuard de Angular: si no hay sesión, redirige al login de
 * Keycloak conservando la URL de destino (state). Mientras carga o redirige,
 * muestra el splash.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  useEffect(() => {
    if (
      !auth.isLoading &&
      !auth.isAuthenticated &&
      !auth.activeNavigator &&
      !auth.error
    ) {
      void auth.signinRedirect({
        state: window.location.pathname + window.location.search,
      });
    }
  }, [auth, auth.isLoading, auth.isAuthenticated, auth.activeNavigator, auth.error]);

  if (auth.error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <p className="text-warn-600 font-medium">
          Error de autenticación: {auth.error.message}
        </p>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}
