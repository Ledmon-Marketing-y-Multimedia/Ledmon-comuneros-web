"use client";

import { SplashScreen } from "@/components/splash-screen";
import { DetailPlaceholder } from "@/components/ui/empty-state";
import { useCurrentUser } from "@/lib/auth/use-current-user";

/**
 * Puerta del panel de usuarios: solo pasan las cuentas con `isAdmin`.
 *
 * Es una comodidad, no la seguridad: la que cuenta la aplica la API (403 del
 * middleware `admin`). Aquí solo se evita que alguien llegue por URL a una
 * pantalla que no va a poder usar. Va **dentro** de AuthGuard (layout de admin),
 * así que llegados aquí ya hay sesión.
 */
export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { data: account, isLoading, isError } = useCurrentUser();

  // Mientras se resuelve quién eres no se decide nada (ni panel ni "sin permiso").
  if (isLoading || (!account && !isError)) {
    return <SplashScreen />;
  }

  if (account?.isAdmin !== true) {
    return (
      <DetailPlaceholder
        title="Esta sección es solo para administradores"
        description="Pide a un administrador que te dé permiso si necesitas gestionar usuarios."
        backHref="/home"
        backLabel="Volver al inicio"
      />
    );
  }

  return <>{children}</>;
}
