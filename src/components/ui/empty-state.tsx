"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * "No existen X" al final de un listado (4 copias).
 */
export function EmptyState({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-t p-8 text-center text-4xl font-semibold tracking-tight sm:p-16",
        className,
      )}
    >
      {message}
    </div>
  );
}

/**
 * Panel de un detalle que no se puede mostrar: cargando, o no encontrado con su
 * salida. Nació de escribir dos veces el mismo "No se encuentra…" en direcciones
 * y comuneros.
 */
export function DetailPlaceholder({
  title,
  description,
  backHref,
  backLabel = "Volver al listado",
}: {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-16 text-center">
      <p className={backHref ? "text-xl font-semibold" : "text-secondary"}>
        {title}
      </p>
      {description && <p className="text-secondary">{description}</p>}
      {backHref && (
        <Link
          href={backHref}
          className="rounded border px-4 py-2 font-medium hover:bg-gray-100"
        >
          {backLabel}
        </Link>
      )}
    </div>
  );
}
