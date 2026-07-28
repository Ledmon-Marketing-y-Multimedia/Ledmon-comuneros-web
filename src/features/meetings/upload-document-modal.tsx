"use client";

import { useRef, useState } from "react";
import { Modal, ModalFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/components/ui/field-row";

/** Modal de subida de documento (portado de upload-document). Devuelve {type,file}. */
export function UploadDocumentModal({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (result: { type: string; file: File }) => void;
}) {
  const [type, setType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const valid = type !== "" && file !== null;

  const save = () => {
    if (file) {
      onConfirm({ type, file });
      onOpenChange(false);
      setType("");
      setFile(null);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Nuevo documento">
      <form
        className="flex flex-auto flex-col overflow-y-auto p-6 sm:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <label className="flex flex-col gap-1">
          <span className="text-secondary">Título del documento</span>
          <input
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={fieldClass}
          />
        </label>

        <div className="col-span-full mt-4">
          <label className="block text-[14px] font-medium leading-6 text-gray-900">
            Archivo
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 flex cursor-pointer justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10"
          >
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-300"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="mt-4 flex justify-center text-md leading-6 text-gray-600">
                <span className="font-semibold text-indigo-600 hover:text-indigo-500">
                  Click para subir archivo
                </span>
                <input
                  ref={fileInputRef}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  type="file"
                  className="sr-only invisible"
                />
              </div>
              <p className="text-sm leading-5 text-gray-600">{file?.name}</p>
            </div>
          </div>
        </div>

        <ModalFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!valid}>
            Subir archivo
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
