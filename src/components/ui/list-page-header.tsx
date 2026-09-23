"use client";

import { cn } from "@/lib/utils";

/**
 * Cabecera de una pantalla de listado: título, recuento y la barra de acciones
 * (buscador, filtro y botones).
 *
 * Las cinco listas la tenían escrita a mano y habían divergido: comuneros ponía
 * las acciones en su propia línea a partir de `md` —con el buscador estirado—,
 * y las otras cuatro las dejaban a la derecha del título con el buscador
 * encogido a 256 px. Se unifica en el patrón de comuneros, que es el que respira
 * cuando hay cuatro controles.
 *
 * El título es un `h1` de verdad (antes eran `div`): es el encabezado de la
 * página, y así los lectores de pantalla —y los tests— pueden encontrarlo.
 */
export function ListPageHeader({
  title,
  subtitle,
  search,
  className,
  children,
}: {
  title: string;
  /** Recuento u otra línea bajo el título. Reuniones y comunicaciones no lo usan. */
  subtitle?: string;
  /** El buscador. Va aparte porque es el único que se estira. */
  search?: React.ReactNode;
  className?: string;
  /** Filtros y botones, en el orden en que se quieren ver. */
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-0 flex-col justify-between border-b px-6 py-8 sm:flex-row md:flex-col md:px-8",
        className,
      )}
    >
      <div>
        <h1 className="text-4xl font-extrabold leading-none tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <div className="ml-0.5 mt-1 font-medium text-secondary">{subtitle}</div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-0 md:mt-4 md:gap-4">
        {search && <div className="min-w-50 flex-auto">{search}</div>}
        {children}
      </div>
    </div>
  );
}

/**
 * Texto del recuento: «4 usuarios», «1 usuario», «Sin usuarios».
 *
 * Cada listado trae sus palabras (los tres que lo muestran no coinciden: "No
 * lugares", "No comuneros", "Sin usuarios"), pero el armazón —número delante,
 * singular con uno, frase propia con cero— era el mismo copiado tres veces.
 */
export function countLabel(
  count: number,
  { none, one, many }: { none: string; one: string; many: string },
): string {
  if (count === 0) return none;
  if (count === 1) return `${count} ${one}`;

  return `${count} ${many}`;
}
