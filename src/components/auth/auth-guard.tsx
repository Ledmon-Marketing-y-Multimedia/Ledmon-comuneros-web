"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SplashScreen } from "@/components/ui/splash-screen";
import { useAuth } from "@/lib/auth/use-auth";

/**
 * Equivalente al AuthGuard de Angular: si no hay sesión, lleva a /login
 * conservando la URL de destino en `next`. Mientras se resuelve, muestra el
 * splash (antes esperaba la redirección a Keycloak).
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading || isAuthenticated) return;

    // La query se lee de window (no con useSearchParams) para no obligar a un
    // límite de Suspense en cada layout que use el guard.
    const next = pathname + window.location.search;

    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [isAuthenticated, isLoading, pathname, router]);

  if (!isAuthenticated) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}
