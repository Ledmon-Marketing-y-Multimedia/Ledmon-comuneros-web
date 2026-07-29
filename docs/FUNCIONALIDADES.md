# Funcionalidades — Front web (Ledmon Comuneros)

Catálogo funcional del front **`Ledmon-comuneros-web`** (Next.js 16 / React 19):
**qué puede hacer el usuario desde cada pantalla y cómo responde el backend**, más
la **autenticación y la gestión de usuarios**.

Es la aplicación de administración de una **comunidad de montes** ("comuneros"). Es
**monocomunidad**: trabaja siempre con la comunidad **Marcón** (`COMUNIDAD_ID` y el
sufijo `/search/marcon` están fijados en código — `src/features/*/api.ts`).

## Arquitectura relevante
- **Stack:** Next.js 16 (App Router, `output: standalone`), React 19, TanStack Query,
  react-hook-form + zod, Tailwind v4, Radix UI. Auth propia contra la API (token
  Bearer de Laravel Sanctum) — sin librerías de OIDC.
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

## 1. Autenticación

Login con **email + contraseña contra la propia API**. No hay IdP: `POST /login`
devuelve un token de Sanctum que viaja como `Authorization: Bearer` en cada
petición.

> Antes esto era OIDC (Authorization Code + PKCE) contra Keycloak. Se retiró el
> IdP por sobredimensionado para el proyecto; ver
> `docs/PLAN-RETIRADA-KEYCLOAK.md` en el repo de la API.

- **Estado de sesión** (`src/lib/auth/use-auth.ts`): el token se guarda en
  `localStorage` (`src/lib/auth/token-storage.ts`) y se lee con
  `useSyncExternalStore`, así que un login o un logout en **otra pestaña**
  re-renderiza la app sin recargar. No hace falta provider.
- **Pantalla de login** (`src/app/login/page.tsx` + `login-form.tsx`): formulario
  con react-hook-form + zod. Mensajes según la respuesta: `401` credenciales
  incorrectas, `429` demasiados intentos (la API limita a 5/minuto por IP), `422`
  datos inválidos. Tras entrar, va a `?next=…` si el guard lo puso, o a `/home`.
- **Guard de rutas** (`src/components/auth/auth-guard.tsx`): sin token →
  `/login?next=<ruta>`. Protege la **raíz** y **todo el grupo `(admin)`**. Mientras
  resuelve (hidratación), muestra el *splash*.
- **Bearer en cada request** (`src/lib/api.ts`): añade el token del storage.
- **Sesión caducada / 401:** el cliente API descarta el token y redirige a
  `/login?next=<ruta actual>`. Si el 401 viene de un login fallido (no había
  token), no redirige: el error lo muestra el formulario.
- **Logout:** ruta `/sign-out` → `POST /logout` (revoca el token en la API) +
  cuenta atrás y vuelta a `/login`. También en el menú de usuario
  (`src/components/layout/user-menu.tsx`).
- **Caducidad:** el token vive lo que diga `SANCTUM_EXPIRATION` en la API (12 h por
  defecto). **No hay refresh silencioso** (antes lo daba el refresh token de
  Keycloak): al caducar se vuelve a pedir el login.
- **Datos de la cuenta en pantalla:** el menú superior muestra el email de
  `GET /login/check` (`src/lib/auth/use-current-user.ts`), que devuelve también
  `isAdmin`.

> ⚠️ **No hay roles ni permisos.** El control general sigue siendo "estar
> autenticado": cualquier cuenta con sesión administra comuneros, direcciones,
> reuniones y comunicaciones. (El `role` que aparece en el código es el de dominio
> del comunero —HOLDER/AUTHORIZED—, no un rol de acceso.)
>
> La **única** excepción es `/usuarios`: requiere `isAdmin`. En el front se oculta
> el menú (`adminOnly` en `src/lib/navigation.ts`) y la ruta enseña un aviso
> (`src/components/auth/admin-only.tsx`), pero **quien decide es la API** (403 del
> middleware `admin`); lo del front es comodidad, no seguridad.

---

## 2. Gestión de usuarios (`/usuarios`)

Panel de administración de las **cuentas de acceso**, solo para cuentas con
`isAdmin`. Mismo patrón que el resto: listado maestro + ficha en panel lateral
(`src/features/accounts/`).

