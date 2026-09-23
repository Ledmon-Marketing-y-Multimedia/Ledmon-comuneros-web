import { defineConfig, devices } from "@playwright/test";

/**
 * Tests de extremo a extremo: navegador real contra la app y la API de verdad
 * (nginx + php-fpm + Postgres). Complementan a los de Vitest, que montan
 * componentes en jsdom con `@/lib/api` doblado y por tanto no ven el App Router,
 * el CSS ni la integración con el backend.
 *
 * Viven en `e2e/`, fuera de `src/**` a propósito: Vitest recoge
 * `src/**\/*.test.{ts,tsx}` y los dos runners exportan `test`/`expect`.
 *
 * Requisitos para ejecutarlos (no los levanta esta config):
 *   - el stack de la API en pie (`docker compose up -d` en Ledmon-comuneros-api)
 *   - una cuenta administradora conocida (por defecto la del seeder de dev)
 */
export default defineConfig({
  testDir: "./e2e",

  // El estado en BD es compartido: en serie se razona mucho mejor sobre él, y
  // son pocos tests. Además WSL agradece no abrir varios Chromium a la vez.
  workers: 1,
  fullyParallel: false,

  // Un fallo de estos suele ser real, no un parpadeo: no se reintenta en local.
  retries: process.env.CI ? 1 : 0,
  // Holgado a propósito: `POST /login` admite 5 intentos por minuto y IP, así que
  // un test puede tener que esperar a que se abra el cupo (ver awaitLoginSlot).
  timeout: 90_000,
  expect: { timeout: 10_000 },

  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],

  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    // Solo cuando algo falla: la traza abre en `npx playwright show-trace`.
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],

  // Reutiliza el `next dev` que ya esté escuchando en el 3000; si no hay ninguno,
  // lo arranca él.
  webServer: {
    command: "npm run dev",
    url: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
