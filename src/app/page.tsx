"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "react-oidc-context";
import { AuthGuard } from "@/components/auth/auth-guard";
import { SplashScreen } from "@/components/splash-screen";

/**
 * Raíz. Es también el redirect_uri del callback OIDC; una vez autenticado
 * redirige a /home (equivalente al redirect '' -> 'home' del Angular).
 */
function HomeRedirect() {
  const router = useRouter();
  const auth = useAuth();

  useEffect(() => {
    if (auth.isAuthenticated) {
      router.replace("/home");
    }
  }, [auth.isAuthenticated, router]);

  return <SplashScreen />;
}

export default function RootPage() {
  return (
    <AuthGuard>
      <HomeRedirect />
    </AuthGuard>
  );
}
