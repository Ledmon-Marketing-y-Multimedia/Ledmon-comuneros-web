"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/solid";
import { useLugares, useCreateLugar } from "@/features/lugares/api";
import { statusLabel } from "@/types/domain";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [5, 10, 25, 100];

export function LugaresList() {
  const router = useRouter();
  const pathname = usePathname();
  const selectedId = useMemo(() => {
    const m = pathname.match(/\/lugares\/([^/]+)/);
    return m ? m[1] : null;
  }, [pathname]);

  const [search, setSearch] = useState("");
  const [zona, setZona] = useState("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const { data: lugares = [] } = useLugares(search);
  const createMut = useCreateLugar();

  const zonas = useMemo(
    () => Array.from(new Set(lugares.map((l) => l.zona).filter(Boolean))),
    [lugares],
  );

  const filtered = useMemo(
    () => (zona === "all" ? lugares : lugares.filter((l) => l.zona === zona)),
    [lugares, zona],
  );

  const count = lugares.length;
  const total = filtered.length;
  const start = page * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const createLugar = () => {
    createMut.mutate(undefined, {
      onSuccess: (newLugar) => router.push(`/lugares/${newLugar.id}`),
    });
  };

  // Atajo Ctrl/Cmd + / para crear dirección (como el fromEvent del Angular).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        createLugar();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gridCols =
    "grid-cols-[200px_200px_200px_auto] md:grid-cols-[180px_250px_200px_auto] lg:grid-cols-[300px_250px_200px_auto]";

  return (
    <div className="flex min-w-0 flex-auto flex-col overflow-hidden bg-card sm:absolute sm:inset-0">
      {/* Header */}
      <div className="relative flex flex-0 flex-col border-b px-6 py-8 sm:flex-row sm:items-center sm:justify-between md:px-8">
        <div>
          <div className="text-4xl font-extrabold leading-none tracking-tight">
            Direcciones
          </div>
          <div className="ml-0.5 font-medium text-secondary">
            {count > 0 && <span>{count} </span>}
            {count === 0 ? "No lugares" : count === 1 ? "lugar" : "lugares"}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-y-2 sm:mt-0 md:mt-4">
          <div className="flex-auto">
            <div className="flex items-center rounded-full border border-gray-300 bg-white px-3 md:w-64">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                autoComplete="off"
                placeholder="Buscar direcciones"
                className="w-full bg-transparent px-2 py-2 focus:outline-none"
              />
            </div>
          </div>

          <select
            value={zona}
            onChange={(e) => {
              setZona(e.target.value);
              setPage(0);
            }}
            className="w-full rounded-full border border-gray-300 bg-white px-3 py-2 focus:outline-none md:ml-4 md:w-44"
          >
            <option value="all">Todos los lugares</option>
            {zonas.map((z) => (
              <option key={String(z)} value={String(z)}>
                {z}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={createLugar}
            className="flex w-full items-center justify-center gap-2 rounded bg-primary px-4 py-2 font-medium text-white hover:bg-primary-600 md:ml-4 md:w-44"
          >
            <PlusIcon className="h-5 w-5" />
            <span className="mr-1">Nueva dirección</span>
          </button>
        </div>
      </div>

      <div className="flex flex-auto overflow-hidden">
        <div className="flex flex-auto flex-col overflow-hidden sm:overflow-y-auto">
          {pageItems.length > 0 ? (
            <>
              <div className="grid">
                {/* Header fila */}
                <div
                  className={cn(
                    "sticky top-0 z-10 grid gap-4 bg-gray-50 px-6 py-4 text-md font-semibold text-secondary shadow md:px-8",
                    gridCols,
                  )}
                >
                  <div>Titulo</div>
                  <div className="md:block">Estado</div>
                  <div className="md:block">Población</div>
                  <div className="md:block">Código postal</div>
                </div>

                {pageItems.map((lugar) => (
                  <Link
                    key={lugar.id}
                    href={`/lugares/${lugar.id}`}
                    className={cn(
                      "grid cursor-pointer select-none items-center gap-4 border-b px-6 py-3 md:px-8",
                      selectedId === lugar.id
                        ? "bg-primary-50"
                        : "hover:bg-gray-100",
                      gridCols,
                    )}
                  >
                    <div className="truncate">{lugar.address}</div>
                    <div className="truncate">
                      {lugar.status && (
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide",
                            lugar.status === "SUSPENDED"
                              ? "bg-red-200 text-red-800"
                              : lugar.status === "ACTIVE"
                                ? "bg-green-200 text-green-800"
                                : "",
                          )}
                        >
                          <span className="whitespace-nowrap leading-relaxed">
                            {statusLabel(lugar.status)}
                          </span>
                        </span>
                      )}
                    </div>
                    <div className="truncate">{lugar.poblacion}</div>
                    <div className="truncate">{lugar.cp}</div>
                  </Link>
                ))}
              </div>

              {/* Paginador */}
              <div className="z-10 flex items-center justify-end gap-4 border-t bg-gray-50 px-6 py-2 md:px-8">
                <label className="flex items-center gap-2 text-secondary">
                  Items por página:
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(0);
                    }}
                    className="rounded border border-gray-300 px-2 py-1"
                  >
                    {PAGE_SIZE_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <span className="text-secondary">
                  {total === 0 ? 0 : start + 1} -{" "}
                  {Math.min(start + pageSize, total)} de {total}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={page === 0}
                    onClick={() => setPage(0)}
                    className="rounded px-2 py-1 disabled:opacity-40"
                  >
                    «
                  </button>
                  <button
                    type="button"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    className="rounded px-2 py-1 disabled:opacity-40"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    disabled={page >= pageCount - 1}
                    onClick={() =>
                      setPage((p) => Math.min(pageCount - 1, p + 1))
                    }
                    className="rounded px-2 py-1 disabled:opacity-40"
                  >
                    ›
                  </button>
                  <button
                    type="button"
                    disabled={page >= pageCount - 1}
                    onClick={() => setPage(pageCount - 1)}
                    className="rounded px-2 py-1 disabled:opacity-40"
                  >
                    »
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="border-t p-8 text-center text-4xl font-semibold tracking-tight sm:p-16">
              No existen lugares
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
