# Funcionalidades — Front web (Ledmon Comuneros)

Catálogo funcional del front **`Ledmon-comuneros-web`** (Next.js 16 / React 19):
**qué puede hacer el usuario desde cada pantalla y cómo responde el backend**, más
la **autenticación y gestión de usuarios con Keycloak**.

Es la aplicación de administración de una **comunidad de montes** ("comuneros"). Es
**monocomunidad**: trabaja siempre con la comunidad **Marcón** (`COMUNIDAD_ID` y el
sufijo `/search/marcon` están fijados en código — `src/features/*/api.ts`).

## Arquitectura relevante
- **Stack:** Next.js 16 (App Router, `output: standalone`), React 19, TanStack Query,
  react-hook-form + zod, Tailwind v4, Radix UI. Auth con `react-oidc-context` /
  `oidc-client-ts`.
- **Proxy a la API:** `next.config.ts` reescribe `/api/:path*` →
  `${API_PROXY_TARGET}/:path*`, con `API_PROXY_TARGET = http://<backend>/comuneros/api/v1`.
  Es decir, un `api.get("/comunero")` del front golpea `…/comuneros/api/v1/comunero`.
  > En las tablas se indica la **ruta relativa** que ve el front; el prefijo real del
  > backend es `comuneros/api/v1`.
- **Cliente HTTP:** `src/lib/api.ts` (`api.get/post/patch/put/delete`, `ApiError`,
  inyección del Bearer, manejo de 401).
- **Contrato:** la correspondencia acción→endpoint respeta el OpenAPI del backend
  (ver `docs/FUNCIONALIDADES.md` de `Ledmon-comuneros-api`). Las **ediciones usan
  `PATCH`** (no `PUT`) y el registro de asistencia usa `PATCH /attendance/register`.

---

## 1. Autenticación con Keycloak (OIDC)

El login es **100% en el cliente** con **OpenID Connect / Authorization Code + PKCE**.
No hay backend de sesión en el front: el token lo emite Keycloak y viaja como Bearer a
la API.

- **Configuración** (`src/lib/auth/oidc.ts`, variables `NEXT_PUBLIC_*` en `.env`):
  - `authority` = issuer del realm (`NEXT_PUBLIC_AUTH_ISSUER`, ej.
    `http://localhost:9090/realms/comuneros`).
  - `client_id` = `comuneros-app` (`NEXT_PUBLIC_AUTH_CLIENT_ID`).
  - `response_type: "code"` → **Code + PKCE**; `scope: "openid profile email"`.
  - `redirect_uri` = origen + `/` (por eso la ruta `/` actúa de **callback** OIDC).
  - `automaticSilentRenew: true`, `monitorSession: true`; tokens en `localStorage`.
- **Provider y callback:** `src/components/providers.tsx` monta `AuthProvider` con el
  `UserManager` (solo cliente). Tras el login limpia `code/state` de la URL y navega al
  destino guardado.
- **Guard de rutas:** `src/components/auth/auth-guard.tsx`. Si no hay sesión →
  `signinRedirect({ state: ruta })` (conserva a dónde iba). Protege la **raíz** y
  **todo el grupo `(admin)`**, es decir, toda la app de administración. Mientras
  resuelve, muestra un *splash*.
- **Bearer en cada request:** `src/lib/api.ts` toma `user.access_token` del UserManager
  (si no está expirado) y lo añade como `Authorization: Bearer …`.
- **Sesión caducada / 401:** ante un `401` de la API, el front hace `removeUser()` +
  `signoutRedirect()` (cierre en Keycloak) — la API responde `401` cuando el token falta,
  está expirado o su firma/issuer no cuadran.
- **Logout:** ruta `/sign-out` (`signoutRedirect()` + cuenta atrás) y opción "Cerrar
  sesión" en el menú de usuario (`src/components/layout/user-menu.tsx`).
