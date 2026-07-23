/**
 * Configuración de entorno (equivalente a environments/environment.ts del Angular).
 * Todas las variables son NEXT_PUBLIC_* porque se consumen en el cliente
 * (el flujo OIDC es 100% cliente, igual que en la app original).
 */
export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "/api",
  realm: process.env.NEXT_PUBLIC_REALM ?? "comuneros",
  authIssuer:
    process.env.NEXT_PUBLIC_AUTH_ISSUER ??
    "http://localhost:9090/realms/comuneros",
  authClientId: process.env.NEXT_PUBLIC_AUTH_CLIENT_ID ?? "comuneros-app",
  webEndpoint:
    process.env.NEXT_PUBLIC_WEB_ENDPOINT ?? "http://localhost:3000",
} as const;
