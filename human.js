// Human inbox: previews are reads; every decision needs a separate explicit action.
const HUMAN_LABELS={all:'Decisiones pendientes',links:'Vínculos',person:'Fichas y aclaraciones',meeting:'Acciones y decisiones',note:'Revisión opcional'};
function newHumanState(){return {kind:'all',q:'',page:1,data:null,loading:false,error:null,request:0,detail:null,detailKey:null,detailBusy:false,detailRequest:0,authorized:false,answer:'',busy:false,receipts:[],requests:{},uncertain:null,countData:null,navigationNotice:null,refreshRequests:{}};}
function humanState(){return S.human||(S.human=newHumanState());}
function humanRender(){const el=document.querySelector('.main-content'),top=el?.scrollTop||0;render();const next=document.querySelector('.main-content');if(next)next.scrollTop=top;}
async function humanRequest(path,options={}){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);
 try{
  const response=await api('/api/human'+path,{...options,signal:controller.signal});
  const data=await response.json().catch(()=>null);
  if(!response.ok||!data){const e=new Error(data?.detail||data?.error||'No se pudo completar la consulta. Reintentá.');e.status=response.status;throw e;}
  return data;
 }catch(e){if(e.name==='AbortError')throw new Error('La consulta demoró demasiado. Podés reintentar; no se aprobó nada al comprobar.');throw e;}
 finally{clearTimeout(timer);}
}
function humanBadge(data){humanState().countData=data;const badge=document.getElementById('human-nav-count');if(badge){badge.textContent=data.total_pending;badge.style.display=data.total_pending?'':'none';}}
async function loadHumanCount(){if(!S.token)return;try{humanBadge(await humanRequest('/summary'));}catch{const badge=document.getElementById('human-nav-count');if(badge){badge.textContent='!';badge.style.display='';badge.title='No se pudo actualizar el contador de pendientes';}}}
async function loadHuman(){
 const h=humanState(),serial=++h.request;h.loading=true;h.error=null;humanRender();
 try{const d=await humanRequest('/queue?'+new URLSearchParams({kind:h.kind,q:h.q,page:h.page,per_page:15}));if(serial!==h.request)return;h.data=d;humanBadge(d);}
 catch(e){if(serial===h.request)h.error=e.message;}
 finally{if(serial===h.request){h.loading=false;humanRender();}}
}
function humanResetDetail(){const h=humanState();++h.detailRequest;h.detail=null;h.detailKey=null;h.detailBusy=false;h.authorized=false;h.answer='';h.error=null;}
function humanClose(){const h=humanState();if(h.busy)return;humanResetDetail();h.navigationNotice='Volviste a la lista. Los pendientes sin resolver se conservan.';humanRender();document.querySelector('.human-list')?.scrollIntoView({block:'start'});}
async function humanContinue(){
 const h=humanState();if(h.busy||h.loading||h.detailBusy||h.uncertain)return;
 const data=h.data,index=data?.results.findIndex(i=>i.key===h.detailKey)??-1;
 const next=index>=0?data.results[index+1]:data?.results[0];
 humanResetDetail();const navigationSerial=h.detailRequest;h.navigationNotice='El pendiente anterior sigue pendiente. No se aprobó ni se declinó.';
 if(next){await humanOpen(next.key,true);return;}
 if(data&&data.page*data.per_page<data.total){
  const kind=h.kind,q=h.q,page=++h.page;await loadHuman();
  if(h.detailRequest!==navigationSerial||h.kind!==kind||h.q!==q||h.page!==page)return;
  if(h.error){h.page=data.page;h.navigationNotice='No se pudo cargar la siguiente página. El pendiente se conserva; podés reintentar desde la lista.';humanRender();document.getElementById('human-feedback')?.scrollIntoView({block:'nearest'});return;}
  if(h.data?.page===page&&h.data.results.length){await humanOpen(h.data.results[0].key,true);return;}
 }
 h.navigationNotice='Llegaste al final de esta vista. Los pendientes sin resolver siguen en la lista.';humanRender();document.getElementById('human-feedback')?.scrollIntoView({block:'nearest'});
}
function humanNavigation(){const h=humanState();return `<div class="human-navigation" aria-label="Continuar la revisión"><button type="button" class="btn btn-primary" onclick="humanContinue()" ${h.busy||h.loading||h.detailBusy||h.uncertain?'disabled':''}>Dejar pendiente y seguir</button><button type="button" class="btn btn-ghost" onclick="humanClose()" ${h.busy?'disabled':''}>Volver a la lista</button><small>Seguir conserva este pendiente, sin aprobarlo ni declinarlo.</small></div>`;}
function humanFilter(kind){const h=humanState();if(h.busy||h.loading)return;humanResetDetail();h.navigationNotice=null;h.kind=kind;h.page=1;loadHuman();}
function humanSearch(){const h=humanState();if(h.busy||h.loading)return;h.q=document.getElementById('human-query').value;humanResetDetail();h.navigationNotice=null;h.page=1;loadHuman();}
function humanPage(delta){const h=humanState();if(h.busy||h.loading)return;humanResetDetail();h.navigationNotice=null;h.page=Math.max(1,h.page+delta);loadHuman();}
function humanPath(key){const [kind,id]=key.split(':');return '/items/'+encodeURIComponent(kind)+'/'+encodeURIComponent(id);}
async function humanOpen(key,keepNotice=false){
 const h=humanState();if(h.busy||h.loading)return;if(!keepNotice)h.navigationNotice=null;const serial=++h.detailRequest;h.detailKey=key;h.detail=null;h.detailBusy=true;h.authorized=false;h.answer='';h.error=null;humanRender();document.getElementById('human-detail')?.scrollIntoView({block:'nearest'});
 try{const d=await humanRequest(humanPath(key));if(serial!==h.detailRequest||h.detailKey!==key)return;h.detail=d;}
 catch(e){if(serial===h.detailRequest)h.error=e.message;}
 finally{if(serial===h.detailRequest){h.detailBusy=false;humanRender();document.getElementById('human-detail')?.scrollIntoView({block:'nearest'});}}
}
function humanAuthorize(checked){humanState().authorized=checked;humanRender();}
function humanAnswer(value){const h=humanState();h.answer=value;const button=document.getElementById('human-answer-save');if(button)button.disabled=!value.trim()||h.busy||!!h.uncertain;}
function humanFieldValue(key,value){return typeof personalFieldText==='function'?personalFieldText(key,value):typeof value==='object'?JSON.stringify(value):String(value??'Sin dato');}
function humanReceipt(data,title){
 const h=humanState();if(!data.verified||!['approved','declined','answered'].includes(data.state))throw new Error('El resultado todavía no está confirmado.');
 h.receipts.push({id:data.id,kind:data.kind,state:data.state,title});h.receipts=h.receipts.slice(-5);h.detail=null;h.detailKey=null;h.uncertain=null;h.authorized=false;
}
async function humanSend(payload,key,title){
 const h=humanState();h.busy=true;h.error=null;humanRender();
 try{const result=await humanRequest(humanPath(key)+'/decision',{method:'POST',body:JSON.stringify(payload)});humanReceipt(result,title);await loadHuman();loadStats();loadBoards();}
 catch(e){
  h.error=e.message;
  try{const prior=await humanRequest('/requests/'+encodeURIComponent(payload.request_id));if(prior.verified){humanReceipt(prior,title);await loadHuman();}else h.uncertain={payload,key,title};}
  catch(readError){if(readError.status===404){h.uncertain=null;}else h.uncertain={payload,key,title};}
 }finally{h.busy=false;humanRender();document.getElementById('human-feedback')?.scrollIntoView({block:'nearest'});}
}
async function humanDecide(action){
 const h=humanState(),d=h.detail;if(!d||h.busy||h.uncertain)return;
 if(action==='approve'&&(!d.validation.ok||!h.authorized))return;
 if(action==='answer'&&!h.answer.trim())return;
 const op=d.key+':'+d.revision+':'+action+':'+(action==='answer'?h.answer:'');
 const payload=h.requests[op]||(h.requests[op]={request_id:crypto.randomUUID(),revision:d.revision,decision:action,authorized_fields:action==='approve'?d.authorized_fields:[],...(action==='answer'?{answer:h.answer.trim()}:{})});
 await humanSend(payload,d.key,d.title);
}
async function humanCheckOutcome(){const h=humanState(),u=h.uncertain;if(!u||h.busy)return;h.busy=true;humanRender();try{const r=await humanRequest('/requests/'+u.payload.request_id);if(r.verified){humanReceipt(r,u.title);await loadHuman();}else h.error='El resultado sigue pendiente de confirmar. Podés reintentar la misma decisión con su identificador original.';}catch(e){h.error=e.message;}finally{h.busy=false;humanRender();}}
function humanRetry(){const u=humanState().uncertain;if(u&&!humanState().busy)humanSend(u.payload,u.key,u.title);}
async function humanUpdateLinks(){
 const h=humanState(),d=h.detail;if(h.busy||h.uncertain||d?.kind!=='links'||!d.refresh?.available)return;
 const key=d.key+':'+d.revision+':'+d.refresh.revision;
 const payload=h.refreshRequests[key]||(h.refreshRequests[key]={request_id:crypto.randomUUID(),revision:d.revision,current_revision:d.refresh.revision});
 h.busy=true;h.authorized=false;h.error=null;humanRender();
 try{
  let result;
  // A lost response may retry the same creation ID. This never applies relationships.
  for(let attempt=0;attempt<2;attempt++){
   try{result=await humanRequest(humanPath(d.key)+'/refresh',{method:'POST',body:JSON.stringify(payload)});break;}
   catch(e){if(attempt||e.status&&e.status<500)throw e;}
  }
  if(!result?.verified||!result.id)throw new Error('No se pudo confirmar la actualización. Reintentá con el mismo botón.');
  h.detail=null;h.detailKey=null;h.page=1;
  h.navigationNotice=result.state==='pending'?'Propuesta actualizada. Los vínculos siguen pendientes: revisalos y autorizalos si corresponden.':'La propuesta actualizada ya fue resuelta. La lista muestra su estado actual.';
  await loadHuman();h.busy=false;
  if(result.state==='pending')await humanOpen('links:'+result.id,true);
 }catch(e){h.error=e.message;}
 finally{h.busy=false;humanRender();document.getElementById(h.error?'human-feedback':'human-detail')?.scrollIntoView({block:'nearest'});}
}

