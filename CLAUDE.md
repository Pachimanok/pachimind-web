# PachiMind Web

Frontend de PachiMind. No es React/Vue/Next — es un único `index.html` estático
(~1900 líneas, CSS+JS inline) servido por un Express muy chico (`server.ts`).
Habla con Gemini directamente (por eso vive separado de `pachimind-api`, el
repo hermano en `../pachimind-api` que expone el vault por HTTP).

## Stack

- Node 20 + TypeScript (`server.ts`), bundleado con `esbuild` a `dist/server.cjs`
- `@google/genai` — todas las llamadas a Gemini (modelo `gemini-2.5-flash`)
- Sin framework de frontend: `index.html` es un SPA a mano (un objeto global
  `S`, `render()` re-renderiza todo el `innerHTML`, funciones `renderX()` por
  vista, todo con `onclick="..."` inline)
- PWA: `manifest.json` + `icon.svg` en la raíz (deben copiarse a `dist/` en el build)

## Comandos

```bash
npm install
npm run dev      # tsx server.ts, hot — puerto 3000 hardcodeado
npm run build    # esbuild + copia index.html/manifest.json/icon.svg a dist/
node dist/server.cjs   # correr el build (requiere node_modules junto a dist/,
                        # ver deploy/02-deploy.sh — no mover dist/ solo)
```

`PORT` admite una variable de entorno (default 3000); `HOST` permite limitar el bind (default 0.0.0.0). Para pruebas usar HOST=127.0.0.1 y un puerto libre.

## Variables de entorno (`.env`)

| Variable | Descripción |
|---|---|
| `AUTH_SECRET` | Semilla del HMAC que arma `authToken()` (login por contraseña única, no hay usuarios) |
| `FRONTEND_PASSWORD` | La contraseña de login del front |
| `GEMINI_API_KEY` | Para todas las llamadas `ai.models.generateContent` |
| `VITE_PACHIMIND_URL` | Base URL de `pachimind-api` (default `http://127.0.0.1:8000`), variable `PM_API_URL` en código |
| `PM_API_KEY` | API key con scope `personal` para pegarle a `pachimind-api` desde acá |
| `EXT_API_KEY` | Gatea `/api/ext/*` (integraciones externas, separado del login normal) |

## Auth

Un solo middleware global (después de `express.json()`) exige `Authorization:
Bearer <token>` en **todo** `/api/ai/*` **excepto** `/api/ai/chat/internal`
(esa es servidor-a-servidor, la llama `pachimind-api`'s `vault_linker.py` vía
`NODE_URL`, no tiene sesión de usuario). El token es
`HMAC-SHA256(AUTH_SECRET, FRONTEND_PASSWORD)` — se calcula, no se guarda; por
eso `/api/auth` no tiene estado de sesión real, solo valida la contraseña y
devuelve el hash siempre-igual como "token".

El proxy a `pachimind-api` (`VAULT_ROUTES`) requiere una sesión válida o una X-API-Key del consumidor. La clave externa se reenvía sin sustituirla por la personal. Sin ninguna credencial devuelve 401, salvo /health. El gateway `/api/memory/projects/...` exige sesión y reenvía a FastAPI `/projects/...`. La configuración Apache heredada puede evitar pasar por este proxy: revisar el enrutamiento y la inyección de API keys antes de desplegar.

## Rutas del servidor (`server.ts`)

| Ruta | Qué hace |
|---|---|
| `POST /api/auth`, `GET /api/auth/verify` | Login por contraseña |
| `POST /api/ai/review-note` | Gemini clasifica un borrador → `{suggested_title, suggested_tipo, ...}` (el front arma el `POST /notes` con esto) |
| `POST /api/ai/chat` | Chat multi-turno con contexto del vault |
| `POST /api/ai/chat/internal` | Server-to-server, sin auth de usuario — usado por `vault_linker.suggest_semantic_links()` de `pachimind-api` |
| `POST /api/ai/extract-facts` | "Sacar el jugo" — devuelve `{section_markdown}` con `## Puntos clave` + `## Datos duros`; el front hace el merge idempotente y el `PATCH /notes/{id}` |
| `POST /api/ai/transcribe` | Audio → texto (dictado en "Nueva nota") |
| `GET /api/ai/process-all` | SSE, clasifica en lote TODOS los borradores del Inbox vía Gemini — **reescribe el contenido** (no usar sobre reuniones/transcripciones largas, para eso está `/notes/{id}/promote` del lado de la API) |
| `GET/POST /api/ext/inbox/*` | Integraciones externas gateadas por `EXT_API_KEY`, no por el login normal |
| `VAULT_ROUTES` (proxy) | `/notes,/vault,/search,/projects,/actions,/decisions,/people,/clients,/inbox,/notebooklm,/attachments` → reenvía a `pachimind-api` con `PM_API_KEY` |