| El administrador puede… | Desde | Llama a |
|---|---|---|
| Ver las cuentas, buscar por nombre o email, filtrar por administradores o por quien no puede entrar | `/usuarios` | `GET /account` |
| Crear una cuenta (nombre, email, contraseña, admin, activa) | `/usuarios/new` | `POST /account` |
| Editar nombre, email, permiso de administrador y si está activa | `/usuarios/[id]` | `PATCH /account/{id}` (solo los campos que cambian) |
| Cambiar la contraseña de otra cuenta | botón **Contraseña** de la ficha | `PATCH /account/{id}/password` |
| Eliminar una cuenta | botón **Eliminar** (con confirmación) | `DELETE /account/{id}` |

Detalles que se ven en pantalla:

- El listado avisa de quién **no puede entrar**: *Desactivada* o *Sin clave*. En la
  ficha se explica por qué.
- Sobre **tu propia cuenta**, los interruptores de administrador y activa salen
  desactivados y no se ofrece Eliminar: la API lo rechazaría con `409` (nadie se
  deja fuera a sí mismo). Renombrarte o cambiarte el email sí se puede.
- Los `409` de la API (p. ej. "debe quedar al menos una cuenta administradora
  activa") se muestran **con su mensaje**, no con un error genérico
  (`src/features/accounts/account-error.ts`).
- Cambiar una contraseña o desactivar una cuenta **cierra las sesiones** de esa
  cuenta (la API revoca sus tokens); el modal lo advierte.

> **Cuenta ≠ comunero.** Un comunero es una **entidad de dominio** (`person` en la
> API) y nunca inicia sesión; una cuenta (`account`) es quien entra al backoffice.
> Hasta el 2026-07-29 compartían tabla en la API, con la contraseña conviviendo con
> el DNI y los teléfonos; ver `docs/PLAN-SEPARAR-CUENTAS.md` en el repo de la API.

> Pendiente (opcional): `PATCH /password` (que cada uno cambie **su** contraseña)
> sigue sin pantalla en el front; el reseteo por consola es
> `php artisan account:password <email>`.

---

## 3. Navegación y pantallas

Menú lateral (`src/lib/navigation.ts`): **Inicio**, **Direcciones** (`/lugares`),
**Comuneros**, **Reuniones**, **Comunicaciones** y, solo para administradores,
**Usuarios**.

| Ruta | Qué muestra |
|---|---|
| `/` | Raíz. Si hay sesión → `/home`; si no → `/login`. |
| `/login` | Acceso con email y contraseña (ruta pública). |
| `/home` | Dashboard con accesos a Reuniones, Comuneros, Direcciones, Comunicaciones. |
| `/comuneros` · `/comuneros/new` · `/comuneros/[id]` | Listado maestro + ficha/alta en panel lateral. |
| `/lugares` · `/lugares/[id]` | Listado de direcciones + ficha (el alta se crea in-place). |
| `/reuniones` · `/reuniones/new` · `/reuniones/[id]` | Listado + detalle de reunión (con overlay global de escaneo QR). |
| `/announcements` · `/announcements/new` · `/announcements/[id]` | Listado + detalle de comunicaciones. |
| `/usuarios` · `/usuarios/new` · `/usuarios/[id]` | Cuentas de acceso: listado + ficha/alta en panel lateral. **Solo administradores.** |
| `/sign-out` | Cierre de sesión. |

---

## 4. Comuneros

Pantallas `/comuneros*`. Un comunero tiene rol **HOLDER** (titular) o **AUTHORIZED**
(autorizado) y estado **ACTIVE**/**UNSUBSCRIBED**.

| El usuario puede… | Desde | Llama a | Respuesta del backend |
|---|---|---|---|
| Listar / buscar titulares (por nombre + estado) | Lista de comuneros (buscador con *debounce* + filtro de estado) | `GET /comunero/search/marcon?name=&status=` | `200` lista de Comunero |
| Ver la ficha de un comunero | Ficha | (se resuelve desde la lista ya cargada; no hay GET por id) | — |
| **Dar de alta** un comunero | Formulario "nuevo" | `POST /comunero` | `200` Comunero (crea también su `person`) |
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
