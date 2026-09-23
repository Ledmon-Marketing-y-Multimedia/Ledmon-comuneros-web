import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/api", () => import("@/test/api-double"));
vi.mock("next/navigation", () => import("@/test/navigation-double"));

import { lastCall, mockRoute, resetApiDouble } from "@/test/api-double";
import { resetNavigation, setLocation } from "@/test/navigation-double";
import { renderWithProviders } from "@/test/harness";
import { AnnouncementsList } from "@/features/announcements/announcements-list";
import type { Announcement } from "@/types/domain";

// `createdAt`/`date` están declarados como Date en domain.ts, pero la API manda
// cadenas ISO (el código hace `new Date(...)` al pintarlas). Los dobles imitan a
// la API, de ahí el doble casting.
function announcement(n: number): Announcement {
  return {
    id: `a${n}`,
    title: `Convocatoria ${String(n).padStart(2, "0")}`,
    user: { id: "u1", name: "Admin", phones: [] },
    createdAt: `2026-0${(n % 9) + 1}-01T10:00:00Z`,
  } as unknown as Announcement;
}

/**
 * Listado de comunicaciones. Mismo paginador que direcciones y reuniones, pero
 * con tamaño de página inicial **5** — divergencia real que hay que conservar al
 * extraer el componente compartido.
 */
describe("AnnouncementsList", () => {
  beforeEach(() => {
    resetApiDouble();
    resetNavigation();
    setLocation("/announcements");
  });

  it("pagina de 5 en 5", async () => {
    mockRoute("GET", "/announcement/search/marcon", () =>
      Array.from({ length: 7 }, (_, i) => announcement(i + 1)),
    );

    renderWithProviders(<AnnouncementsList />);

    expect(await screen.findByText("1 - 5 de 7")).toBeInTheDocument();
    expect(screen.queryByText("Convocatoria 07")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "›" }));

    expect(await screen.findByText("6 - 7 de 7")).toBeInTheDocument();
  });

  it("busca por el parámetro `address` del contrato heredado", async () => {
    mockRoute("GET", "/announcement/search/marcon", () => [announcement(1)]);

    renderWithProviders(<AnnouncementsList />);
    await screen.findByText("Convocatoria 01");

    await userEvent.type(
      screen.getByPlaceholderText("Buscar comunicaciones"),
      "junta",
    );

    await waitFor(() => {
      expect(lastCall("GET", "/announcement/search/marcon")?.ctx.params).toEqual({
        address: "junta",
      });
    });
  });

  it("cada fila enlaza a su detalle y muestra autor y fecha", async () => {
    mockRoute("GET", "/announcement/search/marcon", () => [announcement(1)]);

    renderWithProviders(<AnnouncementsList />);

    const fila = (await screen.findByText("Convocatoria 01")).closest("a");
    expect(fila).toHaveAttribute("href", "/announcements/a1");
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("1/2/2026")).toBeInTheDocument();
  });

  it("sin resultados muestra el estado vacío", async () => {
    mockRoute("GET", "/announcement/search/marcon", () => []);

    renderWithProviders(<AnnouncementsList />);

    expect(
      await screen.findByText("No existen comunicaciones"),
    ).toBeInTheDocument();
  });
});
