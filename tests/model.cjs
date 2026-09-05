/* Anatomy/rig regression checks run against the same DOM/GL recording harness.
   Instrumentation is injected only into this VM, never shipped to the browser. */
const fs=require('node:fs'),vm=require('node:vm');
const before=fs.readFileSync('before-model.html','utf8'),after=fs.readFileSync('index.html','utf8');
const assert=require('node:assert/strict'),crypto=require('node:crypto');
assert.equal(crypto.createHash('sha256').update(before).digest('hex'),'f001d3340af73e175010714e6cf376eb17dd60365beffea2865ebdf6f57397ed','immutable comparison snapshot');
for(const [start,end] of [
 ['/* Landscape geometry:','/* ================================================================== GAITS'],
 ['const runPath=','const budgets='],
 ['const editing=','function animate(dt){']
]){
 const section=src=>src.slice(src.indexOf(start),src.indexOf(end,src.indexOf(start)));
 assert(after.includes(start)&&after.includes(end));assert.equal(section(after),section(before),'landscape/autorun/controls preserved');
}
let harness=fs.readFileSync('tests/static.cjs','utf8');
harness=harness.slice(0,harness.indexOf('assert(ctx.__bankharDebug.ready)'));
const expose=`window.__model={P,Nn,C,BI,BW,FUR,IDX,B,bones,pawParts,eyeParts,parts,statureY,updateSkeleton,buildModelMatrix,matModel,terrainH,dog,limbs,hullIdx};`;
harness=harness.replace('vm.runInContext(js,ctx,{timeout:30000})',`vm.runInContext(js.replace('function frame(now){',${JSON.stringify(expose)}+'\\nfunction frame(now){'),ctx,{timeout:30000})`);
harness+=`
const m=ctx.__model,n=m.P.length/3;
assert(n>10000&&n<50000,'bounded anatomical mesh');
for(const a of [m.P,m.Nn,m.C,m.BW,m.FUR])assert(a.every(Number.isFinite));
for(const i of m.IDX)assert(i>=0&&i<n);
for(let v=0;v<n;v++){
 let w=0;for(let j=0;j<4;j++){const k=v*4+j;assert(m.BI[k]>=0&&m.BI[k]<m.bones.length);assert(m.BW[k]>=0);w+=m.BW[k];}
 assert(Math.abs(w-1)<1e-6,'normalized skin weights');
}
assert.equal(m.pawParts.length,4);assert.equal(m.eyeParts.length,2);
// The closed brisket must carry outward normals and hair, not a bare dark cap.
const torso=m.parts[0];let capZ=0;
for(let v=torso.v1-32;v<torso.v1;v++)capZ+=m.Nn[v*3+2];
assert(capZ>0,'outward front cap normals');
assert(m.bones[m.B.FLu].rest[1]>.74,'raised shoulder bind');
assert(m.bones[m.B.FLl].off[1]<-.32,'longer upper limb');
assert(m.bones[m.B.BLl].off[2]>0&&m.bones[m.B.BLp].off[2]<0,'stifle forward and hock backward');
for(const e of m.eyeParts){
 const y=[];for(let v=e.v0;v<e.v1;v++){y.push(m.P[v*3+1]);assert.equal(m.FUR[v],0);}
 assert(Math.max(...y)-Math.min(...y)<.025,'small almond eye window');
}
// Identity binds preserve every vertex; translations may not be scaled alone.
const rotations=m.bones.map(b=>[b.rx,b.ry,b.rz]);
for(const b of m.bones)b.rx=b.ry=b.rz=0;
m.updateSkeleton();for(const b of m.bones)for(let i=0;i<16;i++)assert(Math.abs(b.skin[i]-(i%5===0?1:0))<1e-6,'identity rest skin');
m.bones.forEach((b,i)=>[b.rx,b.ry,b.rz]=rotations[i]);m.updateSkeleton();
function transform(mat,x,y,z){return [mat[0]*x+mat[4]*y+mat[8]*z+mat[12],mat[1]*x+mat[5]*y+mat[9]*z+mat[13],mat[2]*x+mat[6]*y+mat[10]*z+mat[14]];}
function clearance(v){
 let p=[0,0,0];for(let j=0;j<4;j++){const w=m.BW[v*4+j];if(!w)continue;const q=transform(m.bones[m.BI[v*4+j]].skin,...m.P.slice(v*3,v*3+3));p=p.map((x,k)=>x+w*q[k]);}
 const q=transform(m.matModel,...p);return q[1]-m.terrainH(q[0],q[2]);
}
function feet(){return m.pawParts.map(p=>{let min=Infinity;for(let v=p.v0;v<p.v1;v+=3)min=Math.min(min,clearance(v));return min;});}
function key(code,down=true){for(const f of listeners[down?'keydown':'keyup']||[])f({code,target:get('gl'),preventDefault(){}});}
step(60);let idle=feet();console.log('Idle paw clearance (m):',idle);assert(idle.every(v=>v>-.015&&v<.025),'all idle pads meet terrain');
key('KeyQ');key('KeyQ',false);let min=Infinity,maxSupport=0;
for(let i=0;i<300;i++){step();const c=feet();min=Math.min(min,...c);if(m.limbs.some(l=>l.contact))maxSupport=Math.max(maxSupport,Math.min(...c));assert(m.bones.every(b=>Array.from(b.skin).every(Number.isFinite)));}
console.log('Sprint lowest pad / largest support gap (m):',min,maxSupport);
assert(min>-.012,'sprint paw penetration bounded');
assert(maxSupport<.025,'support pad stays on the terrain');
key('KeyS');step(100);key('KeyS',false);key('Space');step(20);key('Space',false);assert(!m.dog.grounded);step(80);assert(m.dog.grounded);
idle=feet();assert(idle.every(v=>v>-.02&&v<.035),'pads return to terrain after landing');
key('KeyE');step(10);key('KeyE',false);let rollMin=Infinity;
for(let i=0;i<65;i++){step();if(m.dog.rollT>0){for(const v of m.hullIdx)rollMin=Math.min(rollMin,clearance(v));}}
console.log('Roll skin clearance (m):',rollMin);assert(rollMin>-.06,'rolling hull clearance');
console.log('PASS: finite bounded mesh, weights, identity binds, eye windows, four articulated paws, idle/sprint/jump/roll rig. Vertices:',n,'triangles:',m.IDX.length/3);
`;
vm.runInNewContext(harness,{require,process,console,Buffer,URL,URLSearchParams,ArrayBuffer},{filename:process.cwd()+'/tests/model-vm.cjs'});
