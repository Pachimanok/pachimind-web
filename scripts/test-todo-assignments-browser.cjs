// All mutations target the local synthetic vault, never production.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const origin=process.env.HUMAN_PREVIEW_URL||'http://127.0.0.1:18301';assert.ok(['localhost','127.0.0.1'].includes(new URL(origin).hostname));
const out=process.env.TODO_SCREENSHOT_DIR||path.join(process.cwd(),'artifacts','todo-assignments');
(async()=>{fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const page=await browser.newPage({viewport,isMobile:viewport.width<700,hasTouch:viewport.width<700}),errors=[],writes=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(['POST','PATCH'].includes(r.method())&&new URL(r.url()).pathname.startsWith('/actions/todo'))writes.push(r.postDataJSON())});
  await page.goto(origin+'/?view=todo');await page.locator('#pwd').fill('preview-password');await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.waitForFunction(()=>!S.todoLoading);
  assert.equal(await page.evaluate(async()=>(await(await api('/health/preview')).json()).fixture),'human-demo');
  await page.getByRole('button',{name:'+ Actividad',exact:true}).click();assert.equal(await page.getByLabel('Responsable',{exact:true}).inputValue(),'');assert.equal(await page.getByLabel('Subresponsables',{exact:true}).inputValue(),'');assert.equal(await page.getByLabel('Fecha de inicio',{exact:true}).inputValue(),'');
  const title='Actividad de equipo demo '+viewport.width;
  await page.getByLabel('Actividad',{exact:true}).fill(title);await page.getByLabel('Responsable',{exact:true}).fill('Pablo');await page.getByLabel('Subresponsables',{exact:true}).fill('Andrés Buteler\nGenaro La Fata');
  await page.getByLabel('Fecha de inicio',{exact:true}).fill('2026-11-12');await page.getByLabel('Vencimiento',{exact:true}).fill('2026-11-15');
  // Date inversion must not send a mutation.
  await page.getByLabel('Vencimiento',{exact:true}).fill('2026-11-11');await page.getByRole('button',{name:'Guardar actividad',exact:true}).click();assert.equal(writes.length,0);
  await page.getByLabel('Vencimiento',{exact:true}).fill('2026-11-15');
  // Simulate a lost response: one request_id must recover the same activity.
  await page.route('**/actions/todo',async route=>{if(route.request().method()==='POST'){await route.fetch();await route.abort('failed')}else await route.continue()},{times:1});
  await page.getByRole('button',{name:'Guardar actividad',exact:true}).click();await page.waitForFunction(()=>!S.todoBusy&&!!S.todoError&&!!S.todoForm);
  await page.getByRole('button',{name:'Guardar actividad',exact:true}).click();await page.waitForFunction(title=>!S.todoBusy&&!S.todoLoading&&!S.todoForm&&S.todoItems.some(t=>t.title===title),title);
  assert.equal(writes.length,2);assert.equal(writes[0].request_id,writes[1].request_id);
  const task=await page.evaluate(title=>S.todoItems.find(t=>t.title===title),title),card=page.locator('[data-todo-id="'+task.id+'"]');
  assert.equal(task.responsable,'Pablo');assert.deepEqual(task.subresponsables,['Andrés Buteler','Genaro La Fata']);assert.equal(task.fecha_inicio,'2026-11-12');assert.equal(task.vencimiento,'2026-11-15');
  assert.equal(await card.getByText('Subresponsables: Andrés Buteler · Genaro La Fata',{exact:true}).count(),1);assert.equal(await card.getByText('Inicio: 2026-11-12 · Vencimiento: 2026-11-15',{exact:true}).count(),1);
  await page.reload();await page.waitForFunction(id=>!S.todoLoading&&S.todoItems.some(t=>t.id===id),task.id);
  await card.getByRole('button',{name:'Editar',exact:true}).click();assert.equal(await page.getByLabel('Subresponsables',{exact:true}).inputValue(),'Andrés Buteler\nGenaro La Fata');
  assert.ok((await page.locator('#todo-form').boundingBox()).y>=50,'Edit brings the form below the fixed header');
  await page.getByLabel('Responsable',{exact:true}).fill('Sabrina');await page.getByLabel('Subresponsables',{exact:true}).fill('Pablo\nAndrés Buteler');await page.getByLabel('Fecha de inicio',{exact:true}).fill('2026-11-13');await page.getByLabel('Vencimiento',{exact:true}).fill('2026-11-18');
  await page.screenshot({path:path.join(out,'formulario-'+viewport.width+'.png'),fullPage:true});
  await page.getByRole('button',{name:'Guardar actividad',exact:true}).click();await page.waitForFunction(id=>!S.todoBusy&&!S.todoForm&&S.todoItems.find(t=>t.id===id)?.responsable==='Sabrina',task.id);
  await page.getByLabel('Buscar actividades',{exact:true}).fill('Pablo');await page.getByLabel('Buscar actividades',{exact:true}).press('Tab');await card.waitFor();
  assert.equal(await card.getByText('Subresponsables: Pablo · Andrés Buteler',{exact:true}).count(),1,'Search finds secondary assignees');
  await card.getByRole('button',{name:'Editar',exact:true}).click();await page.getByLabel('Responsable',{exact:true}).fill('');await page.getByLabel('Subresponsables',{exact:true}).fill('');await page.getByLabel('Fecha de inicio',{exact:true}).fill('');await page.getByLabel('Vencimiento',{exact:true}).fill('');
  await page.getByRole('button',{name:'Guardar actividad',exact:true}).click();await page.waitForFunction(id=>!S.todoBusy&&!S.todoForm&&!S.todoItems.find(t=>t.id===id)?.responsable,task.id);
  const cleared=await page.evaluate(id=>S.todoItems.find(t=>t.id===id),task.id);assert.deepEqual(cleared.subresponsables,[]);assert.equal(cleared.fecha_inicio,null);assert.equal(cleared.vencimiento,null);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);await page.close();
 }
 console.log('TODO team/dates passed: create/edit/reload/clear, principal and multiple secondary assignees, start/deadline validation, secondary search, lost-response idempotency, desktop/mobile. Synthetic data only.');
}finally{await browser.close()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
