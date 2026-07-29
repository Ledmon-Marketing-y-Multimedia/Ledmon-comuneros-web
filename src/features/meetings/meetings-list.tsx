"use client";

import { useState } from "react";
import { XCircleIcon, PlusIcon } from "@heroicons/react/24/solid";
import { useMeetings } from "@/features/meetings/api";
import { SuspendModal } from "@/features/meetings/suspend-modal";
import { Button, ButtonLink } from "@/components/ui/button";
import { ListPageHeader } from "@/components/ui/list-page-header";
import { ListTable } from "@/components/ui/list-table";
import { SearchInput } from "@/components/ui/search-input";
import { usePagination } from "@/lib/use-pagination";

const GRID_COLS =
  "grid-cols-[200px_200px_100px_auto] md:grid-cols-[180px_250px_100px_auto] lg:grid-cols-[300px_250px_100px_auto]";

export function MeetingsList() {
  const [search, setSearch] = useState("");
  const [suspendOpen, setSuspendOpen] = useState(false);

  const { data: meetings = [] } = useMeetings(search);
  const pagination = usePagination(meetings);

  return (
    <div className="absolute inset-0 flex min-w-0 flex-col overflow-hidden">
      <div className="h-full flex-auto bg-card">
        <ListPageHeader
          title="Reuniones"
          search={
            <SearchInput
              value={search}
              onValueChange={(value) => {
                setSearch(value);
                pagination.reset();
              }}
              placeholder="Buscar reuniones"
            />
          }
        >
          <Button onClick={() => setSuspendOpen(true)} className="w-full md:w-fit">
            <XCircleIcon className="h-5 w-5" />
            <span className="mr-1">Suspender</span>
          </Button>
          <ButtonLink href="/reuniones/new" className="w-full md:w-fit">
            <PlusIcon className="h-5 w-5" />
            <span className="mr-1">Nueva</span>
          </ButtonLink>
        </ListPageHeader>

        <ListTable
          columns={[
            { label: "Titulo" },
            { label: "Fecha", className: "hidden md:block" },
          ]}
          gridCols={GRID_COLS}
          items={pagination.pageItems}
          rowHref={(meeting) => `/reuniones/${meeting.id}`}
          emptyMessage="No existen reuniones"
          pagination={pagination}
          renderRow={(meeting) => (
            <>
              <div className="truncate">{meeting.name}</div>
              <div className="hidden md:block">
                {meeting.date
                  ? new Date(meeting.date).toLocaleDateString("es-ES")
                  : ""}
              </div>
            </>
          )}
        />
      </div>

      <SuspendModal open={suspendOpen} onOpenChange={setSuspendOpen} />
    </div>
  );
}
