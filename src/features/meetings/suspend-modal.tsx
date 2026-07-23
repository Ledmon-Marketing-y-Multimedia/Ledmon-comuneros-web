"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/dialog";
import {
  getSuspendedComuneros,
  suspendComuneros,
  COMUNIDAD_ID,
} from "@/features/meetings/api";
import type { Comunero } from "@/types/domain";

type SelectableComunero = Comunero & { selected?: boolean };

/** Modal de suspensión de comuneros (portado de suspend.component). */
export function SuspendModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [comuneros, setComuneros] = useState<SelectableComunero[]>([]);

  useEffect(() => {
    if (open) {
      getSuspendedComuneros(COMUNIDAD_ID).then((res) =>
        setComuneros(res.map((c) => ({ ...c, selected: false }))),
      );
    }
  }, [open]);

  const markAll = () =>
    setComuneros((prev) => prev.map((c) => ({ ...c, selected: !c.selected })));

  const toggle = (id: string) =>
    setComuneros((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c)),
    );

  const hasActive = comuneros.some((c) => c.selected);

  const suspend = () => {
    const selected = comuneros.filter((c) => c.selected);
    suspendComuneros(COMUNIDAD_ID, selected).then((announcement) => {
      router.push("/announcements/" + announcement.id);
      onOpenChange(false);
    });
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Suspender">
      <div className="flex flex-auto flex-col overflow-hidden md:w-240">
        <div className="flex w-full flex-col gap-2 p-4">
          <span className="text-2xl">Comuneros a suspender</span>
          <span className="text-secondary">
            Listado de comuneros que no asistieron a las últimas 3 reuniones o
            más.
          </span>
        </div>

        {comuneros.length > 0 ? (
          <>
            <button
              type="button"
              onClick={markAll}
              className="mx-auto rounded border px-4 py-2 font-medium hover:bg-gray-100"
            >
              Seleccionar todos
            </button>
            <div className="mx-2 mt-2 h-72 space-y-1.5 overflow-auto">
              {comuneros.map((comunero) => (
                <div key={comunero.id} className="group flex items-center">
                  <input
                    type="checkbox"
                    checked={!!comunero.selected}
                    onChange={() => toggle(comunero.id)}
                  />
                  <span className="w-full px-1 py-0.5">
                    {comunero.user?.name}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center">
            <span className="text-xl">No hay comuneros para suspender.</span>
          </div>
        )}

        <div className="mt-4 flex items-center justify-end gap-2 p-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="ml-auto rounded border px-4 py-2 font-medium hover:bg-gray-100 sm:ml-0"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!hasActive}
            onClick={suspend}
            className="rounded bg-primary px-4 py-2 font-medium text-white hover:bg-primary-600 disabled:opacity-50"
          >
            Suspender comuneros
          </button>
        </div>
      </div>
    </Modal>
  );
}
