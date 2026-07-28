"use client";

import { statusLabel } from "@/types/domain";
import { cn } from "@/lib/utils";

/**
 * Chip de estado (Alta / Baja / Suspenso). Estaba repetido en el listado de
 * comuneros, el de direcciones y el detalle de reunión, cada uno con su propio
 * encadenado de ternarios para el color.
 */

export type BadgeTone = "positive" | "negative" | "neutral";

const TONES: Record<BadgeTone, string> = {
  positive: "bg-green-200 text-green-800",
  negative: "bg-red-200 text-red-800",
  neutral: "",
};

const STATUS_TONES: Record<string, BadgeTone> = {
  ACTIVE: "positive",
  UNSUBSCRIBED: "negative",
  SUSPENDED: "negative",
};

/**
 * Clases del chip. Se exporta aparte porque el detalle de reunión usa la misma
 * píldora como **botón** para alternar la asistencia (con sus propias etiquetas,
 * Presente/Ausente), y forzar ahí el StatusBadge sería la abstracción errónea.
 */
export function badgeClass(tone: BadgeTone, className?: string): string {
  return cn(
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide",
    TONES[tone],
    className,
  );
}

export function StatusBadge({
  status,
  className,
}: {
  status?: string;
  className?: string;
}) {
  if (!status) return null;

  return (
    <span className={badgeClass(STATUS_TONES[status] ?? "neutral", className)}>
      <span className="whitespace-nowrap leading-relaxed">
        {statusLabel(status)}
      </span>
    </span>
  );
}
