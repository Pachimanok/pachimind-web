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

## Explorador estilo Obsidian (actualización 12/11/2026)

El grafo ocupa el espacio disponible. Tiene controles SVG, paneles flotantes para
filtros/lista y detalle lateral (panel inferior en celular), y modo ampliado con
salida por botón o Escape. Se conserva el scroll del resto de la aplicación.

La distribución utiliza d3-force 3.0.0, con repulsión Barnes–Hut, resortes y
colisiones en un Web Worker local. El paquete va incluido en graph-layout.js; no
se consulta una CDN. El worker recibe IDs, radios, posiciones y extremos de vínculos,
no cuerpos de notas. Se incluye graph-layout.LICENSE.txt con las licencias MIT de
d3-force/d3-dispatch/d3-quadtree/d3-timer. Reduced-motion calcula sin animar la
convergencia; la simulación se detiene al estabilizar y se puede pausar/reanudar.

Por defecto muestra notas conectadas, sin nodos virtuales de ámbitos y en tonos
neutros. «Huérfanas ocultas» hace explícito el filtro; «Notas sin vínculos» en
Filtros permite incluirlas. Los ámbitos opcionales siguen usando líneas punteadas.
Se puede elegir color neutro/por tipo/por ámbito, flechas, etiquetas, separación y
distancia de vínculos. Tamaño de nodo según grado; hover/selección resaltan vecinos.
Arrastrar un nodo cambia su posición visual, sin modificar el vault. Doble clic
abre la nota y un toque permite seleccionarla y consultar el panel de detalle.

Se mantiene la API anterior y sus restricciones; no hay cambios en MCP, permisos
ni datos. La publicación requiere sólo assets estáticos y no reinicia servicios.
Si el worker no puede arrancar, hay aviso explícito y se mantiene la exploración
del dibujo inicial, sin afirmar que la distribución automática esté funcionando.

Pruebas específicas: worker real/encuadre, todo el alto disponible, arrastre y hover,
pausa, controles de fuerzas, huérfanas/ámbitos, colores, ampliación y Escape en
320/390/1440. Regresión de navegación/touch/pellizco/apertura/filtros en
360/390/768/1440, más 500 nodos/499 vínculos con reduced-motion.
