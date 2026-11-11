// Real renderers with synthetic long lists. Wheel/touch must work without scrollIntoView.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const origin=process.env.HUMAN_PREVIEW_URL||'http://127.0.0.1:18305';
assert.ok(['127.0.0.1','localhost'].includes(new URL(origin).hostname));
const out=process.env.LIST_SCREENSHOT_DIR||path.join(process.cwd(),'artifacts','list-scroll');
async function seed(page,kind){await page.evaluate(kind=>{
 const notes=Array.from({length:42},(_,i)=>({id:'scroll-demo-'+i,title:'Elemento demo '+String(i).padStart(2,'0'),path:'Demo/'+i+'.md',tipo:'nota',type:'nota',estado:'pendiente',area:'Personal',excerpt:'Contenido sintético para verificar listas largas.',score:1,metadata:{tipo:'nota',estado:'pendiente',tags:[]}}));
 const paged=results=>({results,total:results.length,page:1,per_page:results.length});
 const pending=notes.map(n=>({key:'links:'+n.id,id:n.id,kind:'links',category:'Vínculos',title:n.title,summary:n.excerpt,source:n}));
 S.searchQ='';S.searchResults=null;S.openNote=null;S.openLoading=false;S.human=newHumanState();S.people=newPeopleState();S.associations=newAssociationState();
 S.view=kind.startsWith('humano')?'humano':kind==='reuniones-fuentes'?'reuniones':kind.startsWith('busqueda-')?kind.slice(9):kind;
 if(kind==='tablero'){S.boards={nota:notes};S.boardsLoading=false;S.areaFilter='todos';S.boardExpanded={nota:true};}
 if(['humano','vinculos','humano-opcionales'].includes(kind)){S.human.data={...paged(pending),counts:{links:42},total_pending:42};if(kind==='humano-opcionales'){S.human.kind='note';S.human.data.optional={selection_count:42,hidden_count:0};}}
 if(kind==='humano-aprobadas'){S.human.showSaved=true;S.human.savedData=paged(notes.map(n=>({...n,tipo:'decision',project:{id:'demo',title:'Proyecto demo'},source:{id:'demo',title:'Reunión demo'}})));}
 if(kind==='memoria'){S.memoryProjects=[];S.memoryLoading=false;S.memoryError=null;S.memoryId='demo';S.memoryData={project_id:'demo',title:'Proyecto demo',warnings:[],sources:notes};S.capOpen=false;}
 if(kind==='todo'){S.todoItems=notes.map(n=>({...n,proyectos:[],responsable:null,vencimiento:null,prioridad:'media',revision:'f'.repeat(64)}));S.todoLoading=false;S.todoFilter='todas';S.todoArea='todas';S.todoQuery='';S.todoForm=null;}
 if(kind==='personas'){S.people.items=notes.map(n=>({...n,fields:{nombre:n.title,ambitos:['Trabajo']},pending_fields:[],incoming_count:0,outgoing_count:0}));S.people.total=42;S.people.perPage=42;}
 if(kind==='entidades'){S.enStep='list';S.enTab='organizacion';S.enList={organizacion:notes};S.enLoading=false;S.enError=null;}
 if(kind==='inbox'){S.ibStep='list';S.ibDrafts=notes;S.ibLoading=false;S.ibError=null;S.paLoading=false;S.paResults=[];}
 if(kind.startsWith('reuniones')){S.rnStep=kind==='reuniones'?'notebooks':'sources';S.rnNotebooks=notes;S.rnSources=notes;S.rnSelected=[];S.rnNotebooksLoading=false;S.rnSourcesLoading=false;S.rnError=null;S.rnNotebookTitle='Notebook demo';}
 if(kind==='vault'){S.associations.data={...paged(notes.map(n=>({...n,ambitos:['Trabajo'],orphan:true,general_nodes:[],general_node_count:0,connection_count:0,incoming_count:0,outgoing_count:0,unresolved_count:0}))),summary:{notes:42,orphans:42,no_general_node:42,unresolved:0,no_ambito:0},ambitos:['Trabajo']};}
 if(kind==='sistema'){S.sysLoading=false;S.sysError=null;S.sysData={api:{status:'ok',uptime:'demo',indexed_notes:42},git:{is_clean:true,pending_modified:0,pending_new:0,pending_deleted:0,total_commits:1},vault:{notes_to_review:0,vault_size_kb:1,total_notes:42,by_type:Object.fromEntries(Array.from({length:160},(_,i)=>['Categoría demo '+String(i).padStart(3,'0'),1]))}};}
 if(kind==='tags'){S.allNotes=notes.map(n=>({...n,metadata:{...n.metadata,tags:Array.from({length:70},(_,i)=>'demo-'+String(i).padStart(2,'0'))}}));S.tagSelected='demo-00';S.tagSearch='';}
 if(kind==='chat'){S.chatMessages=notes.map(n=>({role:'user',text:n.title+'\n'+Array(4).fill(n.excerpt).join('\n')}));S.chatLoading=false;S.chatInput='';S.chatError=null;}
 if(kind.startsWith('busqueda-')){S.searchQ='demo';S.searchResults=notes;S.searchLoading=false;}
 render();document.querySelector('.main-area').scrollTop=0;
},kind);}
async function gesture(page,context,selector,mobile){
 const locator=page.locator(selector),box=await locator.boundingBox();assert.ok(box,'Scroller exists: '+selector);
 const point={x:box.x+box.width/2,y:Math.min(box.y+box.height/2,620)};
 const metric=()=>locator.evaluate(el=>({top:el.scrollTop,range:el.scrollHeight-el.clientHeight}));
 assert.ok((await metric()).range>150,'Long list must have scroll range: '+selector);
 await page.mouse.move(point.x,point.y);await page.mouse.wheel(0,500);await page.waitForTimeout(110);
 assert.ok((await metric()).top>30,'Wheel moves '+selector);
 if(mobile){const client=await context.newCDPSession(page),before=(await metric()).top;
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:point.x,y:point.y}]});
  for(let delta=40;delta<=200;delta+=40){await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x,y:point.y-delta}]});await page.waitForTimeout(22)}
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(100);
  assert.ok((await metric()).top>before+20,'Touch moves '+selector);await client.detach();
 }
 for(let i=0;i<24;i++){await page.mouse.wheel(0,1800);await page.waitForTimeout(20)}
 await page.waitForTimeout(120);const m=await metric();assert.ok(m.top>=m.range-3,'Wheel reaches final row: '+selector);
 return m.top;
}
async function accessibleLast(page,locator,height,mobile){
 const target=locator.last(),b=await target.boundingBox();assert.ok(b&&b.y>=55&&b.y+b.height<=height-(mobile?56:0)+2,'Final item visible: '+await target.textContent());
 assert.equal(await target.evaluate(el=>{const b=el.getBoundingClientRect();return el.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2))}),true,'Final item is not covered');
}
(async()=>{fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const mobile=viewport.width<700,context=await browser.newContext({viewport,hasTouch:mobile,isMobile:mobile}),page=await context.newPage(),writes=[],errors=[];
  page.on('request',r=>{if(!['GET','HEAD'].includes(r.method())&&!r.url().endsWith('/api/auth'))writes.push(r.url())});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/?view=humano');await page.locator('#pwd').fill('preview-password');await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.waitForFunction(()=>S.human.data&&!S.human.loading);await page.waitForTimeout(500);
  assert.equal(await page.evaluate(async()=>(await(await api('/health/preview')).json()).synthetic),true);
  for(const kind of ['humano','humano-aprobadas','humano-opcionales','vinculos','tablero','memoria','todo','personas','entidades','inbox','reuniones','reuniones-fuentes','vault','sistema','busqueda-tags','busqueda-chat']){
   await seed(page,kind);const top=await gesture(page,context,'.main-area',mobile);
   const last=kind==='sistema'?page.getByText('Categoría demo 159',{exact:true}):page.locator('.main-content').getByText('Elemento demo 41',{exact:true});
   await accessibleLast(page,last,viewport.height,mobile);
   if(kind.startsWith('humano')||kind==='vinculos')await accessibleLast(page,page.locator('.human-card').last().getByRole('button').last(),viewport.height,mobile);
   await page.evaluate(()=>render());assert.ok(Math.abs(await page.locator('.main-area').evaluate(el=>el.scrollTop)-top)<3,'Rerender keeps position: '+kind);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'No horizontal page overflow: '+kind);
   if(kind==='humano')await page.screenshot({path:path.join(out,'humano-'+viewport.width+'.png')});
   console.log(viewport.width+': '+kind+' wheel'+(mobile?'/touch':'')+' + final item + position OK');
  }
  await seed(page,'tags');await gesture(page,context,'.tag-sidebar',mobile);await accessibleLast(page,page.getByText('#demo-69',{exact:true}),viewport.height,mobile);
  const tagTop=await page.locator('.tag-sidebar').evaluate(el=>el.scrollTop);const notesTop=await gesture(page,context,'.tag-notes',mobile);await accessibleLast(page,page.locator('.tag-notes').getByText('Elemento demo 41',{exact:true}),viewport.height,mobile);
  await page.evaluate(()=>render());assert.equal(await page.locator('.tag-sidebar').evaluate(el=>el.scrollTop),tagTop);assert.equal(await page.locator('.tag-notes').evaluate(el=>el.scrollTop),notesTop);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Tags contain their table overflow');
  await seed(page,'chat');const chatTop=await gesture(page,context,'#chat-msgs',mobile);await accessibleLast(page,page.locator('#chat-msgs>div'),viewport.height,mobile);await accessibleLast(page,page.locator('.chat-composer'),viewport.height,mobile);
  await page.evaluate(()=>render());assert.equal(await page.locator('#chat-msgs').evaluate(el=>el.scrollTop),chatTop);
  // Note panel has its own scroll and must not lose the underlying list position.
  await seed(page,'humano');const rootTop=await gesture(page,context,'.main-area',mobile);
  await page.evaluate(()=>{S.openNote={id:'demo',title:'Nota demo',path:'Demo.md',metadata:{fuente_inmutable:true},content:Array.from({length:150},(_,i)=>'Línea demo '+i).join('\n')};render()});
  await gesture(page,context,'.op-body',mobile);await accessibleLast(page,page.getByText('Fuente original protegida. Usá Memoria → Revisar decisiones y acciones para registrar propuestas separadas.',{exact:true}),viewport.height,false);
  await page.locator('.op-close').click();assert.equal(await page.locator('.main-area').evaluate(el=>el.scrollTop),rootTop);
  assert.deepEqual(writes,[],'Audit must not create or approve data');assert.deepEqual(errors,[],'No browser exceptions');await context.close();
  console.log(viewport.width+': Tags panes, Chat/composer, note panel and return position OK');
 }
 console.log('All list scrolling checks passed with synthetic data only; no writes.');
}finally{await browser.close()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