## Vistas del front (`index.html`, `VIEWS` + `S.view`)

`tablero` (dashboard + panel "Para revisar"), `nueva` (captura rápida, texto o
dictado), `reuniones` (importar de NotebookLM: notebooks → fuentes → import,
usa `/notebooklm/*` proxeado), `entidades`, `inbox` (triage de borradores:
clasificar con Gemini, descartar, o procesar todo), `chat`, `vault`, `tags`,
`sistema`.

Atajo mobile: `manifest.json` tiene un `shortcut` a `/?view=nueva`; el bootstrap
al final de `index.html` lee `?view=` de la URL antes del primer `render()`.

## Convenciones

- Todo el estado vive en el objeto global `S` (ver arriba de `index.html`).
  No hay Redux/Context/nada — cualquier función puede leer/escribir `S`
  directamente y llamar `render()`.
- Las funciones `renderX()` devuelven strings de HTML (template literals),
  nunca manipulan el DOM directo salvo casos puntuales (ej. el overlay-bg
  onclick se asigna después de `innerHTML=`).
- Los botones que llaman a Gemini (`review-note`, `chat`, `extract-facts`,
  `process-all`) siempre son manuales — no hay ningún disparador automático
  de Gemini sin que el usuario haga click en algo (a propósito: evita gastar
  cuota y evita clasificar/reescribir contenido sin que el usuario lo vea).
  La única excepción es `extractFactsForImported()`, encadenada al final de
  un import de reunión — deliberada, ver CLAUDE.md de `pachimind-api`.
- Build: `esbuild --external:express` — Express NO se bundlea, tiene que
  existir como `node_modules/express` al lado de `dist/server.cjs` en runtime
  (por eso el deploy hace `npm install --production` en el server, no solo
  copia `dist/`).

## Memoria y reuniones (octubre 2026)

La vista `memoria` permite consultar fuentes por proyecto, copiar/exportar Markdown, capturar reuniones y revisar propuestas. `/api/ai/meeting-proposals` lee una captura guardada y habilitada para IA, pide JSON con citas literales y filtra sugerencias inválidas. Solo se invoca con un clic explícito, no persiste nada ni aprueba decisiones. El flujo manual no depende de Gemini. Las propuestas guardadas se retoman desde la reunión después de recargar. La API conserva originales; el overlay no ofrece herramientas que reescriban `fuente_inmutable`.

Prueba del contrato con un proveedor simulado: `node scripts/test-meeting-proposals.cjs`. La demo local usa un vault ficticio; no conectar el watcher de desarrollo al vault real para probar escrituras.

## Gateway de producción (candidato)

Apache debe dejar de inyectar X-API-Key. /api/v1/ va a FastAPI, las rutas de browser/heredadas al gateway. El proxy conserva multipart y respuestas binarias. La ruta interna requiere X-PachiMind-Internal-Key igual a PM_API_KEY y está además bloqueada en Apache. Python recibe la misma PM_API_KEY desde el entorno compartido. Routing sensible a mayúsculas. Ver deploy/README.md de la API antes de aplicar.

## TODO — 2026-10-03

Vista ?view=todo para actividades personales y laborales. Crear actividad con proyecto opcional, responsable, prioridad y fecha; editar campos, completar/reabrir, filtrar abiertas/vencidas/hechas y buscar. Usa /actions/todo a través del gateway autenticado. Conflictos 409 requieren actualizar; no reintentar con revisión nueva sin intervención. Actividades y acciones aprobadas comparten Markdown; propuestas quedan fuera del TODO.
