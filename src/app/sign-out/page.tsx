"use client";

import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";

/**
 * Cierre de sesión (equivalente a modules/auth/sign-out): hace signOut contra
 * Keycloak y muestra una cuenta atrás antes de redirigir al login.
 */
export default function SignOutPage() {
  const auth = useAuth();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    void auth.signoutRedirect().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      void auth.signinRedirect();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, auth]);

  return (
    <div className="flex flex-auto items-center justify-center p-16 text-center">
      <div>
        <p className="text-2xl font-semibold">Cerrando sesión…</p>
        <p className="mt-2 text-secondary">
          Serás redirigido en {countdown}{" "}
          {countdown === 1 ? "segundo" : "segundos"}.
        </p>
      </div>
    </div>
  );
}
