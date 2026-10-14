# Portada Personas

Primera versión en `feat/people-knowledge`, coordinada con API/MCP. No desplegada.
SPA existente (S/render/api), sin framework nuevo. Personas aparece en navegación y
`?view=personas`. Sesión, login y selección de cuenta siguen usando el gateway actual.
No utiliza Gemini para crear, editar o vincular personas.

Archivos: people.js, people.css, index.html y assets equivalentes en dist/. Build
usa scripts/build.cjs (esbuild 0.24.2) y copia los assets. Instalar dependencias con
npm ci desde package-lock.json en el sistema de destino; el repo heredado contiene
node_modules de macOS. No copiar ese directorio para un runtime Linux.

La portada busca nombres/alias/organizaciones, tiene paginación y filtros múltiples
por ámbito (una persona, una ficha). Vistas: Por completar, Cambios pendientes,
Sin conexiones, Posibles duplicados y Sin enlaces salientes. Los contadores incluyen
entrantes/salientes visibles; una mención no confirma participación.

Crear exige sólo nombre y verifica fichas existentes. Edición manual incluye
campos opcionales, múltiples ámbitos, validación, vista previa y revisión explícita.
Los conflictos no se reintentan con una revisión nueva. Correcciones de clasificación
son puntuales; no se mueven archivos ni fusionan personas. Notas manuales se guardan
aparte del cuerpo original. El historial permite revertir sólo si no pisa cambios
posteriores. La ficha expone fuentes/fechas cuando existen y separa propuestas y
preguntas de los datos. La creación no confirma cargos, parentescos o reuniones.

Relaciones se preparan con destino real, tipo y revisión. Aplicarlas requiere
checkboxes de autorización; entradas/salidas pueden darse de baja desde la ficha.
Las fuentes inmutables conservan texto; relaciones se registran en la capa separada.
Una corrección de una ficha inmutable queda como propuesta y no se sobrescribe.
Datos sin fecha no reciben fechas inventadas.

Prueba: iniciar una demo API fresca con scripts/people_preview.py del repo API,
compilar web, ejecutarlo con variables ficticias apuntando a loopback y ejecutar
npm run test:people. El runner Playwright exige synthetic y no acepta una URL de
producción. Variables de prueba y pasos completos están en docs/people-v1.md de API.
Usa CHROMIUM_PATH, /usr/bin/chromium si existe o el navegador instalado de Playwright.
Las capturas son portada, ficha y móvil con datos demo; no personas reales.

La regresión de propuestas de reuniones sigue en npm run test:meeting con proveedor
simulado. Estado del archivo de entorno existente se conserva; no insertar claves
en HTML, JS ni dist. Para deployment/reversión/migración y contratos de la capa de
Personas, seguir docs/people-v1.md y ENDPOINTS.md de pachimind-api.
