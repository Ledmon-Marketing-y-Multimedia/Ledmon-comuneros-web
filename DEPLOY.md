# Despliegue — Front (comuneros-marcon, Next.js 16)

> Este documento cubre **solo el front**. El despliegue de la **API** (Spring
> Boot) y de **Keycloak** está documentado en el repositorio de la API
> (`Ledmon-comuneros-api`). El front necesita ambos servicios accesibles.

## Requisitos

- **Node.js ≥ 20.9** (Next.js 16 / Turbopack).
- Una instancia de **Keycloak** con el realm `comuneros` y el cliente público
  `comuneros-app` (Auth Code + PKCE).
- La **API** accesible desde el navegador del usuario (CORS incluido).

## Variables de entorno

Todas son `NEXT_PUBLIC_*` porque el flujo OIDC es 100% en cliente. Se inyectan
**en tiempo de build** (quedan embebidas en el bundle), así que hay que definirlas
antes de `next build`.

| Variable | Descripción | Ejemplo (prod) |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base de la API | `https://api-comuneros.montesmarcon.com/comuneros/api/v1` |
| `NEXT_PUBLIC_AUTH_ISSUER` | Issuer del realm Keycloak | `https://auth.montesmarcon.com/realms/comuneros` |
| `NEXT_PUBLIC_AUTH_CLIENT_ID` | Client ID | `comuneros-app` |
| `NEXT_PUBLIC_REALM` | Realm | `comuneros` |
| `NEXT_PUBLIC_WEB_ENDPOINT` | URL pública del front | `https://comuneros.montesmarcon.com` |
| `API_PROXY_TARGET` | (solo dev) destino del rewrite `/api` | `http://localhost:8080/comuneros/api/v1` |

> **Dev vs prod — el proxy `/api`:** en desarrollo `NEXT_PUBLIC_API_URL=/api` y
> `next.config.ts` reescribe `/api/*` → `API_PROXY_TARGET` (equivalente al
> `proxy.conf.json` de Angular). En **producción** se pone la **URL absoluta** de
> la API en `NEXT_PUBLIC_API_URL`; el navegador llama directamente a la API, por
> lo que **la API debe permitir el origen del front por CORS**.

## Configuración necesaria en Keycloak (cliente `comuneros-app`)

Añadir el dominio de producción a:

- **Valid redirect URIs**: `https://comuneros.montesmarcon.com/*`
- **Web origins**: `https://comuneros.montesmarcon.com`

(En local ya vienen como `*` en el realm importado.)

## Opción A — Node self-host

```bash
npm ci
npm run build      # con las NEXT_PUBLIC_* definidas en el entorno
npm run start      # sirve en :3000 (usa 'next start')
```

Poner un reverse proxy (Nginx/Traefik) delante con TLS apuntando a `:3000`.

## Opción B — Docker (recomendado, salida `standalone`)

Hay un `Dockerfile` multi-stage que usa la salida `output: "standalone"`
(configurada en `next.config.ts`).

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api-comuneros.montesmarcon.com/comuneros/api/v1 \
  --build-arg NEXT_PUBLIC_AUTH_ISSUER=https://auth.montesmarcon.com/realms/comuneros \
  --build-arg NEXT_PUBLIC_AUTH_CLIENT_ID=comuneros-app \
  --build-arg NEXT_PUBLIC_REALM=comuneros \
  --build-arg NEXT_PUBLIC_WEB_ENDPOINT=https://comuneros.montesmarcon.com \
  -t comuneros-marcon-web .

docker run -p 3000:3000 comuneros-marcon-web
```

## Opción C — Vercel

`git push` de `core/rebuild-to-nextjs` y definir las `NEXT_PUBLIC_*` en el panel
de Environment Variables del proyecto. Build command `next build` por defecto.
(En Vercel no aplica el rewrite `/api`; usar la URL absoluta de la API.)

## Notas

- **No** se puede usar `output: export` (estático puro): hay rutas dinámicas
  (`[id]`) que se sirven bajo demanda. Requiere runtime Node (opciones A/B/C).
- Node self-host y Docker sirven con `next start` / `server.js`; asegúrate de que
  el proxy pase el `Host` correcto para que las URLs OIDC (que usan
  `window.location.origin`) coincidan con lo registrado en Keycloak.
- El `silent-refresh` de OIDC usa el **refresh token** que emite Keycloak (sin
  iframe), por lo que no hace falta desplegar página adicional.

## Assets

Los estáticos (logos, imágenes de tarjeta/fondo, sonido del escáner, fuentes)
están en `public/assets/`. Si se actualizan en diseño, reemplazarlos ahí.
