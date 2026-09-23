/**
 * Doble de `@/lib/api` para los tests: sustituye al cliente HTTP y permite
 * declarar la respuesta de cada ruta. Los tests ejercitan así la capa de datos
 * real (los hooks de cada `features/<recurso>/api.ts`), no un mock de esos
 * hooks —que es lo
 * que interesa cuando se refactoriza precisamente esa capa.
 *
 *   vi.mock("@/lib/api", () => import("@/test/api-double"));
 *   mockRoute("GET", "/lugar/search/marcon", () => [lugar]);
 */

export class ApiError extends Error {
  status: number;

  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

interface RequestContext {
  params?: Record<string, unknown>;
  body?: unknown;
}

type Handler = (ctx: RequestContext) => unknown;

const handlers: Map<string, Handler> = new Map();

/** Peticiones registradas, en orden, para poder afirmar sobre ellas. */
export const calls: { method: Method; path: string; ctx: RequestContext }[] = [];

export function mockRoute(method: Method, path: string, handler: Handler): void {
  handlers.set(`${method} ${path}`, handler);
}

export function resetApiDouble(): void {
  handlers.clear();
  calls.length = 0;
}

/** Última petición a una ruta (o undefined si no se ha llamado). */
export function lastCall(method: Method, path: string) {
  return [...calls].reverse().find((c) => c.method === method && c.path === path);
}

async function request<T>(
  method: Method,
  path: string,
  ctx: RequestContext = {},
): Promise<T> {
  calls.push({ method, path, ctx });

  const handler = handlers.get(`${method} ${path}`);

  if (!handler) {
    throw new ApiError(404, `Sin doble declarado para ${method} ${path}`);
  }

  const result = handler(ctx);

  if (result instanceof ApiError) {
    throw result;
  }

  return result as T;
}

export interface ApiRequestOptions {
  method?: Method;
  params?: Record<string, unknown>;
  body?: unknown;
  responseType?: "json" | "text" | "blob";
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { method = "GET", params, body } = options;

  return request<T>(method, path, { params, body });
}

export const api = {
  get: <T>(path: string, options?: ApiRequestOptions) =>
    request<T>("GET", path, { params: options?.params }),
  post: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>("POST", path, { body, params: options?.params }),
  patch: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>("PATCH", path, { body, params: options?.params }),
  put: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>("PUT", path, { body, params: options?.params }),
  delete: <T>(path: string, options?: ApiRequestOptions) =>
    request<T>("DELETE", path, { params: options?.params }),
};
