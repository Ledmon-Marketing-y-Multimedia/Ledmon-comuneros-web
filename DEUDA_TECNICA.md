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

- [x] 🐞 **Seeder no idempotente.** Reinsertaba `admin@example.com` y la app no
  arrancaba (`duplicate key value violates unique constraint`). Corregido con
  `firstOrCreate` por email.

---

## Front — bugs replicados 1:1 (revisar lógica de negocio antes de tocar)

- [x] 🐞 **Escaneo QR sin coincidencias** (`features/meetings/meeting-shell.tsx`).
  La rama estaba invertida —con la lista vacía llamaba a `registerAttendance(
  attendances[0])`, es decir `undefined`— y, como el guardia `inProgress` solo se
  liberaba en el camino feliz, **un QR desconocido dejaba el escáner mudo** hasta
  cerrar y volver a abrir. Ahora hay tres avisos (registrado / ya registrado / QR no
  reconocido) y el guardia se suelta siempre al retirarse el aviso.
- [ ] 🐞 **Subida de documento inconsistente** (reunión). En Angular convivían un
  `<input file>` oculto (pasaba un `FileList`) y el diálogo (pasa `{type,file}`).
  Se portó solo el flujo del diálogo. Confirmar que no hacía falta el otro.
- [x] 🐞 **Los documentos no funcionaban, en tres capas**: los metadatos se perdían
  (el `Blob` de JSON del multipart llega a PHP en `$_FILES`, no en los inputs, así
  que el documento se guardaba sin nombre), un fallo del almacén no se notaba (los
  discos tienen `throw => false`, la API respondía 200 y creaba la fila con el
  fichero en ninguna parte) y la descarga firmaba URLs de objetos inexistentes. Ver
  el commit en el repo de la API; en dev el disco de documentos es `local`
  (`DOCUMENTS_DISK`) para no necesitar credenciales de Spaces.
- [ ] 🐞 **`searchAnnouncement` busca con parámetro `address`** (copy-paste de
  lugares; las convocatorias no tienen dirección). Verificar con el backend cuál
  es el parámetro correcto de búsqueda de comunicaciones.

## Front — corregido

