"use client";

import { cn } from "@/lib/utils";

/**
 * Drawer maestro-detalle (equivalente al mat-drawer position=end de Fuse).
 * Panel deslizante a la derecha sobre la lista, con backdrop que cierra.
 */
export function DetailDrawer({
  onClose,
  children,
  className,
}: {
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="fixed inset-0 z-90 print:static print:z-auto">
      <div
        className="absolute inset-0 bg-black/40 print:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "absolute inset-y-0 right-0 w-full overflow-y-auto bg-card shadow-xl md:w-160 print:static print:w-full print:shadow-none",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
