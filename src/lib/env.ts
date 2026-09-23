/**
 * Configuración de entorno (equivalente a environments/environment.ts del Angular).
 * Es NEXT_PUBLIC_* porque se consume en el cliente: las llamadas a la API y la
 * sesión (token Bearer) viven en el navegador.
 */
export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "/api",
} as const;
