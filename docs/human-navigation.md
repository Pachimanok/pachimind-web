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
