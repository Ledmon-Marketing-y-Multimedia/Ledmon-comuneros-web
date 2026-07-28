"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Botón de la aplicación. Antes las mismas clases estaban copiadas 13 veces
 * (primario) y 11 (secundario), con variantes involuntarias (`rounded` vs
 * `rounded-md`, `ml-auto` colado dentro de la clase…).
 *
 * `ButtonLink` es el mismo aspecto sobre un `next/link`: en la app hay botones
 * que en realidad navegan (p. ej. "Nuevo" del listado de comuneros).
 */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-600",
  secondary: "border hover:bg-gray-100",
  ghost: "hover:bg-gray-100",
  danger: "text-warn-600 hover:underline",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded px-4 py-2 font-medium disabled:opacity-50";

export function buttonClass(
  variant: ButtonVariant = "primary",
  className?: string,
): string {
  return cn(BASE, VARIANTS[variant], className);
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={buttonClass(variant, className)} {...props} />
  );
}

type ButtonLinkProps = React.ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
};

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ButtonLinkProps) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}
