"use client";

/* eslint-disable @next/next/no-img-element */
// La portada es una imagen estática del propio `public/`: `next/image` aquí solo
// añadiría el optimizador para nada (es el mismo criterio que traía el panel de
// comunero, de donde sale este componente).

import Link from "next/link";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Piezas de los paneles de detalle (comunero y dirección). Cada panel las tenía
 * escritas dos veces —una para ver y otra para editar—, así que la portada
 * estaba copiada cuatro veces, el avatar tres y la fila "icono + dato" once.
 */

/** Portada con la foto de Marcón y la salida del panel. */
export function DetailCover({ closeHref }: { closeHref: string }) {
  return (
    <div className="relative h-40 w-full bg-gray-200 px-8 sm:h-48 sm:px-12">
      <img
        className="absolute inset-0 h-full w-full object-cover opacity-60"
        src="/assets/images/marcon_desde_salgueiral.jpg"
        alt=""
      />
      <div className="mx-auto flex w-full max-w-3xl items-center justify-end pt-6">
        <Link
          href={closeHref}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10"
          aria-label="Cerrar"
        >
          <XMarkIcon className="h-6 w-6" />
        </Link>
      </div>
    </div>
  );
}

/**
 * Círculo con la inicial, montado sobre la portada, y las acciones del panel a
 * su derecha (Editar, Tarjeta, Dar de baja…).
 */
export function DetailAvatar({
  initial,
  actions,
}: {
  initial: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="-mt-16 flex flex-auto items-end">
      <div className="ring-bg-card flex h-32 w-32 items-center justify-center overflow-hidden rounded-full ring-4">
        <div className="flex h-full w-full items-center justify-center rounded bg-gray-200 text-8xl font-bold uppercase leading-none text-gray-600">
          {initial}
        </div>
      </div>
      {actions && (
        <div className="mb-1 ml-auto flex items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

/**
 * Fila de la vista: icono a la izquierda y el dato. Con `href` la fila entera
 * navega (la dirección del comunero, el titular de la dirección).
 */
export function InfoRow({
  icon,
  href,
  align = "center",
  bodyClassName,
  children,
}: {
  icon: React.ReactNode;
  href?: string;
  /** `top` no centra el icono: lo usa la lista de teléfonos, de varias líneas. */
  align?: "center" | "top";
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  const rowClass = cn("flex", align === "center" && "sm:items-center");
  const body = (
    <>
      {icon}
      <div className={cn("ml-6", bodyClassName ?? "leading-6")}>{children}</div>
    </>
  );

  return href ? (
    <Link href={href} className={rowClass}>
      {body}
    </Link>
  ) : (
    <div className={rowClass}>{body}</div>
  );
}

/**
 * Pie del formulario de edición: la acción destructiva a la izquierda (si la
 * hay) y Cancelar / Guardar a la derecha.
 */
export function FormActions({
  onCancel,
  saveDisabled,
  children,
}: {
  onCancel: () => void;
  saveDisabled?: boolean;
  /** Acciones destructivas, alineadas a la izquierda. */
  children?: React.ReactNode;
}) {
  return (
    <div className="-mx-6 mt-10 flex items-center border-t bg-gray-50 py-4 pl-1 pr-4 sm:-mx-12 sm:pl-7 sm:pr-12">
      {children}
      <Button variant="ghost" onClick={onCancel} className="ml-auto">
        Cancelar
      </Button>
      <Button type="submit" disabled={saveDisabled} className="ml-2">
        Guardar
      </Button>
    </div>
  );
}
