import { expect, request, type APIRequestContext, type Page } from "@playwright/test";

/**
 * Utilidades de los E2E: hablar con la API para preparar y limpiar datos, y
 * entrar en la app.
 *
 * El alta y la baja de las cuentas de prueba se hacen **por API** a propósito: lo
 * que cada test quiere ejercitar es una pantalla concreta, no montar el escenario
 * a base de clics.
 */

/**
 * API directa (sin pasar por el proxy del front): fallos más fáciles de atribuir.
 *
 * **Con barra final, y las rutas de abajo sin barra inicial**: Playwright resuelve
 * `baseURL` con la semántica de `new URL()`, así que `"/login"` sobre
 * `…/comuneros/api/v1` daría `localhost:8080/login` y se perdería el prefijo.
 */
const API_URL = (process.env.E2E_API_URL ?? "http://localhost:8080/comuneros/api/v1").replace(
  /\/?$/,
  "/",
);

/** Cuenta administradora existente. En el dev local, la del seeder. */
export const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL ?? "admin@example.com",
  password: process.env.E2E_ADMIN_PASSWORD ?? "comuneros1234",
};

/** Marca de las cuentas que crean los tests, para reconocerlas y borrarlas. */
const E2E_PREFIX = "e2e-";

const TOKEN_KEY = "comuneros.accessToken";

export interface TestAccount {
  id: string;
  name: string;
  email: string;
  password: string;
}

/** Email irrepetible entre ejecuciones (la BD de dev no se resetea). */
export function e2eEmail(label: string): string {
  return `${E2E_PREFIX}${label}-${Date.now()}@example.com`;
}

/**
 * Tokens ya emitidos en esta ejecución, por credenciales.
 *
 * No es una optimización: `POST /login` está limitado a **5 intentos por minuto y
 * IP** (a propósito, cubre el hueco que dejaba el bruteForceProtected desactivado
 * de Keycloak). Sin caché, una suite que entre una vez por test se autobloquea
 * con 429 a la cuarta prueba.
 */
const tokens = new Map<string, string>();

/** Intentos de login de esta ejecución (marcas de tiempo), para no pasarse del cupo. */
const loginAttempts: number[] = [];

const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 60_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Espera, si hace falta, a que haya hueco en el limitador de `POST /login` y
 * apunta el intento.
 *
 * Hay que llamarlo **también antes de los logins por formulario**: la API cuenta
 * por IP, le da igual si el intento viene del navegador o de un contexto de API.
 */
export async function awaitLoginSlot(): Promise<void> {
  const now = Date.now();

  while (loginAttempts.length > 0 && now - loginAttempts[0] > LOGIN_WINDOW_MS) {
    loginAttempts.shift();
  }

  if (loginAttempts.length >= LOGIN_LIMIT) {
    const wait = LOGIN_WINDOW_MS - (now - loginAttempts[0]) + 1_000;

    console.log(`[e2e] cupo de login agotado, esperando ${Math.ceil(wait / 1000)}s`);
    await sleep(wait);

    return awaitLoginSlot();
  }

  loginAttempts.push(Date.now());
}

/** Token de API de una cuenta. */
export async function tokenFor(email: string, password: string): Promise<string> {
  const cacheKey = `${email}:${password}`;
  const cached = tokens.get(cacheKey);

  if (cached !== undefined) return cached;

  await awaitLoginSlot();

  const anonymous = await request.newContext({ baseURL: API_URL });

  let response = await anonymous.post("login", { data: { email, password } });

  // Red de seguridad: el cupo también lo gastan ejecuciones anteriores, que este
  // proceso no ha visto. Se espera lo que diga la propia API.
  if (response.status() === 429) {
    const wait = Number(response.headers()["retry-after"] ?? 60);

    console.log(`[e2e] límite de login alcanzado, esperando ${wait}s`);
    await sleep((wait + 1) * 1000);

    response = await anonymous.post("login", { data: { email, password } });
  }

  expect(
    response.ok(),
    `No se ha podido entrar como ${email} (HTTP ${response.status()}). ¿Está el stack de la API en pie y la contraseña es la del seeder? Define E2E_ADMIN_PASSWORD si no.`,
  ).toBeTruthy();

  const { accessToken } = (await response.json()) as { accessToken: string };
  await anonymous.dispose();

  tokens.set(cacheKey, accessToken);

  return accessToken;
}

/** Contexto de API autenticado como `email`. */
export async function apiAs(email: string, password: string): Promise<APIRequestContext> {
  return request.newContext({
    baseURL: API_URL,
    extraHTTPHeaders: {
      Authorization: `Bearer ${await tokenFor(email, password)}`,
      Accept: "application/json",
    },
  });
}

/** Contexto de API autenticado como la cuenta administradora. */
export function apiAsAdmin(): Promise<APIRequestContext> {
  return apiAs(ADMIN.email, ADMIN.password);
}

/** Crea una cuenta de prueba por API y devuelve sus credenciales. */
export async function createAccount(
  api: APIRequestContext,
  { name, isAdmin = false, active = true }: { name: string; isAdmin?: boolean; active?: boolean },
): Promise<TestAccount> {
  const email = e2eEmail(name.toLowerCase().replace(/\s+/g, "-"));
  const password = "secret1234";

  const response = await api.post("account", {
    data: { name, email, password, isAdmin, active },
  });

  expect(response.ok(), `Alta de ${email} fallida: ${response.status()}`).toBeTruthy();

  const created = (await response.json()) as { id: string };

  return { id: created.id, name, email, password };
}

/**
 * Borra todas las cuentas que hayan dejado los tests (las del prefijo `e2e-`).
 * La cuenta administradora nunca entra aquí, así que las guardas del backend no
 * se disparan.
 */
export async function deleteE2eAccounts(api: APIRequestContext): Promise<void> {
  const response = await api.get("account");
  const accounts = (await response.json()) as { id: string; email?: string }[];

  for (const account of accounts) {
    if (account.email?.startsWith(E2E_PREFIX)) {
      await api.delete(`account/${account.id}`);
    }
  }
}

/**
 * Deja la sesión iniciada sin pasar por el formulario: pide el token a la API y
 * lo siembra en localStorage, que es donde lo busca `useAuth`. El formulario se
 * ejercita aparte, en su propio test.
 */
export async function signIn(page: Page, email: string, password: string): Promise<void> {
  const accessToken = await tokenFor(email, password);

  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [TOKEN_KEY, accessToken] as const,
  );
}

/** Cierra la sesión del navegador borrando el token (sin revocarlo en la API). */
export async function forgetSession(page: Page): Promise<void> {
  await page.evaluate((key) => window.localStorage.removeItem(key), TOKEN_KEY);
}
