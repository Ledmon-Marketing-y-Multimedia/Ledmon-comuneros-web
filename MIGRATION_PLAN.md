# Plan de migración — Frontend Angular → Next.js 16

> ## 📌 Estado actual (2026-07-23)
> Migración de módulos **completada** en `core/rebuild-to-nextjs`. El Angular
> original se conserva íntegro en `Ledmon-comuneros-web-copy` como referencia.
>
> **Decisiones tomadas con el cliente:** OIDC en cliente 1:1 (oidc-client-ts +
> react-oidc-context), TanStack Query, Tailwind puro + Radix mínimo.
>
> **Hecho** (build/typecheck/lint en verde, dev server arranca):
> - Scaffold Next.js 16 (App Router, Turbopack, TS, Tailwind v4) + tema Fuse portado.
> - Núcleo: tipos de dominio, cliente API con Bearer + manejo de 401, TanStack Query.
> - Auth Keycloak 1:1 en cliente (Code+PKCE, silent refresh, AuthGuard, /login/check).
> - Layout classic (sidebar + header + menú usuario + footer) y Home.
> - Módulos: **Comuneros**, **Lugares**, **Comunicaciones**, **Reuniones** (QR con
>   @zxing, asistencia, documentos, PDF con jsPDF/pdf-lib, convocatorias, suspensión).
> - `pdf.service.ts` portado verbatim; editor rich-text con react-quill-new.
>
> **Ramas:** una `feat/next-*` por hito, integradas por merge a `core/rebuild-to-nextjs`.
>
> **Pendiente:** verificación de paridad funcional contra el backend real (requiere
> API Laravel/Java + Keycloak levantados), tests (Fase 7), CI/CD (Fase 8) y cutover.

> **Proyecto:** `comuneros-marcon` (gestión de comunidad de montes de Marcón)
> **Origen:** Angular 17 + plantilla Fuse + Angular Material + Tailwind 3
> **Destino:** Next.js 16 (App Router) + Tailwind + Radix (shadcn/ui)
> **Backend:** Java (`/comuneros/api/v1`) → migración paralela a Laravel (rama `core/rebuild-to-laravel`)
> **Rama de trabajo del front:** `core/rebuild-to-nextjs`

---

## 0. Estado actual (inventario)

### Stack origen
- Angular 17.0.3 + plantilla **Fuse v19** (mucho boilerplate: layouts, mock-api, componentes demo).
- UI: **Angular Material 17** + Tailwind 3.3 + componentes Fuse.
- Estado/datos: **servicios + RxJS `BehaviorSubject`** + **resolvers** de ruta + **guards**.
- Formularios: **Reactive Forms** de Angular.
- Auth: **Keycloak** (OAuth2/OIDC, Auth Code + PKCE) vía `angular-oauth2-oidc`. Realm `comuneros`, client `comuneros-app`.
- i18n: **Transloco** (ES) + `transloco-locale`.
- Monitorización: **Sentry** (`@sentry/angular-ivy`).
- Gráficas: **ApexCharts** (`ng-apexcharts`).
- QR: **@zxing** (`ngx-scanner`) para asistencia a reuniones.
- PDF: **jspdf**, **jspdf-autotable**, **pdf-lib**, **print-js** (+ `pdf.service.ts` ≈ 860 KB, probablemente con fuentes embebidas).
- Rich text: **Quill** (`ngx-quill`).
- Fechas: **Luxon**.
- Hosting actual: **Firebase Hosting** (`firebase.json`, `.firebaserc`).

### Módulos de negocio a migrar (lo importante)
| Módulo | Rutas | Notas |
|---|---|---|
| `home` | `/home` | Dashboard / inicio |
| `comuneros` | `/comuneros`, `/comuneros/new`, `/comuneros/:id` | CRUD, lista + detalle en drawer, `canDeactivate` |
| `lugares` | `/lugares`, `/lugares/:id` | CRUD lugares/propiedades, lista + detalle en drawer |
| `meeting` (reuniones) | `/reuniones`, `/reuniones/new`, `/reuniones/:id` | Asambleas: **escaneo QR**, documentos, **PDF**, asistencias |
| `announcement` (convocatorias) | `/announcements`, `/announcements/new`, `/announcements/:id` | **Editor rich-text (Quill)** |

### Superficie de API (backend Java → Laravel)
`/comunero`, `/lugar`, `/meeting`, `/attendance`, `/announcement`, `/document`, `/comunidad/{id}/(absents|suspend)`, `/login/check`, más subrutas: `/{id}/status`, `/{id}/document`, `/{meetingId}/lugar/{lugarId}`, `/search/marcon`, `/register`, `/email`.

