// Real-browser release checks; no mocked rendering on the primary page.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const b=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const result={checks:[],errors:[]};const pass=n=>{result.checks.push(n);console.log('PASS',n)};
 fs.mkdirSync('test-results',{recursive:true});
 try{
  const c=await b.newContext({viewport:{width:640,height:420},acceptDownloads:true});
  const p=await c.newPage();p.on('pageerror',e=>result.errors.push(e.message));
  const url=new URL(process.env.BANKHAR_URL||'http://127.0.0.1:8766/index.html');url.searchParams.set('quality','low');
  await p.goto(url.href);await p.waitForFunction(()=>window.__bankharDebug?.ready,undefined,{timeout:60000});
  await p.evaluate(()=>__bankharDebug.setPaused(true));
  await p.locator('#settings-toggle').click();await p.locator('#quality').focus();await p.keyboard.press('Escape');
  assert.equal(await p.locator('#settings').isVisible(),false,'Escape must close settings while select is focused');
  assert.equal(await p.locator('#settings-toggle').getAttribute('aria-expanded'),'false');pass('Escape closes focused settings and updates accessibility state');
  await p.locator('#photo').click();await p.locator('#photo-save').focus();await p.keyboard.press('Escape');
  assert.equal(await p.evaluate(()=>__bankharDebug.photo),false);pass('Escape exits photo mode from focused save control');
  await p.locator('#photo').click();const download=p.waitForEvent('download',{timeout:120000});await p.bringToFront();await p.locator('#photo-save').click();const d=await download.catch(async e=>{console.log('DOWNLOAD STATE',await p.evaluate(()=>({error:window.__err,frameCount:__bankharDebug.frameCount,photo:__bankharDebug.photo,paused:__bankharDebug.paused,hidden:document.hidden,toast:document.getElementById('toast').innerText})));throw e;});
  await d.saveAs('test-results/photo-button.png');assert(fs.statSync('test-results/photo-button.png').size>10000);pass('Photo save button produces PNG');
  assert.equal(await p.evaluate(()=>document.querySelector('canvas').getContext('webgl2').getError()),0);assert.deepEqual(result.errors,[]);pass('No JavaScript or WebGL errors');await c.close();
  // A separate context simulates unavailable WebGL; no rendering pass claimed for this case.
  const fc=await b.newContext();const fp=await fc.newPage();await fp.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'?null:get.call(this,type,...args)}});
  await fp.goto(url.href);await fp.locator('#err').waitFor({state:'visible'});assert.match(await fp.locator('#err').innerText(),/WebGL|webgl|초기화/);assert.equal(await fp.locator('#loading').isVisible(),false);pass('Unavailable WebGL displays an error instead of an endless loader');await fc.close();
  console.log('Completed',result.checks.length,'edge checks');
 }finally{fs.writeFileSync('test-results/edge-report.json',JSON.stringify(result,null,2));await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
