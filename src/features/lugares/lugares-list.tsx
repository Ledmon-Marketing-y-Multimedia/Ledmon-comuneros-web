"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { PlusIcon } from "@heroicons/react/24/solid";
import { useLugares } from "@/features/lugares/api";
import { ButtonLink } from "@/components/ui/button";
import { FilterSelect } from "@/components/ui/filter-select";
import { countLabel, ListPageHeader } from "@/components/ui/list-page-header";
import { ListTable } from "@/components/ui/list-table";
import { SearchInput } from "@/components/ui/search-input";
import { StatusBadge } from "@/components/ui/status-badge";
import { usePagination } from "@/lib/use-pagination";

const GRID_COLS =
  "grid-cols-[200px_200px_200px_auto] md:grid-cols-[180px_250px_200px_auto] lg:grid-cols-[300px_250px_200px_auto]";

export function LugaresList() {
  const router = useRouter();
  const pathname = usePathname();
  const selectedId = useMemo(() => {
    const m = pathname.match(/\/lugares\/([^/]+)/);
    return m && m[1] !== "new" ? m[1] : null;
  }, [pathname]);

  const [search, setSearch] = useState("");
  const [zona, setZona] = useState("all");

  const { data: lugares = [] } = useLugares(search);

  const zonas = useMemo(
    () => Array.from(new Set(lugares.map((l) => l.zona).filter(Boolean))),
    [lugares],
  );

  const filtered = useMemo(
    () => (zona === "all" ? lugares : lugares.filter((l) => l.zona === zona)),
    [lugares, zona],
  );

  // El subtítulo cuenta todas las direcciones, no las de la zona filtrada.
  const count = lugares.length;
  const pagination = usePagination(filtered);

  // Atajo Ctrl/Cmd + / para crear dirección (como el fromEvent del Angular).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        router.push("/lugares/new");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-w-0 flex-auto flex-col overflow-hidden bg-card sm:absolute sm:inset-0">
      <ListPageHeader
        title="Direcciones"
        subtitle={countLabel(count, {
          none: "No lugares",
          one: "lugar",
          many: "lugares",
        })}
        search={
          <SearchInput
            value={search}
            onValueChange={(value) => {
              setSearch(value);
              pagination.reset();
            }}
            placeholder="Buscar direcciones"
          />
        }
      >
        <FilterSelect
          value={zona}
          onValueChange={(value) => {
            setZona(value);
            pagination.reset();
          }}
          options={[
            { value: "all", label: "Todos los lugares" },
            ...zonas.map((z) => ({ value: String(z), label: String(z) })),
          ]}
          label="Filtrar por lugar"
          className="sm:w-44"
        />

        <ButtonLink href="/lugares/new" className="w-full md:w-fit">
          <PlusIcon className="h-5 w-5" />
          <span className="mr-1">Nueva dirección</span>
        </ButtonLink>
      </ListPageHeader>

      <ListTable
        columns={[
          { label: "Titulo" },
          { label: "Estado", className: "md:block" },
          { label: "Población", className: "md:block" },
          { label: "Código postal", className: "md:block" },
        ]}
        gridCols={GRID_COLS}
        items={pagination.pageItems}
        rowHref={(lugar) => `/lugares/${lugar.id}`}
        isSelected={(lugar) => selectedId === lugar.id}
        emptyMessage="No existen lugares"
        pagination={pagination}
        renderRow={(lugar) => (
          <>
            <div className="truncate">{lugar.address}</div>
            <div className="truncate">
              <StatusBadge status={lugar.status} />
            </div>
            <div className="truncate">{lugar.poblacion}</div>
            <div className="truncate">{lugar.cp}</div>
          </>
        )}
      />
    </div>
  );
}
