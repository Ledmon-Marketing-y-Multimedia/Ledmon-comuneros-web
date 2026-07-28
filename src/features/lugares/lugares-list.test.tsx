import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/api", () => import("@/test/api-double"));
vi.mock("next/navigation", () => import("@/test/navigation-double"));

import { lastCall, mockRoute, resetApiDouble } from "@/test/api-double";
import { resetNavigation, router, setLocation } from "@/test/navigation-double";
import { renderWithProviders } from "@/test/harness";
import { LugaresList } from "@/features/lugares/lugares-list";
import type { Lugar } from "@/types/domain";
import { LugarStatus } from "@/types/domain";

function lugar(n: number): Lugar {
  return {
    id: `l${n}`,
    address: `Rúa ${String(n).padStart(2, "0")}`,
    poblacion: "Marcón",
    cp: "36158",
    zona: n % 2 === 0 ? "Norte" : "Sur",
    status: LugarStatus.ACTIVE,
  } as Lugar;
}

function withLugares(items: Lugar[]) {
  mockRoute("GET", "/lugar/search/marcon", () => items);
}

/**
 * Comportamiento del listado de direcciones tal y como está hoy. Sirve de red
 * para el refactor DRY (paginador, buscador, tabla y estado vacío salen a
 * componentes compartidos).
 */
describe("LugaresList", () => {
  beforeEach(() => {
    resetApiDouble();
    resetNavigation();
    setLocation("/lugares");
  });

  it("lista las direcciones con su total", async () => {
    withLugares([lugar(1), lugar(2), lugar(3)]);

    renderWithProviders(<LugaresList />);

    expect(await screen.findByText("Rúa 01")).toBeInTheDocument();
    expect(screen.getByText("Rúa 03")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("lugares")).toBeInTheDocument();
  });

  it("pagina de 10 en 10 y el contador refleja el tramo", async () => {
    withLugares(Array.from({ length: 12 }, (_, i) => lugar(i + 1)));

    renderWithProviders(<LugaresList />);

    expect(await screen.findByText("1 - 10 de 12")).toBeInTheDocument();
    expect(screen.queryByText("Rúa 11")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "›" }));

    expect(await screen.findByText("11 - 12 de 12")).toBeInTheDocument();
    expect(screen.getByText("Rúa 11")).toBeInTheDocument();
    expect(screen.queryByText("Rúa 01")).not.toBeInTheDocument();
  });

  it("cambiar el tamaño de página vuelve a la primera", async () => {
    withLugares(Array.from({ length: 12 }, (_, i) => lugar(i + 1)));

    renderWithProviders(<LugaresList />);

    await userEvent.click(await screen.findByRole("button", { name: "»" }));
    expect(await screen.findByText("11 - 12 de 12")).toBeInTheDocument();

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: /items por página/i }),
      "5",
    );

    expect(await screen.findByText("1 - 5 de 12")).toBeInTheDocument();
  });

  it("el buscador consulta a la API con el término", async () => {
    withLugares([lugar(1)]);

    renderWithProviders(<LugaresList />);
    await screen.findByText("Rúa 01");

    await userEvent.type(
      screen.getByPlaceholderText("Buscar direcciones"),
      "nova",
    );

    await waitFor(() => {
      expect(lastCall("GET", "/lugar/search/marcon")?.ctx.params).toEqual({
        address: "nova",
      });
    });
  });

  it("filtra por zona sin volver a llamar a la API", async () => {
    withLugares([lugar(1), lugar(2)]);

    renderWithProviders(<LugaresList />);
    await screen.findByText("Rúa 01");

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "" }),
      "Norte",
    );

    expect(screen.queryByText("Rúa 01")).not.toBeInTheDocument();
    expect(screen.getByText("Rúa 02")).toBeInTheDocument();
  });

  it("sin resultados muestra el estado vacío", async () => {
    withLugares([]);

    renderWithProviders(<LugaresList />);

    expect(await screen.findByText("No existen lugares")).toBeInTheDocument();
  });

  it("resalta la fila abierta en el detalle", async () => {
    withLugares([lugar(1), lugar(2)]);
    setLocation("/lugares/l2");

    renderWithProviders(<LugaresList />);

    const fila = (await screen.findByText("Rúa 02")).closest("a");
    expect(fila).toHaveClass("bg-primary-50");
    expect((await screen.findByText("Rúa 01")).closest("a")).not.toHaveClass(
      "bg-primary-50",
    );
  });

  it("«Nueva dirección» crea el lugar y abre su detalle", async () => {
    withLugares([lugar(1)]);
    mockRoute("POST", "/lugar", () => ({
      id: "nuevo",
      status: LugarStatus.ACTIVE,
    }));

    renderWithProviders(<LugaresList />);
    await screen.findByText("Rúa 01");

    await userEvent.click(
      screen.getByRole("button", { name: /nueva dirección/i }),
    );

    await waitFor(() => {
      expect(lastCall("POST", "/lugar")?.ctx.body).toEqual({
        comunidadId: "a09b25f2-897b-4e33-bac5-d5e34f7245ce",
      });
    });
    expect(router.push).toHaveBeenCalledWith("/lugares/nuevo");
  });
});
