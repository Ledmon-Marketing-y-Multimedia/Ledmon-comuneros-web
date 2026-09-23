"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth/use-auth";

const schema = z.object({
  email: z.string().min(1, "El email es obligatorio").email("Email no válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

type FormValues = z.infer<typeof schema>;

/** Mensaje según el estado que devuelve POST /login. */
function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Email o contraseña incorrectos.";
    if (error.status === 429) {
      return "Demasiados intentos. Espera un minuto e inténtalo de nuevo.";
    }
    if (error.status === 422) return "Revisa los datos introducidos.";
  }

  return "No se ha podido conectar con el servidor. Inténtalo de nuevo.";
}

/**
 * Formulario de acceso. Antes esta pantalla la servía Keycloak (redirección
 * OIDC); ahora las credenciales van contra POST /login de la API.
 *
 * Vive separado de `page.tsx` porque usa `useSearchParams` (el destino tras
 * entrar) y eso obliga a un límite de Suspense.
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setFormError(null);

    try {
      await login(values.email, values.password);
    } catch (error) {
      setFormError(errorMessage(error));

      return;
    }

    // Destino: la ruta que pidió el guard, o el home.
    const next = searchParams.get("next");
    router.replace(next && next.startsWith("/") ? next : "/home");
  };

  return (
    <div className="flex flex-auto items-center justify-center p-6">
      <div className="w-full max-w-100 rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <Image
          src="/assets/images/logo.png"
          alt="Comunidad de Montes de Marcón"
          width={220}
          height={60}
          priority
          className="mx-auto w-48"
        />

        <h1 className="mt-8 text-2xl font-semibold">Iniciar sesión</h1>
        <p className="mt-1 text-secondary">
          Accede con tu email y tu contraseña.
        </p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <label className="flex flex-col gap-1">
            <span className="text-secondary">Email</span>
            <input
              type="email"
              autoComplete="username"
              autoFocus
              {...register("email")}
              className="rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
            />
            {errors.email && (
              <span className="text-sm text-warn-600">{errors.email.message}</span>
            )}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-secondary">Contraseña</span>
            <input
              type="password"
              autoComplete="current-password"
              {...register("password")}
              className="rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
            />
            {errors.password && (
              <span className="text-sm text-warn-600">
                {errors.password.message}
              </span>
            )}
          </label>

          {formError && (
            <p role="alert" className="text-sm font-medium text-warn-600">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 rounded-md bg-primary px-4 py-2.5 font-medium text-white hover:bg-primary-600 disabled:opacity-60"
          >
            {isSubmitting ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-sm text-secondary">
          ¿Has olvidado tu contraseña? Ponte en contacto con la administración de
          la comunidad para que te asignen una nueva.
        </p>
      </div>
    </div>
  );
}
