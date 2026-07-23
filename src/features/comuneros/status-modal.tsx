"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/dialog";

/** Modal "dar de baja comunero" (portado de status-modal). Devuelve {comments}. */
export function StatusModal({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (result: { comments: string }) => void;
}) {
  const [comments, setComments] = useState("");

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Dar de baja comunero"
    >
      <form
        className="flex flex-auto flex-col overflow-y-auto p-6 sm:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          onConfirm({ comments });
          onOpenChange(false);
        }}
      >
        <label className="flex flex-col gap-1">
          <span className="text-secondary">Comentarios</span>
          <input
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
          />
        </label>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="ml-auto rounded-md border px-4 py-2 font-medium hover:bg-gray-100 sm:ml-0"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary-600"
          >
            Dar de baja
          </button>
        </div>
      </form>
    </Modal>
  );
}
