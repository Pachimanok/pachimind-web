const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const origin=process.env.HUMAN_PREVIEW_URL||'http://127.0.0.1:18310';
assert.ok(['localhost','127.0.0.1'].includes(new URL(origin).hostname));
const out=process.env.HUMAN_SCREENSHOT_DIR||'/workspace/artifacts/inbox-classification/browser';
(async()=>{fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:900},isMobile:width<700,hasTouch:width<700}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/?view=inbox');await page.locator('#pwd').fill('preview-password');await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.waitForFunction(()=>S.ibDrafts?.length&&!S.ibLoading);
  const marker=await page.evaluate(async()=>await captureJSON('/health/inbox-access-preview'));assert.equal(marker.synthetic,true);
  const blocked=page.locator('[data-inbox-note-id="'+marker.ids.private+'"]');await blocked.getByText('MCP: no habilitado',{exact:true}).waitFor();
  const id=await page.evaluate(async width=>{
   const created=await captureJSON('/inbox/draft',{method:'POST',body:JSON.stringify({title:'Clasificación sintética '+width+' '+crypto.randomUUID(),content:'Fuente sintética íntegra. No aprobar tareas.'})});
   const access=await humanRequest('/inbox-access/'+created.id);
   await humanRequest('/inbox-access/'+created.id,{method:'POST',body:JSON.stringify({request_id:crypto.randomUUID(),revision:access.revision,action:'enable',confirmed:true,authorized_fields:Object.keys(access.actions.enable.changes)})});
   const n=await captureJSON('/notes/'+created.id);
   await captureJSON('/inbox/'+created.id+'/classification',{method:'POST',body:JSON.stringify({request_id:crypto.randomUUID(),revision:n.revision,classification:{title:'Recurso sintético clasificado',tipo:'recurso',area:'Laboral',content:'Síntesis sintética separada.',comment:'Datos de prueba, sin aprobar tareas.'}})});
   await loadInbox();return created.id;
  },width);
  const card=page.locator('[data-inbox-note-id="'+id+'"]');await card.getByText('MCP: habilitado',{exact:true}).waitFor();await card.getByText('Clasificación MCP pendiente de confirmar',{exact:true}).waitFor();
  assert.equal(await page.getByRole('dialog').count(),0,'Status is visible without opening access dialog');
  await card.click();await page.getByRole('button',{name:'Revisar clasificación MCP',exact:true}).click();
  const save=page.getByRole('button',{name:'Guardar en el vault',exact:true});await save.waitFor();assert.equal(await save.isDisabled(),true);
  await page.getByLabel('Confirmo esta clasificación',{exact:true}).check();assert.equal(await save.isEnabled(),true);
  await page.screenshot({path:out+'/revision-'+width+'.png',fullPage:true});
  // A lost response must retry the same decision, without creating a duplicate.
  const commands=[];page.on('request',r=>{if(r.method()==='POST'&&r.url().includes('/inbox-classification/'))commands.push(r.postDataJSON())});
  await page.route('**/api/human/inbox-classification/'+id+'/decision',async route=>{await route.fetch();await route.abort('failed')},{times:1});
  await save.click();await page.waitForFunction(()=>S.ibError&&!S.ibConfirming);assert.equal(commands.length,1);
  await save.click();await page.getByText('Nota guardada',{exact:true}).waitFor();assert.equal(commands.length,2);assert.deepEqual(commands[0],commands[1]);
  const after=await page.evaluate(async id=>({note:await captureJSON('/notes/'+id),marker:await captureJSON('/health/inbox-access-preview')}),id);
  assert.equal(after.note.metadata.ia_editar,false);assert.equal(after.note.metadata.estado,'archivado');assert.equal(after.note.content.includes('Fuente sintética íntegra'),true);
  assert.deepEqual(after.marker.hashes,marker.hashes,'Immutable fixture originals preserved');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
  console.log(width+': visible MCP status, pending classification, explicit confirmation, lost response retry, original protections and responsive review OK');await page.close();
 }
}finally{await browser.close()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
