"use client";

import { useCallback, useMemo, useState } from "react";

/** Tamaños de página de los listados (el `pageSizeOptions` del mat-paginator). */
export const PAGE_SIZE_OPTIONS = [5, 10, 25, 100];

export interface Pagination<T> {
  page: number;
  pageSize: number;
  /** Índice (base 0) del primer elemento de la página actual. */
  start: number;
  /** Elementos totales, ya filtrados. */
  total: number;
  pageCount: number;
  /** Elementos de la página actual. */
  pageItems: T[];
  /** Va a una página, acotando a las que existen. */
  goTo: (page: number) => void;
  /** Cambia el tamaño de página y vuelve a la primera. */
  setPageSize: (size: number) => void;
  /** Vuelve a la primera página: al buscar o cambiar un filtro. */
  reset: () => void;
}

/**
 * Paginación en cliente de una lista ya cargada, que es como paginan todos los
 * listados (la API devuelve la colección completa). Antes cada uno repetía el
 * mismo `page`/`pageSize`, el `slice`, el `pageCount` y el `setPage(0)` a mano
 * en la búsqueda y en el selector de tamaño —y el de comunicaciones se dejaba
 * el `useMemo`—.
 */
export function usePagination<T>(
  items: T[],
  initialPageSize = 10,
): Pagination<T> {
  const [page, setPage] = useState(0);
  const [pageSize, setSize] = useState(initialPageSize);

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const start = page * pageSize;

  const pageItems = useMemo(
    () => items.slice(start, start + pageSize),
    [items, start, pageSize],
  );

  const goTo = useCallback(
    (next: number) => setPage(Math.min(Math.max(0, next), pageCount - 1)),
    [pageCount],
  );

  const setPageSize = useCallback((size: number) => {
    setSize(size);
    setPage(0);
  }, []);

  const reset = useCallback(() => setPage(0), []);

  return {
    page,
    pageSize,
    start,
    total,
    pageCount,
    pageItems,
    goTo,
    setPageSize,
    reset,
  };
}
