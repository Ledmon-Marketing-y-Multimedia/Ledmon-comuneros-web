"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  MagnifyingGlassIcon,
  XCircleIcon,
  PlusIcon,
} from "@heroicons/react/24/solid";
import { useMeetings } from "@/features/meetings/api";
import { SuspendModal } from "@/features/meetings/suspend-modal";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [5, 10, 25, 100];

export function MeetingsList() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [suspendOpen, setSuspendOpen] = useState(false);

  const { data: meetings = [] } = useMeetings(search);

  const total = meetings.length;
  const start = page * pageSize;
  const pageItems = useMemo(
    () => meetings.slice(start, start + pageSize),
    [meetings, start, pageSize],
  );
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const gridCols =
    "grid-cols-[200px_200px_100px_auto] md:grid-cols-[180px_250px_100px_auto] lg:grid-cols-[300px_250px_100px_auto]";

  return (
    <div className="absolute inset-0 flex min-w-0 flex-col overflow-hidden">
      <div className="h-full flex-auto bg-card">
        <div className="relative flex flex-0 flex-col border-b px-6 py-8 sm:flex-row sm:items-center sm:justify-between md:px-8">
          <div className="text-4xl font-extrabold tracking-tight">Reuniones</div>
          <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-0 md:mt-4">
            <div className="flex items-center rounded-full border border-gray-300 bg-white px-3 md:w-64">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                autoComplete="off"
                placeholder="Buscar reuniones"
                className="w-full bg-transparent px-2 py-2 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setSuspendOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded bg-primary px-4 py-2 font-medium text-white hover:bg-primary-600 md:ml-4 md:w-fit"
            >
              <XCircleIcon className="h-5 w-5" />
              <span className="mr-1">Suspender</span>
            </button>
            <Link
              href="/reuniones/new"
              className="flex w-full items-center justify-center gap-2 rounded bg-primary px-4 py-2 font-medium text-white hover:bg-primary-600 md:ml-4 md:w-fit"
            >
              <PlusIcon className="h-5 w-5" />
              <span className="mr-1">Nueva</span>
            </Link>
          </div>
        </div>

        <div className="flex flex-auto overflow-hidden">
          <div className="flex flex-auto flex-col overflow-hidden sm:overflow-y-auto">
            {pageItems.length > 0 ? (
              <>
                <div className="grid">
                  <div
                    className={cn(
                      "sticky top-0 z-10 grid gap-4 bg-gray-50 px-6 py-4 text-md font-semibold text-secondary shadow md:px-8",
                      gridCols,
                    )}
                  >
                    <div>Titulo</div>
                    <div className="hidden md:block">Fecha</div>
                  </div>

                  {pageItems.map((meeting) => (
                    <Link
                      key={meeting.id}
                      href={`/reuniones/${meeting.id}`}
                      className={cn(
                        "grid cursor-pointer select-none items-center gap-4 border-b px-6 py-3 hover:bg-gray-100 md:px-8",
                        gridCols,
                      )}
                    >
                      <div className="truncate">{meeting.name}</div>
                      <div className="hidden md:block">
                        {meeting.date
                          ? new Date(meeting.date).toLocaleDateString("es-ES")
                          : ""}
                      </div>
                    </Link>
                  ))}
                </div>

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
                No existen reuniones
              </div>
            )}
          </div>
        </div>
      </div>

      <SuspendModal open={suspendOpen} onOpenChange={setSuspendOpen} />
    </div>
  );
}
