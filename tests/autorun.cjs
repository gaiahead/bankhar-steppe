/* Focused real-browser checks. Serve index.html first. No renderer stubs. */
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const url=new URL(process.env.BANKHAR_URL||'http://127.0.0.1:8766/index.html');url.searchParams.set('quality','low');
const wait=async(p,fn,arg)=>{try{return await p.waitForFunction(fn,arg,{timeout:180000,polling:'raf'});}catch(e){console.error('WAIT DIAGNOSTICS',await p.evaluate(()=>({error:window.__err,hidden:document.hidden,ready:window.__bankharDebug?.ready,frame:window.__bankharDebug?.frameCount,time:window.__bankharDebug?.time,auto:window.__bankharDebug?.autonomous,input:window.__bankharDebug?.input})));throw e;}};
const snap=p=>p.evaluate(()=>({dog:__bankharDebug.dog,active:__bankharDebug.autonomous,path:__bankharDebug.runPath,input:__bankharDebug.input,time:__bankharDebug.time,camera:__bankharDebug.camera}));
const advance=async(p,seconds)=>{const t=await p.evaluate(()=>__bankharDebug.time);await wait(p,t=>__bankharDebug.time>=t,t+seconds);};
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 const errors=[];
 const observe=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});};
 try{
  const desktop=await browser.newContext({viewport:{width:640,height:420}}),dp=await desktop.newPage();observe(dp);
  await dp.goto(url.href);await wait(dp,()=>window.__bankharDebug?.ready);
  assert(await dp.locator('#autorun').isVisible());await dp.locator('#autorun').click();
  assert.equal(await dp.locator('#autorun').getAttribute('aria-pressed'),'true');
  await dp.keyboard.press('KeyS');assert(!(await snap(dp)).active);
  await dp.keyboard.down('KeyQ');await advance(dp,.2);const elapsed=(await snap(dp)).path.elapsed;
  await dp.keyboard.down('KeyQ');assert((await snap(dp)).path.elapsed>=elapsed);await dp.keyboard.up('KeyQ');assert((await snap(dp)).active);
  console.log('PASS: desktop start button, keyboard stop and repeated Q');await desktop.close();
  const mobile=await browser.newContext({viewport:{width:390,height:520},deviceScaleFactor:1,isMobile:true,hasTouch:true}),p=await mobile.newPage();observe(p);
  await p.bringToFront();await p.goto(url.href);await wait(p,()=>window.__bankharDebug?.ready);console.log('PASS: mobile renderer ready');
  const cdp=await mobile.newCDPSession(p);
  const touch=(type,points=[])=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([id,x,y])=>({id,x,y,radiusX:3,radiusY:3,force:1}))});
  const point=async(selector,id=1)=>{const b=await p.locator(selector).boundingBox();assert(b);return[id,b.x+b.width/2,b.y+b.height/2];};
  const tap=async selector=>{await touch('touchStart',[await point(selector)]);await touch('touchEnd');};
  const q='[data-touch="KeyQ"]';
  const stopped=async()=>{const s=await snap(p);assert(!s.active);assert.equal(await p.locator(q).getAttribute('aria-pressed'),'false');};
  const clean=async()=>{const s=await snap(p);assert.equal(s.input.held.length,0);assert(!s.input.stick);assert(!s.input.dragging);};
  await tap(q);await clean();assert.equal(await p.locator(q).getAttribute('aria-pressed'),'true');
  const released=await snap(p);await advance(p,5);const roaming=await snap(p);
  assert(roaming.active);assert(Math.hypot(roaming.dog.x-released.dog.x,roaming.dog.z-released.dog.z)>10);assert(Math.abs(roaming.dog.yaw-released.dog.yaw)>.3);
  console.log('PASS: actual touch down/up latches movement and changing heading with no further inputs');
  await touch('touchStart',[[2,160,190]]);await touch('touchMove',[[2,230,210]]);await touch('touchEnd');
  const orbit=await snap(p);assert(orbit.active);assert(Math.abs(orbit.camera.orbitYaw-roaming.camera.orbitYaw)>.15);await clean();
  await tap('[data-touch="KeyS"]');await stopped();await wait(p,()=>__bankharDebug.dog.speed===0);
  for(const code of ['KeyW','KeyA','KeyD','ArrowLeft','ArrowRight']){await tap(q);await p.locator('#gl').focus();await p.keyboard.press(code);await stopped();}
  await tap(q);const stick=await point('#stick',3);stick[1]+=18;stick[2]-=32;
  await touch('touchStart',[stick]);await stopped();await advance(p,.3);assert((await snap(p)).input.stick);assert(!(await snap(p)).dog.sprint);await touch('touchEnd');await clean();
  console.log('PASS: camera drag preserves autonomy; stop, keys and joystick take over');
  await touch('touchStart',[await point(q)]);await touch('touchCancel');await stopped();await clean();
  const captured=await point(q);await touch('touchStart',[captured]);captured[1]+=1;await touch('touchMove',[captured]);
  // Real capture loss, triggered via DOM API while the real touch remains down.
  await p.evaluate(()=>{const el=document.querySelector('[data-touch="KeyQ"]');for(let id=0;id<100;id++)if(el.hasPointerCapture(id))el.releasePointerCapture(id);});
  captured[1]+=1;await touch('touchMove',[captured]);await wait(p,()=>!__bankharDebug.autonomous);await touch('touchEnd');await clean();
  await touch('touchStart',[await point(q)]);await p.evaluate(()=>window.dispatchEvent(new Event('blur')));await stopped();await touch('touchEnd');await clean();
  await tap(q);await p.evaluate(()=>__bankharDebug.reset());await stopped();assert.equal((await snap(p)).dog.speed,0);await clean();
  for(const photo of [false,true]){
   await tap(q);await advance(p,.3);await p.evaluate(photo=>photo?__bankharDebug.setPhoto(true):__bankharDebug.setPaused(true),photo);
   await stopped();await clean();const frozen=await snap(p);
   const frame=await p.evaluate(()=>__bankharDebug.frameCount);await wait(p,f=>__bankharDebug.frameCount>=f+3,frame);
   assert.deepEqual((await snap(p)).dog,frozen.dog);assert.equal((await snap(p)).time,frozen.time);
   await p.evaluate(photo=>photo?__bankharDebug.setPhoto(false):__bankharDebug.setPaused(false),photo);
   await advance(p,.3);assert.equal((await snap(p)).dog.speed,0);await stopped();
  }
  await tap(q);assert((await snap(p)).active);await tap('[data-touch="KeyS"]');
  console.log('PASS: cancellation, capture loss, blur, reset, pause/photo cleanup and explicit restart');
  assert.deepEqual(errors,[]);console.log('PASS: no browser JavaScript or shader errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
