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
Assets 20261111-human3. Requiere publicar también API y server.cjs y reiniciar
API/Node por la ruta de actualización; MCP/OAuth permanecen conservados.
