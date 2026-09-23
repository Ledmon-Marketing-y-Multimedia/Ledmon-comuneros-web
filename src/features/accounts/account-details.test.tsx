import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/api", () => import("@/test/api-double"));
vi.mock("next/navigation", () => import("@/test/navigation-double"));

import { ApiError, lastCall, mockRoute, resetApiDouble } from "@/test/api-double";
import { resetNavigation, router, setLocation } from "@/test/navigation-double";
import { renderWithProviders } from "@/test/harness";
import { AccountDetails } from "@/features/accounts/account-details";
import type { Account } from "@/types/domain";

const ANA: Account = {
  id: "a",
  name: "Ana",
  email: "ana@example.com",
  isAdmin: false,
  active: true,
  hasPassword: true,
  lastLogin: "2026-07-20T10:00:00Z",
};

function withAccounts(items: Account[]) {
  mockRoute("GET", "/account", () => items);
}

/** Deja una sesión iniciada como `id`, que es lo que mira `isSelf`. */
function signedInAs(id: string, isAdmin = true) {
  window.localStorage.setItem("comuneros.accessToken", "token-de-prueba");
  mockRoute("GET", "/login/check", () => ({
    id,
    name: "Quien sea",
    email: "admin@example.com",
    isAdmin,
  }));
}

describe("AccountDetails", () => {
  beforeEach(() => {
    resetApiDouble();
    resetNavigation();
    window.localStorage.clear();
    setLocation("/usuarios/a");
  });

  it("muestra los datos de la cuenta", async () => {
    withAccounts([ANA]);

    renderWithProviders(<AccountDetails accountId="a" />);

    expect(await screen.findByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
    expect(
      screen.getByText("Usuario normal (no gestiona usuarios)"),
    ).toBeInTheDocument();
    expect(screen.getByText("Cuenta activa")).toBeInTheDocument();
  });

  it("dice por qué una cuenta no puede entrar", async () => {
    withAccounts([{ ...ANA, active: false }]);

    renderWithProviders(<AccountDetails accountId="a" />);

    expect(
      await screen.findByText("Cuenta desactivada: no puede iniciar sesión"),
    ).toBeInTheDocument();
  });

  it("una cuenta inexistente ofrece la salida", async () => {
    withAccounts([]);

    renderWithProviders(<AccountDetails accountId="fantasma" />);

    expect(await screen.findByText("No se encuentra el usuario")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /volver al listado/i })).toHaveAttribute(
      "href",
      "/usuarios",
    );
  });

  it("edita nombre y permisos enviando solo lo que cambia", async () => {
    withAccounts([ANA]);
    mockRoute("PATCH", "/account/a", ({ body }) => ({
      ...ANA,
      ...(body as object),
    }));

    renderWithProviders(<AccountDetails accountId="a" />);

    await userEvent.click(await screen.findByRole("button", { name: /editar usuario/i }));

    await userEvent.clear(screen.getByDisplayValue("Ana"));
    await userEvent.type(screen.getByLabelText("Nombre"), "Ana Editada");
    await userEvent.click(screen.getByRole("checkbox", { name: /administrador/i }));
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      // El email no se toca: no viaja en el PATCH.
      expect(lastCall("PATCH", "/account/a")?.ctx.body).toEqual({
        name: "Ana Editada",
        isAdmin: true,
      });
    });
  });

  it("el alta pide contraseña y crea la cuenta", async () => {
    withAccounts([]);
    mockRoute("POST", "/account", ({ body }) => ({
      ...(body as object),
      id: "nueva",
    }));

    renderWithProviders(<AccountDetails isNew />);

    await userEvent.type(screen.getByLabelText("Nombre"), "Bruno");
    await userEvent.type(screen.getByLabelText("Email"), "bruno@example.com");

    // Sin contraseña no se puede guardar: una cuenta sin ella no podría entrar.
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();

    await userEvent.type(screen.getByLabelText("Contraseña"), "secret1234");
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(lastCall("POST", "/account")?.ctx.body).toEqual({
        name: "Bruno",
        email: "bruno@example.com",
        password: "secret1234",
        isAdmin: false,
        active: true,
      });
    });

    expect(router.replace).toHaveBeenCalledWith("/usuarios/nueva");
  });

  it("muestra el motivo cuando la API rechaza el cambio (409)", async () => {
    withAccounts([{ ...ANA, isAdmin: true }]);
    mockRoute(
      "PATCH",
      "/account/a",
      () =>
        new ApiError(409, "Conflict", {
          message: "Debe quedar al menos una cuenta administradora activa.",
        }),
    );

    renderWithProviders(<AccountDetails accountId="a" />);

    await userEvent.click(await screen.findByRole("button", { name: /editar usuario/i }));
    await userEvent.click(screen.getByRole("checkbox", { name: /administrador/i }));
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(
      await screen.findByText("Debe quedar al menos una cuenta administradora activa."),
    ).toBeInTheDocument();
  });

  it("en tu propia cuenta no deja quitarte admin ni desactivarte, ni borrarte", async () => {
    withAccounts([{ ...ANA, isAdmin: true }]);
    signedInAs("a");

    renderWithProviders(<AccountDetails accountId="a" />);

    await userEvent.click(await screen.findByRole("button", { name: /editar usuario/i }));

    expect(screen.getByRole("checkbox", { name: /administrador/i })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: /activo/i })).toBeDisabled();
    expect(screen.queryByRole("button", { name: /eliminar/i })).not.toBeInTheDocument();
    // Pero renombrarse sí se puede.
    expect(screen.getByLabelText("Nombre")).toBeEnabled();
  });

  it("en la cuenta de otra persona sí ofrece eliminar", async () => {
    withAccounts([ANA]);
    signedInAs("otro-id");

    renderWithProviders(<AccountDetails accountId="a" />);

    await userEvent.click(await screen.findByRole("button", { name: /editar usuario/i }));

    expect(screen.getByRole("button", { name: /eliminar/i })).toBeInTheDocument();
  });

  it("cambia la contraseña de otra cuenta y avisa de que tendrá que volver a entrar", async () => {
    withAccounts([ANA]);
    mockRoute("PATCH", "/account/a/password", () => undefined);

    renderWithProviders(<AccountDetails accountId="a" />);

    await userEvent.click(await screen.findByRole("button", { name: /contraseña/i }));

    const campo = screen.getByLabelText("Nueva contraseña");
    await userEvent.type(campo, "corta");
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();

    await userEvent.clear(campo);
    await userEvent.type(campo, "nuevaclave1234");
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(lastCall("PATCH", "/account/a/password")?.ctx.body).toEqual({
        newPassword: "nuevaclave1234",
      });
    });

    expect(
      await screen.findByText(/tendrá que iniciar sesión de nuevo/i),
    ).toBeInTheDocument();
  });
});
