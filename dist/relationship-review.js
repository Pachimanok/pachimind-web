// Manual review only. Reuses authenticated gateway and existing revision guards.
const linkReview = {items:[], busy:false, error:null, receipts:[], authorized:{}, checks:{}, requests:{}};
async function pendingLinkReviews(){
  const items=[];let page=1;
  while(true){
    const data=await peopleRequest('/people/changes?per_page=100&page='+page);
    items.push(...data.results);
    if(items.length>=data.total)break;
    if(!data.results.length)throw new Error('Listado incompleto. Volvé a cargar antes de revisar.');
    page++;
  }
  return items.filter(c=>c.kind==='links');
}
async function loadLinkReviews(){
  if(linkReview.busy)return;
  linkReview.busy=true;linkReview.error=null;render();
  try{linkReview.items=await pendingLinkReviews();linkReview.authorized={};linkReview.checks={};}
  catch(e){linkReview.items=[];linkReview.error=e.message;}
  finally{linkReview.busy=false;render();}
}
function linkReviewSnapshot(c){
  return JSON.stringify([c.id,c.kind,c.state,c.target_id,c.base_revision,c.links,c.evidence,c.questions,c.reserved_segments]);
}
async function checkLinkReview(c){
  const source=await peopleRequest('/notes/'+encodeURIComponent(c.target_id));
  if(source.revision!==c.base_revision)throw new Error('La fuente cambió desde esta propuesta. No se puede aplicar; no se actualizaron sus revisiones.');
  for(const link of c.links){
    const target=await peopleRequest('/notes/'+encodeURIComponent(link.target_id));
    if(target.revision!==link.target_revision)throw new Error('Cambió un destino: '+(link.target?.title||link.target_id)+'. No se puede aplicar esta propuesta.');
  }
  return source.revision;
}
async function inspectLinkReview(index){
  if(linkReview.busy)return;
  const c=linkReview.items[index];linkReview.busy=true;linkReview.error=null;render();
  try{await checkLinkReview(c);linkReview.checks[c.id]={ok:true,message:'Revisiones coincidentes. Se comprobarán otra vez al aplicar.'};}
  catch(e){linkReview.checks[c.id]={ok:false,message:e.message};linkReview.authorized[c.id]=false;}
  finally{linkReview.busy=false;render();}
}
async function decideLinkReview(index,action){
  if(linkReview.busy)return;
  const c=linkReview.items[index];
  if(!c||!['apply','reject'].includes(action))return;
  if(action==='apply'&&(!linkReview.authorized[c.id]||!linkReview.checks[c.id]?.ok))return;
  if(action==='reject'&&!confirm('¿Rechazar esta propuesta? Se conservará su historial y no se aplicarán sus vínculos.'))return;
  linkReview.busy=true;linkReview.error=null;render();
  try{
    const fresh=(await pendingLinkReviews()).find(x=>x.id===c.id);
    if(!fresh||linkReviewSnapshot(fresh)!==linkReviewSnapshot(c))throw new Error('La propuesta cambió o ya fue resuelta. Actualizá la lista antes de continuar.');
    if(action==='apply')await checkLinkReview(c);
    const key=c.id+':'+action;
    const body=linkReview.requests[key]||(linkReview.requests[key]={request_id:crypto.randomUUID(),revision:c.base_revision,action,authorized_fields:action==='apply'?['relations']:[],expected_kind:'links'});
    const result=await peopleRequest('/people/changes/'+encodeURIComponent(c.id)+'/review',{method:'POST',body:JSON.stringify(body)});
    const expected=action==='apply'?'applied':'rejected';
    if(result.state!==expected)throw new Error('Respuesta no confirmada. Actualizá la lista y verificá el historial antes de reintentar.');
    linkReview.receipts.push({id:c.id,state:result.state});
    linkReview.items=linkReview.items.filter(x=>x.id!==c.id);
    linkReview.authorized={};linkReview.checks={};
    if(action==='apply'){
      const graph=await peopleRequest('/vault/relations');
      const ok=c.links.every(l=>{
        const exists=graph.relations.some(r=>r.source_id===c.target_id&&r.target_id===l.target_id&&r.relation===l.relation&&r.active!==false);
        return l.action==='remove'?!exists:exists;
      });
      if(!ok)throw new Error('La propuesta quedó aplicada, pero la verificación de vínculos es incompleta. No la vuelvas a aplicar.');
      linkReview.receipts[linkReview.receipts.length-1].verified=true;
    }
  }catch(e){linkReview.error=e.message;linkReview.checks={};linkReview.authorized={};}
  finally{linkReview.busy=false;render();}
}
function renderLinkReviews(){
  const p=linkReview;
  return `<section class="people-workspace"><header class="people-header"><div><h1>Vínculos pendientes</h1><p>Revisá las propuestas existentes de reuniones y notas. Sólo se aplican relaciones; los textos y las tareas se conservan.</p></div><button class="btn btn-ghost" ${p.busy?'disabled':''} onclick="loadLinkReviews()">Actualizar lista</button></header>
  ${p.error?`<div role="alert" class="people-alert">${esc(p.error)}</div>`:''}
  ${p.busy?'<p role="status">Comprobando…</p>':''}
  ${p.receipts.map(r=>`<p role="status">${r.state==='applied'?'Aplicada':'Rechazada'}: ${esc(r.id)}${r.verified?' · vínculos verificados':''}. Historial conservado.</p>`).join('')}
  ${p.items.map((c,i)=>`<article class="people-panel"><h2>${esc(c.source?.title||c.target_id)}</h2><p>${esc(c.source?.path||'')}</p><p>Propuesta <code>${esc(c.id)}</code> · ${esc(c.created_at||'Fecha no informada')}</p>
    <ul>${c.links.map(l=>`<li>${l.action==='remove'?'Quitar':'Agregar'}: ${esc(l.relation)} → <strong>${esc(l.target?.title||l.target_id)}</strong><br><small>${esc(l.target?.path||l.target_id)}</small></li>`).join('')}</ul>
    ${(c.evidence||[]).map(e=>`<blockquote>${esc(e.quote)}<small>Fuente: ${esc(e.path||e.source_id)}</small></blockquote>`).join('')}
    ${(c.questions||[]).map(q=>`<p>${esc(q)}</p>`).join('')}
    ${p.checks[c.id]?`<p role="status">${esc(p.checks[c.id].message)}</p>`:''}
    <button class="btn btn-ghost" ${p.busy?'disabled':''} onclick="inspectLinkReview(${i})">Comprobar revisiones</button>
    <label class="people-check"><input type="checkbox" ${p.authorized[c.id]?'checked':''} ${p.busy||!p.checks[c.id]?.ok?'disabled':''} onchange="linkReview.authorized[linkReview.items[${i}].id]=this.checked;render()">Autorizar únicamente estos vínculos</label>
    <div class="people-actions"><button class="btn btn-primary" ${p.busy||!p.authorized[c.id]||!p.checks[c.id]?.ok?'disabled':''} onclick="decideLinkReview(${i},'apply')">Aplicar vínculos</button><button class="btn btn-ghost" ${p.busy?'disabled':''} onclick="decideLinkReview(${i},'reject')">Rechazar propuesta</button></div>
  </article>`).join('')||(!p.busy?'<p>No hay propuestas de vínculos pendientes visibles en esta sesión.</p>':'')}</section>`;
}
