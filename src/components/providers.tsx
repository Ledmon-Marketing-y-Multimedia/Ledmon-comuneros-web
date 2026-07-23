"use client";

import { useEffect, useState } from "react";
import { AuthProvider } from "react-oidc-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { UserManager, User } from "oidc-client-ts";
import { getUserManager } from "@/lib/auth/oidc";
import { SplashScreen } from "@/components/splash-screen";
import { ConfirmationProvider } from "@/components/ui/confirmation";

/**
 * Tras procesar el callback OIDC: limpia code/state de la URL y, si se guardó
 * una URL de destino en `state`, navega hacia ella (equivalente al manejo de
 * `state` en runInitialLoginSequence del Angular).
 */
const onSigninCallback = (user: User | undefined): void => {
  const target = typeof user?.state === "string" ? user.state : undefined;
  window.history.replaceState({}, document.title, window.location.pathname);
  if (target && target !== "/" && target !== window.location.pathname) {
    window.location.replace(target);
  }
};

/**
 * Envuelve la app en el AuthProvider de react-oidc-context usando el
 * UserManager singleton. Se monta solo en cliente (OIDC usa window).
 */
function OidcGate({ children }: { children: React.ReactNode }) {
  const [manager, setManager] = useState<UserManager>();

  useEffect(() => {
    // El UserManager es un sistema externo que solo existe en cliente.
    const um = getUserManager();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (um) setManager(um);
  }, []);

  if (!manager) {
    return <SplashScreen />;
  }

  return (
    <AuthProvider userManager={manager} onSigninCallback={onSigninCallback}>
      {children}
    </AuthProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 30_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <OidcGate>
        <ConfirmationProvider>{children}</ConfirmationProvider>
      </OidcGate>
    </QueryClientProvider>
  );
}
