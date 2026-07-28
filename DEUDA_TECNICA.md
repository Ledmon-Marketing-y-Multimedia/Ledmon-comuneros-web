# Deuda técnica y correcciones pendientes

> Hallazgos detectados durante la migración Angular → Next.js. La migración fue
> **1:1 en lógica**, así que algunos bugs del original se replicaron a propósito
> para no cambiar el comportamiento. Este documento los recoge para abordarlos
> de forma consciente más adelante.
>
> Leyenda: 🐞 bug real · 🧹 limpieza · ⚙️ mejora · 🔒 seguridad/observabilidad
> Estado: `[ ]` pendiente · `[x]` hecho

---

## Backend (repositorio de la API — corregir allí)

- [ ] 🐞 **Seeder no idempotente.** Al arrancar reinserta `admin@example.com`;
  si el registro ya existe → `duplicate key value violates unique constraint`
  y la app **no arranca**. Hoy hubo que recrear los volúmenes de Postgres.
  → Sembrar solo si no existe (`INSERT ... ON CONFLICT DO NOTHING` o comprobar antes).

---

## Front — bugs replicados 1:1 (revisar lógica de negocio antes de tocar)

- [ ] 🐞 **Escaneo QR sin coincidencias** (`features/meetings/meeting-shell.tsx`,
  `scanSuccessHandler`). El original hace: si hay asistencias muestra selección,
  **si no**, llama `registerAttendance(attendances[0])` con la lista vacía →
  `undefined`. Rama rota heredada. Decidir el comportamiento correcto (¿ignorar?
  ¿avisar "QR no reconocido"?).
- [ ] 🐞 **Subida de documento inconsistente** (reunión). En Angular convivían un
  `<input file>` oculto (pasaba un `FileList`) y el diálogo (pasa `{type,file}`).
  Se portó solo el flujo del diálogo. Confirmar que no hacía falta el otro.
- [ ] 🐞 **`searchAnnouncement` busca con parámetro `address`** (copy-paste de
  lugares; las convocatorias no tienen dirección). Verificar con el backend cuál
  es el parámetro correcto de búsqueda de comunicaciones.

## Front — endurecimientos ya aplicados (verificar que no cambian negocio)

- [x] 🐞 **`comuneros/list`**: acceso a `comunero.lugar.address/status` sin guard
  → añadido optional chaining (`?.`) para evitar crash con comuneros sin lugar.

## Front — limpieza / mejoras

- [ ] 🧹 **UUID de comunidad hardcodeado** (`a09b25f2-897b-4e33-bac5-d5e34f7245ce`)
  repetido en varios sitios. Centralizado parcialmente (`features/meetings/api.ts`
  y `features/lugares/api.ts`); unificar en una única constante de config/env.
- [ ] 🧹 **Estados vacíos**: el original mostraba en blanco (clave i18n
  `LAYOUT.COMPANY.USERS.NO_CASES` inexistente). Se pusieron textos "No existen …";
  revisar wording definitivo con cliente.
- [ ] ⚙️ **Drawer master-detail** (comuneros/lugares) es *overlay*; el Fuse original
  usaba modo `side` en pantallas grandes (empuja la lista). Evaluar si se quiere
  recuperar ese comportamiento en escritorio.
- [ ] ⚙️ **Fechas**: se formatean con `toLocaleDateString('es-ES')`. Si se quiere
  paridad exacta con Luxon/`transloco-locale`, unificar en un helper de fechas.
- [ ] ⚙️ **Editor rich-text**: se usa `react-quill-new` (Quill 2). Revisar la
  whitelist de fuentes (el original registraba `Arial`) si el PDF lo requiere.

## Front — refactor DRY (hecho, con las divergencias que se dejaron a propósito)

- [x] 🧹 Marcado repetido movido a `src/components/ui` (ver README). El detalle de
  comunero y el de dirección pierden ~40 % de líneas, y los tres listados se
  quedan en cabecera + `ListTable`.
- [ ] 🧹 El paginador de la **asistencia** de una reunión sigue siendo distinto
  (`compact`: sin rango, sin ir al principio/fin y con tamaños 5/10/20). Es lo que
  había; igualarlo a los listados es un cambio de interfaz, no un refactor →
  decidir con cliente.
- [ ] 🧹 El listado de **comuneros** no usa `ListTable`: agrupa por inicial y su
  fila lleva avatar y dos líneas. Si alguna vez se le pone paginador, revisar si
  merece un `GroupedListTable` o si se convierte en tabla normal.
- [ ] 🧹 El botón de `/login` mantiene su propio estilo (`rounded-md`, `py-2.5`) en
  vez de `Button`; la pantalla de acceso es la única con ese aspecto.

## Front — no migrado (restos de la plantilla Fuse / dead code)

- Métodos mock de `auth.service` (`signIn/signUp/signInUsingToken` contra
  `api/auth/*`), `lugares.uploadAvatar` (endpoint mock), `deleteLugares()` sin
  botón, `mock-api`, layouts alternativos, quick-chat, etc. → **descartados** por
  "migrar solo lo que se usa". Documentado por si algo se necesitara.

## Tests

- [x] Red de tests de componentes con Vitest + Testing Library (39 casos): los dos
  listados con paginador, el listado agrupado de comuneros y los paneles de
  detalle de dirección y comunero. Se escribieron **antes** del refactor DRY,
  para poder extraer componentes compartidos con red.
- [ ] Sin cubrir todavía: paneles de **reuniones** y **comunicaciones** (arrastran
  `react-quill-new` y `@zxing/browser`, que necesitan doble en jsdom), el overlay
  de escaneo QR y `pdf-service` (port verbatim).
- [ ] `domain.ts` declara `Meeting.date` y `Announcement.createdAt` como `Date`,
  pero la API manda cadenas ISO; el código compensa con `new Date(...)`. Los
  dobles de test imitan a la API y necesitan un cast doble. Conviene alinear el
  tipo con la realidad.

## Observabilidad / seguridad

- [ ] 🔒 **Sentry** no portado (el Angular usaba `@sentry/angular-ivy` sin DSN en
  el env). Si se quiere en producción, añadir `@sentry/nextjs`.
- [ ] 🔒 Revisar política de **expiración** del token de sesión (Sanctum,
  `SANCTUM_EXPIRATION` en la API, 12 h por defecto): no hay refresh silencioso, al
  caducar la API responde 401 y el front lleva a `/login`.
- [ ] 🔒 Token en `localStorage` (igual que antes con OIDC): expuesto a XSS. Si
  algún día front y API comparten dominio, valorar el modo cookie de Sanctum.
- [ ] Falta pantalla de **cambio de contraseña** (`PATCH /password` ya existe en la
  API).