### Modelos de dominio (a portar a tipos TS + Zod)
`Comunero`, `User`, `NewComunero`, `Lugar`, `Meeting`, `MeetingAttendance`, `Announcement`, `Country`, `Tag` y enums `ComuneroStatus`, `ComuneroRole`, `LugarStatus`.

---

## 1. Decisiones de arquitectura (a confirmar antes de empezar)

| Tema | Recomendación por defecto | Alternativas |
|---|---|---|
| **Ubicación del código** | Reconstruir Next.js **en la raíz de la rama** `core/rebuild-to-nextjs`, moviendo el Angular actual a `legacy/` de forma temporal para poder comparar paridad | Subcarpeta `web/` · repo nuevo |
| **Librería de componentes** | **shadcn/ui** (Radix Primitives + Tailwind, copy-in, sin dependencia pesada) | Radix puro + estilos propios |
| **Auth** | **Auth.js (NextAuth v5)** con provider **Keycloak** (mismo realm/cliente) | Mantener `oidc-client-ts` en cliente |
| **Data fetching / estado servidor** | **TanStack Query** (cliente) + `fetch` en Server Components donde aplique | SWR · RSC-only |
| **Estado UI global** | **Zustand** (ligero) + Context puntual | Redux Toolkit |
| **Formularios + validación** | **React Hook Form + Zod** | Formik |
| **i18n** | **next-intl** (App Router) | react-i18next |
| **Gráficas** | **react-apexcharts** (menor fricción con lo existente) | Recharts / Tremor |
| **Rich text** | **Tiptap** (moderno, mantenido) | react-quill (migración 1:1 más directa) |
| **QR** | **@zxing/browser** en client component | html5-qrcode |
| **PDF** | Reutilizar **jspdf/pdf-lib** en cliente; evaluar mover generación pesada a Laravel | Generación server-side en Laravel |
| **Fechas** | **date-fns** (o mantener Luxon) | Day.js |
| **Tests** | **Vitest + Testing Library** (unit) + **Playwright** (e2e) | Jest / Cypress |
| **Hosting/deploy** | Definir: **Vercel** vs **Node self-host** vs export estático (Next 16 necesita runtime Node para SSR/RSC; Firebase Hosting solo sirve estáticos sin Cloud Functions) | Docker + servidor propio |
| **Node** | Node 20 LTS+ (Next 16 requiere Node ≥ 20.9) | — |

> Las decisiones marcadas afectan a estructura y despliegue; se validan con el cliente antes de la Fase 2.

---

## 2. Fases del proyecto

Cada fase termina con **commit(s) descriptivos** y, en hitos, **PR a `core/rebuild-to-nextjs`**. Convención de commits: `feat|fix|chore|docs|refactor(scope): mensaje`.

### Fase 0 — Preparación y decisiones ✅ (este documento)
- [x] Inventario del proyecto actual.
- [ ] Confirmar decisiones de arquitectura (§1) con el cliente.
- [ ] Acordar contrato de API con el equipo de Laravel (paridad de endpoints y payloads).
- **Hito Git:** commit de `MIGRATION_PLAN.md`.

### Fase 1 — Scaffolding del proyecto Next.js 16
- [ ] `create-next-app` (App Router, TypeScript, Tailwind, ESLint, Turbopack).
- [ ] Configurar **Tailwind** (portar tokens/tema de `tailwind.config.js` actual: colores Fuse, tipografía).
- [ ] Instalar e inicializar **shadcn/ui** (Radix) + tema base (light/dark).
- [ ] Prettier + ESLint (config del proyecto) + `tsconfig` con paths (`@/...`).
- [ ] Variables de entorno (`.env`): API URL, Keycloak issuer/client, Sentry DSN.
- [ ] Estructura de carpetas: `app/`, `components/`, `lib/`, `features/`, `types/`, `hooks/`.
- **Hito Git:** PR "chore: scaffold Next.js 16 + Tailwind + Radix".

### Fase 2 — Núcleo transversal (infra)
- [ ] **Cliente HTTP/API** con inyección de token (wrapper `fetch` + interceptores de error/refresh).
- [ ] **Tipos de dominio** + esquemas **Zod** (portados de `*.types.ts`).
- [ ] **i18n** con next-intl (extraer traducciones de `assets/i18n`).
- [ ] **Sentry** (`@sentry/nextjs`).
- [ ] **TanStack Query** provider + convención de query keys.
- [ ] Utilidades (fechas, formato ES, helpers de `AuthUtils`).
- **Hito Git:** PR "feat(core): API client, tipos+zod, i18n, sentry, query".

### Fase 3 — Autenticación (Keycloak)
- [ ] **Auth.js** con provider Keycloak (realm `comuneros`, PKCE).
- [ ] Middleware de protección de rutas (equivalente a `AuthGuard`/`NoAuthGuard`).
- [ ] Gestión de sesión/refresh de token + `login/check` contra backend.
- [ ] Páginas de auth: sign-in, sign-out, forgot/reset password, confirmation, unlock.
- **Hito Git:** PR "feat(auth): login Keycloak con Auth.js + middleware".

