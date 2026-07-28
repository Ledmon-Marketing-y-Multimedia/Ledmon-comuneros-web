import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/api", () => import("@/test/api-double"));
vi.mock("next/navigation", () => import("@/test/navigation-double"));

import { lastCall, mockRoute, resetApiDouble } from "@/test/api-double";
import { resetNavigation, setLocation } from "@/test/navigation-double";
import { renderWithProviders } from "@/test/harness";
import { LugarDetails } from "@/features/lugares/lugar-details";
import { LugarStatus, type Lugar } from "@/types/domain";

const completo: Lugar = {
  id: "l1",
  address: "Rúa Nova 5",
  poblacion: "Marcón",
  cp: "36158",
  zona: "Norte",
  status: LugarStatus.ACTIVE,
  comuneros: [],
} as Lugar;

/** Borrador: creado por "Nueva dirección", todavía sin dirección. */
const borrador: Lugar = { id: "l2", status: LugarStatus.ACTIVE } as Lugar;

/**
 * Panel de detalle de una dirección. Cubre los tres estados que el refactor
 * mueve a componentes compartidos (cargando / no encontrado / ficha) y el ciclo
 * ver ↔ editar.
 */
describe("LugarDetails", () => {
  beforeEach(() => {
    resetApiDouble();
    resetNavigation();
    setLocation("/lugares/l1");
  });

  it("muestra la ficha en modo lectura", async () => {
    mockRoute("GET", "/lugar/search/marcon", () => [completo]);

    renderWithProviders(<LugarDetails lugarId="l1" />);

    expect(await screen.findByText("Rúa Nova 5")).toBeInTheDocument();
    expect(screen.getByText("Alta")).toBeInTheDocument();
    expect(screen.getByText("Marcón")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /editar lugar/i }),
    ).toBeInTheDocument();
  });

  it("una dirección recién creada abre directamente en edición", async () => {
    mockRoute("GET", "/lugar/search/marcon", () => [borrador]);

    renderWithProviders(<LugarDetails lugarId="l2" />);

    // Sin `address` el panel entra en modo edición para completarla.
    expect(
      await screen.findByPlaceholderText(/dirección|address/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /guardar/i })).toBeInTheDocument();
  });

  it("si no se encuentra la dirección lo dice y ofrece volver", async () => {
    mockRoute("GET", "/lugar/search/marcon", () => []);

    renderWithProviders(<LugarDetails lugarId="fantasma" />);

    expect(
      await screen.findByText("No se encuentra la dirección"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /volver al listado/i })).toHaveAttribute(
      "href",
      "/lugares",
    );
  });

  it("guardar envía PATCH con los campos del formulario", async () => {
    mockRoute("GET", "/lugar/search/marcon", () => [completo]);
    mockRoute("PATCH", "/lugar/l1", ({ body }) => ({
      ...completo,
      ...(body as object),
    }));

    renderWithProviders(<LugarDetails lugarId="l1" />);

    await userEvent.click(
      await screen.findByRole("button", { name: /editar lugar/i }),
    );

    const poblacion = screen.getByDisplayValue("Marcón");
    await userEvent.clear(poblacion);
    await userEvent.type(poblacion, "Pontevedra");
    await userEvent.click(screen.getByRole("button", { name: /guardar/i }));

    await waitFor(() => {
      expect(lastCall("PATCH", "/lugar/l1")).toBeDefined();
    });
    expect(lastCall("PATCH", "/lugar/l1")?.ctx.body).toMatchObject({
      id: "l1",
      address: "Rúa Nova 5",
      poblacion: "Pontevedra",
    });
  });
});
