import { expect, test, type APIRequestContext } from "@playwright/test";
import { apiAsAdmin } from "./support/accounts";
import { abrirEscaner, aviso, primeraReunion } from "./support/scanner";

/**
 * Escáner QR **sin cámara**: es el caso que fallaba. Chromium headless no tiene
 * ninguna, así que este fichero no necesita nada especial; el de la cámara
 * simulada va aparte (`qr-scanner-con-camara.spec.ts`).
 *
 * En jsdom no existe `getUserMedia` —los tests de componentes lo doblan—, y el
 * fallo original (`NotFoundError: Requested device not found`) lo producía el
 * navegador de verdad al pedir la cámara con una restricción imposible.
 */

let api: APIRequestContext;
let reunionId: string | undefined;

test.use({ permissions: ["camera"] });

test.beforeAll(async () => {
  api = await apiAsAdmin();
  reunionId = await primeraReunion(api);
});

test.afterAll(async () => {
  await api?.dispose();
});

test.beforeEach(() => {
  // La suite no crea reuniones (el alta pide comunidad, lugar y fecha): si el
  // entorno no tiene ninguna, se dice en vez de fallar de forma confusa.
  test.skip(!reunionId, "No hay ninguna reunión en este entorno");
});

test("sin cámara, lo dice en pantalla y ofrece reintentar", async ({ page }) => {
  await abrirEscaner(page, reunionId!);

  await expect(aviso(page)).toContainText("No hay cámara disponible");
  await expect(
    page.getByRole("button", { name: /volver a intentarlo/i }),
  ).toBeVisible();

  // Y deja a mano la alternativa: registrar la asistencia a mano.
  await expect(page.getByText(/añadir manualmente/i)).toBeVisible();
});
