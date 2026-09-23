/**
 * Persistencia del token de sesión (Sanctum) en localStorage.
 *
 * Se mantiene localStorage —y no una cookie httpOnly— porque es lo que ya hacía
 * la app con OIDC (`WebStorageStateStore`) y porque la API es stateless con
 * `Authorization: Bearer`. Al estar en localStorage, la sesión se comparte entre
 * pestañas; el evento `storage` permite reaccionar cuando otra pestaña entra o
 * cierra sesión.
 */

const TOKEN_KEY = "comuneros.accessToken";

/** Evento propio: `storage` no se dispara en la pestaña que escribe. */
const CHANGE_EVENT = "comuneros:token-change";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * Suscribe a los cambios del token: en esta pestaña (evento propio) y en las
 * demás (evento `storage` del navegador). Devuelve la función para desuscribir.
 */
export function onTokenChange(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === TOKEN_KEY) listener();
  };

  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}
