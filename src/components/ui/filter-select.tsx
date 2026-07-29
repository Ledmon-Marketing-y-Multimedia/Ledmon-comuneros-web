"use client";

import { Select, type SelectOption } from "@/components/ui/select";

/**
 * Desplegable redondeado de las cabeceras de listado, el que acompaña al
 * buscador (zona en direcciones, estado en comuneros, permisos en usuarios).
 *
 * Es la variante `pill` de `Select`. Antes envolvía un `<select>` nativo y las
 * opciones se pasaban como `<option>`; ahora van en `options`, porque la lista la
 * pinta Radix y no el sistema operativo.
 */
export function FilterSelect({
  value,
  onValueChange,
  options,
  label,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  /**
   * Nombre accesible del desplegable. No hay etiqueta visible (el diseño es un
   * chip junto al buscador), así que sin esto un lector de pantalla solo anuncia
   * "lista", y en una pantalla con paginador hay dos controles indistinguibles.
   */
  label?: string;
  className?: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      options={options}
      label={label}
      variant="pill"
      className={className}
    />
  );
}
