"use client";

import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { Paginator } from "@/components/ui/paginator";
import type { Pagination } from "@/lib/use-pagination";
import { cn } from "@/lib/utils";

/**
 * Tabla de un listado: cabecera pegada arriba, filas que navegan al detalle,
 * paginador y, si no hay nada, el "No existen X".
 *
 * Comunicaciones, direcciones y reuniones tenían esta misma rejilla copiada, con
 * el `hover` escrito de dos maneras y el pie de página repetido. El listado de
 * comuneros **no** usa esto: agrupa por inicial y su fila lleva avatar y dos
 * líneas, así que no es la misma tabla.
 */

export interface ListColumn {
  label: string;
  className?: string;
}

const HEADER_ROW =
  "sticky top-0 z-10 grid gap-4 bg-gray-50 px-6 py-4 text-md font-semibold text-secondary shadow md:px-8";

const ITEM_ROW =
  "grid cursor-pointer select-none items-center gap-4 border-b px-6 py-3 md:px-8";

export function ListTable<T extends { id?: string }>({
  columns,
  gridCols,
  items,
  rowHref,
  isSelected,
  emptyMessage,
  pagination,
  renderRow,
}: {
  columns: ListColumn[];
  /** Clases `grid-cols-*` de la rejilla; las comparten cabecera y filas. */
  gridCols: string;
  items: T[];
  rowHref: (item: T) => string;
  /** Fila resaltada (el detalle abierto). Sin esto, solo hay `hover`. */
  isSelected?: (item: T) => boolean;
  emptyMessage: string;
  pagination?: Pagination<T>;
  renderRow: (item: T) => React.ReactNode;
}) {
  return (
    <div className="flex flex-auto overflow-hidden">
      <div className="flex flex-auto flex-col overflow-hidden sm:overflow-y-auto">
        {items.length > 0 ? (
          <>
            <div className="grid">
              <div className={cn(HEADER_ROW, gridCols)}>
                {columns.map((column) => (
                  <div key={column.label} className={column.className}>
                    {column.label}
                  </div>
                ))}
              </div>

              {items.map((item, index) => (
                <Link
                  key={item.id ?? index}
                  href={rowHref(item)}
                  className={cn(
                    ITEM_ROW,
                    isSelected?.(item) ? "bg-primary-50" : "hover:bg-gray-100",
                    gridCols,
                  )}
                >
                  {renderRow(item)}
                </Link>
              ))}
            </div>

            {pagination && <Paginator pagination={pagination} />}
          </>
        ) : (
          <EmptyState message={emptyMessage} />
        )}
      </div>
    </div>
  );
}
