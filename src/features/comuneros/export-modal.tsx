"use client";

import { useState } from "react";
import { Modal, ModalFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ExportType = "SIMPLE" | "COMPLETE";

/** Modal de exportación de comuneros (portado de export-modal). */
export function ExportModal({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (type: ExportType) => void;
}) {
  const [type, setType] = useState<ExportType | "">("");

  const cardClass = (selected: boolean) =>
    cn(
      "pointer-events-none absolute -inset-px rounded-lg border-2",
      selected ? "border border-indigo-500" : "border-2 border-transparent",
    );

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Exportar comuneros">
      <fieldset className="p-6">
        <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
          <label
            onClick={() => setType("SIMPLE")}
            className="relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none"
          >
            <input type="radio" name="export-type" className="sr-only" />
            <span className="flex flex-1">
              <span className="flex flex-col">
                <span className="block text-sm font-medium text-gray-900">
                  Sencilla
                </span>
                <span className="mt-1 flex items-center text-sm text-gray-500">
                  Nombre, estado y fecha de alta
                </span>
              </span>
            </span>
            <span className={cardClass(type === "SIMPLE")} aria-hidden="true" />
          </label>

          <label
            onClick={() => setType("COMPLETE")}
            className="relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none"
          >
            <input type="radio" name="export-type" className="sr-only" />
            <span className="flex flex-1">
              <span className="flex flex-col">
                <span className="block text-sm font-medium text-gray-900">
                  Completa
                </span>
                <span className="mt-1 flex items-center text-sm text-gray-500">
                  Nombre, DNI, dirección, estado y fecha de alta
                </span>
              </span>
            </span>
            <span
              className={cardClass(type === "COMPLETE")}
              aria-hidden="true"
            />
          </label>
        </div>

        <ModalFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!type}
            onClick={() => {
              if (type) {
                onConfirm(type);
                onOpenChange(false);
              }
            }}
          >
            Exportar
          </Button>
        </ModalFooter>
      </fieldset>
    </Modal>
  );
}
