import { env } from "@/lib/env";
import { getUserManager } from "@/lib/auth/oidc";

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

/** Devuelve el access token vigente (no expirado), o null. */
async function getAccessToken(): Promise<string | null> {
  const um = getUserManager();
  if (!um) return null;
  const user = await um.getUser();
  if (user && !user.expired && user.access_token) {
    return user.access_token;
  }
  return null;
}

let handlingUnauthorized = false;

/**
 * Manejo de 401 equivalente al authInterceptor:
 *   - si hay token → logout (redirige al end-session de Keycloak)
 *   - si no hay nada en el storage → recarga
 */
async function handleUnauthorized(): Promise<void> {
  if (handlingUnauthorized) return;
  handlingUnauthorized = true;
  const um = getUserManager();
  if (!um) return;
  const user = await um.getUser();
  if (user) {
    await um.removeUser().catch(() => undefined);
    await um.signoutRedirect().catch(() => undefined);
  } else if (typeof window !== "undefined") {
    window.location.reload();
  }
}

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

  const token = await getAccessToken();
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
    await handleUnauthorized();
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
