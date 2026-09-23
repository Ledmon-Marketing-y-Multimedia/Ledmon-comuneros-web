/**
 * Fecha de reunión ⇄ valor de `<input type="date">`.
 *
 * Las reuniones se guardan a medianoche HORA LOCAL (una del 15/06 en Madrid es
 * `2025-06-14T22:00:00Z`). Pasar por `toISOString()` la convertía a UTC y el
 * formulario enseñaba el día anterior —y lo guardaba así al pulsar Guardar—.
 */
const pad = (n: number) => String(n).padStart(2, "0");

export function toDateInput(d?: Date | string | null): string {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "2025-06-15" → medianoche local de ese día (no la de UTC). */
export function fromDateInput(value: string): Date | undefined {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}
