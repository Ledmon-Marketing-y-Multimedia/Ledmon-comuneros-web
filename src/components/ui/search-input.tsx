"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils";

/**
 * Buscador redondeado de las cabeceras de listado (5 copias antes de esto).
 *
 * El debounce **no** va aquí: hoy solo lo tiene el listado de comuneros y es una
 * diferencia real de comportamiento; quien lo necesite usa `useDebouncedValue`.
 */
export function SearchInput({
  value,
  onValueChange,
  placeholder,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center rounded-full border border-gray-300 bg-white px-3",
        className,
      )}
    >
      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
      <input
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        autoComplete="off"
        placeholder={placeholder}
        className="w-full bg-transparent px-2 py-2 focus:outline-none"
      />
    </div>
  );
}
