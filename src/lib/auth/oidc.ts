"use client";

import {
  UserManager,
  WebStorageStateStore,
  type UserManagerSettings,
} from "oidc-client-ts";
import { env } from "@/lib/env";

/**
 * Configuración OIDC equivalente al authConfig de angular-oauth2-oidc:
 *   - Code Flow + PKCE
 *   - issuer/clientId del mismo realm de Keycloak
 *   - redirectUri = origin + '/'
 *   - logoutUrl = origin + '?client_id=comuneros-app'
 *   - silent refresh automático (vía refresh token que emite Keycloak)
 */
export function getOidcSettings(): UserManagerSettings {
  const origin =
    typeof window !== "undefined" ? window.location.origin : env.webEndpoint;

  return {
    authority: env.authIssuer,
    client_id: env.authClientId,
    redirect_uri: origin + "/",
    post_logout_redirect_uri: origin + "/?client_id=" + env.authClientId,
    response_type: "code",
    scope: "openid profile email",
    automaticSilentRenew: true,
    // Persistimos la sesión en localStorage (equivalente al manejo entre
    // pestañas que hacía la app original escuchando el evento 'storage').
    userStore:
      typeof window !== "undefined"
        ? new WebStorageStateStore({ store: window.localStorage })
        : undefined,
    monitorSession: true,
  };
}

let _userManager: UserManager | null = null;

/** Singleton del UserManager (solo en cliente). */
export function getUserManager(): UserManager | null {
  if (typeof window === "undefined") return null;
  if (!_userManager) {
    _userManager = new UserManager(getOidcSettings());
  }
  return _userManager;
}
