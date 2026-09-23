import { describe, expect, it } from "vitest";
import { fromDateInput, toDateInput } from "@/features/meetings/date-input";

describe("fecha de reunión en el formulario", () => {
  it("abrir y guardar sin tocar no mueve la reunión de día", () => {
    const guardada = fromDateInput("2025-06-15")!;
    expect(toDateInput(guardada.toISOString())).toBe("2025-06-15");
    expect(fromDateInput(toDateInput(guardada.toISOString()))!.getTime()).toBe(guardada.getTime());
  });

  it("una fecha guardada a medianoche local se enseña con su día", () => {
    // Medianoche del 15/06 en la zona del navegador, venga en el formato que venga.
    const medianocheLocal = new Date(2025, 5, 15).toISOString();
    expect(toDateInput(medianocheLocal)).toBe("2025-06-15");
  });

  it("vacío o inválido no rompe", () => {
    expect(toDateInput(null)).toBe("");
    expect(toDateInput("no es fecha")).toBe("");
    expect(fromDateInput("")).toBeUndefined();
  });
});
