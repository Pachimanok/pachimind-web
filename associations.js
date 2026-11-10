// Read-only connections. Suggestions and broken references are never shown as applied links.
function newAssociationState(){return {data:null,loading:false,error:null,view:'orphans',ambito:'',q:'',page:1,request:0};}
function associationState(){return S.associations||(S.associations=newAssociationState());}
async function associationJSON(path){const r=await api(path);if(!r.ok)throw new Error('No se pudieron consultar las asociaciones. Reintentá.');return r.json();}
async function loadAssociationAudit(){
  const state=associationState(),request=++state.request;
  state.loading=true;state.error=null;render();
  const params=new URLSearchParams({view:state.view,ambito:state.ambito,q:state.q,page:state.page,per_page:20});
  try{const data=await associationJSON('/vault/associations?'+params);if(request===state.request)state.data=data;}
  catch(e){if(request===state.request)state.error=e.message;}
  finally{if(request===state.request){state.loading=false;render();}}
}
function associationView(view){const s=associationState();s.view=view;s.page=1;loadAssociationAudit();}
function associationSearch(){const s=associationState();s.q=document.getElementById('association-query').value;s.ambito=document.getElementById('association-ambito').value;s.page=1;loadAssociationAudit();}
function associationPage(delta){associationState().page+=delta;loadAssociationAudit();}
function associationNodeButton(n,extra=''){return `<button type="button" class="association-node" data-note-id="${esc(n.id)}" onclick="openNote(this.dataset.noteId)" title="${esc(n.path)}">${esc(n.title)}${extra?`<small>${esc(extra)}</small>`:''}</button>`;}
function associationAmbitos(values){return values.length?values.map(v=>`<span class="association-ambito">${esc(v)}</span>`).join(''):'<span class="association-muted">Ámbito sin registrar</span>';}
function associationStatus(n){return n.orphan?'Sin conexiones visibles':n.no_general_node?'Sin nodo general cercano':'Con conexiones';}
function renderAssociationAudit(){
  const s=associationState(),d=s.data;
  return `<section class="association-audit" aria-labelledby="association-title">
    <div class="association-head"><div><h2 id="association-title">Notas y sus asociaciones</h2><p>Revisá huérfanas, ámbitos y nodos generales. Se cuentan vínculos entrantes y salientes.</p></div><button type="button" class="btn btn-ghost" onclick="loadAssociationAudit()" ${s.loading?'disabled':''}>Actualizar asociaciones</button></div>
    ${d?`<div class="association-stats"><span><strong>${d.summary.notes}</strong> notas visibles</span><span><strong>${d.summary.orphans}</strong> sin conexiones</span><span><strong>${d.summary.no_general_node}</strong> sin nodo general cercano</span><span><strong>${d.summary.unresolved}</strong> con referencias sin resolver</span><span><strong>${d.summary.no_ambito}</strong> sin ámbito</span></div>`:''}
    <p class="association-muted">Nodos generales: proyectos, personas, organizaciones y clientes. Estas vistas pueden superponerse.</p>
    <div class="association-views" aria-label="Vistas de asociaciones">${[['orphans','Huérfanas'],['no_general','Sin nodo general'],['unresolved','Referencias sin resolver'],['all','Todas las notas']].map(([v,label])=>`<button type="button" class="btn ${s.view===v?'btn-primary':'btn-ghost'}" aria-pressed="${s.view===v}" data-view="${v}" onclick="associationView(this.dataset.view)">${label}</button>`).join('')}</div>
    <form class="association-filters" onsubmit="event.preventDefault();associationSearch()"><label>Buscar nota<input class="fi" id="association-query" maxlength="200" placeholder="Título o ruta" value="${esc(s.q)}"></label><label>Ámbito<select id="association-ambito"><option value="">Todos los ámbitos</option>${(d?.ambitos||[]).map(a=>`<option value="${esc(a)}" ${s.ambito===a?'selected':''}>${esc(a)}</option>`).join('')}</select></label><button type="submit" class="btn btn-ghost">Filtrar notas</button></form>
    <p class="association-muted">${esc(d?.scope_note||'Sólo se muestran notas y conexiones que tu cuenta puede consultar.')} Tener un ámbito no equivale a tener enlaces.</p>
    ${s.error?`<p role="alert" class="alert-err">${esc(s.error)}</p>`:''}
    ${s.loading?'<p role="status">Consultando todas las notas visibles…</p>':d&&!s.error?`<p class="association-muted">${d.total} notas en esta vista · página ${d.page} de ${Math.max(1,Math.ceil(d.total/d.per_page))}</p><div class="association-list">${d.results.map(n=>`<article class="association-card"><div class="association-head"><div>${associationNodeButton(n)}<small class="association-path">${esc(n.path)}</small></div><span class="association-status ${n.orphan?'is-orphan':''}">${associationStatus(n)}</span></div><div class="association-chips">${associationAmbitos(n.ambitos)}</div><p class="association-muted">${n.connection_count} ${n.connection_count===1?'nota vinculada':'notas vinculadas'} · ${n.incoming_count} enlaces entrantes · ${n.outgoing_count} salientes${n.estado?` · ${esc(n.estado)}`:''}</p>${n.general_nodes.length?`<div class="association-chips">${n.general_nodes.map(g=>associationNodeButton(g,g.depth===1?'Vínculo directo':'Vía '+g.via.title)).join('')}</div>${n.general_node_count>n.general_nodes.length?`<small>Otros ${n.general_node_count-n.general_nodes.length} nodos generales: abrí la nota para verlos.</small>`:''}`:n.orphan?'<p class="association-muted">Falta una relación con otra nota visible; su clasificación por ámbito se muestra arriba.</p>':n.is_general_node?'<p class="association-muted">Esta nota es un nodo general.</p>':'<p class="association-muted">Hay conexiones, pero no se llega a un proyecto, persona u organización en dos enlaces.</p>'}${n.unresolved_count?`<p class="association-warning">${n.broken_links.length} referencias sin destino · ${n.ambiguous_links.length} ambiguas</p>`:''}</article>`).join('')||'<p class="association-empty">No hay notas en esta vista.</p>'}</div><div class="association-pagination"><button type="button" class="btn btn-ghost" onclick="associationPage(-1)" ${d.page<=1?'disabled':''}>Anterior</button><button type="button" class="btn btn-ghost" onclick="associationPage(1)" ${d.page*d.per_page>=d.total?'disabled':''}>Siguiente</button></div>`:'<p class="association-muted">Actualizá las asociaciones para consultar el estado del vault.</p>'}
  </section>`;
}
function renderNoteAssociations(){
  const n=S.openAssociations;
  if(!n)return `<section class="note-associations"><h3>Ámbitos y conexiones</h3><p class="association-muted">${esc(S.associationError||'Consultando asociaciones…')}</p></section>`;
  const groups=[['proyecto','Proyectos'],['persona','Personas'],['organizacion','Organizaciones'],['cliente','Clientes']];
  const direct=n.connections.filter(c=>groups.some(([t])=>c.node.tipo===t));
  const other=n.connections.filter(c=>!groups.some(([t])=>c.node.tipo===t));
  return `<section class="note-associations" aria-labelledby="note-associations-title"><h3 id="note-associations-title">Ámbitos y conexiones</h3><div class="association-chips">${associationAmbitos(n.ambitos)}</div><p><span class="association-status ${n.orphan?'is-orphan':''}">${associationStatus(n)}</span> <span class="association-muted">${n.connection_count} ${n.connection_count===1?'nota vinculada':'notas vinculadas'}</span></p>
    ${groups.map(([tipo,label])=>{const items=direct.filter(c=>c.node.tipo===tipo);return items.length?`<div class="association-group"><h4>${label}</h4>${items.map(c=>associationNodeButton(c.node,(c.direction==='entrante'?'Desde esta entidad · ':'Hacia esta entidad · ')+c.relation)).join('')}</div>`:'';}).join('')}
    ${n.general_nodes.some(g=>g.depth===2)?`<details open class="association-group"><summary>A través de otras notas</summary><p class="association-muted">Conexiones de dos pasos; no confirman pertenencia al proyecto ni un rol de la persona.</p>${n.general_nodes.filter(g=>g.depth===2).map(g=>`<div>${associationNodeButton(g)}<small class="association-muted"> vía </small>${associationNodeButton(g.via)}</div>`).join('')}</details>`:''}
    ${n.general_node_count>n.general_nodes.length?`<p class="association-muted">Mostrando ${n.general_nodes.length} de ${n.general_node_count} nodos generales.</p>`:''}
    ${other.length?`<details class="association-group"><summary>Otras notas relacionadas (${other.length})</summary>${other.map(c=>associationNodeButton(c.node,(c.direction==='entrante'?'Entrante · ':'Saliente · ')+c.relation)).join('')}</details>`:''}
    ${n.orphan?'<p class="association-muted">No tiene enlaces entrantes ni salientes visibles. El ámbito se registra por separado.</p>':''}
    ${n.unresolved_count?`<details class="association-group"><summary>Referencias sin resolver (${n.unresolved_count})</summary><p class="association-muted">No se cuentan como conexiones.</p>${n.broken_links.map(v=>`<p>Sin destino: ${esc(v)}</p>`).join('')}${n.ambiguous_links.map(v=>`<p>Destino ambiguo: ${esc(v)}</p>`).join('')}</details>`:''}
  </section>`;
}