- **Datos del usuario en pantalla:** el menú superior muestra el email obtenido de
  `GET /login/check` (`src/features/.../use-current-user.ts`).

> ⚠️ **Los roles de Keycloak NO se comprueban en el front.** El único control es "estar
> autenticado": cualquier usuario con sesión válida en el realm tiene acceso total a la
> administración. (El `role` que aparece en el código es el de dominio del comunero
> —HOLDER/AUTHORIZED—, no un rol de Keycloak.) Si se quisiera limitar por rol, habría
> que añadirlo aquí y/o activar el middleware `role:` del backend.

---

## 2. Gestión de usuarios

**El front no tiene pantalla de gestión de cuentas de Keycloak** (no hay alta/baja de
usuarios de acceso, ni asignación de roles, ni reset de contraseña). Ese ciclo de vida
de las **identidades** se hace en la **consola de administración de Keycloak**.

Lo más parecido es la gestión de **comuneros**, que es una **entidad de dominio** (no una
cuenta de login): al crear/editar un comunero, el front envía sus datos de usuario
(nombre, email, username, DNI, teléfonos) a la **API del backend** (`POST/PATCH
/comunero`), que mantiene el registro `_user` en Postgres. Un comunero **no es
necesariamente** alguien que inicia sesión — el login es, en la práctica, para el
administrador de la comunidad.

---

## 3. Navegación y pantallas

Menú lateral (`src/lib/navigation.ts`): **Inicio**, **Direcciones** (`/lugares`),
**Comuneros**, **Reuniones**, **Comunicaciones**.

| Ruta | Qué muestra |
|---|---|
| `/` | Raíz + callback OIDC. Si hay sesión → `/home`; si no, splash/login. |
| `/home` | Dashboard con accesos a Reuniones, Comuneros, Direcciones, Comunicaciones. |
| `/comuneros` · `/comuneros/new` · `/comuneros/[id]` | Listado maestro + ficha/alta en panel lateral. |
| `/lugares` · `/lugares/[id]` | Listado de direcciones + ficha (el alta se crea in-place). |
| `/reuniones` · `/reuniones/new` · `/reuniones/[id]` | Listado + detalle de reunión (con overlay global de escaneo QR). |
| `/announcements` · `/announcements/new` · `/announcements/[id]` | Listado + detalle de comunicaciones. |
| `/sign-out` | Cierre de sesión. |

---

## 4. Comuneros

