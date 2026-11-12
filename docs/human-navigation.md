# Continuar la revisión humana

Un conflicto de revisión bloquea Aprobar y su autorización porque la propuesta
corresponde a un estado anterior de la fuente o de sus relaciones. Comprobar
revisiones vuelve a consultar; no reemplaza revisiones para forzar una aprobación.
Una propuesta desactualizada debe reformularse y revisarse antes de aplicarse.

El detalle ofrece **Dejar pendiente y seguir** y **Volver a la lista** junto a
las decisiones. Seguir abre el siguiente pendiente de la vista filtrada, también
al cambiar de página. Al llegar al final vuelve a la lista con un aviso. Los
contadores y el estado pendiente se conservan; no ejecuta ninguna escritura.
La autorización nunca se arrastra de una propuesta a otra. Los errores al abrir
un detalle ofrecen las mismas salidas, además de Reintentar comprobación.

Se muestra la posición en la lista y una explicación del conflicto. Si falla la
consulta de la página siguiente se conserva la página actual y aparece un error.
Una decisión cuyo resultado todavía sea incierto debe comprobarse antes de usar
Seguir: su request_id se conserva para recuperar el recibo existente.

Validación: `npm run test:human` contra la demo sintética de API. Incluye conflicto,
seguir sin decidir, retorno a lista, paginación, error de página, último pendiente
y único resultado filtrado, además del recorrido de decisiones existente.

Publicación: sólo dist/index.html, dist/human.js y dist/human.css; versión de assets
20261111-human2. Conservar el bundle Node, API, MCP y todos los datos. No requiere
reiniciar servicios. Antes de reemplazar, verificar hashes y respaldar esos tres
archivos. Para rollback restaurar sólo esos destinos si conservan los hashes de
esta entrega. No restaurar el vault ni deshacer decisiones del usuario.

## Actualizar sin aplicar

La vista de conflicto ahora permite Actualizar propuesta, sin aplicar. Prepara
los mismos vínculos con revisiones actuales y reemplaza el pendiente anterior,
conservándolo para trazabilidad. La lectura/comprobación no escribe. La propuesta
nueva exige una autorización y aprobación separadas; no arrastra la casilla previa.
La respuesta perdida reintenta el mismo ID de creación para evitar duplicaciones.
Una evidencia que ya no es literal o un destino incompatible impiden actualizar.

Decisiones pendientes muestra vínculos, fichas y propuestas. Revisión opcional
agrupa las notas sin revisar sólo al elegirla; no incrementa el badge principal,
no se impone como paso previo ni cambia estados o permisos automáticamente.
Assets 20261111-human4. Requiere publicar también API y server.cjs y reiniciar
API/Node por la ruta de actualización; MCP/OAuth permanecen conservados.

## Limpiar la revisión opcional

En Revisión opcional, Limpiar avisos sin revisar oculta los avisos de la búsqueda
actual, incluyendo todas sus páginas. Dejar vacía la búsqueda para limpiar todos.
No se abren contenidos ni se marca revisado, no se archivan notas ni se cambian
permisos o propuestas. Un aviso reaparece si cambia la versión de su nota.

Ver avisos ocultos muestra los avisos apartados; Volver a mostrar avisos revierte
la preferencia con el mismo alcance de filtro. Una lista que cambia desde la carga
pide actualizar antes de limpiar. Reintentos tras una respuesta perdida reutilizan
el ID y recuperan el mismo recibo, sin repetir operaciones ni decisiones.

Assets 20261111-human5 y gateway/API coordinados. Sólo API y Node requieren reinicio;
MCP/OAuth conservados. La publicación no ejecuta limpiezas sobre datos reales.

## Destinos de acciones y decisiones

Tras aprobar una propuesta de reunión, el recibo permite abrir su resultado:
Ver en TODO enfoca la actividad real, sin completarla ni crear otra. Ver decisión
abre el registro guardado. Ver proyecto abre su memoria, y Ver reunión la fuente.

Ver acciones y decisiones aprobadas muestra resultados persistentes de reuniones,
con filtros por tipo/título/proyecto y paginación. Enlace guardable:
/?view=humano&human=aprobadas. Recargar conserva esa vista y la sesión. Pendientes
y descartadas no se mezclan con los registros aprobados. Toda navegación es lectura.
Los registros previos se resuelven por el circuito de aprobación existente, sin
migrar ni modificar sus notas o recibos. Se mantienen los controles de permisos.

Assets 20261111-human6, con API/gateway coordinados. Requiere reiniciar API/Node;
MCP/OAuth intactos. No se ejecutan aprobaciones ni creaciones en producción al probar.

## TODO: desplazamiento y actividad desde decisión

TODO deja crecer su contenido dentro del scroll principal (sin recortarlo por
flex/overflow:hidden). La barra superior conserva su altura y hay espacio para
los controles finales sobre la navegación móvil. Prueba: npm run test:todo-scroll,
con API/demo sintéticas; usa rueda y gestos táctiles con 35 tareas.

Crear tarea desde esta decisión está disponible en recibos/lista de aprobadas.
Abre un formulario editable en TODO, con proyecto y decisión vinculados. Guardar
actividad crea una tarea pendiente; no mueve, reescribe ni completa la decisión.
Responsable/fecha quedan vacíos. TODO ofrece Ver decisión de origen. Si falla la
respuesta, reintentar el mismo formulario conserva el ID y no duplica la actividad.

Assets 20261111-human7, API coordinada para origen/revisión/permisos. Sólo requiere
reinicio de API; Node sirve los assets sin reiniciar, y MCP/OAuth quedan conservados.

## Desplazamiento en todas las listas

