"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  PlusIcon,
} from "@heroicons/react/24/solid";
import { useComuneros } from "@/features/comuneros/api";
import { ExportModal, type ExportType } from "@/features/comuneros/export-modal";
import { pdfService } from "@/lib/pdf/pdf-service";
import { ComuneroStatus, statusLabel } from "@/types/domain";
import { cn } from "@/lib/utils";

const STATUSES = Object.values(ComuneroStatus);

export function ComunerosList() {
  const pathname = usePathname();
  const selectedId = useMemo(() => {
    const m = pathname.match(/\/comuneros\/([^/]+)/);
    return m && m[1] !== "new" ? m[1] : null;
  }, [pathname]);

  const [inputValue, setInputValue] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [exportOpen, setExportOpen] = useState(false);

  // Debounce de 500ms sobre la búsqueda (como el debounceTime del Angular).
  useEffect(() => {
    const t = setTimeout(() => setSearch(inputValue), 500);
    return () => clearTimeout(t);
  }, [inputValue]);

  const { data: comuneros = [] } = useComuneros(search, status);
  const count = comuneros.length;

  const handleExport = (type: ExportType) => {
    if (type === "SIMPLE") {
      void pdfService.comuneroSimpleList(comuneros);
    } else {
      void pdfService.comuneroCompleteList(comuneros);
    }
  };

  return (
    <div className="absolute inset-0 flex min-w-0 flex-col overflow-hidden">
      <div className="flex h-full flex-auto flex-col bg-card">
        <div className="flex-auto overflow-y-auto">
          {/* Header */}
          <div className="flex flex-auto flex-col justify-between border-b px-6 py-8 sm:flex-row md:flex-col md:px-8">
            <div>
              <div className="text-4xl font-extrabold leading-none tracking-tight">
                Comuneros
              </div>
              <div className="ml-0.5 font-medium text-secondary">
                {count > 0 && <span>{count} </span>}
                {count === 0
                  ? "No comuneros"
                  : count === 1
                    ? "comunero"
                    : "comuneros"}
              </div>
            </div>

            {/* Acciones */}
            <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-0 md:mt-4">
              {/* Búsqueda */}
              <div className="min-w-50 flex-auto">
                <div className="flex items-center rounded-full border border-gray-300 bg-white px-3">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  <input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    autoComplete="off"
                    placeholder="Búsqueda de comuneros"
                    className="w-full bg-transparent px-2 py-2 focus:outline-none"
                  />
                </div>
              </div>

              {/* Filtro de estado */}
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-full border border-gray-300 bg-white px-3 py-2 focus:outline-none sm:w-44 md:ml-4"
              >
                <option value="">Todos</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setExportOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded bg-primary px-4 py-2 font-medium text-white hover:bg-primary-600 md:ml-4 md:w-fit"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                <span className="mr-1">Exportar</span>
              </button>

              <Link
                href="/comuneros/new"
                className="flex w-full items-center justify-center gap-2 rounded bg-primary px-4 py-2 font-medium text-white hover:bg-primary-600 md:ml-4 md:w-fit"
              >
                <PlusIcon className="h-5 w-5" />
                <span className="mr-1">Nuevo</span>
              </Link>
            </div>
          </div>

          {/* Lista */}
          <div className="relative">
            {count > 0 ? (
              comuneros.map((comunero, i) => {
                const initial = comunero.user?.name?.charAt(0) ?? "";
                const prevInitial =
                  i > 0 ? comuneros[i - 1].user?.name?.charAt(0) ?? "" : null;
                const showGroup = i === 0 || initial !== prevInitial;
                const isSelected = selectedId === comunero.id;
                const suspended = comunero.lugar?.status === "SUSPENDED";

                return (
                  <div key={comunero.id || i}>
                    {showGroup && (
                      <div className="sticky top-0 z-10 -mt-px border-b border-t bg-gray-50 px-6 py-1 font-medium uppercase text-secondary md:px-8">
                        <div className="grid grid-cols-6 items-center">
                          <div className="col-span-3">
                            <span>{initial}</span>
                          </div>
                          <span className="col-span-1 ml-4 hidden md:flex">
                            DNI
                          </span>
                          <span className="col-span-1 ml-4 truncate">
                            Código de comunero
                          </span>
                          <span className="col-span-1 ml-4">Estado</span>
                        </div>
                      </div>
                    )}

                    <Link
                      href={`/comuneros/${comunero.id}`}
                      className={cn(
                        "z-20 grid cursor-pointer grid-cols-6 border-b px-6 py-4 md:px-8",
                        isSelected
                          ? "bg-primary-50"
                          : "hover:bg-gray-100",
                      )}
                    >
                      <div className="col-span-3 flex items-center">
                        <div className="flex h-10 w-10 flex-0 items-center justify-center overflow-hidden rounded-full">
                          <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-200 text-lg uppercase text-gray-600">
                            {initial}
                          </div>
                        </div>
                        <div className="ml-4 min-w-0">
                          <div className="truncate font-medium leading-5">
                            {comunero.user?.name}
                          </div>
                          <div className="truncate leading-5 text-secondary">
                            {comunero.lugar?.address}
                          </div>
                        </div>
                      </div>

                      <div className="ml-4 hidden min-w-0 items-center md:flex">
                        <div className="truncate font-medium leading-5">
                          {comunero.user?.dni}
                        </div>
                      </div>

                      <div className="ml-4 flex min-w-0 items-center">
                        <div className="truncate font-medium leading-5">
                          {comunero.code}
                        </div>
                      </div>

                      <div className="ml-4 flex min-w-0 items-center">
                        {(comunero.status || comunero.lugar?.status) && (
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide",
                              comunero.status === ComuneroStatus.UNSUBSCRIBED
                                ? "bg-red-200 text-red-800"
                                : comunero.status === ComuneroStatus.ACTIVE
                                  ? "bg-green-200 text-green-800"
                                  : "",
                            )}
                          >
                            {comunero.status && !suspended && (
                              <span className="whitespace-nowrap leading-relaxed">
                                {statusLabel(comunero.status)}
                              </span>
                            )}
                            {suspended && (
                              <span className="whitespace-nowrap leading-relaxed">
                                {statusLabel(comunero.lugar?.status)}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </Link>
                  </div>
                );
              })
            ) : (
              <div className="border-t p-8 text-center text-4xl font-semibold tracking-tight sm:p-16">
                No existen comuneros
              </div>
            )}
          </div>
        </div>
      </div>

      <ExportModal
        open={exportOpen}
        onOpenChange={setExportOpen}
        onConfirm={handleExport}
      />
    </div>
  );
}
