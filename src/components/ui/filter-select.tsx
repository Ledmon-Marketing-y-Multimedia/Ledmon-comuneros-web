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
  className,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
      className={cn(
        "w-full rounded-full border border-gray-300 bg-white px-3 py-2 focus:outline-none",
        className,
      )}
    >
      {children}
    </select>
  );
}
