# Tests de extremo a extremo (Playwright)

Navegador real (Chromium) contra la app y la **API de verdad**. Complementan a los
de Vitest, que montan componentes en jsdom con `@/lib/api` doblado y por tanto no
ven el App Router, el CSS ni la integración con el backend.

```bash
npm run e2e            # todos, headless
npm run e2e:ui         # modo interactivo (en WSL funciona por WSLg)
npx playwright test --headed --project=chromium   # viendo el navegador
npx playwright show-trace test-results/<carpeta>/trace.zip   # traza de un fallo
```

## Qué hace falta

1. **El stack de la API en pie** (en `Ledmon-comuneros-api`):
   `docker compose up -d` y, si se ha recreado el backend, `docker compose restart nginx`.
2. **El front**: la config lo arranca (`npm run dev`) o reutiliza el que ya escuche
   en el 3000.
3. **Una cuenta administradora conocida.** Por defecto la del seeder de dev
   (`admin@example.com`); si tu contraseña es otra:

```bash
E2E_ADMIN_EMAIL=otra@example.com E2E_ADMIN_PASSWORD=… npm run e2e
```

Otras variables: `E2E_BASE_URL` (front, por defecto `http://localhost:3000`) y
`E2E_API_URL` (API, por defecto `http://localhost:8080/comuneros/api/v1`).

## Cómo tratan los datos

Escriben en la **BD real** del entorno, así que:

- Las cuentas que crean llevan el prefijo `e2e-` y se borran en el `afterAll`.
  Si una ejecución se interrumpe a medias, la siguiente las limpia igual.
- **Nunca** tocan `admin@example.com` más allá de leerla y de abrir su ficha: las
  guardas del backend impedirían borrarla, pero además no es asunto de un test.
- No apuntes estos tests a producción.

## Dos cosas que hay que saber al escribirlos

- **`POST /login` admite 5 intentos por minuto y IP.** Los tokens se cachean en
  `support/accounts.ts` y hay que llamar a `awaitLoginSlot()` **antes de cada login
  por formulario**: a la API le da igual si el intento viene del navegador o de un
  contexto de API. Sin eso, la suite se autobloquea con 429.
- **`baseURL` se resuelve como `new URL()`**: en las llamadas de API las rutas van
  **sin barra inicial** (`"login"`, no `"/login"`), o se pierde el prefijo
  `/comuneros/api/v1`.
