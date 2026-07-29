"use client";

import { cn } from "@/lib/utils";

/**
 * Desplegable redondeado de las cabeceras de listado, el que acompaña al
 * buscador (zona en direcciones, estado en comuneros, zona en el destinatario de
 * una comunicación). El ancho lo pone cada pantalla.
 */
export function FilterSelect({
  value,
  onValueChange,
  label,
  className,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  /**
   * Nombre accesible del desplegable. No hay etiqueta visible (el diseño es un
   * chip junto al buscador), así que sin esto un lector de pantalla solo anuncia
   * "lista", y en una pantalla con paginador hay dos `select` indistinguibles.
   */
  label?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
      aria-label={label}
      className={cn(
        "w-full rounded-full border border-gray-300 bg-white px-3 py-2 focus:outline-none",
        className,
      )}
    >
      {children}
    </select>
  );
}
