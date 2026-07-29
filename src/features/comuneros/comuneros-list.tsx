"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowDownTrayIcon, PlusIcon } from "@heroicons/react/24/solid";
import { useComuneros } from "@/features/comuneros/api";
import { ExportModal, type ExportType } from "@/features/comuneros/export-modal";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterSelect } from "@/components/ui/filter-select";
import { SearchInput } from "@/components/ui/search-input";
import { StatusBadge } from "@/components/ui/status-badge";
import { pdfService } from "@/lib/pdf/pdf-service";
import { useDebouncedValue } from "@/lib/use-debounced-value";
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
  const [status, setStatus] = useState("");
  const [exportOpen, setExportOpen] = useState(false);

  // Búsqueda con retardo (el debounceTime del Angular). Es el único listado que
  // lo tiene.
  const search = useDebouncedValue(inputValue);

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
                <SearchInput
                  value={inputValue}
                  onValueChange={setInputValue}
                  placeholder="Búsqueda de comuneros"
                />
              </div>

              {/* Filtro de estado */}
              <FilterSelect
                value={status}
                onValueChange={setStatus}
                options={[
                  { value: "", label: "Todos" },
                  ...STATUSES.map((s) => ({ value: s, label: statusLabel(s) })),
                ]}
                label="Filtrar por estado"
                className="sm:w-44 md:ml-4"
              />

              <Button
                onClick={() => setExportOpen(true)}
                className="w-full md:ml-4 md:w-fit"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                <span className="mr-1">Exportar</span>
              </Button>

              <ButtonLink href="/comuneros/new" className="w-full md:ml-4 md:w-fit">
                <PlusIcon className="h-5 w-5" />
                <span className="mr-1">Nuevo</span>
              </ButtonLink>
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
                        // Cada fila va envuelta en su propio div (por la cabecera
                        // de grupo), así que `last:` no sirve: la última se marca
                        // a mano para no doblar la línea con el fin del listado.
                        i === comuneros.length - 1 && "border-b-0",
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
                        {/* Si el lugar está suspendido manda su estado. */}
                        <StatusBadge
                          status={
                            suspended ? comunero.lugar?.status : comunero.status
                          }
                        />
                      </div>
                    </Link>
                  </div>
                );
              })
            ) : (
              <EmptyState message="No existen comuneros" />
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
