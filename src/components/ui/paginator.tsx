"use client";

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
    <select
      value={pageSize}
      onChange={(event) => setPageSize(Number(event.target.value))}
      className="rounded border border-gray-300 px-2 py-1"
    >
      {options.map((size) => (
        <option key={size} value={size}>
          {size}
        </option>
      ))}
    </select>
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
        <label className="flex items-center gap-2 text-secondary">
          Items por página:
          {sizeSelect}
        </label>
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
