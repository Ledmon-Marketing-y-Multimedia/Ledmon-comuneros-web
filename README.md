# Comuneros Marcón — front

Backoffice de la comunidad de montes de Marcón: **Next.js 16** (App Router,
Turbopack, React 19, Tailwind v4). Consume la API del repositorio
[`../Ledmon-comuneros-api`](../Ledmon-comuneros-api) (Laravel 13) bajo
`/comuneros/api/v1`, con token de Sanctum en `localStorage`.

## Puesta en marcha

```bash
npm install
npm run dev            # http://localhost:3000
```

Necesita la **API levantada** y un `.env.local` con:

```bash
NEXT_PUBLIC_API_URL=/api                                   # en dev, vía el proxy
API_PROXY_TARGET=http://localhost:8080/comuneros/api/v1    # destino del rewrite
```

En desarrollo `next.config.ts` reescribe `/api/*` hacia `API_PROXY_TARGET`
(equivalente al `proxy.conf.json` del Angular original). En producción se pone la
URL absoluta de la API; ver [`DEPLOY.md`](./DEPLOY.md).

### Todo en Docker

Alternativa a `npm run dev` cuando se quiere revisar el conjunto tal y como se
despliega (imagen de producción, sin hot-reload):

```bash
cd ../Ledmon-comuneros-api && docker compose up -d      # backend + nginx + postgres
cd ../Ledmon-comuneros-web && docker compose up -d --build
```

El `docker-compose.yml` de aquí levanta **solo el front** y se une a la red del
compose de la API, así que aquel tiene que estar arriba primero. Detalles en
[`DEPLOY.md`](./DEPLOY.md).

## Ramas y despliegue

```
fix/…, feat/…  ──PR──▶  develop  ──PR──▶  main
                        staging           producción
```

- **`develop`** es lo que corre en el staging de srv03 (web `192.168.30.103:8085`,
  API `:8086`, con una copia de la BD de producción). Todo cambio entra aquí por PR
  desde una rama corta con prefijo (`fix/`, `feat/`, `docs/`…).
- **`main`** es producción. Solo se cambia por PR desde `develop` (o desde un
  `hotfix/` que sale de `main` y luego vuelve a `develop`). Fusionar con merge
  commit o rebase, **nunca squash**: se rompe la relación con `develop`.
- **Se despliega desde srv03**, no desde el VPS: `/opt/ops/comuneros/deploy-comuneros.sh`
  (simula por defecto; `--apply` despliega y `--rollback` vuelve atrás). Se niega si
  lo que probó staging no tiene el mismo contenido que `origin/main`. Norma de la casa
  en `/opt/DESPLIEGUE.md` de srv03.
- El código anterior al cambio de stack vive en **`legacy/angular`**.

## Documentación

| Documento | Qué cuenta |
|---|---|
| [`docs/FUNCIONALIDADES.md`](./docs/FUNCIONALIDADES.md) | **Qué puede hacer el usuario en cada pantalla y a qué endpoint llama.** El sitio por donde empezar. |
| [`DEPLOY.md`](./DEPLOY.md) | Despliegue (Node, Docker o Vercel) y variables de entorno. |
| [`DEUDA_TECNICA.md`](./DEUDA_TECNICA.md) | Bugs heredados del Angular, decisiones aplazadas y qué queda sin cubrir por tests. |
| [`e2e/README.md`](./e2e/README.md) | Cómo se ejecutan los tests de extremo a extremo y qué hay que saber al escribirlos. |

## Estructura

```
src/app/          rutas (App Router). El grupo (admin) va tras el AuthGuard
src/features/     un módulo por dominio: comuneros, lugares, meetings,
                  announcements, accounts, files — cada uno con su api.ts
src/components/   ui/ (piezas compartidas), layout/, auth/
src/lib/          cliente API, auth, paginación, utilidades, pdf
src/types/        tipos de dominio
src/test/         dobles y arranque de los tests de componentes
e2e/              tests de extremo a extremo (Playwright)
```

Los tests de componentes viven **junto al componente** (`x.tsx` + `x.test.tsx`),
que es la costumbre del ecosistema; los de extremo a extremo, aparte en `e2e/`,
porque no son lo mismo: unos montan en jsdom con la API doblada, los otros abren un
navegador contra la API real.

## Componentes compartidos

`src/components/ui/` tiene las piezas que repetían todas las pantallas:

- **Listados:** `ListPageHeader` (título, recuento y barra de acciones), `ListTable`
  (cabecera + filas + paginador), `SearchInput`, `FilterSelect`, `Paginator`,
  `EmptyState`.
- **Formularios y detalle:** `FieldRow`, `FormActions`, `DetailCover`,
  `DetailAvatar`, `InfoRow`, `DetailPlaceholder`.
- **Comunes:** `Button` / `ButtonLink`, `Select` (desplegable propio sobre Radix,
  con variantes `pill`, `field` y `compact`), `StatusBadge`, `Modal` /
  `ModalFooter`, las confirmaciones y el `SplashScreen`.

Antes de escribir marcado nuevo, mirar si ya está aquí: el criterio es que una
clase repetida en dos sitios acaba divergiendo (había botones con `rounded` y con
`rounded-md`, y filas de formulario con y sin mensaje de error).

## Comprobaciones

```bash
npm test           # 59 tests de componentes (Vitest + Testing Library, jsdom)
npm run test:watch
npm run e2e        # 6 tests en navegador real contra la API (ver e2e/README.md)
npm run lint
npx tsc --noEmit
npm run build
```

Los de componentes no levantan Next: montan el componente de cliente y simulan la
API con el doble de `@/lib/api` (`src/test/api-double.ts`), así que la capa de datos
real —los hooks de cada `features/<recurso>/api.ts`— sí se ejercita.
`next/navigation` tiene su propio doble para controlar la ruta y espiar las
navegaciones.

> ⚠️ Antes de tocar código, leer [`AGENTS.md`](./AGENTS.md): Next 16 trae cambios
> que rompen respecto a versiones anteriores y la guía está en
> `node_modules/next/dist/docs/`.
