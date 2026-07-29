# Despliegue — Front (comuneros-marcon, Next.js 16)

> Este documento cubre **solo el front**. El despliegue de la **API** está
> documentado en el repositorio `Ledmon-comuneros-api`. El front solo necesita la
> API accesible: **ya no hay IdP** (Keycloak se retiró; la sesión es un token de
> la propia API).

## Requisitos

- **Node.js ≥ 20.9** (Next.js 16 / Turbopack).
- La **API** accesible desde el navegador del usuario (CORS incluido).
- Una **cuenta** con contraseña en la API (`php artisan account:password <email>`
  allí, o desde el panel `/usuarios` si ya hay un administrador dentro).

## Variables de entorno

Queda **una** variable pública (las de Keycloak desaparecieron con el IdP). Se
inyecta **en tiempo de build** (queda embebida en el bundle), así que hay que
definirla antes de `next build`.

| Variable | Descripción | Ejemplo (prod) |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base de la API | `https://api-comuneros.montesmarcon.com/comuneros/api/v1` |
| `API_PROXY_TARGET` | (solo dev) destino del rewrite `/api` | `http://localhost:8080/comuneros/api/v1` |

> **Dev vs prod — el proxy `/api`:** en desarrollo `NEXT_PUBLIC_API_URL=/api` y
> `next.config.ts` reescribe `/api/*` → `API_PROXY_TARGET` (equivalente al
> `proxy.conf.json` de Angular). En **producción** se pone la **URL absoluta** de
> la API en `NEXT_PUBLIC_API_URL`; el navegador llama directamente a la API, por
> lo que **la API debe permitir el origen del front por CORS**.

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
- **Sesión:** el token de la API se guarda en `localStorage` y caduca según
  `SANCTUM_EXPIRATION` de la API (12 h por defecto). No hay refresh silencioso:
  al caducar, la API responde 401 y el front lleva a `/login`.
- **Recuperar contraseña:** no hay autoservicio. Un administrador la resetea desde
  el panel `/usuarios` del propio front, o por consola en la API con
  `php artisan account:password <email>`. Resetearla **cierra las sesiones** de esa
  cuenta. Que cada uno cambie la suya (`PATCH /password`) existe en la API pero
  todavía no tiene pantalla (ver `DEUDA_TECNICA.md`).

## Assets

Los estáticos están en `public/assets/`: logos (`logo.png`, `logo_corto.png`), la
portada de los paneles de detalle (`marcon_desde_salgueiral.jpg`), las imágenes que
usa el generador de PDF (`background_1.jpg`, `tarjeta-1.png`, `tarjeta-2.png`) y el
sonido del escáner QR (`sounds/ping.mp3`). Si se actualizan en diseño, reemplazarlos
ahí.

La **tipografía no está aquí**: Inter la carga `next/font` en `src/app/layout.tsx`
(por eso se borraron los `.woff2` que traía la plantilla).
