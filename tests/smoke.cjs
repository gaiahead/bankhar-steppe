/* Actual browser tests. Set BANKHAR_URL to a served project subpath or file URL.
   PLAYWRIGHT_MODULE / CHROMIUM_PATH can select an existing local installation. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const url=process.env.BANKHAR_URL||'http://localhost:8766/index.html';
const out=path.resolve('test-results');fs.mkdirSync(out,{recursive:true});
const errors=[],requests=[],report={checks:[],errors,requests};
const check=(name)=>{report.checks.push(name);console.log('PASS',name);};
const lowURL=()=>{const u=new URL(url);u.searchParams.set('quality','low');return u.href;};
const waitFor=async(p,fn,arg)=>p.waitForFunction(fn,arg,{timeout:180000,polling:'raf'});
const frames=async(p,n=3)=>{const target=await p.evaluate(n=>__bankharDebug.frameCount+n,n);await waitFor(p,target=>__bankharDebug.frameCount>=target,target);};
const snap=p=>p.evaluate(()=>{const d=__bankharDebug;return{ready:d.ready,frameCount:d.frameCount,frameMs:d.frameMs,renderer:d.renderer,quality:d.quality,dog:d.dog,camera:d.camera,paused:d.paused,photo:d.photo,time:d.time,input:d.input};});
function observe(p){p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('requestfailed',r=>requests.push(r.url()+': '+r.failure()?.errorText));p.on('response',r=>{if(r.status()>=400)requests.push(r.url()+': '+r.status());});}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 try{
 if(process.env.BANKHAR_ONLY!=='touch'){
 const context=await browser.newContext({viewport:{width:800,height:500},acceptDownloads:true});
 const p=await context.newPage();observe(p);await p.goto(lowURL(),{waitUntil:'load',timeout:180000});
 await waitFor(p,()=>window.__bankharDebug?.ready);await frames(p);assert.equal((await snap(p)).dog.speed,0);check('startup: idle, rendered frames, telemetry');
 await p.screenshot({path:path.join(out,'opening-low.png'),timeout:180000});
 const frozen=await p.evaluate(()=>Object.isFrozen(__bankharDebug)&&Object.isFrozen(__bankharDebug.dog));assert(frozen);check('read-only telemetry');
 await p.keyboard.press('KeyW');await waitFor(p,()=>__bankharDebug.dog.speed>5&&Math.hypot(__bankharDebug.dog.x,__bankharDebug.dog.z)>1);const running=await snap(p);assert(Math.hypot(running.dog.x,running.dog.z)>1);check('W accelerates and moves');
 await p.keyboard.down('KeyA');await waitFor(p,yaw=>Math.abs(__bankharDebug.dog.yaw-yaw)>.12,running.dog.yaw);await p.keyboard.up('KeyA');check('steering changes heading');
 await p.keyboard.press('KeyQ');await waitFor(p,()=>__bankharDebug.dog.speed>12);check('Q sprint');
 await p.keyboard.press('KeyS');await waitFor(p,()=>__bankharDebug.dog.speed===0);check('S stops');
 await p.keyboard.down('Space');await waitFor(p,()=>!__bankharDebug.dog.grounded&&__bankharDebug.dog.air>.05);await p.keyboard.up('Space');await waitFor(p,()=>__bankharDebug.dog.grounded);await frames(p,8);check('jump launches and lands');
 await p.keyboard.down('KeyE');await waitFor(p,()=>__bankharDebug.dog.roll>0);await p.keyboard.up('KeyE');await waitFor(p,()=>__bankharDebug.dog.roll===0);check('roll starts and finishes');
 const before=await snap(p);await p.mouse.move(400,240);await p.mouse.down();await p.mouse.move(500,280,{steps:4});await p.mouse.up();await p.mouse.wheel(0,180);await frames(p);const after=await snap(p);assert(Math.abs(after.camera.orbitYaw-before.camera.orbitYaw)>.2);assert(after.camera.dist>before.camera.dist);assert.equal(after.input.dragging,false);check('orbit, zoom, pointer release');
 await p.locator('#pause').click();const stopped=await snap(p);await frames(p,5);const still=await snap(p);assert.equal(still.time,stopped.time);assert.deepEqual(still.dog,stopped.dog);check('pause freezes simulation');
 await p.locator('#settings-toggle').click();
 const budgets=[];for(const q of ['high','ultra','auto','low']){await p.locator('#quality').selectOption(q);await frames(p);const s=await snap(p);assert.equal(s.quality.requested,q);budgets.push(s.quality);}
 assert(budgets[1].grass>budgets[0].grass&&budgets[0].grass>budgets[3].grass);assert(budgets[1].strands>budgets[0].strands&&budgets[0].strands>budgets[3].strands);check('all quality choices change real render budgets; Ultra stays fixed');
 await p.evaluate(()=>__bankharDebug.setPaused(false));await p.locator('#quality').focus();await p.keyboard.press('KeyW');await p.keyboard.press('Space');assert.equal((await snap(p)).dog.running,false);assert.equal((await snap(p)).dog.air,0);await p.keyboard.press('Escape');await p.evaluate(()=>{__bankharDebug.setPaused(true);document.getElementById('settings').hidden=false;});check('focused controls ignore gameplay keys');
 for(const preset of ['golden','clear','afternoon']){await p.locator('#light').selectOption(preset);await frames(p);assert.equal(await p.evaluate(()=>__bankharDebug.light),preset);}check('light presets render');
 await p.locator('#reset').click();const reset=await snap(p);assert.equal(reset.dog.x,0);assert.equal(reset.dog.z,0);assert.equal(reset.dog.speed,0);check('reset restores opening position');
 await p.locator('#settings-toggle').click();await p.locator('#pause').click();await p.locator('#photo').click();assert((await snap(p)).photo);assert.equal(await p.locator('#tools').isVisible(),false);check('photo mode freezes time and hides HUD');
 const photoCamera=(await snap(p)).camera;await p.mouse.move(380,250);await p.mouse.down();await p.mouse.move(440,260);await p.mouse.up();await frames(p);assert.notEqual((await snap(p)).camera.orbitYaw,photoCamera.orbitYaw);check('photo orbit remains usable');
 const downloadPromise=p.waitForEvent('download',{timeout:180000});await p.keyboard.press('KeyP');const dl=await downloadPromise;await dl.saveAs(path.join(out,'photo-export.png'));assert(fs.statSync(path.join(out,'photo-export.png')).size>10000);check('photo PNG download');
 await p.keyboard.press('Escape');assert.equal((await snap(p)).paused,false);check('photo exit restores play state');
 await p.locator('#help-toggle').click();assert(await p.locator('#help').isVisible());await p.locator('#help-toggle').click();check('help toggle');
 await p.locator('#gl').focus();await p.keyboard.press('KeyW');await p.keyboard.down('KeyA');await frames(p);assert((await snap(p)).dog.running);await p.evaluate(()=>window.dispatchEvent(new Event('blur')));const clean=await snap(p);assert.equal(clean.input.held.length,0);assert.equal(clean.dog.running,false);await p.keyboard.up('KeyA');check('blur clears held and latched input');
 await p.setViewportSize({width:960,height:600});await frames(p);assert.equal((await snap(p)).quality.width,720);check('viewport resize changes drawing buffer');
 await p.evaluate(()=>{__bankharDebug.reset();__bankharDebug.setQuality('high');__bankharDebug.setPaused(true);});await frames(p);await p.screenshot({path:path.join(out,'opening-high.png'),timeout:180000});report.desktop=await snap(p);check('high quality still');
 await context.close(); // Release the software GPU before the mobile context.
 }
 // Touch via Chromium input protocol produces real captured multi-pointer events.
 const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const mp=await mobile.newPage();observe(mp);await mp.bringToFront();await mp.goto(lowURL(),{timeout:180000});await waitFor(mp,()=>window.__bankharDebug?.ready);await frames(mp);
 assert(await mp.locator('#stick').isVisible());const client=await mobile.newCDPSession(mp);
 const box=await mp.locator('#stick').boundingBox(),sx=box.x+box.width/2,sy=box.y+box.height/2;
 const touch=async(type,points)=>client.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([id,x,y])=>({id,x,y,radiusX:3,radiusY:3,force:1}))});
 await touch('touchStart',[[1,sx+18,sy-35]]);await waitFor(mp,()=>__bankharDebug.dog.speed>2&&Math.abs(__bankharDebug.dog.yaw)>.02);check('touch joystick movement and steering');
 const jump=await mp.locator('[data-touch="Space"]').boundingBox();await touch('touchStart',[[1,sx+18,sy-35],[2,jump.x+20,jump.y+20]]);await waitFor(mp,()=>!__bankharDebug.dog.grounded);await touch('touchEnd',[[1,sx+18,sy-35]]);await touch('touchEnd',[]);await waitFor(mp,()=>__bankharDebug.dog.grounded);check('multitouch jump while steering');
 const sprint=await mp.locator('[data-touch="KeyQ"]').boundingBox();await touch('touchStart',[[3,sprint.x+20,sprint.y+20]]);await waitFor(mp,()=>__bankharDebug.dog.speed>12);await touch('touchEnd',[]);assert(await mp.evaluate(()=>__bankharDebug.autonomous));assert.equal((await snap(mp)).input.held.length,0);check('normal touch Q release keeps autonomous sprint');await touch('touchStart',[[3,sprint.x+20,sprint.y+20]]);await touch('touchCancel',[]);assert.equal(await mp.evaluate(()=>__bankharDebug.autonomous),false);await waitFor(mp,()=>__bankharDebug.dog.speed===0);const mc=await snap(mp);assert.equal(mc.input.held.length,0);assert.equal(mc.input.stick,false);check('touch sprint and cancellation cleanup');
 await mp.evaluate(()=>__bankharDebug.reset());await frames(mp);await mp.screenshot({path:path.join(out,'mobile.png'),timeout:180000});report.mobile=await snap(mp);
 assert.equal(await mp.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);check('mobile full viewport layout');
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);check('no JavaScript, shader, or missing-resource errors');
 console.log('Completed',report.checks.length,'checks');
 }finally{fs.writeFileSync(path.join(out,'smoke-report.json'),JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
