"use client";

import { useEffect, useState } from "react";

/**
 * Valor con retardo (el `debounceTime` del Angular). Lo usa la búsqueda del
 * listado de comuneros para no consultar en cada pulsación.
 */
export function useDebouncedValue<T>(value: T, delay = 500): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
