// Local rendering only. The server supplies permission-filtered saved links.
let graphRuntime=null;
const GRAPH_COLORS={ambito:'#e8a020',proyecto:'#70b7ff',persona:'#b997ff',organizacion:'#5ed2b5',cliente:'#69c9de',reunion:'#f08ca9',nota:'#b4aca0'};
function graphState(){return S.graph||(S.graph={data:null,loading:false,error:null,request:0,q:'',tipo:'',ambito:'',showAmbitos:true,selected:null,focus:null,list:false,listPage:0,filtersOpen:false,camera:null,positions:new Map()});}
async function loadGraph(focus=null){
 const s=graphState(),request=++s.request;s.loading=true;s.error=null;s.listPage=0;s.focus=focus;s.selected=focus;s.camera=null;s.positions=new Map();render();
 try{const r=await api('/vault/graph'+(focus?'?focus='+encodeURIComponent(focus):''));if(!r.ok)throw new Error('No se pudo cargar el grafo. Reintentá.');const d=await r.json();if(s===S.graph&&request===s.request)s.data=d;}
 catch(e){if(s===S.graph&&request===s.request)s.error=e.message;}
 finally{if(s===S.graph&&request===s.request){s.loading=false;render();}}
}
function openGraphFor(id){const s=graphState();s.q='';s.tipo='';s.ambito='';setView('grafo');loadGraph(id);}
function graphFilter(){const s=graphState();s.q=document.getElementById('graph-query').value;s.tipo=document.getElementById('graph-type').value;s.ambito=document.getElementById('graph-area').value;s.selected=null;s.camera=null;s.positions=new Map();s.listPage=0;render();}
function graphVisible(){
 const s=graphState(),q=s.q.trim().toLocaleLowerCase('es');
 const nodes=(s.data?.nodes||[]).filter(n=>(!q||(n.title+' '+n.path).toLocaleLowerCase('es').includes(q))&&(!s.tipo||n.tipo===s.tipo)&&(!s.ambito||n.ambitos.includes(s.ambito)));
 const ids=new Set(nodes.map(n=>n.id));return {nodes,edges:(s.data?.edges||[]).filter(e=>ids.has(e.source)&&ids.has(e.target))};
}
function graphSelect(id,showDetail=false){const s=graphState();if(!id.startsWith('@ambito:')&&!graphVisible().nodes.some(n=>n.id===id)){s.q='';s.tipo='';s.ambito='';s.camera=null;}s.selected=id;render();if(showDetail)document.querySelector('.graph-detail')?.scrollIntoView({block:'nearest',behavior:'auto'});}
function graphListPage(delta){graphState().listPage+=delta;render();}
function renderGraph(){
 const s=graphState(),d=s.data,v=graphVisible(),areas=[...new Set((d?.nodes||[]).flatMap(n=>n.ambitos))].sort(),types=[...new Set((d?.nodes||[]).map(n=>n.tipo).filter(Boolean))].sort();
 const n=d?.nodes.find(n=>n.id===s.selected),group=s.selected?.startsWith('@ambito:')?s.selected.slice(8):null;
 const links=n?(d.edges.filter(e=>e.source===n.id||e.target===n.id)):[];
 const neighbors=n?[...new Set(links.map(e=>e.source===n.id?e.target:e.source))].map(id=>d.nodes.find(n=>n.id===id)).filter(Boolean):[];
 return `<section class="graph-view" aria-labelledby="graph-title"><header class="graph-header"><div><p class="graph-eyebrow">TU VAULT, CONECTADO</p><h1 id="graph-title">Grafo de notas</h1><p>Explorá tus notas, ámbitos y entidades.</p></div><button class="btn btn-ghost" onclick="loadGraph(graphState().focus)" ${s.loading?'disabled':''}>Actualizar grafo</button></header>
 <details class="graph-filter-panel" ${s.filtersOpen||!matchMedia('(max-width:700px)').matches?'open':''} ontoggle="graphState().filtersOpen=this.open"><summary>Buscar y filtrar el grafo</summary><form class="graph-filters" onsubmit="event.preventDefault();graphFilter()"><label>Buscar en el grafo<input id="graph-query" type="search" placeholder="Nombre de una nota" value="${esc(s.q)}" maxlength="200"></label><label>Tipo<select id="graph-type"><option value="">Todos los tipos</option>${types.map(t=>`<option ${s.tipo===t?'selected':''} value="${esc(t)}">${esc(t)}</option>`).join('')}</select></label><label>Ámbito<select id="graph-area"><option value="">Todos los ámbitos</option>${areas.map(a=>`<option ${s.ambito===a?'selected':''} value="${esc(a)}">${esc(a)}</option>`).join('')}</select></label><button class="btn btn-ghost" type="submit">Filtrar</button></form>
 <div class="graph-options"><label><input type="checkbox" ${s.showAmbitos?'checked':''} onchange="graphState().showAmbitos=this.checked;graphState().camera=null;render()"> Mostrar nodos de ámbitos</label></div></details><div class="graph-options"><button class="btn btn-ghost" onclick="graphState().list=!graphState().list;render()" aria-expanded="${s.list}">${s.list?'Ocultar lista':'Ver notas en lista'}</button>${s.focus?'<button class="btn btn-ghost" onclick="loadGraph()">Volver al grafo completo</button>':''}</div>
 ${s.loading?'<p role="status">Cargando conexiones…</p>':''}${s.error?`<p class="alert-err" role="alert">${esc(s.error)}</p><button class="btn btn-ghost" onclick="loadGraph(graphState().focus)">Reintentar</button>`:''}
 ${d&&!s.loading&&!s.error?`<p class="graph-count" role="status">${v.nodes.length} notas · ${v.edges.length} vínculos guardados${s.focus?' · Grafo local':''}</p>${d.truncated?`<p class="graph-notice">Vista limitada a ${d.returned} de ${d.total_matching} notas. Desde cualquier nota, «Ver en grafo» abre sus conexiones locales.</p>`:''}
 <div class="graph-workspace"><div class="graph-stage"><canvas id="vault-graph" aria-label="Grafo de notas. Usá los controles o la lista para explorar." aria-describedby="graph-help" tabindex="0"></canvas><div class="graph-controls" aria-label="Controles del grafo"><button type="button" onclick="graphZoom(1.3)" aria-label="Acercar grafo">+</button><button type="button" onclick="graphZoom(1/1.3)" aria-label="Alejar grafo">−</button><button type="button" onclick="graphFit()" aria-label="Encuadrar grafo">⌖</button></div>${!v.nodes.length?'<p class="graph-empty">No hay notas con estos filtros.</p>':''}</div>
 <aside class="graph-detail" aria-label="Nota seleccionada">${n?`<span class="graph-kind">${esc(n.tipo||'nota')}</span><h2>${esc(n.title)}</h2><p class="graph-path">${esc(n.path)}</p><div class="graph-chips">${n.ambitos.map(a=>`<span>${esc(a)}</span>`).join('')}</div><div class="graph-detail-actions"><button class="btn btn-primary" data-graph-open="${esc(n.id)}" onclick="openNote(this.dataset.graphOpen)">Abrir nota</button><button class="btn btn-ghost" data-graph-focus="${esc(n.id)}" onclick="openGraphFor(this.dataset.graphFocus)">Ver conexiones locales</button></div><h3>${neighbors.length} notas conectadas</h3><div class="graph-neighbors">${neighbors.map(other=>`<button type="button" data-graph-id="${esc(other.id)}" onclick="graphSelect(this.dataset.graphId,true)">${esc(other.title)}</button>`).join('')||'<p>Sin vínculos visibles. Su ámbito se muestra por separado.</p>'}</div>`:group?`<span class="graph-kind">Ámbito</span><h2>${esc(group)}</h2><p>Clasificación declarada en las notas. Las líneas punteadas no equivalen a vínculos entre notas.</p><p>${v.nodes.filter(n=>n.ambitos.includes(group)).length} notas en esta vista.</p>`:'<div class="graph-welcome"><span aria-hidden="true">⬡</span><h2>Tocá una nota</h2><p>Vas a ver sus conexiones y podrás abrirla sin salir de PachiMind.</p></div>'}</aside></div>
 <p id="graph-help" class="graph-help">Arrastrá para desplazarte. Pellizcá con dos dedos para acercar o alejar; también podés usar + y −. Tocá un nodo para seleccionarlo. Con teclado, usá las flechas y +/− o la lista.</p>
 <div class="graph-legend">${[['proyecto','Proyecto'],['persona','Persona'],['organizacion','Organización'],['cliente','Cliente'],['nota','Otras notas'],['ambito','Ámbito · línea punteada']].map(([t,label])=>`<span><i style="background:${GRAPH_COLORS[t]}"></i>${label}</span>`).join('')}</div>
 ${s.list?`<section class="graph-list" aria-label="Notas del grafo"><h2>Notas de esta vista</h2>${v.nodes.slice(s.listPage*30,s.listPage*30+30).map(n=>`<button type="button" data-graph-id="${esc(n.id)}" onclick="graphSelect(this.dataset.graphId,true)"><strong>${esc(n.title)}</strong><small>${esc(n.tipo||'nota')} · ${esc(n.ambitos.join(', ')||'Sin ámbito')}</small></button>`).join('')||'<p>No hay notas.</p>'}<div class="graph-pagination"><button class="btn btn-ghost" onclick="graphListPage(-1)" ${s.listPage===0?'disabled':''}>Anterior</button><span>Página ${s.listPage+1}</span><button class="btn btn-ghost" onclick="graphListPage(1)" ${(s.listPage+1)*30>=v.nodes.length?'disabled':''}>Siguiente</button></div></section>`:''}
 <p class="graph-help">${esc(d.scope_note)}</p>`:''}</section>`;
}
function destroyGraphView(){if(graphRuntime){graphRuntime.destroy();graphRuntime=null;}}
function mountGraphView(){
 const canvas=document.getElementById('vault-graph');if(!canvas)return;const s=graphState(),v=graphVisible(),ctx=canvas.getContext('2d');if(!ctx)return;
 const areas=s.showAmbitos?[...new Set(v.nodes.flatMap(n=>n.ambitos))].sort():[],groupCounts=new Map(),nodes=[],map=new Map();
 areas.forEach((a,i)=>{const angle=i*2*Math.PI/Math.max(1,areas.length);const n={id:'@ambito:'+a,title:a,tipo:'ambito',x:Math.cos(angle)*280,y:Math.sin(angle)*280,vx:0,vy:0,pinned:true};nodes.push(n);map.set(n.id,n);});
 v.nodes.forEach((n,i)=>{const group=n.ambitos[0],g=map.get('@ambito:'+group),j=(groupCounts.get(group)||0)+1;groupCounts.set(group,j);const saved=s.positions.get(n.id),angle=j*2.399963;const p={...n,x:saved?.x??((g?.x||0)+Math.cos(angle)*Math.sqrt(j)*26),y:saved?.y??((g?.y||0)+Math.sin(angle)*Math.sqrt(j)*26),vx:0,vy:0};nodes.push(p);map.set(p.id,p);});
 const edges=v.edges.map(e=>({...e,a:map.get(e.source),b:map.get(e.target),group:false}));
 if(s.showAmbitos)v.nodes.forEach(n=>n.ambitos.forEach(a=>edges.push({a:map.get(n.id),b:map.get('@ambito:'+a),group:true})));
 let width=1,height=1,frame=0,steps=0,disposed=false,camera=s.camera||{x:0,y:0,k:1},pointers=new Map(),gesture=null,moved=false,dirty=true;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function fit(){
  const xs=nodes.map(n=>n.x),ys=nodes.map(n=>n.y),left=nodes.length?Math.min(...xs):0,right=nodes.length?Math.max(...xs):0,top=nodes.length?Math.min(...ys):0,bottom=nodes.length?Math.max(...ys):0;
  camera={x:-(left+right)/2,y:-(top+bottom)/2,k:Math.min(2,Math.max(.15,Math.min((width-64)/(right-left+80),(height-64)/(bottom-top+80))))};s.camera=camera;dirty=true;draw();
 }
 function screen(n){return {x:width/2+(n.x+camera.x)*camera.k,y:height/2+(n.y+camera.y)*camera.k};}
 function draw(){
  if(disposed)return;const colors=getComputedStyle(document.documentElement);ctx.clearRect(0,0,width,height);const selected=map.get(s.selected),neighbors=new Set(selected?[selected.id]:[]);
  if(selected)edges.forEach(e=>{if(e.a===selected)neighbors.add(e.b.id);if(e.b===selected)neighbors.add(e.a.id)});
  edges.forEach(e=>{const a=screen(e.a),b=screen(e.b);ctx.globalAlpha=!selected||e.a===selected||e.b===selected?(e.group ? .38 : .65):.09;ctx.strokeStyle=e.group?GRAPH_COLORS.ambito:colors.getPropertyValue('--tx3').trim();ctx.lineWidth=e.group?1:1.2;ctx.setLineDash(e.group?[3,5]:[]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();});ctx.setLineDash([]);
  const labels=[];
  nodes.forEach(n=>{const p=screen(n);if(p.x< -100||p.x>width+100||p.y< -50||p.y>height+50)return;ctx.globalAlpha=!selected||neighbors.has(n.id)?1:.28;const radius=n.tipo==='ambito'?11:n.id===s.selected?9:['proyecto','persona','organizacion','cliente'].includes(n.tipo)?7:4.5;
   ctx.fillStyle=GRAPH_COLORS[n.tipo]||GRAPH_COLORS.nota;ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.fill();if(n.id===s.selected){ctx.strokeStyle=colors.getPropertyValue('--tx').trim();ctx.lineWidth=2;ctx.stroke();}
   if(n.tipo==='ambito'||nodes.length<55||camera.k>1.4||neighbors.has(n.id)&&selected)labels.push({n,p,radius,priority:n.id===s.selected?0:n.tipo==='ambito'?1:selected&&neighbors.has(n.id)?2:['proyecto','persona','organizacion','cliente'].includes(n.tipo)?3:4});
  });
  const placed=[];labels.sort((a,b)=>a.priority-b.priority).forEach(({n,p,radius,priority})=>{
   const text=n.title.length>32?n.title.slice(0,31)+'…':n.title;ctx.font=(n.tipo==='ambito'?'600 ':'')+'12px "DM Sans",sans-serif';const w=ctx.measureText(text).width,box={x:p.x-w/2,y:p.y+radius+4,w,h:16};
   if(priority>0&&placed.some(b=>box.x<b.x+b.w+5&&box.x+box.w>b.x-5&&box.y<b.y+b.h+3&&box.y+box.h>b.y-3))return;
   placed.push(box);ctx.globalAlpha=!selected||neighbors.has(n.id)?1:.4;ctx.fillStyle=colors.getPropertyValue('--tx').trim();ctx.textAlign='center';ctx.fillText(text,p.x,p.y+radius+16);
  });ctx.globalAlpha=1;dirty=false;
 }
 function simulate(){
  const cells=new Map(),size=80;
  nodes.forEach(n=>{const key=Math.floor(n.x/size)+','+Math.floor(n.y/size);if(!cells.has(key))cells.set(key,[]);cells.get(key).push(n);});
  for(const n of nodes){if(n.pinned)continue;const cx=Math.floor(n.x/size),cy=Math.floor(n.y/size);
   for(let x=cx-1;x<=cx+1;x++)for(let y=cy-1;y<=cy+1;y++)for(const other of cells.get(x+','+y)||[]){if(other===n)continue;let dx=n.x-other.x,dy=n.y-other.y,d2=dx*dx+dy*dy+1;if(d2<3600){const force=18/d2;n.vx+=dx*force;n.vy+=dy*force;}}
   n.vx-=n.x*.0002;n.vy-=n.y*.0002;
  }
  edges.forEach(e=>{const dx=e.b.x-e.a.x,dy=e.b.y-e.a.y,d=Math.hypot(dx,dy)||1,force=(d-(e.group?105:85))*.0015,fx=dx/d*force,fy=dy/d*force;if(!e.a.pinned){e.a.vx+=fx;e.a.vy+=fy;}if(!e.b.pinned){e.b.vx-=fx;e.b.vy-=fy;}});
  nodes.forEach(n=>{if(!n.pinned){n.vx*=.75;n.vy*=.75;n.x+=n.vx;n.y+=n.vy;}});
 }
 function tick(){if(disposed)return;if(steps<(reduced?0:100)){simulate();steps++;dirty=true;}if(dirty)draw();if(steps<(reduced?0:100))frame=requestAnimationFrame(tick);}
 function resize(){const box=canvas.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);width=box.width;height=box.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);if(!s.camera)fit();else{camera=s.camera;draw();}}
 function zoom(factor,anchor={x:width/2,y:height/2}){const before=camera.k,next=Math.max(.15,Math.min(5,before*factor));camera.x+=(anchor.x-width/2)*(1/next-1/before);camera.y+=(anchor.y-height/2)*(1/next-1/before);camera.k=next;s.camera=camera;draw();}
 function point(e){const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
 function snapshot(){const p=[...pointers.values()];return p.length===2?{x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2,d:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)}:p[0];}
 function down(e){canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,point(e));gesture=snapshot();moved=pointers.size>1;}
 function move(e){if(!pointers.has(e.pointerId))return;const before=gesture;pointers.set(e.pointerId,point(e));const now=snapshot();if(!before||!now)return;const dx=now.x-before.x,dy=now.y-before.y;if(Math.abs(dx)+Math.abs(dy)>2)moved=true;if(now.d&&before.d){moved=true;zoom(now.d/Math.max(1,before.d),now);}camera.x+=dx/camera.k;camera.y+=dy/camera.k;s.camera=camera;gesture=now;draw();}
 function up(e){const p=point(e);if(!moved&&pointers.size===1){let nearest=null,distance=22;nodes.forEach(n=>{const q=screen(n),d=Math.hypot(q.x-p.x,q.y-p.y);if(d<distance){nearest=n;distance=d;}});if(nearest){pointers.clear();graphSelect(nearest.id);return;}}pointers.delete(e.pointerId);gesture=snapshot();moved=true;}
 function cancel(e){pointers.delete(e.pointerId);gesture=snapshot();moved=true;}
 function wheel(e){e.preventDefault();zoom(Math.exp(-e.deltaY*.002),point(e));}
 function keys(e){if(['+','=','-','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','0'].includes(e.key)){e.preventDefault();if(e.key==='+'||e.key==='=')zoom(1.3);else if(e.key==='-')zoom(1/1.3);else if(e.key==='0')fit();else{camera.x+=(e.key==='ArrowLeft'?30:e.key==='ArrowRight'?-30:0)/camera.k;camera.y+=(e.key==='ArrowUp'?30:e.key==='ArrowDown'?-30:0)/camera.k;draw();}}}
 const events={pointerdown:down,pointermove:move,pointerup:up,pointercancel:cancel,wheel,keydown:keys};Object.entries(events).forEach(([name,fn])=>canvas.addEventListener(name,fn,{passive:false}));
 const observer=new ResizeObserver(resize);observer.observe(canvas);resize();tick();
 graphRuntime={zoom,fit,positions:()=>nodes.map(n=>({id:n.id,...screen(n)})),destroy(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();Object.entries(events).forEach(([name,fn])=>canvas.removeEventListener(name,fn));nodes.forEach(n=>s.positions.set(n.id,{x:n.x,y:n.y}));s.camera=camera;}};
}
function graphZoom(factor){graphRuntime?.zoom(factor);}
function graphFit(){graphRuntime?.fit();}
