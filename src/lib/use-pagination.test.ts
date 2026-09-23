import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { usePagination } from "@/lib/use-pagination";

/**
 * La paginación la comparten ahora los tres listados y la tabla de asistencia,
 * así que sus reglas se fijan aquí y no a través de una pantalla concreta.
 */
describe("usePagination", () => {
  const items = Array.from({ length: 23 }, (_, i) => ({ id: String(i) }));

  it("corta la primera página y calcula el total", () => {
    const { result } = renderHook(() => usePagination(items));

    expect(result.current.pageItems).toHaveLength(10);
    expect(result.current.pageItems[0].id).toBe("0");
    expect(result.current.total).toBe(23);
    expect(result.current.pageCount).toBe(3);
    expect(result.current.start).toBe(0);
  });

  it("no pasa de la última página ni baja de la primera", () => {
    const { result } = renderHook(() => usePagination(items));

    act(() => result.current.goTo(99));
    expect(result.current.page).toBe(2);
    // Última página incompleta: 23 elementos, 10 por página.
    expect(result.current.pageItems).toHaveLength(3);

    act(() => result.current.goTo(-5));
    expect(result.current.page).toBe(0);
  });

  it("cambiar el tamaño de página vuelve a la primera", () => {
    const { result } = renderHook(() => usePagination(items));

    act(() => result.current.goTo(2));
    act(() => result.current.setPageSize(5));

    expect(result.current.page).toBe(0);
    expect(result.current.pageItems).toHaveLength(5);
    expect(result.current.pageCount).toBe(5);
  });

  it("reset() vuelve a la primera página (al buscar o filtrar)", () => {
    const { result } = renderHook(() => usePagination(items, 5));

    act(() => result.current.goTo(3));
    expect(result.current.start).toBe(15);

    act(() => result.current.reset());
    expect(result.current.page).toBe(0);
  });

  it("con la lista vacía deja una página y ningún elemento", () => {
    const { result } = renderHook(() => usePagination([]));

    expect(result.current.pageItems).toEqual([]);
    expect(result.current.pageCount).toBe(1);
    expect(result.current.total).toBe(0);
  });
});
