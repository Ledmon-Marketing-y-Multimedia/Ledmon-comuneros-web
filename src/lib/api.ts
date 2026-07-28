import { env } from "@/lib/env";
import { clearToken, getToken } from "@/lib/auth/token-storage";

/** Error HTTP con estado y cuerpo, para que las capas superiores puedan reaccionar. */
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

type QueryValue = string | number | boolean | undefined | null;

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  params?: Record<string, QueryValue>;
  body?: unknown;
  /** Tipo de respuesta esperado. Por defecto 'json'. */
  responseType?: "json" | "text" | "blob";
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

let handlingUnauthorized = false;

/**
 * Manejo de 401 (equivalente al authInterceptor del Angular):
 *   - si había token → la sesión ha caducado o se ha revocado: se descarta y se
 *     lleva al login conservando la ruta actual como destino.
 *   - si no había → es un login fallido: no se hace nada aquí, el error lo
 *     gestiona quien llamó (la pantalla de login muestra el mensaje).
 */
function handleUnauthorized(): void {
  if (getToken() === null) return;

  clearToken();

  if (handlingUnauthorized || typeof window === "undefined") return;
  handlingUnauthorized = true;

  const { pathname, search } = window.location;
  const target =
    pathname === LOGIN_PATH
      ? LOGIN_PATH
      : `${LOGIN_PATH}?next=${encodeURIComponent(pathname + search)}`;

  window.location.replace(target);
}

const LOGIN_PATH = "/login";

function buildUrl(path: string, params?: Record<string, QueryValue>): string {
  const base = env.apiUrl.replace(/\/$/, "");
  const url = path.startsWith("/") ? base + path : base + "/" + path;
  if (!params) return url;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      search.append(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `${url}?${qs}` : url;
}

/** Cliente HTTP con inyección de Bearer y manejo de 401 (portado del interceptor). */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { method = "GET", params, body, responseType = "json", signal } = options;

  const token = getToken();
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", "Bearer " + token);
  }

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined && body !== null) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    payload = JSON.stringify(body);
  }

  const res = await fetch(buildUrl(path, params), {
    method,
    headers,
    body: payload,
    signal,
  });

  if (res.status === 401) {
    handleUnauthorized();
    throw new ApiError(401, "Unauthorized");
  }

  if (!res.ok) {
    let errBody: unknown;
    try {
      errBody = await res.json();
    } catch {
      errBody = await res.text().catch(() => undefined);
    }
    throw new ApiError(res.status, res.statusText || "Request failed", errBody);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  if (responseType === "blob") {
    return (await res.blob()) as T;
  }
  if (responseType === "text") {
    return (await res.text()) as T;
  }
  // json (tolerante con cuerpos vacíos)
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
  get: <T>(path: string, options?: Omit<ApiRequestOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, "method">) =>
    apiRequest<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, "method">) =>
    apiRequest<T>(path, { ...options, method: "PATCH", body }),
  put: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, "method">) =>
    apiRequest<T>(path, { ...options, method: "PUT", body }),
  delete: <T>(path: string, options?: Omit<ApiRequestOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...options, method: "DELETE" }),
};
