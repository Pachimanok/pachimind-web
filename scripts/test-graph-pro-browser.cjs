const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const origin=process.env.HUMAN_PREVIEW_URL||'http://127.0.0.1:18311';assert.ok(['localhost','127.0.0.1'].includes(new URL(origin).hostname));
const out=process.env.HUMAN_SCREENSHOT_DIR||'/workspace/artifacts/graph-pro/browser';
(async()=>{fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{
 for(const width of [320,390,1440]){
  const page=await browser.newPage({viewport:{width,height:900},isMobile:width<700,hasTouch:width<700}),errors=[],writes=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(['POST','PATCH','DELETE'].includes(r.method())&&!r.url().endsWith('/api/auth'))writes.push(r.url())});
  await page.goto(origin+'/?view=grafo');await page.locator('#pwd').fill('preview-password');await page.getByRole('button',{name:'Entrar',exact:true}).click();
  await page.waitForFunction(()=>S.graph?.data&&!S.graph.loading&&graphRuntime?.settled&&graphRuntime.hasWorker);
  assert.equal(await page.evaluate(()=>graphState().layoutError),null);assert.equal(await page.evaluate(()=>graphState().showAmbitos),false);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  const fit=await page.evaluate(()=>{const c=document.querySelector('canvas');return graphRuntime.positions().every(p=>p.x>=0&&p.x<=c.clientWidth&&p.y>=0&&p.y<=c.clientHeight)});assert.equal(fit,true,'Automatic layout is initially fitted');
  const canvas=page.locator('#vault-graph'),box=await canvas.boundingBox();assert.ok(box.height>600,'Graph uses the viewport');
  await page.getByRole('button',{name:'Pausar distribución',exact:true}).click();await page.waitForFunction(()=>graphRuntime?.settled);assert.equal(await page.evaluate(()=>graphState().paused),true);
  const target=await page.evaluate(()=>graphRuntime.positions().filter(p=>p.x>30&&p.x<document.querySelector('canvas').clientWidth-30&&p.y>65&&p.y<document.querySelector('canvas').clientHeight-100)[0]);assert.ok(target);
  if(width===1440){
   await page.mouse.move(box.x+target.x,box.y+target.y);await page.locator('.graph-tooltip').waitFor({state:'visible'});
   const camera=await page.evaluate(()=>({...graphState().camera}));await page.mouse.down();await page.mouse.move(box.x+target.x+50,box.y+target.y+30,{steps:8});await page.mouse.up();
   const moved=await page.evaluate(id=>graphRuntime.positions().find(p=>p.id===id),target.id);assert.ok(Math.hypot(moved.x-target.x,moved.y-target.y)>40,'Dragging changes node position');assert.equal(await page.evaluate(()=>graphState().camera.x),camera.x,'Node dragging does not pan the camera');
  }
  await page.getByRole('button',{name:'Pantalla completa',exact:true}).click();const expanded=await page.locator('.graph-expanded').boundingBox();assert.equal(expanded.x,0);assert.equal(expanded.width,width);assert.equal(expanded.height,900);
  await page.keyboard.press('Escape');assert.equal(await page.locator('.graph-expanded').count(),0);
  await page.getByRole('button',{name:'Reanudar distribución',exact:true}).click();await page.waitForFunction(()=>graphRuntime?.settled);
  await page.getByRole('button',{name:'Buscar y filtrar el grafo',exact:true}).click();const settings=page.getByRole('complementary',{name:'Ajustes del grafo',exact:true});await settings.waitFor();
  await settings.getByLabel('Notas sin vínculos',{exact:true}).check();await page.waitForFunction(()=>graphRuntime?.settled);assert.equal(await page.evaluate(()=>graphRuntime.positions().length),await page.evaluate(()=>graphState().data.nodes.length));
  await settings.getByLabel('Nodos de ámbitos',{exact:true}).check();await page.waitForFunction(()=>graphRuntime?.settled);assert.ok(await page.evaluate(()=>graphRuntime.positions().some(p=>p.id.startsWith('@ambito:'))));
  await settings.getByRole('combobox',{name:'Color de nodos',exact:true}).selectOption('tipo');await settings.getByLabel('Flechas de dirección',{exact:true}).check();
  const range=settings.getByRole('slider',{name:'Separación de nodos',exact:true});await range.focus();await page.keyboard.press('ArrowRight');assert.ok(await page.evaluate(()=>graphState().repulsion)>1);
  await page.getByRole('button',{name:'Cerrar ajustes',exact:true}).click();await page.waitForFunction(()=>graphRuntime?.settled);
  await page.screenshot({path:out+'/pro-'+width+'.png'});
  // Changing graph presentation must not change permissions or notes.
  assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);console.log(width+': actual D3 worker, fit, full viewport, pause, drag/hover, fullscreen/Escape, orphan/area controls, colors and force tuning OK');
  await page.close();
 }
 const stress=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 await stress.goto(origin+'/?view=grafo');await stress.locator('#pwd').fill('preview-password');await stress.getByRole('button',{name:'Entrar',exact:true}).click();await stress.waitForFunction(()=>S.graph?.data&&!S.graph.loading&&graphRuntime?.settled);
 await stress.evaluate(()=>{const s=graphState();s.camera=null;s.userCamera=false;s.positions=new Map();s.data={nodes:Array.from({length:500},(_,i)=>({id:'demo-'+i,title:'Demo '+i,path:'Demo/'+i+'.md',tipo:'nota',ambitos:['Trabajo']})),edges:Array.from({length:499},(_,i)=>({source:'demo-'+i,target:'demo-'+(i+1),relation:'referencia'}))};render();});
 await stress.waitForFunction(()=>graphRuntime?.settled&&graphRuntime.hasWorker,{},{timeout:20000});assert.equal(await stress.evaluate(()=>graphRuntime.positions().length),500);assert.equal(await stress.evaluate(()=>graphState().layoutError),null);await stress.close();console.log('500 notes + 499 links: worker layout with reduced motion OK');
}finally{await browser.close()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
