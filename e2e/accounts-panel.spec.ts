import { expect, test, type APIRequestContext } from "@playwright/test";
import {
  ADMIN,
  apiAsAdmin,
  awaitLoginSlot,
  createAccount,
  deleteE2eAccounts,
  signIn,
  type TestAccount,
} from "./support/accounts";

/**
 * Panel de usuarios (/usuarios) en un navegador real, contra la API real.
 *
 * Lo que aporta sobre los tests de Vitest: la composición de rutas del App Router
 * (layout con AdminOnly + el drawer del detalle), que el menú lateral se pinte
 * según quién eres, y que el front y el backend encajen de verdad — incluido el
 * proxy `/api` de next.config.ts.
 */

let api: APIRequestContext;

test.beforeAll(async () => {
  api = await apiAsAdmin();
});

test.afterAll(async () => {
  // Si el beforeAll no llegó a autenticarse (stack caído, contraseña distinta),
  // aquí no hay nada que limpiar y el error que importa es el suyo.
  if (!api) return;

  await deleteE2eAccounts(api);
  await api.dispose();
});

test.describe("Acceso al panel", () => {
  test("un administrador entra por el formulario y ve el panel en el menú", async ({ page }) => {
    // Este es el único test que pasa por el formulario: los demás siembran el
    // token, que es lo mismo que hace el login pero sin repetir la pantalla.
    await awaitLoginSlot();
    await page.goto("/login");

    await page.getByLabel("Email").fill(ADMIN.email);
    await page.getByLabel("Contraseña").fill(ADMIN.password);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/home$/);

    const usuarios = page.getByRole("navigation").getByRole("link", { name: "Usuarios" });
    await expect(usuarios).toBeVisible();

    await usuarios.click();

    await expect(page).toHaveURL(/\/usuarios$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Usuarios");
    // La cuenta con la que hemos entrado tiene que estar en su propio listado.
    await expect(page.getByText(ADMIN.email)).toBeVisible();
  });

  test("una cuenta sin permiso no ve el menú y por URL recibe el aviso", async ({ page }) => {
    const normal = await createAccount(api, { name: "Sin Permiso" });
    await signIn(page, normal.email, normal.password);

    await page.goto("/home");

    // Acotado al menú lateral: en /home los módulos salen también como tarjetas
    // del dashboard, así que "Comuneros" aparece dos veces en la página.
    const menu = page.getByRole("navigation");

    // El resto de la aplicación sí es suya.
    await expect(menu.getByRole("link", { name: "Comuneros" })).toBeVisible();
    await expect(menu.getByRole("link", { name: "Usuarios" })).toHaveCount(0);

    await page.goto("/usuarios");

    await expect(
      page.getByText("Esta sección es solo para administradores"),
    ).toBeVisible();
    // Y no se le filtra el listado por detrás del aviso.
    await expect(page.getByText(ADMIN.email)).toHaveCount(0);
  });
});

test.describe("Gestión de cuentas", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, ADMIN.email, ADMIN.password);
  });

  test("da de alta un usuario y esa cuenta puede entrar", async ({ page, browser }) => {
    const email = `e2e-alta-${Date.now()}@example.com`;

    await page.goto("/usuarios");
    await page.getByRole("link", { name: /nuevo usuario/i }).click();

    await page.getByLabel("Nombre").fill("Alta Desde El Panel");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Contraseña").fill("secret1234");
    await page.getByRole("button", { name: "Guardar" }).click();

    // Tras guardar, el drawer muestra la ficha de la cuenta creada…
    await expect(page).toHaveURL(/\/usuarios\/[^/]+$/);
    await expect(page.getByText("Cuenta activa")).toBeVisible();
    // …y aparece en el listado, que es lo que se refresca por detrás.
    await expect(page.getByText(email).first()).toBeVisible();

    // La prueba de fuego: esa cuenta entra de verdad en la aplicación.
    const otro = await browser.newContext();
    const otraPagina = await otro.newPage();

    await awaitLoginSlot();
    await otraPagina.goto("/login");
    await otraPagina.getByLabel("Email").fill(email);
    await otraPagina.getByLabel("Contraseña").fill("secret1234");
    await otraPagina.getByRole("button", { name: "Entrar" }).click();

    await expect(otraPagina).toHaveURL(/\/home$/);
    await otro.close();
  });

  test("el listado avisa de quién no puede entrar", async ({ page }) => {
    const desactivada = await createAccount(api, { name: "Cuenta Parada", active: false });

    await page.goto("/usuarios");

    const fila = page.locator("a", { hasText: desactivada.name });
    await expect(fila).toContainText("Desactivada");

    // Y el filtro «Sin acceso» la encuentra. Ya no es un `<select>` nativo (la
    // lista la pinta Radix), así que se abre y se pulsa la opción, como una
    // persona. Se localiza por su nombre accesible: en esta pantalla hay dos
    // desplegables (este y el del paginador).
    await page.getByRole("combobox", { name: "Filtrar usuarios" }).click();
    await page.getByRole("option", { name: "Sin acceso" }).click();
    await expect(page.getByText(desactivada.name)).toBeVisible();
  });

  test("no deja que te quites a ti mismo el permiso de administrador", async ({ page }) => {
    await page.goto("/usuarios");
    await page.locator("a", { hasText: ADMIN.email }).click();

    await page.getByRole("button", { name: /editar usuario/i }).click();

    // Sobre la cuenta propia los interruptores están bloqueados y no hay Eliminar:
    // la API respondería 409 y es más claro no dejar pulsar.
    await expect(page.getByRole("checkbox", { name: /administrador/i })).toBeDisabled();
    await expect(page.getByRole("checkbox", { name: /activo/i })).toBeDisabled();
    await expect(page.getByRole("button", { name: /eliminar/i })).toHaveCount(0);
    await expect(page.getByText(/no puedes quitarte el permiso/i)).toBeVisible();
  });

  test("cambiar la contraseña de otra cuenta cierra su sesión", async ({ page, browser }) => {
    const victima: TestAccount = await createAccount(api, { name: "Sesion Abierta" });

    // Esa cuenta está dentro y navegando.
    const suyo = await browser.newContext();
    const suPagina = await suyo.newPage();
    await signIn(suPagina, victima.email, victima.password);
    await suPagina.goto("/comuneros");
    await expect(
      suPagina.getByRole("navigation").getByRole("link", { name: "Comuneros" }),
    ).toBeVisible();

    // El admin le cambia la contraseña desde el panel.
    await page.goto("/usuarios");
    await page.locator("a", { hasText: victima.name }).click();
    await page.getByRole("button", { name: /contraseña/i }).click();

    await page.getByLabel("Nueva contraseña").fill("otraclave1234");
    await page.getByRole("button", { name: "Guardar" }).click();

    await expect(page.getByText(/tendrá que iniciar sesión de nuevo/i)).toBeVisible();

    // Su token ya no vale: la siguiente petición la devuelve al login.
    await suPagina.reload();
    await expect(suPagina).toHaveURL(/\/login/);
    await suyo.close();
  });
});
