"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

/**
 * Diálogo modal (equivalente a MatDialog). Cabecera con título estilo Fuse
 * (barra primary) y botón de cierre.
 */
/**
 * Pie de acciones de un diálogo (Cancelar + acción principal, a la derecha).
 * Estaba repetido en los cuatro modales, con `rounded` en dos y `rounded-md` en
 * los otros dos.
 */
export function ModalFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mt-4 flex items-center justify-end gap-2", className)}>
      {children}
    </div>
  );
}

export function Modal({
  open,
  onOpenChange,
  title,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-99 bg-black/40" />
        <RadixDialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-99 flex max-h-screen w-full max-w-240 -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg bg-card shadow-xl md:min-w-160 focus:outline-none",
            className,
          )}
        >
          {/* Header */}
          <div className="flex h-16 flex-0 items-center justify-between bg-primary pl-6 pr-3 text-white sm:pl-8 sm:pr-5">
            <RadixDialog.Title className="text-lg font-medium">
              {title}
            </RadixDialog.Title>
            <RadixDialog.Close
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/10"
              aria-label="Cerrar"
            >
              <XMarkIcon className="h-6 w-6" />
            </RadixDialog.Close>
          </div>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