Assets `20261111-scroll-all`: el contenido normal crece dentro de `.main-area`,
que es el contenedor de desplazamiento de la página. El flex anterior lo comprimía
con `overflow:hidden`, recortando las listas largas de Humano y otras vistas.
La barra superior conserva su altura; el espacio inferior permite llegar a los
últimos controles sobre la navegación móvil.

Tags y Chat mantienen paneles acotados con scroll interno: cada columna de Tags
se desplaza por separado, y el cuadro para escribir del Chat permanece accesible.
La búsqueda global usa el scroll normal incluso desde Tags o Chat. Redibujar la
misma vista conserva la posición; cambiar de vista la reinicia. Abrir/cerrar una
nota conserva la posición de la lista de origen.

`npm run test:list-scroll` usa sólo la demo local sintética (`HUMAN_PREVIEW_URL`)
y prueba rueda real, gestos táctiles móviles, acceso al último elemento, ausencia
de solapamientos y conservación de posición. Cubre Humano (pendientes, aprobadas,
opcionales), Vínculos, Tablero expandido, Memoria, TODO, Personas, Entidades,
Inbox, Reuniones (notebooks y fuentes), Vault, Sistema, búsqueda global,
ambos paneles de Tags, Chat y el detalle de una nota. No crea ni aprueba datos.
No sustituye los gestos por `scrollIntoView`, que puede mover contenedores recortados
y ocultar el problema. Capturas fuera del repositorio: `LIST_SCREENSHOT_DIR`.

Publicación: únicamente `dist/human.js` y `dist/index.html`, con respaldo/hash
previo y verificación HTTPS. No requiere reiniciar servicios. Rollback restaura
sólo esos dos assets; no restaurar el vault ni cambiar permisos OAuth.

## Contexto de las propuestas y decisiones

En Humano, las propuestas de acciones y decisiones muestran **De dónde viene**:
proyecto, reunión de origen y fecha registrada de esa reunión. Los títulos abren
las notas originales; el detalle identifica por separado la propuesta y su cita
literal. El mismo bloque aparece en recibos y resultados aprobados. La búsqueda
de pendientes/aprobadas también acepta el nombre del proyecto o la reunión.

Si no existe una fecha válida, se muestra Sin fecha confirmada. No se deduce del
nombre del archivo, del día de importación o de la aprobación. Los metadatos se
obtienen de las referencias explícitas que ya tenía la propuesta, respetando su
visibilidad. Consultar contexto no autoriza ni aprueba nada y no reescribe notas.
El catálogo incluye sólo procedencia; el contenido/evidencia se abre en el detalle.

Assets `20261111-decision-context`. `npm run test:decision-context` comprueba
escritorio/móvil, enlaces de origen, evidencia literal, fecha ausente y ausencia
de escrituras. `test:human` conserva el flujo de aprobación y `test:list-scroll`
incluye una lista larga de decisiones con contexto.

## Responsables y fechas en TODO

En TODO, + Actividad o Editar permiten indicar un responsable principal, varios
subresponsables (hasta 20, uno por línea), fecha de inicio y vencimiento. Todos son
opcionales y se pueden borrar. La lista muestra los nombres y las dos fechas;
la búsqueda incluye subresponsables. Editar desplaza el formulario a la vista.
No asigna personas ni fechas automáticamente al partir de una decisión.

El vencimiento no puede ser anterior al inicio. Al completar/reabrir se mantienen
las asignaciones y fechas planificadas. El texto, proyecto y referencia de origen
se conservan. Los datos nuevos se guardan en la actividad, sin modificar la reunión
o decisión. Assets 20261111-todo-assignments; requiere API y frontend coordinados.

`npm run test:todo-assignments` prueba crear, editar, recargar, borrar, búsqueda,
validación de fechas y reintento de respuesta perdida en escritorio/móvil, sólo
contra la demo sintética. Se mantiene la auditoría de scroll y el flujo Humano.

## Habilitar borradores para MCP

Cada fila de INBOX y su detalle tienen **Acceso MCP**. El cuadro consulta el
estado actual y muestra los permisos de lectura que cambiarían. Habilitar requiere
marcar la autorización de lectura completa y confirmar. El permiso sirve para MCP
y otras consultas IA, sin dar edición ni aprobar la nota: sigue como borrador con
el mismo estado de revisión. Cancelar/Escape no escribe.

La autorización se guarda fuera del archivo y queda ligada a su contenido exacto.
Si cambia el original, deja de aplicarse y se pide comprobar/autorizar de nuevo.
No se rebaja sensibilidad ni se habilitan fuentes vinculadas: salud, reservado,
privado/sensible/secreto o dependencias bloqueadas impiden habilitar desde aquí.
Un original inmutable puede habilitarse para lectura sin reescribirlo.

El mismo control permite revocar la autorización y recuperar los permisos del
archivo. Revocar no borra lo que un agente ya leyó. La revocación también está
accesible desde el panel de una nota autorizada después de su revisión documental.
Si el archivo ya permitía acceso IA, no se crea una autorización innecesaria.

Los endpoints son exclusivos de la sesión humana del propietario; una API key
externa o un actor assistant no puede otorgarse permisos. Respuestas perdidas
reutilizan el mismo request_id; un conflicto requiere comprobar y confirmar de
nuevo. Cambios sólo tras el clic del dueño: publicar el botón no habilita notas.

Assets 20261112-inbox-access. Prueba: `npm run test:inbox-access` contra demo
sintética; incluye escritorio/móvil, cancelación, confirmación, visibilidad y
revocación, respuesta perdida, conflictos, fuentes inmutables, sesión y contenido
sin cambios. La API incluye su suite de consentimiento y dependencias.