### Fase 4 — Layout y sistema de diseño
- [ ] Layout principal (equivalente al `classic` de Fuse): navbar lateral, header, navegación.
- [ ] Layout vacío (auth) y responsive.
- [ ] Componentes base con Radix/shadcn: botones, inputs, selects, dialog/drawer, table, tabs, toast, tooltip, menu.
- [ ] Tema (dark/light), iconos, densidad.
- [ ] Navegación/menú lateral portado (`core/navigation`).
- **Hito Git:** PR "feat(ui): layout principal + librería de componentes base".

### Fase 5 — Migración por módulos de negocio
Orden por dependencias (comuneros y lugares son base de los demás):

1. [ ] **Home / Dashboard** (`/home`) — incluye gráficas ApexCharts. → PR
2. [ ] **Comuneros** (`/comuneros`) — lista + detalle drawer, alta/edición, teléfonos, estados/roles, tags. → PR
3. [ ] **Lugares** (`/lugares`) — lista + detalle, estados, suspensión/baja. → PR
4. [ ] **Announcements / Convocatorias** (`/announcements`) — **editor rich-text**, envío por email. → PR
5. [ ] **Reuniones / Meetings** (`/reuniones`) — el más complejo:
   - [ ] Lista + detalle + alta.
   - [ ] **Escaneo QR de asistencia** (@zxing en client component).
   - [ ] Gestión de **documentos** (subida/descarga).
   - [ ] **Generación de PDF** (portar `pdf.service.ts`; decidir cliente vs Laravel).
   - [ ] Asistencias, representaciones, ausentes/suspendidos (`/comunidad`).
   - → PR (posible división en varios PRs)

### Fase 6 — Funcionalidad transversal restante
- [ ] Búsqueda global, notificaciones, ajustes de usuario, atajos (según se usen realmente).
- [ ] Manejo de errores/estados vacíos/carga consistente.
- [ ] Accesibilidad (Radix ayuda) y responsive final.
- **Hito Git:** PR "feat: funcionalidad transversal + pulido UX".

### Fase 7 — Calidad y testing
- [ ] Tests unitarios (Vitest + Testing Library) de componentes y utilidades críticas.
- [ ] Tests e2e (Playwright) de flujos clave: login, alta comunero, crear reunión + QR, generar PDF.
- [ ] Auditoría a11y y de rendimiento (Lighthouse).
- **Hito Git:** PR "test: cobertura unit + e2e de flujos críticos".

### Fase 8 — CI/CD y despliegue
- [ ] GitHub Actions: lint + typecheck + tests + build en cada PR.
- [ ] Configurar entorno de despliegue elegido (§1) + variables de entorno por entorno (dev/staging/prod).
- [ ] Integración con backend Laravel (CORS, proxy, contratos).
- **Hito Git:** PR "chore(ci): pipeline y despliegue".

### Fase 9 — Cutover y cierre
- [ ] Verificación de **paridad funcional** contra la app Angular.
- [ ] Migrar dominio/hosting; retirar `legacy/` Angular.
- [ ] Documentación (`README`, onboarding) y traspaso.
- **Hito Git:** merge de `core/rebuild-to-nextjs` → `develop`/`master` según flujo.

---

## 3. Estrategia de registro en GitHub
- **Rama raíz de facto:** `core/rebuild-to-nextjs`. Se trata como la base del proyecto; **`master` y `develop` se ignoran** en esta migración.
- Todas las **feature branches se sacan de `core/rebuild-to-nextjs`** (p. ej. `feat/next-scaffold`, `feat/next-comuneros`) y se integran de vuelta a ella por **PR**.
- Un **PR por hito/fase** con checklist de paridad.
- Commits pequeños y descriptivos con convención `tipo(scope): mensaje`.
- Cada hito importante = commit + push.

## 4. Riesgos y puntos de atención
- **`pdf.service.ts` (860 KB):** casi seguro fuentes/plantillas embebidas; evaluar mover generación a Laravel o extraer assets.
- **Cambio de paradigma** RxJS/servicios/resolvers → RSC + TanStack Query (mayor esfuerzo de rediseño que "traducción 1:1").
- **Keycloak con Auth.js:** verificar flujo PKCE, refresh y `logoutUrl` equivalentes.
- **Coordinación con Laravel:** los contratos de API deben mantenerse estables o versionarse.
- **Hosting:** Next 16 (RSC/SSR) no encaja en Firebase Hosting estático puro; decidir runtime.
- **Fuse:** no hay equivalente directo; el layout se reconstruye con Radix/shadcn.

---

_Documento vivo — se actualiza al cerrar cada fase._
