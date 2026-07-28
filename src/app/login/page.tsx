import { Suspense } from "react";
import { LoginForm } from "@/app/login/login-form";
import { SplashScreen } from "@/components/splash-screen";

export const metadata = {
  title: "Iniciar sesión · Comunidad de Montes de Marcón",
};

/** Ruta pública de acceso (queda fuera del grupo (admin), que exige sesión). */
export default function LoginPage() {
  return (
    <Suspense fallback={<SplashScreen />}>
      <LoginForm />
    </Suspense>
  );
}
