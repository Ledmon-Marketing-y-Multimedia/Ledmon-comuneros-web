import { expect, test, type APIRequestContext } from "@playwright/test";
import { apiAsAdmin } from "./support/accounts";
import { abrirEscaner, aviso, esperarVideoEnMarcha, primeraReunion } from "./support/scanner";

/**
 * Escáner QR **con cámara**, simulada por Chromium. Va en su propio fichero porque
 * `launchOptions` solo puede fijarse al principio de uno (fuerza un worker nuevo).
 */

let api: APIRequestContext;
let reunionId: string | undefined;

test.use({
  permissions: ["camera"],
  launchOptions: {
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
  },
});

test.beforeAll(async () => {
  api = await apiAsAdmin();
  reunionId = await primeraReunion(api);
});

test.afterAll(async () => {
  await api?.dispose();
});

test.beforeEach(() => {
  test.skip(!reunionId, "No hay ninguna reunión en este entorno");
});

test("con cámara, la abre y no muestra ningún aviso", async ({ page }) => {
  await abrirEscaner(page, reunionId!);

  // Antes del arreglo, pedir la cámara con `facingMode: 'environment'` estricto
  // fallaba en cuanto el dispositivo no declaraba una trasera, y esto se quedaba en
  // negro sin decir nada.
  await esperarVideoEnMarcha(page);

  await expect(aviso(page)).toHaveCount(0);
});
