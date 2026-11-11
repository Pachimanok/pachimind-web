// Synthetic read-only acceptance: actual wheel/touch scrolling, no scrollIntoView workaround.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const origin=process.env.HUMAN_PREVIEW_URL||'http://127.0.0.1:18301';assert.ok(['127.0.0.1','localhost'].includes(new URL(origin).hostname));
const out=process.env.TODO_SCREENSHOT_DIR||require('node:path').join(process.cwd(),'artifacts','todo-scroll');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const context=await browser.newContext({viewport,hasTouch:viewport.width<700,isMobile:viewport.width<700});const page=await context.newPage(),writes=[];
  page.on('request',r=>{if(!['GET','HEAD'].includes(r.method())&&!r.url().endsWith('/api/auth'))writes.push(r.url())});
  await page.route('**/actions/todo',r=>r.fulfill({contentType:'application/json',body:JSON.stringify(Array.from({length:35},(_,i)=>({id:'demo-'+i,title:'Actividad demo '+i,path:'09 Acciones/TODO/demo-'+i+'.md',estado:'pendiente',area:'Personal',proyectos:[],responsable:null,vencimiento:null,prioridad:'media',fuente_ref:null,revision:'f'.repeat(64)})))}));
  await page.goto(origin+'/?view=todo');await page.locator('#pwd').fill('preview-password');await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.waitForFunction(()=>S.todoItems.length===35&&!S.todoLoading);
  assert.equal(await page.evaluate(async()=>(await (await api('/health/preview')).json()).synthetic),true);
  const range=await page.evaluate(()=>{const el=document.querySelector('.main-area');return el.scrollHeight-el.clientHeight});assert.ok(range>500,'The task list must produce a real scroll range');
  const box=await page.locator('.main-area').boundingBox();await page.mouse.move(box.x+box.width/2,400);
  await page.mouse.wheel(0,1500);await page.waitForTimeout(250);
  assert.ok(await page.evaluate(()=>document.querySelector('.main-area').scrollTop>100),'Wheel moves the task list');
  for(let i=0;i<12;i++){await page.mouse.wheel(0,1600);await page.waitForTimeout(40)}
  await page.waitForTimeout(200);
  assert.ok(await page.evaluate(()=>{const a=document.querySelector('.main-area');return a.scrollTop>=a.scrollHeight-a.clientHeight-3}),'Wheel reaches the bottom');
  const last=await page.locator('[data-todo-id="demo-34"]').boundingBox();assert.ok(last.y>=0&&last.y+last.height<=viewport.height-(viewport.width<700?56:0),'Last task is visible above navigation');
  const edit=await page.locator('[data-todo-id="demo-34"]').getByRole('button',{name:'Editar',exact:true}).boundingBox();
  assert.equal(await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.closest('[data-todo-id]')?.dataset.todoId,{x:edit.x+edit.width/2,y:edit.y+edit.height/2}),'demo-34','Last task controls are not covered');
  if(viewport.width<700){
   const client=await context.newCDPSession(page);const before=await page.evaluate(()=>document.querySelector('.main-area').scrollTop);
   await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:200,y:280}]});
   for(let y=320;y<=680;y+=60){await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:200,y}]});await page.waitForTimeout(30)}
   await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(150);
   assert.ok(await page.evaluate(()=>document.querySelector('.main-area').scrollTop)<before,'A touch gesture also moves the list');
  }
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  fs.mkdirSync(out,{recursive:true});await page.screenshot({path:out+'/todo-scroll-'+viewport.width+'.png'});assert.deepEqual(writes,[]);await context.close();
 }
 console.log('TODO scrolling passed: real wheel and touch, full 35-task list, last controls accessible, mobile navigation clear, no writes.');
}finally{await browser.close()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
