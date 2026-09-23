"use client";

import { useState } from "react";
import { Modal, ModalFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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

        <ModalFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit">Dar de baja</Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
