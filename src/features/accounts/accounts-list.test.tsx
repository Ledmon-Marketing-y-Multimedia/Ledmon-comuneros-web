import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/api", () => import("@/test/api-double"));
vi.mock("next/navigation", () => import("@/test/navigation-double"));

import { lastCall, mockRoute, resetApiDouble } from "@/test/api-double";
import { resetNavigation, setLocation } from "@/test/navigation-double";
import { renderWithProviders } from "@/test/harness";
import { chooseOption } from "@/test/select";
import { AccountsList } from "@/features/accounts/accounts-list";
import type { Account } from "@/types/domain";

function account(overrides: Partial<Account> & { id: string }): Account {
  return {
    name: `Cuenta ${overrides.id}`,
    email: `${overrides.id}@example.com`,
    isAdmin: false,
    active: true,
    hasPassword: true,
    ...overrides,
  };
}

function withAccounts(items: Account[]) {
  mockRoute("GET", "/account", () => items);
}

describe("AccountsList", () => {
  beforeEach(() => {
    resetApiDouble();
    resetNavigation();
    setLocation("/usuarios");
  });

  it("lista las cuentas con su total", async () => {
    withAccounts([
      account({ id: "a", name: "Ana" }),
      account({ id: "b", name: "Bruno" }),
    ]);

    renderWithProviders(<AccountsList />);

    expect(await screen.findByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Bruno")).toBeInTheDocument();
    expect(screen.getByText("2 usuarios")).toBeInTheDocument();
  });

  it("distingue a los administradores", async () => {
    withAccounts([
      account({ id: "a", name: "Ana", isAdmin: true }),
      account({ id: "b", name: "Bruno" }),
    ]);

    renderWithProviders(<AccountsList />);

    await screen.findByText("Ana");
    expect(screen.getAllByText("Admin")).toHaveLength(1);
  });

  it("avisa de quién no puede entrar", async () => {
    withAccounts([
      account({ id: "a", name: "Ana", active: false }),
      account({ id: "b", name: "Bruno", hasPassword: false }),
      account({ id: "c", name: "Carla", lastLogin: "2026-07-20T10:00:00Z" }),
    ]);

    renderWithProviders(<AccountsList />);

    expect(await screen.findByText("Desactivada")).toBeInTheDocument();
    expect(screen.getByText("Sin clave")).toBeInTheDocument();
    expect(screen.getByText("20/07/2026")).toBeInTheDocument();
  });

  it("una cuenta que nunca ha entrado lo dice", async () => {
    withAccounts([account({ id: "a", name: "Ana" })]);

    renderWithProviders(<AccountsList />);

    expect(await screen.findByText("Nunca")).toBeInTheDocument();
  });

  it("el buscador filtra por nombre y email sin volver a la API", async () => {
    withAccounts([
      account({ id: "a", name: "Ana", email: "ana@example.com" }),
      account({ id: "b", name: "Bruno", email: "bruno@example.com" }),
    ]);

    renderWithProviders(<AccountsList />);
    await screen.findByText("Ana");

    const llamadasAntes = lastCall("GET", "/account");

    await userEvent.type(screen.getByPlaceholderText("Buscar usuarios"), "bruno@");

    expect(screen.queryByText("Ana")).not.toBeInTheDocument();
    expect(screen.getByText("Bruno")).toBeInTheDocument();
    // La lista es corta: se filtra en cliente, sin nueva petición.
    expect(lastCall("GET", "/account")).toBe(llamadasAntes);
  });

  it("filtra por administradores y por quien no tiene acceso", async () => {
    withAccounts([
      account({ id: "a", name: "Ana", isAdmin: true }),
      account({ id: "b", name: "Bruno" }),
      account({ id: "c", name: "Carla", active: false }),
    ]);

    renderWithProviders(<AccountsList />);
    await screen.findByText("Ana");

    await chooseOption("Filtrar usuarios", "Administradores");
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.queryByText("Bruno")).not.toBeInTheDocument();

    await chooseOption("Filtrar usuarios", "Sin acceso");
    expect(screen.getByText("Carla")).toBeInTheDocument();
    expect(screen.queryByText("Ana")).not.toBeInTheDocument();
  });

  it("sin cuentas muestra el estado vacío", async () => {
    withAccounts([]);

    renderWithProviders(<AccountsList />);

    expect(await screen.findByText("No existen usuarios")).toBeInTheDocument();
  });

  it("resalta la fila abierta en el detalle", async () => {
    withAccounts([account({ id: "a", name: "Ana" }), account({ id: "b", name: "Bruno" })]);
    setLocation("/usuarios/b");

    renderWithProviders(<AccountsList />);

    expect((await screen.findByText("Bruno")).closest("a")).toHaveClass(
      "bg-primary-50",
    );
    expect((await screen.findByText("Ana")).closest("a")).not.toHaveClass(
      "bg-primary-50",
    );
  });

  it("«Nuevo usuario» abre el alta sin crear nada", async () => {
    withAccounts([account({ id: "a", name: "Ana" })]);

    renderWithProviders(<AccountsList />);
    await screen.findByText("Ana");

    expect(screen.getByRole("link", { name: /nuevo usuario/i })).toHaveAttribute(
      "href",
      "/usuarios/new",
    );
    expect(lastCall("POST", "/account")).toBeUndefined();
  });
});
