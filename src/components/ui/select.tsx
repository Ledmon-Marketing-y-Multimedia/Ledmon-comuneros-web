"use client";

import * as RadixSelect from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils";

/**
 * Desplegable de la aplicación, sobre Radix Select.
 *
 * Antes eran `<select>` nativos: la lista de opciones la pinta el sistema
 * operativo y **no se puede estilar** (ni tipografía, ni colores, ni el estado
 * seleccionado). Radix la renderiza en el DOM, así que el desplegable se ve igual
 * en todas partes y a juego con el resto de la interfaz. Misma librería que el
 * Dialog y el DropdownMenu que ya usa la app.
 *
 * Los `<option value="">` de antes (los "Todos", "Elige una dirección…") se
 * respetan: Radix prohíbe el valor vacío en un Item, así que aquí se traduce a un
 * centinela interno y se devuelve como `""` en `onValueChange`. Quien lo usa no
 * se entera.
 */

export interface SelectOption {
  value: string;
  label: string;
}

/** Radix no admite `value=""` en un Item; se sustituye por esto puertas adentro. */
const EMPTY = "__empty__";

const toRadix = (value: string) => (value === "" ? EMPTY : value);
const fromRadix = (value: string) => (value === EMPTY ? "" : value);

export type SelectVariant = "pill" | "field" | "compact";

const TRIGGERS: Record<SelectVariant, string> = {
  /** Cabeceras de listado, a juego con SearchInput. */
  pill: "w-full rounded-full border border-gray-300 bg-white px-4 py-2",
  /** Formularios de los paneles de detalle, a juego con `fieldClass`. */
  field: "w-full border-b border-gray-300 bg-transparent py-2",
  /** Selector de tamaño de página del paginador. */
  compact: "rounded border border-gray-300 px-2 py-1",
};

export function Select({
  value,
  onValueChange,
  options,
  label,
  placeholder,
  variant = "pill",
  className,
  disabled,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  /** Nombre accesible: no hay etiqueta visible dentro del control. */
  label?: string;
  placeholder?: string;
  variant?: SelectVariant;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <RadixSelect.Root
      value={toRadix(value)}
      onValueChange={(next) => {
        // Dentro de un `<form>`, Radix renderiza un `<select>` nativo oculto para
        // que el valor viaje en un envío nativo. Ese select solo conoce las
        // opciones cuando el desplegable está abierto, así que al asignarle un
        // valor que aún no tiene, el navegador lo deja en "" y dispara un `change`
        // que llega aquí: sin este corte, el valor del formulario se machacaba
        // (react-hook-form perdía el estado recién puesto por `reset`).
        //
        // Una elección real nunca trae "": las opciones vacías viajan con el
        // centinela, así que la cadena vacía identifica sin ambigüedad al select
        // oculto.
        if (next === "") return;

        onValueChange(fromRadix(next));
      }}
      disabled={disabled}
    >
      <RadixSelect.Trigger
        aria-label={label}
        className={cn(
          // `overflow-hidden` + el `truncate` de dentro: una etiqueta larga
          // ("Todos los usuarios" en un chip de 176 px) partía en dos líneas y
          // dejaba el control más alto que el buscador de al lado.
          "flex items-center justify-between gap-2 overflow-hidden text-left focus:outline-none focus-visible:border-primary disabled:opacity-50 data-[placeholder]:text-hint",
          TRIGGERS[variant],
          className,
        )}
      >
        <span className="truncate">
          <RadixSelect.Value placeholder={placeholder} />
        </span>
        <RadixSelect.Icon>
          <ChevronDownIcon className="h-4 w-4 shrink-0 text-gray-400" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={4}
          // `--radix-select-trigger-width`: el desplegable copia el ancho del
          // control, como hacía el nativo.
          className="z-99 max-h-72 min-w-(--radix-select-trigger-width) overflow-hidden rounded-lg border bg-card shadow-lg"
        >
          <RadixSelect.Viewport className="p-1">
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={toRadix(option.value)}
                className="flex cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 outline-none data-[highlighted]:bg-gray-100 data-[state=checked]:font-medium"
              >
                {/* El hueco de la marca se reserva siempre (el indicador solo
                    existe en la opción elegida): así el texto de todas queda
                    alineado y la lista no baila al cambiar de opción. */}
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                  <RadixSelect.ItemIndicator>
                    <CheckIcon className="h-4 w-4 text-primary" />
                  </RadixSelect.ItemIndicator>
                </span>
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
