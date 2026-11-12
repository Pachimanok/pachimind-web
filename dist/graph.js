// Permission-filtered metadata stays in memory. Rendering and physics are local.
let graphRuntime=null, graphGeneration=0;
const GRAPH_COLORS={proyecto:'#82a8d9',persona:'#b7a0d9',organizacion:'#75b9a7',cliente:'#78b7c8',reunion:'#c38da4',nota:'#9298a3',ambito:'#c8ad77'};
function graphState(){
 return S.graph||(S.graph={data:null,loading:false,error:null,request:0,q:'',tipo:'',ambito:'',showAmbitos:false,showOrphans:false,
  selected:null,focus:null,list:false,listPage:0,filtersOpen:false,fullscreen:false,paused:false,colorMode:'neutral',labels:true,arrows:false,
  repulsion:1,distance:90,camera:null,userCamera:false,positions:new Map(),layoutError:null,lastTap:null});
}
async function loadGraph(focus=null){
 const s=graphState(),request=++s.request;
 Object.assign(s,{loading:true,error:null,listPage:0,focus,selected:focus,camera:null,userCamera:false,positions:new Map(),layoutError:null});render();
 try{
  const response=await api('/vault/graph'+(focus?'?focus='+encodeURIComponent(focus):''));
  if(!response.ok)throw new Error('No se pudo cargar el grafo. Reintentá.');
  const data=await response.json();if(s===S.graph&&request===s.request)s.data=data;
 }catch(e){if(s===S.graph&&request===s.request)s.error=e.message;}
 finally{if(s===S.graph&&request===s.request){s.loading=false;render();}}
}
function openGraphFor(id){const s=graphState();s.q=s.tipo=s.ambito='';s.list=s.filtersOpen=false;setView('grafo');loadGraph(id);}
function graphFilter(){
 const s=graphState();s.q=document.getElementById('graph-query').value;s.tipo=document.getElementById('graph-type').value;s.ambito=document.getElementById('graph-area').value;
 s.selected=null;s.camera=null;s.userCamera=false;s.positions=new Map();s.listPage=0;render();
}
function graphVisible(){
 const s=graphState(),q=s.q.trim().toLocaleLowerCase('es'),connected=new Set((s.data?.edges||[]).flatMap(e=>[e.source,e.target]));
 const nodes=(s.data?.nodes||[]).filter(n=>(s.showOrphans||connected.has(n.id))&&(!q||(n.title+' '+n.path).toLocaleLowerCase('es').includes(q))&&(!s.tipo||n.tipo===s.tipo)&&(!s.ambito||n.ambitos.includes(s.ambito)));
 const ids=new Set(nodes.map(n=>n.id));return {nodes,edges:(s.data?.edges||[]).filter(e=>ids.has(e.source)&&ids.has(e.target))};
}
function graphSelect(id){
 const s=graphState();if(id&&!id.startsWith('@ambito:')&&!graphVisible().nodes.some(n=>n.id===id)){s.q=s.tipo=s.ambito='';s.showOrphans=true;s.camera=null;s.userCamera=false;}
 s.selected=id;s.list=false;render();
}
function graphListPage(delta){graphState().listPage+=delta;render();}
function graphPanel(which){const s=graphState();if(which==='filters'){s.filtersOpen=!s.filtersOpen;s.list=false;}else{s.list=!s.list;s.filtersOpen=false;}render();}
function graphOption(key,value){const s=graphState();s[key]=value;if(['showOrphans','showAmbitos'].includes(key)){s.positions=new Map();s.camera=null;s.userCamera=false;}render();}
function graphTune(key,value){const s=graphState();s[key]=Number(value);graphRuntime?.tune({repulsion:s.repulsion,distance:s.distance});}
function graphPause(){const s=graphState();s.paused=!s.paused;graphRuntime?.pause(s.paused);render();}
function graphExpand(){graphState().fullscreen=!graphState().fullscreen;render();document.querySelector('[data-graph-expand]')?.focus({preventScroll:true});}
function graphReset(){const s=graphState();Object.assign(s,{q:'',tipo:'',ambito:'',showOrphans:false,showAmbitos:false,colorMode:'neutral',labels:true,arrows:false,repulsion:1,distance:90,paused:false,camera:null,userCamera:false,positions:new Map(),selected:null,listPage:0});render();}
function graphButton(label,icon,action,extra=''){
 const shapes={'↻':'<path d="M20 7v5h-5M19 12a7 7 0 1 0-1.5 5"/>','☷':'<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>','⚙':'<path d="M4 6h5m5 0h6M4 12h10m5 0h1M4 18h2m5 0h9"/><circle cx="11.5" cy="6" r="2.5"/><circle cx="16.5" cy="12" r="2.5"/><circle cx="8.5" cy="18" r="2.5"/>','⛶':'<path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4"/>','↙':'<path d="M4 8h4V4m12 4h-4V4M8 20v-4H4m12 4v-4h4"/>','+':'<path d="M12 5v14M5 12h14"/>','−':'<path d="M5 12h14"/>','⌖':'<circle cx="12" cy="12" r="6"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/>','Ⅱ':'<path d="M9 5v14M15 5v14"/>','▷':'<path d="m8 5 11 7-11 7z"/>','×':'<path d="m6 6 12 12M18 6 6 18"/>'};
 return `<button type="button" class="graph-icon" aria-label="${label}" title="${label}" onclick="${action}" ${extra}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes[icon]||''}</svg></button>`;
}
function renderGraph(){
 const s=graphState(),d=s.data,v=graphVisible(),areas=[...new Set((d?.nodes||[]).flatMap(n=>n.ambitos))].sort(),types=[...new Set((d?.nodes||[]).map(n=>n.tipo).filter(Boolean))].sort();
 const n=d?.nodes.find(n=>n.id===s.selected),group=s.selected?.startsWith('@ambito:')?s.selected.slice(8):null;
 const links=n?d.edges.filter(e=>e.source===n.id||e.target===n.id):[],neighborIds=[...new Set(links.map(e=>e.source===n.id?e.target:e.source))];
 const byId=new Map((d?.nodes||[]).map(n=>[n.id,n])),neighbors=neighborIds.map(id=>byId.get(id)).filter(Boolean);
 return `<section class="graph-view graph-pro${s.fullscreen?' graph-expanded':''}" aria-label="Explorador del grafo" aria-labelledby="graph-title">
  <header class="graph-pro-header"><div class="graph-heading"><span class="graph-mark" aria-hidden="true">⬡</span><div><h1 id="graph-title">Grafo de notas</h1><span class="graph-subtitle">${s.focus?'Conexiones locales':'Todas tus conexiones'}</span></div></div>
   <div class="graph-toolbar">${s.focus?'<button type="button" class="graph-global" onclick="loadGraph()">Grafo global</button>':''}${graphButton('Actualizar grafo','↻','loadGraph(graphState().focus)',s.loading?'disabled':'')}${graphButton('Ver notas en lista','☷',"graphPanel('list')",`aria-pressed="${s.list}"`)}${graphButton('Buscar y filtrar el grafo','⚙',"graphPanel('filters')",`aria-pressed="${s.filtersOpen}"`)}${graphButton(s.fullscreen?'Salir de pantalla completa':'Pantalla completa',s.fullscreen?'↙':'⛶','graphExpand()','data-graph-expand')}</div>
  </header>
  <div class="graph-stage">
   <canvas id="vault-graph" aria-label="Grafo de notas. Usá los controles o la lista para explorar." aria-describedby="graph-help" tabindex="0"></canvas>
   <div class="graph-status" role="status">${s.loading?'Cargando conexiones…':s.error?'No se pudo cargar':`${v.nodes.length} notas <span>·</span> ${v.edges.length} vínculos`}${!s.showOrphans&&d?.nodes.length>v.nodes.length?` <span>·</span> Huérfanas ocultas`:''}${d?.truncated?` <span>·</span> Vista parcial: ${d.returned}/${d.total_matching}`:''}</div>
   <div class="graph-tooltip" role="tooltip" hidden></div>
   ${s.error?`<div class="graph-empty" role="alert"><p>${esc(s.error)}</p><button class="btn btn-ghost" onclick="loadGraph(graphState().focus)">Reintentar</button></div>`:!s.loading&&!v.nodes.length?'<div class="graph-empty">No hay notas con estos filtros.<br><button class="btn btn-ghost" onclick="graphOption(\'showOrphans\',true)">Incluir notas sin vínculos</button></div>':''}
   ${s.filtersOpen?`<aside class="graph-floating graph-settings" aria-label="Ajustes del grafo"><header><h2>Filtros y apariencia</h2>${graphButton('Cerrar ajustes','×',"graphPanel('filters')")}</header><div class="graph-panel-scroll">
    <form class="graph-filters" onsubmit="event.preventDefault();graphFilter()"><label>Buscar en el grafo<input id="graph-query" type="search" placeholder="Título o ruta" value="${esc(s.q)}" maxlength="200"></label><div class="graph-filter-pair"><label>Tipo<select id="graph-type"><option value="">Todos</option>${types.map(t=>`<option ${s.tipo===t?'selected':''} value="${esc(t)}">${esc(t)}</option>`).join('')}</select></label><label>Ámbito<select id="graph-area"><option value="">Todos</option>${areas.map(a=>`<option ${s.ambito===a?'selected':''} value="${esc(a)}">${esc(a)}</option>`).join('')}</select></label></div><button class="btn btn-ghost" type="submit">Filtrar</button></form>
    <div class="graph-settings-section"><h3>Mostrar</h3>${[['showOrphans','Notas sin vínculos'],['showAmbitos','Nodos de ámbitos'],['labels','Etiquetas'],['arrows','Flechas de dirección']].map(([key,label])=>`<label class="graph-check"><input type="checkbox" ${s[key]?'checked':''} onchange="graphOption('${key}',this.checked)">${label}</label>`).join('')}
     <label>Color de nodos<select aria-label="Color de nodos" onchange="graphOption('colorMode',this.value)">${[['neutral','Neutro'],['tipo','Por tipo'],['ambito','Por ámbito']].map(([value,label])=>`<option value="${value}" ${s.colorMode===value?'selected':''}>${label}</option>`).join('')}</select></label>
    </div><div class="graph-settings-section"><h3>Distribución</h3><label>Separación<input aria-label="Separación de nodos" type="range" min="0.5" max="3" step="0.1" value="${s.repulsion}" oninput="graphTune('repulsion',this.value)"></label><label>Distancia de vínculos<input aria-label="Distancia de vínculos" type="range" min="50" max="180" step="5" value="${s.distance}" oninput="graphTune('distance',this.value)"></label><button class="btn btn-ghost" onclick="graphReset()">Restablecer vista</button></div>
    <p class="graph-muted">Los ámbitos son clasificación. Sus líneas punteadas no son vínculos entre notas. Explorar y mover nodos no modifica el vault.</p>
   </div></aside>`:''}
   ${s.list?`<aside class="graph-floating graph-list" aria-label="Notas del grafo"><header><h2>Notas · ${v.nodes.length}</h2>${graphButton('Cerrar lista','×',"graphPanel('list')")}</header><div class="graph-panel-scroll">${v.nodes.slice(s.listPage*30,s.listPage*30+30).map(n=>`<button type="button" data-graph-id="${esc(n.id)}" onclick="graphSelect(this.dataset.graphId)"><strong>${esc(n.title)}</strong><small>${esc(n.tipo||'nota')} · ${esc(n.ambitos.join(', ')||'Sin ámbito')}</small></button>`).join('')||'<p>No hay notas.</p>'}</div><footer class="graph-pagination"><button class="graph-text-button" onclick="graphListPage(-1)" ${s.listPage===0?'disabled':''}>Anterior</button><span>${s.listPage+1}/${Math.max(1,Math.ceil(v.nodes.length/30))}</span><button class="graph-text-button" onclick="graphListPage(1)" ${(s.listPage+1)*30>=v.nodes.length?'disabled':''}>Siguiente</button></footer></aside>`:''}
   ${(n||group)&&!s.filtersOpen&&!s.list?`<aside class="graph-floating graph-detail" aria-label="Nota seleccionada"><header><span class="graph-kind">${esc(n?.tipo||'Ámbito')}</span>${graphButton('Cerrar selección','×','graphSelect(null)')}</header><div class="graph-panel-scroll"><h2>${esc(n?.title||group)}</h2>${n?`<p class="graph-path">${esc(n.path)}</p><div class="graph-chips">${n.ambitos.map(a=>`<span>${esc(a)}</span>`).join('')}</div><div class="graph-detail-actions"><button class="btn btn-primary" data-graph-open="${esc(n.id)}" onclick="openNote(this.dataset.graphOpen)">Abrir nota</button><button class="btn btn-ghost" data-graph-focus="${esc(n.id)}" onclick="openGraphFor(this.dataset.graphFocus)">Ver conexiones locales</button></div><h3>${neighbors.length} notas conectadas</h3><div class="graph-neighbors">${neighbors.map(other=>`<button type="button" data-graph-id="${esc(other.id)}" onclick="graphSelect(this.dataset.graphId)"><span>${esc(other.title)}</span><small>${esc(other.tipo||'nota')}</small></button>`).join('')||'<p class="graph-muted">Esta nota no tiene vínculos visibles.</p>'}</div>`:`<p class="graph-muted">Ámbito declarado en ${v.nodes.filter(n=>n.ambitos.includes(group)).length} notas de esta vista. Es clasificación, no una conexión entre notas.</p>`}</div></aside>`:''}
   <div class="graph-controls" aria-label="Controles del grafo">${graphButton('Acercar grafo','+','graphZoom(1.3)')}${graphButton('Alejar grafo','−','graphZoom(1/1.3)')}${graphButton('Encuadrar grafo','⌖','graphFit()')}${graphButton(s.paused?'Reanudar distribución':'Pausar distribución',s.paused?'▷':'Ⅱ','graphPause()')}</div>
   <div class="graph-layout-notice" role="status" ${s.layoutError?'':'hidden'}>${esc(s.layoutError||'')}</div>
  </div>
  <footer class="graph-footer"><span id="graph-help">${matchMedia('(max-width:700px)').matches?'Tocá un nodo · Arrastrá para mover · Pellizcá para acercar':'Arrastrá nodos o el fondo · Rueda para zoom · Doble clic para abrir'}</span><span class="graph-readonly">Sólo lectura</span></footer>
 </section>`;
}
function destroyGraphView(){if(graphRuntime){graphRuntime.destroy();graphRuntime=null;}}
function mountGraphView(){
 const canvas=document.getElementById('vault-graph');if(!canvas)return;
 const s=graphState(),visible=graphVisible(),ctx=canvas.getContext('2d');if(!ctx)return;
 const nodes=[],map=new Map(),degree=new Map(),parents=new Map(visible.nodes.map(n=>[n.id,n.id]));
 const root=id=>{let p=id;while(parents.get(p)!==p)p=parents.get(p);return p;};
 visible.edges.forEach(e=>{degree.set(e.source,(degree.get(e.source)||0)+1);degree.set(e.target,(degree.get(e.target)||0)+1);const a=root(e.source),b=root(e.target);if(a!==b)parents.set(b,a);});
 const components=new Map();visible.nodes.forEach(n=>{const r=root(n.id);if(!components.has(r))components.set(r,[]);components.get(r).push(n);});
 const sorted=[...components.values()].sort((a,b)=>b.length-a.length);let isolated=0;
 sorted.forEach((members,component)=>members.forEach((n,i)=>{
  const singleton=members.length===1,angle=(singleton?++isolated:i)*2.399963,centerAngle=component*2.399963;
  const center=component===0||singleton?{x:0,y:0}:{x:Math.cos(centerAngle)*Math.sqrt(component)*140,y:Math.sin(centerAngle)*Math.sqrt(component)*140};
  const radius=singleton?260+Math.sqrt(isolated)*18:Math.sqrt(i+1)*22,saved=s.positions.get(n.id),d=degree.get(n.id)||0;
  const p={...n,degree:d,radius:3.2+Math.min(8,Math.sqrt(d)*1.4),x:saved?.x??center.x+Math.cos(angle)*radius,y:saved?.y??center.y+Math.sin(angle)*radius};nodes.push(p);map.set(p.id,p);
 }));
 const areas=[...new Set(visible.nodes.flatMap(n=>n.ambitos))].sort();
 if(s.showAmbitos)areas.forEach((a,i)=>{const angle=i*2.399963,saved=s.positions.get('@ambito:'+a);const n={id:'@ambito:'+a,title:a,tipo:'ambito',degree:visible.nodes.filter(n=>n.ambitos.includes(a)).length,radius:9,x:saved?.x??Math.cos(angle)*300,y:saved?.y??Math.sin(angle)*300};nodes.push(n);map.set(n.id,n);});
 const edges=visible.edges.map(e=>({a:map.get(e.source),b:map.get(e.target),group:false}));
 if(s.showAmbitos)visible.nodes.forEach(n=>n.ambitos.forEach(a=>edges.push({a:map.get(n.id),b:map.get('@ambito:'+a),group:true})));
 const generation=++graphGeneration,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let width=1,height=1,disposed=false,worker=null,frame=0,ready=false,userCamera=!!s.userCamera,camera=s.camera||{x:0,y:0,k:1},hover=null,points=new Map(),gesture=null,drag=null,moved=false,start=null;
 const tooltip=canvas.parentElement.querySelector('.graph-tooltip');
 const palette=['#9daed2','#b4a0d5','#79b3a2','#c5a582','#90b7c2','#c68fa6'];
 function theme(){const light=document.documentElement.dataset.theme==='light';return {text:light?'#3f4653':'#d6d9e0',muted:light?'#697180':'#89909e',node:light?'#7e8593':'#9399a5',edge:light?'#8e98aa':'#5a6170',accent:light?'#7652bd':'#b7a0e8'};}
 function color(n,t){if(s.colorMode==='tipo')return GRAPH_COLORS[n.tipo]||t.node;if(s.colorMode==='ambito'&&n.ambitos?.length)return palette[Math.max(0,areas.indexOf(n.ambitos[0]))%palette.length];return n.tipo==='ambito'?GRAPH_COLORS.ambito:t.node;}
 function screen(n){return {x:width/2+(n.x+camera.x)*camera.k,y:height/2+(n.y+camera.y)*camera.k};}
 function world(p){return {x:(p.x-width/2)/camera.k-camera.x,y:(p.y-height/2)/camera.k-camera.y};}
 function fit(manual=true){
  if(manual){userCamera=true;s.userCamera=true;}
  const xs=nodes.map(n=>n.x),ys=nodes.map(n=>n.y),left=nodes.length?Math.min(...xs):0,right=nodes.length?Math.max(...xs):0,top=nodes.length?Math.min(...ys):0,bottom=nodes.length?Math.max(...ys):0;
  const mobile=width<700,pad=mobile?70:100;
  camera={x:-(left+right)/2,y:-(top+bottom)/2,k:Math.max(.08,Math.min(2.5,Math.min((width-pad)/(right-left+80),(height-pad)/(bottom-top+80))))};s.camera=camera;draw();
 }
 function requestDraw(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;draw();});}
 function draw(){
  if(disposed)return;
  const t=theme(),active=map.get(hover||s.selected),neighbors=new Set(active?[active.id]:[]);
  if(active)edges.forEach(e=>{if(e.a===active)neighbors.add(e.b.id);if(e.b===active)neighbors.add(e.a.id);});
  ctx.clearRect(0,0,width,height);
  edges.forEach(e=>{
   const a=screen(e.a),b=screen(e.b),highlight=active&&(e.a===active||e.b===active);
   ctx.globalAlpha=active?(highlight ? .8 : .065):(e.group ? .22 : .55);ctx.strokeStyle=highlight?t.accent:t.edge;ctx.lineWidth=highlight?1.3:1;ctx.setLineDash(e.group?[2,5]:[]);
   ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
   if(s.arrows&&!e.group){const angle=Math.atan2(b.y-a.y,b.x-a.x),end={x:b.x-Math.cos(angle)*(e.b.radius+3),y:b.y-Math.sin(angle)*(e.b.radius+3)};ctx.beginPath();ctx.moveTo(end.x,end.y);ctx.lineTo(end.x-Math.cos(angle-.4)*6,end.y-Math.sin(angle-.4)*6);ctx.moveTo(end.x,end.y);ctx.lineTo(end.x-Math.cos(angle+.4)*6,end.y-Math.sin(angle+.4)*6);ctx.stroke();}
  });ctx.setLineDash([]);
  const labels=[];
  nodes.forEach(n=>{
   const p=screen(n);if(p.x< -80||p.x>width+80||p.y< -40||p.y>height+40)return;
   const selected=n.id===s.selected,near=!active||neighbors.has(n.id),radius=Math.max(2,n.radius*Math.min(1.3,Math.max(.65,Math.sqrt(camera.k))));
   ctx.globalAlpha=near?1:.15;ctx.fillStyle=n===active?t.accent:color(n,t);
   if(n===active){ctx.globalAlpha=.12;ctx.beginPath();ctx.arc(p.x,p.y,radius+9,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
   ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.fill();
   if(selected){ctx.strokeStyle=t.accent;ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(p.x,p.y,radius+3,0,Math.PI*2);ctx.stroke();}
   const priority=n===active?0:selected?1:active&&near?2:n.degree>2?3:4;
   if(priority<2||s.labels&&(priority===2||n.tipo==='ambito'||camera.k>1.05||nodes.length<65&&n.degree>0))labels.push({n,p,radius,priority});
  });
  const occupied=[];
  labels.sort((a,b)=>a.priority-b.priority).forEach(({n,p,radius,priority})=>{
   const text=n.title.length>38?n.title.slice(0,37)+'…':n.title;ctx.font=(priority<2?'500 ':'')+'11px "DM Sans",sans-serif';
   const w=ctx.measureText(text).width,box={x:p.x-w/2,y:p.y+radius+5,w,h:15};
   if(priority>0&&occupied.some(b=>box.x<b.x+b.w+6&&box.x+box.w>b.x-6&&box.y<b.y+b.h+3&&box.y+box.h>b.y-3))return;
   occupied.push(box);ctx.globalAlpha=active&&!neighbors.has(n.id)?.2:priority<2?1:.72;ctx.fillStyle=priority<2?t.text:t.muted;ctx.textAlign='center';ctx.fillText(text,p.x,p.y+radius+15);
  });ctx.globalAlpha=1;
 }
 function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);width=r.width;height=r.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);if(!s.camera)fit(false);else draw();}
 function zoom(factor,p={x:width/2,y:height/2}){userCamera=true;s.userCamera=true;const before=camera.k,next=Math.max(.08,Math.min(7,before*factor));camera.x+=(p.x-width/2)*(1/next-1/before);camera.y+=(p.y-height/2)*(1/next-1/before);camera.k=next;s.camera=camera;requestDraw();}
 function point(e){const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
 function hit(p){let nearest=null,distance=matchMedia('(pointer:coarse)').matches?22:14;nodes.forEach(n=>{const q=screen(n),d=Math.hypot(q.x-p.x,q.y-p.y);if(d<distance){nearest=n;distance=d;}});return nearest;}
 function snapshot(){const p=[...points.values()];return p.length===2?{x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2,d:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)}:p[0];}
 function clearHover(){hover=null;if(tooltip)tooltip.hidden=true;canvas.style.cursor='grab';requestDraw();}
 function down(e){
  if(e.button!==0&&e.pointerType==='mouse')return;
  canvas.setPointerCapture(e.pointerId);const p=point(e);points.set(e.pointerId,p);gesture=snapshot();start=p;moved=points.size>1;
  if(points.size===1){const n=hit(p);drag=n?{n,index:nodes.indexOf(n)}:null;}else{if(drag)worker?.postMessage({type:'drag',index:drag.index,release:true});drag=null;}
  if(tooltip)tooltip.hidden=true;
 }
 function move(e){
  const p=point(e);
  if(!points.has(e.pointerId)){
   if(e.pointerType==='mouse'){const n=hit(p);if(hover!==n?.id){hover=n?.id||null;requestDraw();}canvas.style.cursor=n?'pointer':'grab';if(tooltip){tooltip.hidden=!n;if(n){tooltip.textContent=n.title;tooltip.style.left=Math.min(width-220,Math.max(10,p.x+14))+'px';tooltip.style.top=Math.max(8,p.y-38)+'px';}}}return;
  }
  const before=gesture;points.set(e.pointerId,p);const now=snapshot();if(!now||!before)return;
  if(start&&Math.hypot(p.x-start.x,p.y-start.y)>5)moved=true;
  if(now.d&&before.d){moved=true;zoom(now.d/Math.max(1,before.d),now);}
  if(drag&&points.size===1&&moved){userCamera=true;s.userCamera=true;const w=world(p);Object.assign(drag.n,w);worker?.postMessage({type:'drag',index:drag.index,...w});canvas.style.cursor='grabbing';}
  else if(!drag||points.size>1){userCamera=true;s.userCamera=true;camera.x+=(now.x-before.x)/camera.k;camera.y+=(now.y-before.y)/camera.k;s.camera=camera;}
  gesture=now;requestDraw();
 }
 function up(e){
  const candidate=drag?.n||hit(point(e));if(drag)worker?.postMessage({type:'drag',index:drag.index,release:true});drag=null;
  if(!moved&&points.size===1&&candidate){
   const now=performance.now(),last=s.lastTap;s.lastTap={id:candidate.id,at:now};points.clear();
   if(last?.id===candidate.id&&now-last.at<350&&!candidate.id.startsWith('@ambito:')){s.selected=candidate.id;openNote(candidate.id);}else graphSelect(candidate.id);
   return;
  }
  points.delete(e.pointerId);gesture=snapshot();moved=true;canvas.style.cursor='grab';
 }
 function cancel(e){if(drag)worker?.postMessage({type:'drag',index:drag.index,release:true});drag=null;points.delete(e.pointerId);gesture=snapshot();moved=true;}
 function wheel(e){e.preventDefault();zoom(Math.exp(-e.deltaY*.002),point(e));}
 function keys(e){if(['+','=','-','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','0'].includes(e.key)){e.preventDefault();if(['+','='].includes(e.key))zoom(1.3);else if(e.key==='-')zoom(1/1.3);else if(e.key==='0')fit();else{userCamera=true;s.userCamera=true;camera.x+=(e.key==='ArrowLeft'?30:e.key==='ArrowRight'?-30:0)/camera.k;camera.y+=(e.key==='ArrowUp'?30:e.key==='ArrowDown'?-30:0)/camera.k;requestDraw();}}}
 const events={pointerdown:down,pointermove:move,pointerup:up,pointercancel:cancel,pointerleave:clearHover,wheel,keydown:keys};Object.entries(events).forEach(([name,fn])=>canvas.addEventListener(name,fn,{passive:false}));
 const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
 function workerFailure(){if(disposed)return;worker?.terminate();worker=null;ready=true;s.layoutError='Distribución automática no disponible. Podés explorar la vista y mover nodos.';const el=canvas.parentElement.querySelector('.graph-layout-notice');if(el){el.textContent=s.layoutError;el.hidden=false;}}
 if(nodes.length)try{
  worker=new Worker('/graph-layout.js?v=20261112-pro');worker.onerror=event=>{event.preventDefault();workerFailure();};
  worker.onmessage=({data})=>{if(disposed||data.generation!==generation)return;data.points.forEach((value,i)=>{if(i%2===0&&(!drag||drag.index!==i/2)){nodes[i/2].x=value;nodes[i/2].y=data.points[i+1];}});ready=data.done;if(!userCamera)fit(false);else requestDraw();};
  worker.postMessage({type:'start',generation,nodes:nodes.map(n=>({id:n.id,x:n.x,y:n.y,radius:n.radius})),edges:edges.map(e=>({source:e.a.id,target:e.b.id,group:e.group})),paused:s.paused,reduced,warm:s.positions.size>0,tuning:{repulsion:s.repulsion,distance:s.distance}});
 }catch{workerFailure();}else ready=true;
 graphRuntime={zoom,fit,pause(value){worker?.postMessage({type:'pause',value});},tune(value){ready=false;worker?.postMessage({type:'tune',value});},positions:()=>nodes.map(n=>({id:n.id,...screen(n)})),get settled(){return ready;},get hasWorker(){return !!worker;},destroy(){disposed=true;worker?.terminate();cancelAnimationFrame(frame);observer.disconnect();Object.entries(events).forEach(([name,fn])=>canvas.removeEventListener(name,fn));nodes.forEach(n=>s.positions.set(n.id,{x:n.x,y:n.y}));s.camera=camera;}};
}
function graphZoom(factor){graphRuntime?.zoom(factor);}
function graphFit(){graphRuntime?.fit();}
window.addEventListener('keydown',event=>{
 if(S.view!=='grafo'||!graphState().fullscreen||S.openNote)return;
 if(event.key==='Escape'){event.preventDefault();graphExpand();}
 if(event.key==='Tab'){
  const items=[...document.querySelectorAll('.graph-expanded button,.graph-expanded input,.graph-expanded select,.graph-expanded canvas')].filter(e=>!e.disabled&&e.getClientRects().length),first=items[0],last=items.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
 }
});
