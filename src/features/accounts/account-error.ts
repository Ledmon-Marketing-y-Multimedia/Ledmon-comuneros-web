import { ApiError } from "@/lib/api";

/**
 * Mensaje para lo que puede responder el CRUD de cuentas.
 *
 * El **409** importa especialmente: son las guardas del backend contra quedarse
 * fuera de casa (degradarse, desactivarse o borrarse a uno mismo, o dejar el
 * sistema sin ningún administrador activo). La API manda el motivo en el cuerpo,
 * así que se muestra ese texto en vez de inventar uno peor.
 */
export function accountErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return apiMessage(error) ?? "La operación dejaría el sistema sin administradores.";
    }

    if (error.status === 422) {
      return apiMessage(error) ?? "Revisa los datos: el email puede estar en uso.";
    }

    if (error.status === 403) {
      return "No tienes permiso para gestionar usuarios.";
    }

    if (error.status === 404) {
      return "Esa cuenta ya no existe.";
    }
  }

  return "No se ha podido completar la operación. Inténtalo de nuevo.";
}

/** Texto que manda la API: `{ message }` de Laravel, o el primero de `errors`. */
function apiMessage(error: ApiError): string | null {
  if (typeof error.body !== "object" || error.body === null) return null;

  const body = error.body as { message?: unknown; errors?: Record<string, unknown> };

  const firstFieldError = Object.values(body.errors ?? {})
    .flatMap((messages) => (Array.isArray(messages) ? messages : []))
    .find((message): message is string => typeof message === "string");

  if (typeof firstFieldError === "string") return firstFieldError;

  return typeof body.message === "string" && body.message !== "" ? body.message : null;
}
