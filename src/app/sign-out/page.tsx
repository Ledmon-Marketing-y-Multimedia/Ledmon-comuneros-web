"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/use-auth";

/**
 * Cierre de sesión (equivalente a modules/auth/sign-out): revoca el token en la
 * API (POST /logout) y muestra una cuenta atrás antes de volver al login. Antes
 * esto era una redirección al end-session de Keycloak.
 */
export default function SignOutPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [countdown, setCountdown] = useState(5);
  const done = useRef(false);

  useEffect(() => {
    // Efecto de un solo disparo: revocar el token es una acción, no un render.
    if (done.current) return;
    done.current = true;

    void logout();
  }, [logout]);

  useEffect(() => {
    if (countdown <= 0) {
      router.replace("/login");

      return;
    }

    const timer = setTimeout(() => setCountdown((value) => value - 1), 1000);

    return () => clearTimeout(timer);
  }, [countdown, router]);

  return (
    <div className="flex flex-auto items-center justify-center p-16 text-center">
      <div>
        <p className="text-2xl font-semibold">Sesión cerrada</p>
        <p className="mt-2 text-secondary">
          Volverás al inicio de sesión en {countdown}{" "}
          {countdown === 1 ? "segundo" : "segundos"}.
        </p>
      </div>
    </div>
  );
}
