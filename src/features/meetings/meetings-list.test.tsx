import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/api", () => import("@/test/api-double"));
vi.mock("next/navigation", () => import("@/test/navigation-double"));

import { lastCall, mockRoute, resetApiDouble } from "@/test/api-double";
import { resetNavigation, setLocation } from "@/test/navigation-double";
import { renderWithProviders } from "@/test/harness";
import { MeetingsList } from "@/features/meetings/meetings-list";
import type { Meeting } from "@/types/domain";

// `date` está declarado como Date en domain.ts pero la API manda una cadena ISO
// (el listado hace `new Date(...)`). El doble imita a la API.
function meeting(n: number): Meeting {
  return {
    id: `m${n}`,
    name: `Asamblea ${String(n).padStart(2, "0")}`,
    date: "2026-03-15T18:00:00Z",
  } as unknown as Meeting;
}

/** Listado de reuniones: paginador de 10 y acceso al diálogo de suspensión. */
describe("MeetingsList", () => {
  beforeEach(() => {
    resetApiDouble();
    resetNavigation();
    setLocation("/reuniones");
  });

  it("lista las reuniones con su fecha y enlaza al detalle", async () => {
    mockRoute("GET", "/meeting/search/marcon", () => [meeting(1)]);

    renderWithProviders(<MeetingsList />);

    const fila = (await screen.findByText("Asamblea 01")).closest("a");
    expect(fila).toHaveAttribute("href", "/reuniones/m1");
    expect(screen.getByText("15/3/2026")).toBeInTheDocument();
  });

  it("pagina de 10 en 10", async () => {
    mockRoute("GET", "/meeting/search/marcon", () =>
      Array.from({ length: 11 }, (_, i) => meeting(i + 1)),
    );

    renderWithProviders(<MeetingsList />);

    expect(await screen.findByText("1 - 10 de 11")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "»" }));

    expect(await screen.findByText("11 - 11 de 11")).toBeInTheDocument();
  });

  it("el buscador consulta con el parámetro `query`", async () => {
    mockRoute("GET", "/meeting/search/marcon", () => [meeting(1)]);

    renderWithProviders(<MeetingsList />);
    await screen.findByText("Asamblea 01");

    await userEvent.type(
      screen.getByPlaceholderText("Buscar reuniones"),
      "asamblea",
    );

    await waitFor(() => {
      expect(lastCall("GET", "/meeting/search/marcon")?.ctx.params).toEqual({
        query: "asamblea",
      });
    });
  });

  it("«Suspender» abre su diálogo", async () => {
    mockRoute("GET", "/meeting/search/marcon", () => [meeting(1)]);
    mockRoute("GET", "/comunidad/a09b25f2-897b-4e33-bac5-d5e34f7245ce/absents", () => []);

    renderWithProviders(<MeetingsList />);
    await screen.findByText("Asamblea 01");

    await userEvent.click(screen.getByRole("button", { name: /suspender/i }));

    expect(
      await screen.findByRole("dialog", { name: /suspender/i }),
    ).toBeInTheDocument();
  });

  it("sin resultados muestra el estado vacío", async () => {
    mockRoute("GET", "/meeting/search/marcon", () => []);

    renderWithProviders(<MeetingsList />);

    expect(await screen.findByText("No existen reuniones")).toBeInTheDocument();
  });
});
