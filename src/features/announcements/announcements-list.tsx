"use client";

import { useState } from "react";
import { PlusIcon } from "@heroicons/react/24/solid";
import { useAnnouncements } from "@/features/announcements/api";
import { ButtonLink } from "@/components/ui/button";
import { ListPageHeader } from "@/components/ui/list-page-header";
import { ListTable } from "@/components/ui/list-table";
import { SearchInput } from "@/components/ui/search-input";
import { usePagination } from "@/lib/use-pagination";

const GRID_COLS =
  "grid-cols-[200px_200px_auto] md:grid-cols-[180px_250px_auto] lg:grid-cols-[300px_250px_auto]";

export function AnnouncementsList() {
  const [search, setSearch] = useState("");

  const { data: announcements = [] } = useAnnouncements(search);
  // Único listado que arranca con 5 por página.
  const pagination = usePagination(announcements, 5);

  return (
    <div className="flex min-w-0 flex-auto flex-col overflow-hidden bg-card sm:absolute sm:inset-0">
      <ListPageHeader
        title="Comunicaciones"
        search={
          <SearchInput
            value={search}
            onValueChange={(value) => {
              setSearch(value);
              pagination.reset();
            }}
            placeholder="Buscar comunicaciones"
          />
        }
      >
        <ButtonLink href="/announcements/new" className="w-full md:w-fit">
          <PlusIcon className="h-5 w-5" />
          <span className="mr-1">Nueva comunicación</span>
        </ButtonLink>
      </ListPageHeader>

      <ListTable
        columns={[
          { label: "Titulo" },
          { label: "Usuario" },
          { label: "Fecha", className: "hidden md:block" },
        ]}
        gridCols={GRID_COLS}
        items={pagination.pageItems}
        rowHref={(announcement) => `/announcements/${announcement.id}`}
        emptyMessage="No existen comunicaciones"
        pagination={pagination}
        renderRow={(announcement) => (
          <>
            <div className="truncate">{announcement.title}</div>
            <div className="truncate">{announcement.user?.name}</div>
            <div className="hidden md:block">
              {announcement.createdAt
                ? new Date(announcement.createdAt).toLocaleDateString("es-ES")
                : ""}
            </div>
          </>
        )}
      />
    </div>
  );
}
