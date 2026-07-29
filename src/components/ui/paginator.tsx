"use client";

import { Select } from "@/components/ui/select";
import { PAGE_SIZE_OPTIONS, type Pagination } from "@/lib/use-pagination";
import { cn } from "@/lib/utils";

/**
 * Pie de paginación (el mat-paginator del Angular): tamaño de página, rango y
 * navegación. Eran ~55 líneas idénticas en los listados de comunicaciones,
 * direcciones y reuniones, más la tabla de asistencia de una reunión con menos
 * controles.
 */

function PageButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded px-2 py-1 disabled:opacity-40"
    >
      {label}
    </button>
  );
}

export function Paginator<T>({
  pagination,
  options = PAGE_SIZE_OPTIONS,
  compact = false,
  className,
}: {
  pagination: Pagination<T>;
  options?: number[];
  /**
   * Variante de la tabla de asistencia: sin barra gris, sin etiqueta en el
   * selector, sin rango y solo anterior/siguiente. Es lo que había allí;
   * igualarla a los listados sería un cambio de interfaz, no un refactor.
   */
  compact?: boolean;
  className?: string;
}) {
  const { page, pageSize, start, total, pageCount, goTo, setPageSize } =
    pagination;

  const first = page === 0;
  const last = page >= pageCount - 1;

  const sizeSelect = (
    <Select
      value={String(pageSize)}
      onValueChange={(value) => setPageSize(Number(value))}
      options={options.map((size) => ({ value: String(size), label: String(size) }))}
      label="Items por página"
      variant="compact"
    />
  );

  return (
    <div
      className={cn(
        "flex items-center justify-end gap-4 border-t py-2",
        !compact && "z-10 bg-gray-50 px-6 md:px-8",
        className,
      )}
    >
      {compact ? (
        sizeSelect
      ) : (
        // `div` y no `label`: el control ya no es un `<select>` nativo sino un
        // botón (Radix), y un `<label>` no etiqueta a un botón. El nombre
        // accesible lo pone el `label` que recibe el Select.
        <div className="flex items-center gap-2 text-secondary">
          <span aria-hidden="true">Items por página:</span>
          {sizeSelect}
        </div>
      )}

      {!compact && (
        <span className="text-secondary">
          {total === 0 ? 0 : start + 1} - {Math.min(start + pageSize, total)} de{" "}
          {total}
        </span>
      )}

      <div className="flex items-center gap-1">
        {!compact && (
          <PageButton label="«" disabled={first} onClick={() => goTo(0)} />
        )}
        <PageButton label="‹" disabled={first} onClick={() => goTo(page - 1)} />
        <PageButton label="›" disabled={last} onClick={() => goTo(page + 1)} />
        {!compact && (
          <PageButton
            label="»"
            disabled={last}
            onClick={() => goTo(pageCount - 1)}
          />
        )}
      </div>
    </div>
  );
}