Pantallas `/comuneros*`. Un comunero tiene rol **HOLDER** (titular) o **AUTHORIZED**
(autorizado) y estado **ACTIVE**/**UNSUBSCRIBED**.

| El usuario puede… | Desde | Llama a | Respuesta del backend |
|---|---|---|---|
| Listar / buscar titulares (por nombre + estado) | Lista de comuneros (buscador con *debounce* + filtro de estado) | `GET /comunero/search/marcon?name=&status=` | `200` lista de Comunero |
| Ver la ficha de un comunero | Ficha | (se resuelve desde la lista ya cargada; no hay GET por id) | — |
| **Dar de alta** un comunero | Formulario "nuevo" | `POST /comunero` | `200` Comunero (crea también su `_user`) |
| **Editar** un comunero | Ficha (formulario) | `PATCH /comunero/{id}` | `200` Comunero |
| **Dar de baja** | Botón "Dar de baja" → modal con comentario | `PATCH /comunero/{id}/status` (`{status:"UNSUBSCRIBED", comments}`) | `200` Comunero (fija `unsubscribedDate`) |
| **Borrar** | Botón "Borrar comunero" (confirmación) | `DELETE /comunero/{id}` | `200` |
| **Exportar PDF** (sencilla / completa) | Modal "Exportar" | *cliente* (jsPDF; sin API) | ver §8 |
| **Generar tarjeta con QR** | Botón "Tarjeta" | *cliente* (jsPDF + QR) | ver §8 |

Campos del formulario: nombre y apellidos (obligatorio), DNI, email, username, nº de
comunero (`code`), lugar (select), teléfonos (número + etiqueta) y checkbox "Recibir
comunicaciones por email" (`emailCommunication`).

---

## 5. Direcciones / Lugares

Pantallas `/lugares*`. Estado del lugar: **ACTIVE** / **SUSPENDED** / **UNSUBSCRIBED**.

| El usuario puede… | Desde | Llama a | Respuesta |
|---|---|---|---|
| Listar / buscar (por dirección; filtro de zona en cliente) | Lista de direcciones | `GET /lugar/search/marcon?address=` | `200` lista de Lugar |
| **Crear** una dirección | Botón "Nueva dirección" (o atajo Ctrl/⌘+`/`) | `POST /lugar` (`{comunidadId}`) | `200` Lugar (se crea vacío y navega a su ficha) |
| **Editar** la dirección y sus **autorizados** | Ficha | `PATCH /lugar/{id}` | `200` Lugar (puede crear comuneros AUTHORIZED) |
| **Borrar** | (acción disponible en la API) | `DELETE /lugar/{id}` | `200` |

Campos: dirección (obligatoria), zona (select), estado, población, código postal, y
lista de "Autorizados" (nombre + DNI). El titular se muestra como "Comunero" y el resto
como "Autorizado".

---

## 6. Reuniones / Asambleas

Pantallas `/reuniones*`. Incluye documentos, asistencia y escaneo QR.

### Reunión y documentos
| El usuario puede… | Desde | Llama a | Respuesta |
|---|---|---|---|
| Listar / buscar reuniones | Lista | `GET /meeting/search/marcon?query=` | `200` lista de Meeting |
| Ver el detalle | Ficha | `GET /meeting/{id}` | `200` Meeting |
| **Crear** una reunión | Formulario | `POST /meeting` | `200` Meeting (genera asistencias **ABSENT** de los titulares activos) |
| **Editar** | Formulario | `PATCH /meeting/{id}` | `200` Meeting |
| **Borrar** | (acción disponible en la API) | `DELETE /meeting/{id}` | `200` |
| **Subir un documento** (acta, cuentas…) | Modal "Subir documento" (título + fichero) | `POST /meeting/{id}/document` (multipart: `file` + `document`) | `200` Document (binario a Spaces) |
| **Borrar un documento** | Tarjeta del documento (confirmación) | `DELETE /meeting/{id}/document/{documentId}` | `200` |
| **Abrir/descargar** un documento | Click en la tarjeta | `GET /document?path=…` → `window.open(url)` | `200` URL temporal (texto) |

### Asistencia y escaneo QR
Overlay global "Escanear QRs" (`@zxing/browser`, multi-formato; sonido al registrar).

| El usuario puede… | Llama a | Respuesta |
|---|---|---|
| Alternar Presente/Ausente en la tabla | `PATCH /attendance/register` | `200` **todas** las asistencias de la reunión |
| Escanear el QR de un comunero (= dirección del lugar) | `GET /attendance/{meetingId}/lugar/{lugarId}` | `200` asistencias de ese lugar |
| Buscar un comunero por nombre (búsqueda manual) | `GET /attendance/{meetingId}/search?name=` | `200` asistencias que casan |
| Registrar la asistencia (con representación opcional) | `PATCH /attendance/register` | `200` lista de Attendance |

### Convocatoria desde la reunión y suspensión de ausentes
| El usuario puede… | Desde | Llama a | Respuesta |
|---|---|---|---|
| Crear la **convocatoria** de la reunión | Botón "Crear convocatoria" | `POST /announcement` | `200` Announcement (navega a su ficha) |
| Ir a la convocatoria ya existente | Botón (si `announcementId`) | navegación interna | — |
| Cargar **comuneros ausentes** (≥3 reuniones) | Modal "Suspender" | `GET /comunidad/{id}/absents` | `200` lista de Comunero |
| **Suspender** los seleccionados | Modal "Suspender" | `POST /comunidad/{id}/suspend` (`{comuneros:[…]}`) | `200` Announcement (suspende lugares + crea convocatoria de aviso) |

---

## 7. Comunicaciones / Convocatorias

Pantallas `/announcements*`. Editor de texto enriquecido (Quill) y envío por carta o email.

| El usuario puede… | Desde | Llama a | Respuesta |
|---|---|---|---|
| Listar / buscar | Lista (ordena por fecha) | `GET /announcement/search/marcon?address=` | `200` lista de Announcement |
| Ver el detalle | Ficha | `GET /announcement/{id}` | `200` Announcement |
| **Crear** una comunicación | Formulario (título + contenido + destinatarios) | `POST /announcement` | `200` Announcement |
| **Editar** | Formulario | `PATCH /announcement/{id}` | `200` Announcement |
| **Enviar por email** | Botón "Enviar por email" | `POST /announcement/email` (`{id, title, content, comuneros:[con email]}`) | `200` (eco del payload; el envío SMTP lo hace el backend) |
| **Imprimir cartas** (PDF combinado) | Botón "Imprimir comunicaciones" | *cliente* (jsPDF/pdf-lib/print-js) + descarga del doc "Cuentas" vía `GET /document` | ver §8 |

La pantalla separa destinatarios por **carta** y por **email**, con filtros (todos/altas/
suspensos), filtro por zona, multiselección de comuneros y opción "Incluir comuneros con
email". Solo aplica a titulares (HOLDER).

---

## 8. Funcionalidades especiales (lado cliente)

**Generación de PDF** — `src/lib/pdf/pdf-service.ts` (jsPDF + jspdf-autotable, pdf-lib
para combinar, print-js para el diálogo de impresión, `qrcode` para los QR):
- **Listado de comuneros** sencillo (nombre, DNI, estado) y completo (añade dirección,
  CP, población, provincia, fechas de alta/baja).
- **Tarjeta de comunero** (tamaño credit-card, doble cara) con **QR** que codifica la
  dirección del lugar.
- **Cartas de convocatoria**: renderiza el contenido sobre una plantilla, añade el QR de
  la dirección y combina todas en un único PDF para imprimir; puede anexar el documento
  "Cuentas" descargado desde Spaces (`GET /document`).

**QR:**
- **Lectura** con `@zxing/browser` para el registro de asistencia por cámara.
- **Generación** con `qrcode` (tarjeta del comunero y convocatorias), codificando la
  **dirección del lugar** como identificador de asistencia.

**Editor rich-text:** Quill (`src/components/ui/rich-text-editor.tsx`) para el contenido
de las comunicaciones.

---

## 9. Idiomas (i18n)

La interfaz está **en español** (`<html lang="es">`) y **hardcodeada**: no hay librería
i18n activa. Existen `public/assets/i18n/en.json` y `tr.json`, pero son **restos del
template original y no se usan**. Las etiquetas de estado se traducen en código
(`ACTIVE`→"Alta", `UNSUBSCRIBED`→"Baja", `SUSPENDED`→"Suspenso"; `PRESENT`→"Presente",
`ABSENT`→"Ausente").

---

## 10. Notas y limitaciones conocidas

- **Monocomunidad:** `COMUNIDAD_ID` y `/search/marcon` están fijados en código.
- **Sin control de roles** en el front (ver §1): cualquier sesión válida es admin total.
- **Detalle sin GET por id** en comuneros/lugares: la ficha se resuelve filtrando la
  lista ya cargada en cliente.
- El **email real** de convocatorias y el **almacenamiento en Spaces** los ejecuta el
  backend; verificarlos en integración (SMTP y credenciales de Spaces).

---

_Para el detalle de cada endpoint (payloads y respuestas), ver el documento equivalente
del backend: `Ledmon-comuneros-api/docs/FUNCIONALIDADES.md` y su Swagger UI en `…/docs`._
