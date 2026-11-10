# Notas y sus asociaciones

Vault incluye una auditoría de todas las notas visibles, con vistas de huérfanas,
sin nodo general cercano, referencias sin resolver y todas las notas. La lista se
pagina desde el servidor y permite buscar por título/ruta y filtrar por ámbito.
No aplica enlaces ni modifica notas. Los estados borrador/archivado se conservan.

Cada nota abierta muestra ámbitos registrados, proyectos, personas, organizaciones
y clientes relacionados, entradas/salidas y conexiones de dos pasos con su nota
intermedia. Un vínculo entrante evita un falso huérfano. La relación indirecta no
se presenta como pertenencia o rol; las propuestas pendientes no son conexiones.
Los errores de consulta se muestran como errores, no como falta de conexiones.

Requiere las rutas de sólo lectura `/vault/associations` y
`/vault/associations/{note_id}` de pachimind-api. La sesión y los permisos
existentes se mantienen. No se cambiaron el servidor Node, MCP ni OAuth.

## Prueba reproducible

Iniciar la demo sintética del repo API: `python scripts/association_preview.py`.
Crear un build con `npm ci` y `npm run build`. Para la prueba usar únicamente
variables ficticias, por ejemplo las documentadas en docs/people-v1.md de API:
AUTH_SECRET=preview-synthetic, FRONTEND_PASSWORD=preview-password,
GEMINI_API_KEY=preview-not-real, PM_API_KEY=test-personal,
VITE_PACHIMIND_URL=http://127.0.0.1:18000, HOST=127.0.0.1, PORT=18300.
Iniciar `node dist/server.cjs`, luego ejecutar `npm run test:associations`.
El runner sólo admite loopback y exige el marcador de fixture sintética correcto.
Usa Chromium instalado o CHROMIUM_PATH; guarda capturas en artifacts/associations
(o ASSOCIATION_SCREENSHOT_DIR). También se ejecutan las pruebas de Personas y
el contrato de propuestas de reuniones. No usar credenciales ni datos reales.

En cloud las dependencias pueden instalarse fuera del checkout, que contiene
node_modules históricos de otra plataforma. NODE_PATH apunta al directorio
externo y el build lo respeta. Nunca copiar `.env` al entorno de prueba.

## Publicación

Primero instalar/verificar la API nueva. Después publicar sólo dist/index.html,
dist/associations.js y dist/associations.css, con respaldos y comprobación de
hashes anteriores. No reinstalar people.js/css de una versión anterior ni cambiar
el proceso Node para estos assets. Si la versión productiva difiere, comparar antes
de reemplazar. Para revertir, restaurar los assets anteriores y el código API de
esta entrega; no restaurar el vault ni OAuth. No se aplican relaciones en lote.
