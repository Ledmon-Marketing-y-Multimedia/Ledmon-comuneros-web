import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/api", () => import("@/test/api-double"));
vi.mock("next/navigation", () => import("@/test/navigation-double"));

import { calls, lastCall, mockRoute, resetApiDouble } from "@/test/api-double";
import { resetNavigation, setLocation } from "@/test/navigation-double";
import { renderWithProviders } from "@/test/harness";
import { chooseOption } from "@/test/select";
import { ComunerosList } from "@/features/comuneros/comuneros-list";
import {
  ComuneroRole,
  ComuneroStatus,
  statusLabel,
  type Comunero,
} from "@/types/domain";

function comunero(name: string, extra: Partial<Comunero> = {}): Comunero {
  return {
    id: name.toLowerCase().replace(/\s/g, "-"),
    user: { id: `u-${name}`, name, dni: "11111111H", phones: [] },
    code: "C1",
    role: ComuneroRole.HOLDER,
    status: ComuneroStatus.ACTIVE,
    lugar: { id: "l1", address: "Rúa 01" },
    ...extra,
  } as Comunero;
}

/**
 * Comportamiento del listado de comuneros. Ojo: este listado NO usa tabla ni
 * paginador (va agrupado por inicial), y es el único con debounce en la
 * búsqueda — dos diferencias que el refactor debe conservar.
 */
describe("ComunerosList", () => {
  beforeEach(() => {
    resetApiDouble();
    resetNavigation();
    setLocation("/comuneros");
  });

  it("agrupa por inicial del nombre", async () => {
    mockRoute("GET", "/comunero/search/marcon", () => [
      comunero("Ana García"),
      comunero("Alba Ruiz"),
      comunero("Luis Pérez"),
    ]);

    renderWithProviders(<ComunerosList />);

    await screen.findByText("Ana García");
    // Dos grupos: A (Ana, Alba) y L (Luis). La cabecera de grupo repite la
    // inicial, y cada fila muestra su avatar con la misma letra.
    expect(screen.getAllByText("A").length).toBe(3);
    expect(screen.getAllByText("L").length).toBe(2);
    expect(screen.getByText("3 comuneros")).toBeInTheDocument();
  });

  it("muestra el estado del comunero y, si el lugar está suspendido, el del lugar", async () => {
    mockRoute("GET", "/comunero/search/marcon", () => [
      comunero("Ana García"),
      comunero("Luis Pérez", {
        lugar: { id: "l2", address: "Rúa 02", status: "SUSPENDED" },
      } as Partial<Comunero>),
    ]);

    renderWithProviders(<ComunerosList />);

    // Ojo: "Alta"/"Baja" también son opciones del filtro de estado, así que se
    // busca dentro de la fila, no en todo el documento.
    const filaAna = (await screen.findByText("Ana García")).closest("a")!;
    const filaLuis = screen.getByText("Luis Pérez").closest("a")!;

    expect(within(filaAna).getByText("Alta")).toBeInTheDocument();
    expect(within(filaLuis).getByText("Suspenso")).toBeInTheDocument();
  });

  it("la búsqueda va con debounce: tres pulsaciones, una sola consulta", async () => {
    mockRoute("GET", "/comunero/search/marcon", () => []);

    renderWithProviders(<ComunerosList />);
    await screen.findByText("No existen comuneros");

    await userEvent.type(screen.getByPlaceholderText("Búsqueda de comuneros"), "ana");

    await waitFor(
      () => {
        expect(lastCall("GET", "/comunero/search/marcon")?.ctx.params).toEqual({
          name: "ana",
        });
      },
      { timeout: 2000 },
    );

    // Sin debounce habría una consulta por pulsación (a, an, ana).
    const consultas = calls.filter(
      (c) => c.path === "/comunero/search/marcon",
    ).length;
    expect(consultas).toBe(2);
  });

  it("el filtro de estado viaja como parámetro", async () => {
    mockRoute("GET", "/comunero/search/marcon", () => []);

    renderWithProviders(<ComunerosList />);
    await screen.findByText("No existen comuneros");

    await chooseOption("Filtrar por estado", statusLabel(ComuneroStatus.UNSUBSCRIBED));

    await waitFor(() => {
      expect(lastCall("GET", "/comunero/search/marcon")?.ctx.params).toEqual({
        status: ComuneroStatus.UNSUBSCRIBED,
      });
    });
  });

  it("enlaza al alta y al detalle de cada comunero", async () => {
    mockRoute("GET", "/comunero/search/marcon", () => [comunero("Ana García")]);

    renderWithProviders(<ComunerosList />);

    const fila = (await screen.findByText("Ana García")).closest("a");
    expect(fila).toHaveAttribute("href", "/comuneros/ana-garcía");
    expect(screen.getByRole("link", { name: /nuevo/i })).toHaveAttribute(
      "href",
      "/comuneros/new",
    );
  });

  it("«Exportar» abre el diálogo de exportación", async () => {
    mockRoute("GET", "/comunero/search/marcon", () => [comunero("Ana García")]);

    renderWithProviders(<ComunerosList />);
    await screen.findByText("Ana García");

    await userEvent.click(screen.getByRole("button", { name: /exportar/i }));

    expect(
      await screen.findByRole("dialog", { name: /exportar comuneros/i }),
    ).toBeInTheDocument();
  });

  it("sin resultados muestra el estado vacío", async () => {
    mockRoute("GET", "/comunero/search/marcon", () => []);

    renderWithProviders(<ComunerosList />);

    expect(await screen.findByText("No existen comuneros")).toBeInTheDocument();
  });
});
