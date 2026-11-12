const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const origin=process.env.HUMAN_PREVIEW_URL||'http://127.0.0.1:18311';assert.ok(['localhost','127.0.0.1'].includes(new URL(origin).hostname));
const out=process.env.HUMAN_SCREENSHOT_DIR||'/workspace/artifacts/mobile-graph/browser';
(async()=>{fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{
 for(const width of [360,390,768,1440]){
  const mobile=width<=700,context=await browser.newContext({viewport:{width,height:900},isMobile:mobile,hasTouch:mobile}),page=await context.newPage(),errors=[],writes=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(['POST','PATCH','DELETE'].includes(r.method())&&!r.url().endsWith('/api/auth'))writes.push(r.url())});
  await page.goto(origin+'/?view=grafo');await page.locator('#pwd').fill('preview-password');await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.waitForFunction(()=>S.graph?.data&&!S.graph.loading&&graphRuntime?.settled);
  const marker=await page.evaluate(async()=>await captureJSON('/health/inbox-access-preview'));assert.equal(marker.synthetic,true);
  assert.ok(await page.locator('#vault-graph').isVisible());
  if(mobile){
   assert.equal(await page.locator('.sidebar .nav-item:visible').count(),5);
   const nav=await page.locator('.sidebar').boundingBox();assert.ok(nav.height>=64&&nav.y+nav.height<=901);
   for(const b of await page.locator('.sidebar .nav-item:visible').all()){const box=await b.boundingBox();assert.ok(box.width>=44&&box.height>=44);}
   await page.getByRole('button',{name:'Más secciones',exact:true}).click();const menu=page.getByRole('dialog',{name:'Todas las secciones',exact:true});await menu.waitFor();
   await menu.getByRole('button',{name:'Personas',exact:true}).click();await page.waitForFunction(()=>S.view==='personas');assert.equal(await page.getByRole('dialog').count(),0);
   await page.getByRole('button',{name:'Más secciones',exact:true}).click();await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
   await page.getByRole('button',{name:'Buscar en el vault',exact:true}).click();const input=page.getByRole('textbox',{name:'Buscar notas en el vault',exact:true});await input.waitFor();assert.ok(parseFloat(await input.evaluate(el=>getComputedStyle(el).fontSize))>=16);
   await page.getByRole('button',{name:'Grafo',exact:true}).click();await page.waitForFunction(()=>graphRuntime?.settled);
  }
  const before=await page.evaluate(()=>graphState().camera.k);await page.getByRole('button',{name:'Acercar grafo',exact:true}).click();assert.ok(await page.evaluate(()=>graphState().camera.k)>before);
  await page.getByRole('button',{name:'Alejar grafo',exact:true}).click();await page.getByRole('button',{name:'Encuadrar grafo',exact:true}).click();
  const canvas=page.locator('#vault-graph'),bounds=await canvas.boundingBox();
  const prior=await page.evaluate(()=>({...graphState().camera}));
  const blank=await page.evaluate(()=>{const pts=graphRuntime.positions(),c=document.querySelector('canvas');for(let y=70;y<c.clientHeight-90;y+=40)for(let x=30;x<c.clientWidth-40;x+=40)if(pts.every(p=>Math.hypot(p.x-x,p.y-y)>35))return{x,y};return{x:30,y:70}});
  if(mobile){
   const cdp=await context.newCDPSession(page),x=bounds.x+blank.x,y=bounds.y+blank.y;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:0}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+50,y:y+30,id:0}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   assert.notEqual(await page.evaluate(()=>graphState().camera.x),prior.x,'Touch pans graph');
   const k=await page.evaluate(()=>graphState().camera.k);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-30,y,id:0},{x:x+30,y,id:1}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-65,y,id:0},{x:x+65,y,id:1}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.ok(await page.evaluate(()=>graphState().camera.k)>k,'Pinch zooms graph');
   await cdp.detach();
  }else{
   await page.mouse.move(bounds.x+blank.x,bounds.y+blank.y);await page.mouse.down();await page.mouse.move(bounds.x+blank.x+45,bounds.y+blank.y+25,{steps:5});await page.mouse.up();assert.notEqual(await page.evaluate(()=>graphState().camera.x),prior.x);
  }
  await page.getByRole('button',{name:'Encuadrar grafo',exact:true}).click();
  await canvas.scrollIntoViewIfNeeded();
  const target=await page.evaluate(()=>graphRuntime.positions().filter(p=>!p.id.startsWith('@ambito:')).sort((a,b)=>a.y-b.y)[0]);
  const location=await canvas.boundingBox();
  if(mobile)await page.touchscreen.tap(location.x+target.x,location.y+target.y);else await page.mouse.click(location.x+target.x,location.y+target.y);
  await page.waitForFunction(()=>graphState().selected!==null);
  await page.getByRole('button',{name:'Ver notas en lista',exact:true}).click();await page.locator('.graph-list .graph-panel-scroll>button').first().click();await page.locator('[data-graph-open]').waitFor();
  const selected=await page.evaluate(()=>graphState().selected);await page.screenshot({path:out+'/grafo-'+width+'.png',fullPage:true});
  await page.locator('[data-graph-open]').click();await page.locator('.op-body').waitFor();await page.waitForFunction(()=>!S.openLoading);assert.equal(await page.evaluate(()=>S.openNote.id),selected);
  const close=page.locator('.op-close');await close.click();await page.waitForFunction(()=>graphRuntime?.settled);assert.equal(await page.evaluate(()=>graphState().selected),selected);
  await page.getByRole('button',{name:'Buscar y filtrar el grafo',exact:true}).click();
  await page.getByLabel('Buscar en el grafo',{exact:true}).fill('NO-EXISTE-DEMO-123');await page.getByRole('button',{name:'Filtrar',exact:true}).click();await page.getByText('No hay notas con estos filtros.',{exact:false}).waitFor();
  await page.getByLabel('Buscar en el grafo',{exact:true}).fill('');await page.getByRole('button',{name:'Filtrar',exact:true}).click();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);assert.deepEqual(writes,[],'Graph browsing never mutates vault');
  const after=await page.evaluate(async()=>await captureJSON('/health/inbox-access-preview'));assert.deepEqual(after.hashes,marker.hashes);console.log(width+': navigation, touch targets, graph pan/zoom, selection, open/return, search, privacy-preserving read-only browsing OK');await context.close();
 }
}finally{await browser.close()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
