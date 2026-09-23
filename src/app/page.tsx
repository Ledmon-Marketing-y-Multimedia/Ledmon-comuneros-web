"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SplashScreen } from "@/components/ui/splash-screen";
import { useAuth } from "@/lib/auth/use-auth";

/**
 * Raíz: reparte según haya sesión o no (equivalente al redirect '' -> 'home' del
 * Angular). Ya no es el `redirect_uri` de ningún callback OIDC.
 */
export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    router.replace(isAuthenticated ? "/home" : "/login");
  }, [isAuthenticated, isLoading, router]);

  return <SplashScreen />;
}