- [x] 🐞 **El escáner QR no abría la cámara** (`NotFoundError: Requested device not
  found`). `@zxing/browser` pide la cámara con `facingMode: 'environment'` **como
  exigencia** cuando no se le pasa un `deviceId`, así que fallaba en cualquier
  equipo cuya cámara no se declare trasera —todos los portátiles— y también sin
  cámara. Ahora el componente abre el stream él mismo con `{ ideal: 'environment' }`
  (preferencia, no exigencia) y se lo entrega al lector con `decodeFromStream`.
  Además el fallo se explica **en pantalla** en vez de acabar en `console.error`
  dejando un rectángulo negro: sin cámara, sin permiso, cámara ocupada o navegador
  sin acceso (el caso de servir el front por http:// desde el móvil), con botón de
  reintentar donde tiene sentido.

## Front — endurecimientos ya aplicados (verificar que no cambian negocio)

- [x] 🐞 **Alta de dirección creaba una fila vacía.** "Nueva dirección" hacía
  `POST /lugar` al pulsarla (herencia del Angular) y abría el detalle en edición:
  si nadie completaba el formulario quedaba un lugar sin dirección. Ahora hay
  `/lugares/new` y el lugar se crea al guardar, con `address` obligatoria.
  - Pendiente en BD: **limpiar los lugares sin `address`** que dejó el flujo
    anterior. El panel sigue abriendo en edición los que tengan `address` a NULL
    para poder completarlos, y `comunero-details` los excluye del selector de
    dirección.
  - `POST /lugar` ignora `comuneros` y fuerza estado Alta, así que el alta manda
    un PATCH extra **solo** si se rellenaron autorizados o se cambió el estado.
    Si algún día el alta acepta esos campos, quitar ese segundo viaje.
  - El comentario del `COALESCE` en `LugarService::findByComunidadUrl` (API) dice
    que el front crea el lugar sin dirección: ya no es así, pero el `COALESCE`
    sigue haciendo falta mientras existan filas con `address` a NULL.

- [x] 🐞 **`comuneros/list`**: acceso a `comunero.lugar.address/status` sin guard
  → añadido optional chaining (`?.`) para evitar crash con comuneros sin lugar.

## Reuniones — mejoras acordadas, pendientes de hacer

Salieron al revisar la pantalla el 2026-07-29, con la decisión ya tomada para cada
una:

- [ ] ⚙️ **Filtro de reuniones actuales / pasadas** en el listado, según el día de
  hoy, con el mismo patrón que el filtro de estado de comuneros (`FilterSelect` en
  la cabecera). Se puede resolver en cliente: `GET /meeting/search/marcon` ya
  devuelve la colección completa con su fecha.
- [ ] ⚙️ **Datepicker propio** en la ficha de reunión: hoy es un `<input type="date">`
  nativo y el aspecto lo pone el sistema operativo. **Acordado:**
  `react-day-picker` dentro de un Popover de Radix, estilado con Tailwind. Ojo:
  `@radix-ui/react-popover` se quitó al limpiar dependencias sin usar, hay que
  volver a añadirlo.
- [ ] ⚙️ **Aviso al poner una fecha pasada** al crear o editar una reunión.
  **Acordado:** avisar junto al campo pero **permitir** guardar — puede haber
  motivos legítimos para registrar una reunión ya celebrada. Hoy no hay ninguna
  validación, ni en el front ni en la API (`POST /meeting` acepta cualquier fecha).
- [ ] ⚙️ **Las asistencias solo se siembran al crear la reunión**
  (`MeetingService::create` recorre los comuneros titulares activos). Una reunión
  creada antes de dar de alta a un comunero **no tiene fila suya**, así que su QR no
  se reconoce: las tres reuniones de dev están así. Decidir si el alta de comunero
  debe añadirse a las reuniones futuras ya creadas.

## Reuniones — el QR identifica la dirección, no a la persona (decisión pendiente)

El QR que se imprime en la convocatoria contiene `comunero.lugar.address` —el texto
de la dirección— y la API busca las asistencias por igualdad exacta de esa cadena
(`GET /attendance/{meetingId}/lugar/{direccion}`). Consecuencias:

- Si se **corrige la dirección** de un lugar, los QR ya impresos dejan de coincidir.
- Dos lugares con la dirección escrita igual son indistinguibles.
- Cuando una dirección tiene varios titulares hay que desambiguar a mano; el diálogo
  «¿Quién asiste?» existe por eso, y **es el comportamiento deseado**: lo que importa
  es que asista el representante de cada dirección.
- [ ] Pendiente de decidir con el cliente el flujo completo (las bajas se dan según
  la presencia en reuniones). Opciones sobre la mesa: dejarlo como está, o meter el
  id en el QR aceptando también la dirección para no invalidar lo ya impreso.
- [ ] 🐞 En el diálogo de selección, «Añadir representante» usa `selecting[0]` —el
  primero de la lista— en vez del titular que se haya elegido.

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
- [ ] 🧹 **Icono del subidor de documentos** (`features/meetings/upload-document-modal.tsx`):
  es `PhotoIcon`, heredado de un ejemplo de Tailwind UI, en un diálogo que sube
  documentos. `DocumentArrowUpIcon` diría mejor lo que es; se dejó el glifo original
  para no cambiar el aspecto sin acordarlo.
- [ ] ⚙️ **Cabecera de comuneros a ~1000 px**: con cuatro controles (buscador,
  filtro, Exportar y Nuevo) las acciones parten en dos líneas. Es inherente al ancho;
  si molesta, la salida es un menú «⋯» para las acciones secundarias.
- [ ] ⚙️ **Listado de usuarios en móvil**: solo se ve el nombre (las demás columnas
  se ocultan bajo `md`, como en el resto de listados), así que no se distingue a los
  administradores sin abrir la ficha. Valorar mostrar el chip `Admin` junto al nombre
  en pantalla pequeña.

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
- [x] 🧹 Cabeceras de listado unificadas en `ListPageHeader` (las cinco pantallas
  habían divergido: buscador estirado en comuneros y encogido en las otras cuatro,
  botones con `md:w-44` frente a `md:w-fit`). Los títulos pasan a ser `h1`, que no
  lo eran en ninguna.
- [x] 🧹 Desplegables propios sobre Radix (`components/ui/select.tsx`): la lista de
  opciones de un `<select>` nativo la pinta el sistema operativo y no se puede
  estilar.

## Front — no migrado (restos de la plantilla Fuse / dead code)

- Métodos mock de `auth.service` (`signIn/signUp/signInUsingToken` contra
  `api/auth/*`), `lugares.uploadAvatar` (endpoint mock), `deleteLugares()` sin
  botón, `mock-api`, layouts alternativos, quick-chat, etc. → **descartados** por
  "migrar solo lo que se usa". Documentado por si algo se necesitara.

## Tests

- [x] Red de tests de componentes con Vitest + Testing Library (**59 casos**): los
  listados con paginador, el agrupado de comuneros, los paneles de detalle de
  dirección, comunero y usuario. Se escribieron **antes** del refactor DRY, para
  poder extraer componentes compartidos con red — y funcionó: al cambiar los
  desplegables a Radix cayeron exactamente los 6 que tocaban un `select`.
- [x] Tests de extremo a extremo con Playwright (**6 casos**, `npm run e2e`):
  navegador real contra la API real sobre el panel de usuarios. Cubren lo que jsdom
  no alcanza: el menú según quién eres, el aviso al entrar por URL sin permiso, que
  una cuenta recién creada inicie sesión y que un reseteo de contraseña cierre la
  sesión abierta. Ver `e2e/README.md`.
- [x] **Escáner QR**: 9 casos de componente (doblando `getUserMedia` y el lector de
  @zxing) más 2 e2e en navegador real, uno con la cámara simulada de Chromium y otro
  sin cámara.
- [ ] Sin cubrir todavía: paneles de **reuniones** y **comunicaciones** (arrastran
  `react-quill-new`, que necesita doble en jsdom) y `pdf-service` (port verbatim).
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
