"use client";

import { cn } from "@/lib/utils";

/**
 * Fila de formulario de los paneles de detalle: etiqueta, icono, campo y error.
 *
 * Estaba duplicada en el detalle de dirección y en el de comunero, y ya había
 * divergido: distinto margen (`mt-4` vs `mt-8`) y el mensaje de error existía
 * solo en uno de los dos. Se unifica en `mt-8` (el del detalle de comunero, que
 * es el que se ve en la app con más campos).
 */
export function FieldRow({
  icon,
  label,
  error,
  className,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  /** Mensaje de validación. Sin él, un campo inválido solo deshabilita Guardar. */
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mt-8", className)}>
      <label className="mb-1 block font-medium text-secondary">{label}</label>
      <div className="flex items-center gap-2">
        {icon && <span className="hidden text-gray-500 sm:block">{icon}</span>}
        <div className="flex-auto">{children}</div>
      </div>
      {error && (
        <p role="alert" className="mt-1 text-sm font-medium text-warn-600">
          {error}
        </p>
      )}
    </div>
  );
}

/** Clases del campo de texto de los formularios de detalle (borde inferior). */
export const fieldClass =
  "w-full border-b border-gray-300 bg-transparent py-2 focus:border-primary focus:outline-none";
