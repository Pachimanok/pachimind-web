const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const origin=process.env.HUMAN_PREVIEW_URL||'http://127.0.0.1:18309';assert.ok(['localhost','127.0.0.1'].includes(new URL(origin).hostname));
const out=process.env.HUMAN_SCREENSHOT_DIR||path.join(process.cwd(),'artifacts','inbox-access');
(async()=>{fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const page=await browser.newPage({viewport,isMobile:viewport.width<700,hasTouch:viewport.width<700}),errors=[],commands=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='POST'&&r.url().includes('/api/human/inbox-access/')&&r.headers().authorization)commands.push(r.postDataJSON())});
  await page.goto(origin+'/?view=inbox');await page.locator('#pwd').fill('preview-password');await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.waitForFunction(()=>S.ibDrafts?.length&&!S.ibLoading);
  const marker=await page.evaluate(async()=>await(await api('/health/inbox-access-preview')).json());assert.equal(marker.synthetic,true);const ids=marker.ids;
  const dialog=page.getByRole('dialog',{name:'Acceso de lectura en MCP',exact:true});
  const open=async id=>{await page.locator('[data-inbox-access-id="'+id+'"]').click();await dialog.waitFor();await page.waitForFunction(()=>S.ibAccess&&!S.ibAccess.loading)};
  const permitted=async id=>page.evaluate(async id=>{const r=await fetch('/notes/'+id,{headers:{'X-API-Key':'reader'}});return r.status},id);
  assert.equal(await permitted(ids.normal),403);
  const summary=await page.evaluate(async()=>await humanRequest('/summary'));
  await open(ids.normal);assert.equal(await page.evaluate(()=>S.ibStep),'list','Access button does not open/classify the draft');
  await dialog.getByText('Disponible para consultas IA',{exact:true}).waitFor();assert.equal(await dialog.getByRole('button',{name:'Confirmar habilitación',exact:true}).isDisabled(),true);
  assert.equal(await dialog.getByLabel('Autorizo este cambio de acceso',{exact:true}).isChecked(),false);
  await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();assert.equal(commands.length,0);assert.equal(await permitted(ids.normal),403);
  await open(ids.normal);await dialog.getByLabel('Autorizo este cambio de acceso',{exact:true}).check();
  const confirmBox=await dialog.getByRole('button',{name:'Confirmar habilitación',exact:true}).boundingBox();assert.ok(confirmBox.y>0&&confirmBox.y+confirmBox.height<=viewport.height,'Confirmation stays inside the viewport');
  await page.screenshot({path:path.join(out,'consentimiento-'+viewport.width+'.png'),fullPage:true});
  await page.route('**/api/human/inbox-access/'+ids.normal,async route=>{if(route.request().method()==='POST'){await route.fetch();await route.abort('failed')}else await route.continue()},{times:1});
  await dialog.getByRole('button',{name:'Confirmar habilitación',exact:true}).click();await dialog.getByRole('alert').waitFor();
  await dialog.getByRole('button',{name:'Reintentar misma autorización',exact:true}).click();await dialog.getByText('Lectura habilitada y verificada.',{exact:false}).waitFor();
  assert.equal(commands.length,2);assert.equal(commands[0].request_id,commands[1].request_id);assert.deepEqual(commands[0],commands[1],'Lost-response retry reuses exact approval');
  assert.equal(await permitted(ids.normal),200);
  let note=await page.evaluate(async id=>await captureJSON('/notes/'+id),ids.normal);assert.equal(note.metadata.estado,'borrador');assert.equal(note.metadata.revisado,false);assert.equal(note.metadata.ia_editar,false);
  await dialog.getByRole('button',{name:'Listo',exact:true}).click();
  await open(ids.normal);await dialog.getByLabel('Autorizo este cambio de acceso',{exact:true}).check();await dialog.getByRole('button',{name:'Confirmar revocación',exact:true}).click();
  await dialog.getByText('Autorización revocada y verificada.',{exact:false}).waitFor();assert.equal(await permitted(ids.normal),403);await dialog.getByRole('button',{name:'Listo',exact:true}).click();
  const beforeBlocked=commands.length;await open(ids.private);assert.equal(await dialog.locator('#inbox-mcp-submit').count(),0);await dialog.getByText('Esta nota o una fuente vinculada tiene una restricción adicional.',{exact:false}).waitFor();await page.keyboard.press('Escape');assert.equal(commands.length,beforeBlocked);
  await open(ids.stale);await dialog.getByLabel('Autorizo este cambio de acceso',{exact:true}).check();
  await page.route('**/api/human/inbox-access/'+ids.stale,async route=>{if(route.request().method()==='POST')await route.fulfill({status:409,contentType:'application/json',body:JSON.stringify({detail:'La nota o su acceso cambió. Volvé a comprobar antes de autorizar.'})});else await route.continue()},{times:1});
  await dialog.getByRole('button',{name:'Confirmar habilitación',exact:true}).click();await dialog.getByRole('alert').waitFor();assert.equal(await dialog.getByLabel('Autorizo este cambio de acceso',{exact:true}).isChecked(),false);
  await dialog.getByRole('button',{name:'Volver a comprobar acceso',exact:true}).click();await page.waitForFunction(()=>!S.ibAccess.loading);assert.equal(await dialog.getByLabel('Autorizo este cambio de acceso',{exact:true}).isChecked(),false);await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();
  // Immutable original can be read after consent and revoked from the note overlay.
  await open(ids.immutable);await dialog.getByLabel('Autorizo este cambio de acceso',{exact:true}).check();await dialog.getByRole('button',{name:'Confirmar habilitación',exact:true}).click();await dialog.getByText('Lectura habilitada y verificada.',{exact:false}).waitFor();await dialog.getByRole('button',{name:'Listo',exact:true}).click();
  await page.evaluate(id=>openNote(id),ids.immutable);await page.waitForFunction(()=>S.openNote&&!S.openLoading);
  await page.locator('.op-body').getByRole('button',{name:'Acceso MCP',exact:true}).click();await page.waitForFunction(()=>S.ibAccess&&!S.ibAccess.loading);
  await dialog.getByLabel('Autorizo este cambio de acceso',{exact:true}).check();await dialog.getByRole('button',{name:'Confirmar revocación',exact:true}).click();await dialog.getByText('Autorización revocada y verificada.',{exact:false}).waitFor();await dialog.getByRole('button',{name:'Listo',exact:true}).click();await page.locator('.op-close').click();
  const after=await page.evaluate(async()=>await(await api('/health/inbox-access-preview')).json());assert.deepEqual(after.hashes,marker.hashes,'All original bytes preserved');
  const lastSummary=await page.evaluate(async()=>await humanRequest('/summary'));for(const kind of ['links','person','meeting'])assert.equal(lastSummary.counts[kind],summary.counts[kind]);
  const auth=await page.evaluate(async id=>({none:(await fetch('/api/human/inbox-access/'+id)).status,key:(await fetch('/api/human/inbox-access/'+id,{headers:{'X-API-Key':'test-personal'}})).status}),ids.normal);assert.deepEqual(auth,{none:401,key:401});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);await page.close();
  console.log(viewport.width+': explicit consent, cancel, grant/read/revoke, lost reply, stale preview, blocked private, immutable source, owner session and no content approvals OK');
 }
}finally{await browser.close()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
