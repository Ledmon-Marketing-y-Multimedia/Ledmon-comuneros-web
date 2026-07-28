import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/api", () => import("@/test/api-double"));
vi.mock("next/navigation", () => import("@/test/navigation-double"));

import { ApiError, lastCall, mockRoute, resetApiDouble } from "@/test/api-double";
import { resetNavigation, router, setLocation } from "@/test/navigation-double";
import { renderWithProviders } from "@/test/harness";
import { ComuneroDetails } from "@/features/comuneros/comunero-details";
import {
  ComuneroRole,
  ComuneroStatus,
  type Comunero,
  type Lugar,
} from "@/types/domain";

const lugar: Lugar = { id: "l1", address: "Rúa Nova 5" } as Lugar;

const ana: Comunero = {
  id: "c1",
  user: { id: "u1", name: "Ana García", dni: "11111111H", phones: [] },
  code: "C1",
  role: ComuneroRole.HOLDER,
  status: ComuneroStatus.ACTIVE,
  lugar,
} as Comunero;

function withLugares() {
  mockRoute("GET", "/lugar/search/marcon", () => [lugar]);
}

/**
 * Panel de detalle/alta de comunero. Cubre lo que se rompió al portar del
 * Angular (el detalle resolviéndose contra el listado) y las validaciones del
 * formulario, que el refactor mueve a componentes compartidos.
 */
describe("ComuneroDetails", () => {
  beforeEach(() => {
    resetApiDouble();
    resetNavigation();
    withLugares();
  });

  it("muestra la ficha del comunero", async () => {
    setLocation("/comuneros/c1");
    mockRoute("GET", "/comunero/c1", () => ana);

    renderWithProviders(<ComuneroDetails comuneroId="c1" />);

    expect(await screen.findByText("Ana García")).toBeInTheDocument();
    expect(screen.getByText("11111111H")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /rúa nova 5/i })).toBeInTheDocument();
  });

  it("si el comunero no existe lo dice, en vez de parecer un alta", async () => {
    setLocation("/comuneros/fantasma");
    mockRoute("GET", "/comunero/fantasma", () => new ApiError(404, "Not found"));

    renderWithProviders(<ComuneroDetails comuneroId="fantasma" />);

    expect(
      await screen.findByText("No se encuentra el comunero"),
    ).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Nombre y apellidos"),
    ).not.toBeInTheDocument();
  });

  it("el alta exige nombre y dirección, y lo dice", async () => {
    setLocation("/comuneros/new");

    renderWithProviders(<ComuneroDetails isNew />);

    await userEvent.click(await screen.findByRole("button", { name: /guardar/i }));

    expect(await screen.findByText("El nombre es obligatorio.")).toBeInTheDocument();
    expect(
      screen.getByText("Elige la dirección del comunero."),
    ).toBeInTheDocument();
    expect(lastCall("POST", "/comunero")).toBeUndefined();
  });

  it("el alta crea el comunero como HOLDER y abre su detalle", async () => {
    setLocation("/comuneros/new");
    mockRoute("POST", "/comunero", () => ({ ...ana, id: "nuevo" }));

    renderWithProviders(<ComuneroDetails isNew />);

    await userEvent.type(
      await screen.findByPlaceholderText("Nombre y apellidos"),
      "Ana García",
    );
    await userEvent.selectOptions(screen.getByRole("combobox"), "l1");
    await userEvent.click(screen.getByRole("button", { name: /guardar/i }));

    await waitFor(() => {
      expect(lastCall("POST", "/comunero")).toBeDefined();
    });
    expect(lastCall("POST", "/comunero")?.ctx.body).toMatchObject({
      name: "Ana García",
      lugarId: "l1",
      role: "HOLDER",
    });
    expect(router.push).toHaveBeenCalledWith("/comuneros/nuevo");
  });

  it("sin direcciones dadas de alta no se puede crear: enlaza a Direcciones", async () => {
    setLocation("/comuneros/new");
    mockRoute("GET", "/lugar/search/marcon", () => []);

    renderWithProviders(<ComuneroDetails isNew />);

    expect(
      await screen.findByText(/no hay direcciones dadas de alta/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /crea una dirección/i }),
    ).toHaveAttribute("href", "/lugares");
  });

  it("editar guarda con PATCH y conserva la dirección elegida", async () => {
    setLocation("/comuneros/c1");
    mockRoute("GET", "/comunero/c1", () => ana);
    mockRoute("PATCH", "/comunero/c1", ({ body }) => ({
      ...ana,
      ...(body as object),
    }));

    renderWithProviders(<ComuneroDetails comuneroId="c1" />);

    await userEvent.click(
      await screen.findByRole("button", { name: "Editar" }),
    );

    const dni = screen.getByDisplayValue("11111111H");
    await userEvent.clear(dni);
    await userEvent.type(dni, "22222222J");
    await userEvent.click(screen.getByRole("button", { name: /guardar/i }));

    await waitFor(() => {
      expect(lastCall("PATCH", "/comunero/c1")).toBeDefined();
    });
    expect(lastCall("PATCH", "/comunero/c1")?.ctx.body).toMatchObject({
      id: "c1",
      dni: "22222222J",
      lugarId: "l1",
    });
  });
});
