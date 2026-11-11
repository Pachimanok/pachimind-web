const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const origin=process.env.HUMAN_PREVIEW_URL||'http://127.0.0.1:18301';assert.ok(['localhost','127.0.0.1'].includes(new URL(origin).hostname));
const out=process.env.HUMAN_SCREENSHOT_DIR||path.join(process.cwd(),'artifacts','decision-context');
(async()=>{fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const page=await browser.newPage({viewport,isMobile:viewport.width<700,hasTouch:viewport.width<700}),writes=[],errors=[];
  page.on('request',r=>{if(!['GET','HEAD'].includes(r.method())&&!r.url().endsWith('/api/auth'))writes.push(r.url())});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/?view=humano');await page.locator('#pwd').fill('preview-password');await page.getByRole('button',{name:'Entrar',exact:true}).click();
  await page.waitForFunction(()=>!!S.human.data&&!S.human.loading);
  assert.equal(await page.evaluate(async()=>(await(await api('/health/preview')).json()).fixture),'human-demo');
  await page.getByRole('button',{name:/^Acciones y decisiones ·/}).click();await page.waitForFunction(()=>S.human.kind==='meeting'&&!S.human.loading);
  const item=await page.evaluate(()=>S.human.data.results.find(i=>i.title==='Decisión a aprobar (demo)'));
  const card=page.locator('.human-card').filter({has:page.getByRole('heading',{name:item.title,exact:true})});
  await card.locator('.human-context').getByText('10/11/2026',{exact:false}).waitFor();
  await card.locator('.human-context').getByRole('button',{name:item.context.project.title,exact:true}).click();
  await page.waitForFunction(id=>S.openNote?.id===id&&!S.openLoading,item.context.project.id);await page.locator('.op-close').click();
  await card.locator('.human-context').getByRole('button',{name:item.context.source.title,exact:true}).click();
  await page.waitForFunction(id=>S.openNote?.id===id&&!S.openLoading,item.context.source.id);assert.equal(await page.evaluate(()=>S.openNote.metadata.fuente_inmutable),true);await page.locator('.op-close').click();
  await card.getByRole('button',{name:'Revisar',exact:true}).click();await page.waitForFunction(()=>S.human.detail&&!S.human.detailBusy);
  await page.locator('#human-detail').getByRole('heading',{name:'Evidencia literal de la reunión',exact:true}).waitFor();
  assert.equal(await page.locator('#human-detail blockquote').innerText(),'Registrar decisión demo.');
  assert.equal(await page.getByLabel('Confirmo esta propuesta y su efecto',{exact:true}).isChecked(),false);
  assert.equal(await page.getByRole('button',{name:'Aprobar',exact:true}).isDisabled(),true);
  await page.screenshot({path:path.join(out,'contexto-'+viewport.width+'.png'),fullPage:true});
  // Missing historical date stays explicit; untrusted titles remain inert text.
  await page.evaluate(()=>{S.human.detail.context.meeting_date=null;S.human.detail.context.project.title='<img src=x onerror=alert(1)>';render()});
  assert.equal(await page.locator('#human-detail .human-context').getByText('Sin fecha confirmada',{exact:false}).count(),1);
  assert.equal(await page.locator('.human-context img').count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.deepEqual(writes,[],'Opening context only reads; never approves, declines or creates tasks');assert.deepEqual(errors,[]);await page.close();
 }
 console.log('Decision context passed: project/meeting/date in list and detail, original links, literal evidence, explicit unknown date, escaped titles, desktop/mobile, zero writes.');
}finally{await browser.close()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
