import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { ADMIN, signIn } from "./accounts";

/**
 * Piezas compartidas por los dos specs del escáner QR.
 *
 * Están separados en dos ficheros porque cada uno arranca Chromium distinto —con
 * cámara simulada y sin ella— y `launchOptions` solo puede fijarse al principio de
 * un fichero, no dentro de un `describe`.
 */

/** Id de la primera reunión del entorno, o undefined si no hay ninguna. */
export async function primeraReunion(api: APIRequestContext): Promise<string | undefined> {
  const response = await api.get("meeting/search/marcon");
  const reuniones = (await response.json()) as { id: string }[];

  return reuniones[0]?.id;
}

/** Entra como administrador y abre el escáner de esa reunión. */
export async function abrirEscaner(page: Page, reunionId: string) {
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto(`/reuniones/${reunionId}`);
  await page.getByRole("button", { name: /escanear qrs/i }).click();
}

/** El panel de aviso del escáner (Next añade su propio `role="alert"`). */
export function aviso(page: Page) {
  return page.locator('[role="alert"]').filter({ hasText: /cámara/i }).first();
}

/** Espera a que el vídeo esté reproduciendo el stream de la cámara. */
export async function esperarVideoEnMarcha(page: Page) {
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const video = document.querySelector("video");

          return video
            ? { stream: !!video.srcObject, ancho: video.videoWidth, pausado: video.paused }
            : null;
        }),
      { timeout: 15_000 },
    )
    .toMatchObject({ stream: true, pausado: false });
}
