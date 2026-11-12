# Navegación móvil y grafo del vault

En celular, la barra inferior muestra Tablero, TODO, Inbox, Grafo y Más. Más abre
un diálogo con todas las secciones; su contador refleja los pendientes de Humano.
La navegación de escritorio conserva el sidebar. Botones principales de al menos
44 px, inputs de 16 px en móvil, safe areas, altura dinámica y paneles con scroll
permiten usar los formularios y las notas sin ocultarlos bajo la barra. La búsqueda
global se despliega desde el encabezado y mantiene foco/cursor al actualizar datos.

Grafo representa las notas del vault en PachiMind; no incrusta ni ejecuta la app
nativa de Obsidian. Se abre desde la navegación, Vault → Abrir grafo o directamente
/?view=grafo. Cada nota también tiene Ver en grafo para explorar su entorno local.

- Arrastrar con un dedo o mouse desplaza. Pellizco, rueda o botones +/- cambian zoom.
- Encuadrar ajusta la vista. Tocar/clicar un nodo muestra título, ruta, ámbito y vecinos.
- Abrir nota conserva selección y cámara al cerrar el panel.
- Buscar y filtrar permite elegir título/ruta, tipo y ámbito; plegado por defecto
  en móvil para priorizar el lienzo. La lista paginada ofrece navegación alternativa.
- Los ámbitos son nodos virtuales con líneas punteadas: clasificación declarada,
  no relaciones ni pertenencia inferida. Vínculos entre notas proceden de las
  referencias resueltas y relaciones guardadas; no de propuestas pendientes.
- Colores distinguen proyectos, personas, organizaciones, clientes y otras notas.
  Las etiquetas priorizan la selección y evitan superposiciones.
- El dibujo usa Canvas local, sin bibliotecas/CDNs nuevas ni exportaciones. La
  simulación usa vecindarios espaciales y se detiene; reduced-motion evita animarla.

GET /vault/graph entrega sólo metadatos y extremos/tipo de vínculos. Reutiliza el
filtro de asociaciones; respeta scope, actor IA, fuentes, salud, rutas reservadas
y notas excluidas. No incluye cuerpos ni citas de evidencia. Cache-Control no-store.
Hasta 2.000 notas por defecto, máximo 3.000; indica explícitamente truncamiento.
?focus=ID muestra la nota y sus vecinos visibles. Un ID restringido retorna 404.
No crea, aprueba, archiva ni modifica datos o permisos. El MCP no cambia.

El manifiesto mantiene el modo standalone y suma el acceso directo Grafo para
plataformas que admitan shortcuts. El sitio requiere conexión y sesión; no agrega
sincronización offline ni almacenamiento local del grafo.

Pruebas: API de permisos/metadatos/foco/límites y originales intactos. Chromium
360/390 con gestos táctiles reales emulados y 768/1440 con mouse: navegación, botones,
zoom/pan, selección, apertura/regreso, filtros y ausencia de escrituras/errores JS.
Regresión de todas las listas con rueda/touch, chat, tags, paneles y posición; revisión
Humano y consentimiento individual de Inbox. Fixture adicional con 500 notas y
499 vínculos, reduced-motion. Las pruebas emulan tamaños/gestos: no se realizaron
sobre un iPhone físico.
