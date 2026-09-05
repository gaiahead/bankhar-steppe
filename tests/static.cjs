/* Deterministic JavaScript/geometry checks without a browser. This DOM/GL stub
   cannot prove shader compilation or rendered appearance; use smoke.cjs for that. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const html=fs.readFileSync('index.html','utf8');
assert.equal(crypto.createHash('sha256').update(fs.readFileSync('original.html')).digest('hex'),'a0bc3f2744753a6bd5e163ff177e8e3712d3b180162e09a797f7e1ec33555306');
assert(!/<(?:script|link)[^>]+(?:src|href)="https?:/i.test(html));
const capture=!!process.env.BANKHAR_RECORD,out=process.env.BANKHAR_RECORD,commands=[];let nextId=1,now=0,raf=null;
if(capture)fs.mkdirSync(out,{recursive:true});
const values={VERTEX_SHADER:35633,FRAGMENT_SHADER:35632,COMPILE_STATUS:35713,LINK_STATUS:35714,ACTIVE_UNIFORMS:35718,ARRAY_BUFFER:34962,ELEMENT_ARRAY_BUFFER:34963,STATIC_DRAW:35044,DYNAMIC_DRAW:35048,FLOAT:5126,UNSIGNED_INT:5125,UNSIGNED_BYTE:5121,TEXTURE_2D:3553,TEXTURE0:33984,TEXTURE1:33985,TEXTURE2:33986,TEXTURE_MIN_FILTER:10241,TEXTURE_MAG_FILTER:10240,TEXTURE_WRAP_S:10242,TEXTURE_WRAP_T:10243,NEAREST:9728,LINEAR:9729,LINEAR_MIPMAP_LINEAR:9987,REPEAT:10497,CLAMP_TO_EDGE:33071,UNPACK_ALIGNMENT:3317,R8:33321,RED:6403,RGBA8:32856,RGBA:6408,DEPTH_COMPONENT24:33190,DEPTH_COMPONENT:6402,FRAMEBUFFER:36160,DEPTH_ATTACHMENT:36096,FRAMEBUFFER_COMPLETE:36053,NONE:0,DEPTH_TEST:2929,CULL_FACE:2884,BLEND:3042,LEQUAL:515,COLOR_BUFFER_BIT:16384,DEPTH_BUFFER_BIT:256,TRIANGLES:4,TRIANGLE_STRIP:5,SRC_ALPHA:770,ONE_MINUS_SRC_ALPHA:771,RENDERER:7937};
function serialize(a){if(ArrayBuffer.isView(a)){const name='array-'+nextId+++'.bin';fs.writeFileSync(out+'/'+name,Buffer.from(a.buffer,a.byteOffset,a.byteLength));return{array:name,type:a.constructor.name,length:a.length};}return a;}
function record(name,args){if(capture)commands.push([name,...args.map(serialize)]);}
const gl=new Proxy(values,{get(t,k){if(k in t)return t[k];
 if(k==='getExtension')return()=>null;
 if(k==='getParameter')return()=> 'static stub (not a renderer)';
 if(k==='getShaderParameter')return()=>true;
 if(k==='getProgramParameter')return(p,what)=>what===values.ACTIVE_UNIFORMS?p.uniforms.length:true;
 if(k==='getActiveUniform')return(p,i)=>({name:p.uniforms[i]});
 if(k==='checkFramebufferStatus')return()=>values.FRAMEBUFFER_COMPLETE;
 if(k==='getUniformLocation')return(p,n)=>({uniform:n,program:p.id});
 if(k==='getAttribLocation')return(p,n)=>p.attributes.indexOf(n);
 if(k.startsWith('create'))return(...args)=>{const o={id:nextId++,kind:k};record(k,[o,...args]);return o;};
 if(k==='shaderSource')return(sh,src)=>{sh.source=src;record(k,[{id:sh.id},src]);};
 if(k==='attachShader')return(p,sh)=>{(p.shaders??=[]).push(sh);record(k,[{id:p.id},{id:sh.id}]);};
 if(k==='linkProgram')return p=>{p.uniforms=[...new Set(p.shaders.flatMap(sh=>[...sh.source.matchAll(/uniform\s+\w+\s+(\w+)(?:\[(\d+)\])?\s*;/g)].map(m=>m[1]+(m[2]?'[0]':''))))];p.attributes=[...p.shaders[0].source.matchAll(/\bin\s+\w+\s+(\w+)\s*;/g)].map(m=>m[1]);record(k,[{id:p.id},p.attributes]);};
 return(...args)=>record(k,args.map(a=>a?.kind?{id:a.id}:a));
}});
class Element{constructor(id){this.id=id;this.style={};this.hidden=['help','settings'].includes(id);this.listeners={};this.dataset={};this.value='';this.classList={add(){},toggle(){}};this.captured=new Set();this.attributes={};}addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);}setAttribute(k,v){this.attributes[k]=String(v);}focus(){}closest(){return null;}setPointerCapture(id){this.captured.add(id);}hasPointerCapture(id){return this.captured.has(id);}releasePointerCapture(id){if(this.captured.delete(id))this.dispatch('lostpointercapture',{pointerId:id});}getBoundingClientRect(){return{x:0,y:0,left:0,top:0,width:116,height:116};}getContext(){return gl;}dispatch(type,e){for(const f of this.listeners[type]||[])f({type,target:this,preventDefault(){},...e});}}
const els=new Map(),get=id=>{if(!els.has(id))els.set(id,new Element(id));return els.get(id);};
const touch=['Space','KeyQ','KeyE','KeyS'].map(x=>{const e=get(x);e.dataset.touch=x;return e;});
const docListeners={};
const doc={getElementById:get,querySelectorAll:selector=>selector==='[data-touch="KeyQ"]'?touch.filter(e=>e.dataset.touch==='KeyQ'):touch,body:get('body'),addEventListener:(type,f)=>(docListeners[type]??=[]).push(f),hidden:false};
const listeners={};const ctx={console,Float32Array,Uint8Array,Uint32Array,Math,Set,Map,Object,Array,JSON,Number,String,Boolean,Infinity,isFinite,Element,document:doc,innerWidth:800,innerHeight:500,devicePixelRatio:Number(process.env.BANKHAR_DPR)||1,matchMedia:()=>({matches:false}),performance:{now:()=>now},location:{search:'?quality='+ (process.env.BANKHAR_QUALITY||'low')},URLSearchParams,URL,setTimeout:(f,t)=>{if(t===40)f();return 0;},clearTimeout(){},requestAnimationFrame:f=>raf=f,addEventListener:(type,f)=>(listeners[type]??=[]).push(f)};ctx.window=ctx;
vm.createContext(ctx);for(const [,js]of html.matchAll(/<script>([\s\S]*?)<\/script>/g))vm.runInContext(js,ctx,{timeout:30000});
assert(raf);const step=(n=1)=>{for(let i=0;i<n;i++){now+=1000/60;raf(now);}};step(3);
assert(ctx.__bankharDebug.ready);assert.equal(ctx.__bankharDebug.dog.speed,0);assert(Number.isFinite(ctx.__bankharDebug.camera.x));
if(capture){fs.writeFileSync(out+'/commands.json',JSON.stringify(commands));fs.writeFileSync(out+'/frame.json',JSON.stringify({width:get('gl').width,height:get('gl').height,dog:ctx.__bankharDebug.dog,camera:ctx.__bankharDebug.camera}));console.log('Recorded real scene commands for optional native GLES verification:',commands.length);process.exit();}
function key(code,down=true){for(const f of listeners[down?'keydown':'keyup']||[])f({code,target:get('gl'),preventDefault(){}});}
key('KeyW');step(80);assert(ctx.__bankharDebug.dog.speed>8);assert(ctx.__bankharDebug.dog.z>5);
key('KeyA');step(25);key('KeyA',false);assert(ctx.__bankharDebug.dog.yaw>.1);
key('KeyQ');key('KeyQ',false);step(90);assert(ctx.__bankharDebug.autonomous);assert(ctx.__bankharDebug.dog.speed>12);
key('KeyS');step(110);assert.equal(ctx.__bankharDebug.dog.speed,0);
key('Space');step(10);assert(!ctx.__bankharDebug.dog.grounded);key('Space',false);step(70);assert(ctx.__bankharDebug.dog.grounded);
key('KeyE');step(10);assert(ctx.__bankharDebug.dog.roll>0);key('KeyE',false);step(80);assert.equal(ctx.__bankharDebug.dog.roll,0);
const d=ctx.__bankharDebug;d.setPaused(true);const t=d.time;step(20);assert.equal(d.time,t);d.reset();assert.equal(d.dog.x,0);assert.equal(d.dog.z,0);
const budgets=[];for(const q of ['low','high','ultra','auto']){d.setQuality(q);budgets.push(d.quality);assert.equal(d.quality.requested,q);step();}assert(budgets[2].grass>budgets[1].grass&&budgets[1].grass>budgets[0].grass);
d.setPhoto(true);assert(d.photo);d.setPhoto(false);assert(d.paused);d.setPaused(false);
get('gl').dispatch('pointerdown',{pointerId:3,clientX:100,clientY:100});get('gl').dispatch('pointermove',{pointerId:3,clientX:200,clientY:120});get('gl').dispatch('pointercancel',{pointerId:3});assert(!d.input.dragging);
get('stick').dispatch('pointerdown',{pointerId:8,clientX:75,clientY:20});step(40);assert(d.dog.speed>2);get('stick').dispatch('pointercancel',{pointerId:8});assert(!d.input.stick);assert(!d.dog.running);
key('KeyA');for(const f of listeners.blur)f();assert.equal(d.input.held.length,0);
// Full initialization above and actual simulation frames; no rendered-output claims.
d.reset();
const q=get('KeyQ');
function tapQ(id=20){q.dispatch('pointerdown',{pointerId:id});q.dispatch('pointerup',{pointerId:id});}
function inactive(){assert.equal(d.autonomous,false);assert.equal(get('autorun').attributes['aria-pressed'],'false');assert.equal(q.attributes['aria-pressed'],'false');}
function clean(){assert.equal(d.input.held.length,0);assert(!d.input.dragging);assert(!d.input.stick);for(const el of els.values())assert.equal(el.captured.size,0);}
tapQ();assert(d.autonomous);clean();assert.equal(q.attributes['aria-pressed'],'true');
const start=d.dog;step(180);assert(Math.hypot(d.dog.x-start.x,d.dog.z-start.z)>15);assert(Math.abs(d.dog.yaw-start.yaw)>.2);
const elapsed=d.runPath.elapsed;key('KeyQ');key('KeyQ',false);assert.equal(d.runPath.elapsed,elapsed,'Q start is idempotent');
let minSpeed=Infinity,maxSpeed=0,minYaw=Infinity,maxYaw=-Infinity,maxRadius=0,prev=d.dog;
for(let i=0;i<36000;i++){
 step();const dog=d.dog,r=Math.hypot(dog.x,dog.z);maxRadius=Math.max(maxRadius,r);
 assert(r<55,`autonomous route escaped meadow: ${r}`);
 assert(Math.hypot(dog.x-prev.x,dog.z-prev.z)<.25,'no position jumps');
 assert(Math.abs(dog.yaw-prev.yaw)<.025,'no abrupt spins');
 minSpeed=Math.min(minSpeed,dog.speed);maxSpeed=Math.max(maxSpeed,dog.speed);
 minYaw=Math.min(minYaw,dog.yaw);maxYaw=Math.max(maxYaw,dog.yaw);prev=dog;
}
assert(maxSpeed-minSpeed>4);assert(maxYaw-minYaw>Math.PI*4);assert(d.autonomous);
console.log(`PASS: 10-minute autonomous simulation, radius <= ${maxRadius.toFixed(2)}, speed ${minSpeed.toFixed(2)}–${maxSpeed.toFixed(2)}`);
key('KeyS');key('KeyS',false);inactive();step(100);assert.equal(d.dog.speed,0);
for(const code of ['KeyW','ArrowUp','KeyA','KeyD','ArrowLeft','ArrowRight','ArrowDown']){tapQ();key(code);key(code,false);inactive();}
tapQ();get('stick').dispatch('pointerdown',{pointerId:21,clientX:80,clientY:20});inactive();assert(!d.dog.sprint);get('stick').dispatch('pointerup',{pointerId:21});clean();
tapQ();get('gl').dispatch('pointerdown',{pointerId:22,clientX:100,clientY:100});get('gl').dispatch('pointermove',{pointerId:22,clientX:180,clientY:120});get('gl').dispatch('pointerup',{pointerId:22});assert(d.autonomous);clean();
for(const type of ['pointercancel','lostpointercapture']){
 q.dispatch('pointerdown',{pointerId:23});q.dispatch(type,{pointerId:23});inactive();clean();
 tapQ();get('gl').dispatch('pointerdown',{pointerId:24,clientX:100,clientY:100});get('gl').dispatch(type,{pointerId:24});inactive();clean();
}
q.dispatch('pointerdown',{pointerId:25});for(const f of listeners.blur)f();inactive();clean();q.dispatch('pointerup',{pointerId:25});inactive();
tapQ();doc.hidden=true;for(const f of docListeners.visibilitychange)f();inactive();clean();doc.hidden=false;
tapQ();d.reset();inactive();clean();assert.equal(d.dog.speed,0);assert.equal(d.runPath.elapsed,0);
for(const photo of [false,true]){
 tapQ();step(90);get('gl').dispatch('pointerdown',{pointerId:26,clientX:100,clientY:100});
 if(photo)d.setPhoto(true);else d.setPaused(true);
 inactive();clean();const dog=JSON.stringify(d.dog),time=d.time,path=JSON.stringify(d.runPath);step(30);
 assert.equal(JSON.stringify(d.dog),dog);assert.equal(d.time,time);assert.equal(JSON.stringify(d.runPath),path);
 if(photo)d.setPhoto(false);else d.setPaused(false);
 step(30);assert.equal(d.dog.speed,0);inactive();tapQ();assert(d.autonomous);
}
d.reset();get('autorun').onclick({detail:0});assert(d.autonomous);key('KeyS');inactive();
get('autorun').dispatch('pointerdown',{pointerId:27});get('autorun').dispatch('pointerup',{pointerId:27});assert(d.autonomous);clean();
get('autorun').dispatch('pointerdown',{pointerId:28});get('autorun').dispatch('pointercancel',{pointerId:28});inactive();clean();
// Starting outside the local loop returns smoothly instead of teleporting.
d.reset();key('KeyW');key('KeyW',false);step(1200);assert(Math.hypot(d.dog.x,d.dog.z)>150);
tapQ();const far=d.dog;step();assert(Math.hypot(d.dog.x-far.x,d.dog.z-far.z)<.25);step(2400);assert(Math.hypot(d.dog.x,d.dog.z)<55);d.reset();
console.log('PASS: original hash, self-contained script, full mesh initialization, simulation, movement, steering, sprint, jump/landing, roll, pause/photo/reset, real budgets, pointer/touch cancellation and blur.');
console.log('These checks use a DOM/GL stub. Browser and GLSL verification are separate.');