function renderHumanDetail(d){
 const h=humanState(),questionsOnly=d.kind==='person'&&!Object.keys(d.fields||{}).length;
 const index=h.data?.results.findIndex(i=>i.key===d.key)??-1;
 const position=index>=0?((h.data.page-1)*h.data.per_page+index+1):null;
 const preview=d.kind==='links'?`<h3>Vínculos propuestos</h3>${d.links.map(l=>`<div class="human-change"><strong>${l.action==='remove'?'Quitar':'Agregar'}: ${esc(l.relation)}</strong><p>Destino: ${esc(l.target.title)}</p><small>${esc(l.target.path)}</small></div>`).join('')}`:
 d.kind==='person'?`<h3>Cambios propuestos</h3>${Object.entries(d.fields).map(([k,v])=>`<p><strong>${esc(PERSON_FIELDS[k]||k)}:</strong> ${esc(humanFieldValue(k,v))}</p>`).join('')}${d.questions.map(q=>`<p class="human-question">${esc(q)}</p>`).join('')}`:
 d.kind==='meeting'?`<h3>${d.proposal.tipo==='accion'?'Actividad propuesta':'Decisión propuesta'}</h3><p>${esc(d.proposal.detalle)}</p><p>Responsable: ${esc(d.proposal.responsable||'Sin asignar')} · Vencimiento: ${esc(d.proposal.vencimiento||'Sin fecha')}</p><blockquote>${esc(d.proposal.evidencia)}</blockquote>`:
 `<h3>Contenido para revisar</h3><pre class="human-original">${esc(d.content??d.excerpt??'Sin contenido disponible')}</pre><p class="human-muted">Acceso IA: ${d.metadata.ia_permiso==='allow'&&d.metadata.ia_indexar?'habilitado según los permisos actuales':'se conserva restringido'}. Revisar no cambia estos permisos.</p>`;
 return `<section id="human-detail" class="human-detail" aria-label="Detalle del pendiente"><div class="human-detail-head"><h2>${esc(d.title)}</h2><button type="button" class="btn btn-ghost" ${h.busy?'disabled':''} onclick="humanClose()">Cerrar detalle</button></div><p class="human-muted">${position?`Pendiente ${position} de ${h.data.total} en esta vista · `:''}${esc(d.source.path)}</p>${h.navigationNotice?`<p role="status" class="human-navigation-notice">${esc(h.navigationNotice)}</p>`:''}${preview}
 ${(d.evidence||[]).map(e=>`<blockquote>${esc(e.quote)}<small>Fuente: ${esc(e.path||e.source_id)}${e.fecha?' · '+esc(e.fecha):''}</small></blockquote>`).join('')}
 <p class="human-effect"><strong>Al aprobar:</strong> ${esc(d.effect)}</p>${d.decline_effect?`<p class="human-muted"><strong>Al declinar:</strong> ${esc(d.decline_effect)}</p>`:''}
 <p role="status" class="human-check ${d.validation.ok?'ok':'blocked'}">${esc(d.validation.reason)}</p>
 ${!d.validation.ok&&!questionsOnly?'<p class="human-conflict-help">Esta comprobación no autoriza una propuesta desactualizada. Si la nota o sus relaciones cambiaron, hay que reformularla con la versión actual y volver a revisarla. Podés dejarla pendiente y seguir, o declinarla.</p>':''}
 ${d.refresh?`<div class="human-refresh"><p>${d.refresh.available?'Las citas y los destinos se comprobaron con sus versiones actuales. Actualizar prepara una propuesta nueva con los mismos vínculos; la aprobación será un paso separado.':esc(d.refresh.reason)}</p>${d.refresh.available?`<p class="human-muted">${d.refresh.source_changed?'Cambió la revisión de la fuente. ':''}${d.refresh.changed_targets.length?'Destinos con revisión nueva: '+d.refresh.changed_targets.map(t=>esc(t.title)).join(' · '):''}</p><button type="button" class="btn btn-primary" onclick="humanUpdateLinks()" ${h.busy||h.uncertain?'disabled':''}>Actualizar propuesta, sin aplicar</button>`:''}</div>`:''}
 <button type="button" class="btn btn-ghost" data-key="${esc(d.key)}" onclick="humanOpen(this.dataset.key)" ${h.busy||h.loading?'disabled':''}>Comprobar revisiones</button>
 ${questionsOnly?`<label class="human-answer">Tu aclaración<textarea maxlength="10000" aria-label="Tu aclaración" ${h.busy||h.uncertain?'disabled':''} oninput="humanAnswer(this.value)">${esc(h.answer)}</textarea></label><button type="button" id="human-answer-save" class="btn btn-primary" onclick="humanDecide('answer')" ${!h.answer.trim()||h.busy||h.uncertain?'disabled':''}>Guardar aclaración</button>`:
 `<label class="human-authorize"><input type="checkbox" ${h.authorized?'checked':''} ${!d.validation.ok||h.busy||h.uncertain?'disabled':''} onchange="humanAuthorize(this.checked)">${d.kind==='links'?'Autorizar únicamente estos vínculos':d.kind==='person'?'Autorizar únicamente los campos mostrados':d.kind==='meeting'?'Confirmo esta propuesta y su efecto':'Confirmo la revisión del contenido mostrado'}</label>`}
 <div class="human-actions">${!questionsOnly?`<button type="button" class="btn btn-primary" onclick="humanDecide('approve')" ${!h.authorized||!d.validation.ok||h.busy||h.uncertain?'disabled':''}>${S.view==='vinculos'&&d.kind==='links'?'Aplicar vínculos':'Aprobar'}</button>`:''}<button type="button" class="btn btn-ghost" onclick="humanDecide('decline')" ${h.busy||h.uncertain?'disabled':''}>Declinar</button></div>
 ${!questionsOnly&&!h.authorized&&d.validation.ok?'<p class="human-muted">Marcá la autorización de lo mostrado para habilitar Aprobar.</p>':''}${humanNavigation()}</section>`;
}
function renderHuman(heading='Humano'){
 const h=humanState(),d=h.data,counts=d?.counts||h.countData?.counts||{};
 return `<section class="human-workspace"><header class="human-header"><div><div class="human-eyebrow">TU DECISIÓN</div><h1>${esc(heading)}</h1><p>Decisiones concretas sobre vínculos, fichas y propuestas. Cada aprobación tiene su vista previa.</p></div><button type="button" class="btn btn-ghost" onclick="loadHuman()" ${h.loading||h.busy?'disabled':''}>Actualizar pendientes</button></header>
 <div id="human-feedback">${h.navigationNotice&&!h.detail?`<p role="status" class="human-navigation-notice">${esc(h.navigationNotice)}</p>`:''}${h.receipts.map(r=>`<p role="status" class="human-receipt">${r.state==='approved'?'Aprobado y verificado':r.state==='declined'?'Declinado y verificado':'Aclaración guardada y verificada'}: ${esc(r.title)}.</p>`).join('')}
 ${h.error?`<p role="alert" class="human-alert">${esc(h.error)}</p>`:''}
 ${h.uncertain?`<div class="human-alert"><p>La respuesta fue incompleta. Comprobá el resultado antes de tomar otra decisión.</p><button type="button" class="btn btn-ghost" onclick="humanCheckOutcome()" ${h.busy?'disabled':''}>Comprobar resultado</button><button type="button" class="btn btn-ghost" onclick="humanRetry()" ${h.busy?'disabled':''}>Reintentar misma decisión</button></div>`:''}
 </div><div class="human-tabs" aria-label="Tipos de pendientes">${Object.entries(HUMAN_LABELS).map(([k,label])=>`<button type="button" class="btn ${h.kind===k?'btn-primary':'btn-ghost'}" aria-pressed="${h.kind===k}" data-kind="${k}" onclick="humanFilter(this.dataset.kind)" ${h.busy||h.loading?'disabled':''}>${label}${k==='all'?d||h.countData?' · '+(d?.total_pending??h.countData.total_pending):'':' · '+(counts[k]||0)}</button>`).join('')}</div>
 ${h.kind==='note'?'<p class="human-optional">Revisión opcional. No necesitás releer todas tus notas para usar PachiMind. Estas notas conservan su estado y permisos; no suman al contador de decisiones pendientes.</p>':''}
 <form class="human-search" onsubmit="event.preventDefault();humanSearch()"><label for="human-query">Buscar pendiente</label><div><input class="fi" id="human-query" maxlength="200" placeholder="Título o ruta" value="${esc(h.q)}" oninput="S.human.q=this.value"><button type="submit" class="btn btn-ghost" ${h.busy||h.loading?'disabled':''}>Buscar pendientes</button></div></form>
 ${h.loading?'<p role="status">Cargando tus pendientes…</p>':d?`<p class="human-muted">${d.total} ${h.kind==='note'?'notas disponibles para revisión opcional':'decisiones pendientes en esta vista'} · página ${d.page} de ${Math.max(1,Math.ceil(d.total/d.per_page))}. Se muestran sólo los permitidos para tu cuenta.</p>`:!h.error?'<p role="status">Consultando pendientes…</p>':''}
 ${h.detailBusy?'<section id="human-detail" class="human-detail"><p role="status">Comprobando la propuesta y sus revisiones…</p></section>':h.detailKey&&!h.detail?`<section id="human-detail" class="human-detail"><p role="alert" class="human-alert">${esc(h.error||'No se pudo abrir la propuesta.')}</p><button type="button" class="btn btn-ghost" data-key="${esc(h.detailKey)}" onclick="humanOpen(this.dataset.key)">Reintentar comprobación</button>${humanNavigation()}</section>`:''}
 ${h.detail&&h.detailKey===h.detail.key?renderHumanDetail(h.detail):''}
 ${!h.loading&&d?`<div class="human-list">${d.results.map(i=>`<article class="human-card"><div><span class="human-kind">${esc(i.category)}</span><h2>${esc(i.title)}</h2><p>${esc(i.summary)}</p><small>${esc(i.source.path)}</small></div><button type="button" class="btn btn-ghost" data-key="${esc(i.key)}" onclick="humanOpen(this.dataset.key)" ${h.busy||h.loading?'disabled':''}>Revisar</button></article>`).join('')||(!h.error?`<p class="human-empty">${h.kind==='note'?'No hay notas para revisión opcional.':'No hay decisiones pendientes en esta vista.'}</p>`:'')}</div><footer class="human-pagination"><button type="button" class="btn btn-ghost" onclick="humanPage(-1)" ${h.page<=1||h.busy||h.loading?'disabled':''}>Anterior</button><button type="button" class="btn btn-ghost" onclick="humanPage(1)" ${h.page*d.per_page>=d.total||h.busy||h.loading?'disabled':''}>Siguiente</button></footer>`:''}
 </section>`;
}
