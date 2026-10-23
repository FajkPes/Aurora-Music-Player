// Actual worker code, deterministic clocks and numeric reference calculations.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const parts=new Map(),appParts={},App={parts:appParts,addParts:(k,v)=>Object.assign(appParts[k]||={},v),define(){}};
vm.runInNewContext(fs.readFileSync('workers.js','utf8'),{window:{Aurora:{registerWorker(){},registerWorkerPart:(k,fn)=>parts.set(k,fn)}}});
const body=key=>{const s=parts.get(key).toString();return s.slice(s.indexOf('{')+1,s.lastIndexOf('}'));};
function scheduler(kind,fps,hz,seconds=10){
  let now=0,id=0,draws=0;const queue=new Map();
  const context=vm.createContext({self:{},performance:{now:()=>now,timeOrigin:0},requestAnimationFrame:fn=>{queue.set(++id,fn);return id;},cancelAnimationFrame:id=>queue.delete(id),postMessage(){},setTimeout,clearTimeout,settingsChanged(){},drawFrame:()=>draws++});
  vm.runInContext(body(kind+'/01-settings')+';globalThis.set=setActive;globalThis.message=sharedMessage;',context);
  if(kind==='spectrum')vm.runInContext('let spectrumDirty=false,pendingSpectrum=null;',context);
  if(kind==='timeline')vm.runInContext('let playAnchor={playing:true},tlState={waveAmp:0,hovering:false};',context);
  context.message({type:'settings',settings:{renderFps:fps}});context.set(true);
  const tick=t=>{now=t;const callbacks=[...queue.values()];queue.clear();callbacks.forEach(fn=>fn(now));};
  for(let i=0;i<seconds*hz;i++)tick(i*1000/hz);
  return {draws,context,tick,queue};
}
for(const [fps,hz] of [[240,240],[240,360],[144,240],[120,144],[60,240],[240,120]]){
  const s=scheduler('background',fps,hz);
  assert(Math.abs(s.draws-Math.min(fps,hz)*10)<=2,`${fps} FPS on ${hz} Hz: ${s.draws} frames`);
  s.context.set(false);assert.equal(s.queue.size,0,'Hidden worker cancels its frame');
}
const idle=scheduler('spectrum',240,240);assert.equal(idle.draws,1,'Spectrum sleeps after consuming its invalidation');
const tl=scheduler('timeline',240,240);assert.equal(tl.draws,2400);
vm.runInContext('playAnchor.playing=false;',tl.context);tl.tick(10010);assert.equal(tl.queue.size,0,'Settled paused timeline sleeps');
console.log('PASS: 60/120/144/240 FPS deadlines on 120/144/240/360 Hz clocks, idle workers and hidden cancellation.');

const dsp=vm.createContext({postMessage(){}});
vm.runInContext(body('dsp/03-settings')+';globalThis.api={fft,fftPlan,reset,fftCache,fftPlans,sinkMessage,broadcast,sinks,set:s=>settings=s};',dsp);
const api=dsp.api;
function reference(samples,smoothing,previous){
  const n=samples.length,bytes=new Uint8Array(n/2),levels=new Float32Array(n/2);
  for(let k=0;k<n/2;k++){
    let re=0,im=0;
    for(let j=0;j<n;j++){
      const window=Math.fround(.42-.5*Math.cos(2*Math.PI*j/n)+.08*Math.cos(4*Math.PI*j/n));
      re+=samples[j]*window*Math.cos(-2*Math.PI*k*j/n);im+=samples[j]*window*Math.sin(-2*Math.PI*k*j/n);
    }
    const m=Math.hypot(re,im)/n;levels[k]=Math.max(0,Math.min(1,(20*Math.log10(Math.max(1e-12,m))+80)/80));
    previous[k]=previous[k]*smoothing+m*(1-smoothing);
    bytes[k]=Math.max(0,Math.min(255,(20*Math.log10(Math.max(1e-12,previous[k]))+100)/70*255));
  }return {bytes,levels};
}
for(const n of [32,64,128]){
  const previous=new Float32Array(n/2);
  for(const amplitude of [.03,.7,.2]){
    const samples=Float32Array.from({length:n},(_,i)=>amplitude*(Math.sin(i*1.27)+.2*Math.cos(i*.34)));
    const expected=reference(samples,.75,previous),actual=api.fft(samples,'main',.75),levels=api.fftCache.get(n+'|main').visualLevels;
    assert.deepEqual(Array.from(actual),Array.from(expected.bytes),'FFT byte bins match a direct DFT');
    levels.forEach((value,i)=>assert(Math.abs(value-expected.levels[i])<1e-6,'Visual spectrum preserves float dynamics'));
  }
}
for(const slot of [0,1,2])api.fft(new Float32Array(1024),slot);
const band=api.fftCache.get('1024|0'),other=api.fftCache.get('1024|1');
assert.equal(band.window,other.window);assert.equal(band.reverse,other.reverse);assert.equal(band.stages,other.stages);assert.notEqual(band.last,other.last);
const packet={sense:{bass:12},freq:new Uint8Array(1024),visualFreq:new Float32Array(1024),wave:new Float32Array(260),playing:true};
api.set({specEnabled:true,vizMode:'ring',vizOpacity:1});
assert(!api.sinkMessage({spectrum:false},packet).freq,'UI readouts do not copy the spectrum');
assert(api.sinkMessage({spectrum:true},packet).freq);
assert(!api.sinkMessage({visualizer:true},packet).wave,'Ring does not copy unused waveform samples');
api.set({specEnabled:false,vizMode:'wave',vizOpacity:1});
assert(!api.sinkMessage({spectrum:true},packet).freq);assert(!api.sinkMessage({visualizer:true},packet).visualFreq);assert(api.sinkMessage({visualizer:true},packet).wave);
console.log('PASS: exact DSP bins, shared FFT plans with separate history, and consumer-specific audio packets.');

// Both motion implementations advance at the same speed at 120 and 240 FPS.
vm.runInNewContext(fs.readFileSync('background.js','utf8'),{window:{Aurora:App}});
const motion=vm.createContext({BlobShapes:{},settings:{}});
vm.runInContext(body('background/03-round-polygon-path')+';globalThis.motion=MotionPaths;',motion);
const sample=hz=>{const b={x:.5,y:.5,dirX:1,dirY:0,phase:0};for(let i=0;i<hz;i++)motion.motion.random.step(b,.5,1/hz);return b;};
const a=sample(120),b=sample(240);assert(Math.abs(a.x-b.x)<1e-12);assert(Math.abs(a.phase-b.phase)<1e-12);
const curves=vm.createContext({self:{},performance:{},requestAnimationFrame(){},cancelAnimationFrame(){}});
vm.runInContext(body('background/01-settings')+';globalThis.curve=CurveMath;',curves);
const points=[{x:.7,y:.9},{x:.2,y:.1}],first=curves.curve._fullPoints(points);
assert.equal(curves.curve._fullPoints(points),first,'Unchanged curves reuse their sorted points');
points[0].x=.1;assert.notEqual(curves.curve._fullPoints(points),first);assert.equal(curves.curve._fullPoints(points)[1].x,.1,'Dragging invalidates ordering immediately');
console.log('PASS: motion speed at 120/240 FPS and curve-cache invalidation during drag edits.');
