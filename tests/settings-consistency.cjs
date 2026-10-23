// Exercise the real color clocks, including a disabled background in both paths.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const parts={},modules=new Map(),workerParts=new Map();
const App={parts,define:(id,fn)=>modules.set(id,fn),addParts:(id,methods)=>Object.assign(parts[id]||={},methods)};
let now=1000;
vm.runInNewContext(fs.readFileSync('background.js','utf8'),{window:{Aurora:App},performance:{now:()=>now}});
const settings={bgEnabled:false,reduceColorSpeedIntensity:false,bgMapColorSpeed:{enabled:true}};
App.settings=settings;App.el=()=>({style:{}});App.FxEngine={setBaseOpacity(){}};
App.MappingEngine={resolve:()=>2};App.applyTempoSpeedMult=(_,value)=>value;
const main={...parts.BgReact,_lastTime:0,_hueAccum:0};
vm.runInNewContext(fs.readFileSync('workers.js','utf8'),{window:{Aurora:{registerWorker(){},registerWorkerPart:(id,fn)=>workerParts.set(id,fn)}}});
const workerScope={settings,performance:{now:()=>now},el:App.el,FxEngine:App.FxEngine,MappingEngine:App.MappingEngine,applyTempoSpeedMult:App.applyTempoSpeedMult};
const body=workerParts.get('background/05-bg-react').toString();
vm.runInNewContext(body.slice(body.indexOf('{')+1,body.lastIndexOf('}'))+';globalThis.renderer=BgReact;',workerScope);
const worker=workerScope.renderer;
main.update();worker.update();now+=100;main.update();worker.update();
assert.equal(main._hueAccum,8);assert.equal(worker._hueAccum,8,'Worker color clock continues with background off');
settings.reduceColorSpeedIntensity=true;now+=100;main.update();worker.update();
assert.equal(main._hueAccum,12);assert.equal(worker._hueAccum,12,'Gentler color changes apply in both paths');
// Re-enabling the background must not restart or double the shared color clock.
settings.bgEnabled=true;App.stageBox=workerScope.stageBox={w:0,h:0};main.ensure=worker.ensure=()=>{};
now+=100;main.update();worker.update();assert.equal(main._hueAccum,16);assert.equal(worker._hueAccum,16);

// Compact drawer state keeps the actual panel and accessible toggle in sync.
const classes=new Set(),attrs={},edgeAttrs={};let focused=0,layoutUpdates=0;
App.app={classList:{toggle(name,on){on?classes.add(name):classes.delete(name);}}};
const panel={id:'playlistPanel',contains:()=>true},button={setAttribute:(key,value)=>attrs[key]=value,focus:()=>focused++};
App.el=id=>id==='playlistPanel'?panel:button;App.compactPlayer=true;
App.playlistBackdrop={hidden:true};App.playlistEdgeHandle={setAttribute:(key,value)=>edgeAttrs[key]=value};App.scheduleResponsiveLayout=()=>layoutUpdates++;
vm.runInNewContext(fs.readFileSync('compact-player.js','utf8'),{window:{Aurora:App},document:{activeElement:{}},performance:{now:()=>now}});
App.setPlaylistOpen(true);assert.equal(panel.inert,false);assert.equal(attrs['aria-expanded'],'true');assert.equal(App.playlistBackdrop.hidden,false);
App.setPlaylistOpen(false);assert.equal(panel.inert,true);assert(classes.has('playlist-closed'));assert.equal(attrs['aria-expanded'],'false');assert.equal(edgeAttrs['aria-expanded'],'false');assert.equal(App.playlistBackdrop.hidden,true);assert.equal(focused,1);assert.equal(layoutUpdates,2);
// Real gesture handlers must ignore vertical scrolling and suppress the synthetic
// click after a swipe, so opening a drawer does not immediately toggle it closed.
let swipes=0;
const handlers={},handle={tagName:'BUTTON',setPointerCapture(){},addEventListener:(name,fn)=>handlers[name]=fn};
const event=(x,y)=>({pointerType:'touch',pointerId:1,clientX:x,clientY:y,target:{closest:()=>null},preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;}});
App.bindDrawerSwipe(handle,-1,()=>true,()=>swipes++);
handlers.pointerdown(event(380,200));handlers.pointerup(event(380,300));assert.equal(swipes,0,'Vertical scroll does not open the playlist');
handlers.pointerdown(event(380,200));handlers.pointerup(event(310,205));assert.equal(swipes,1,'Playlist opens with a leftward swipe from the right edge');
const click=event(310,205);handlers.click(click);assert(click.prevented&&click.stopped,'Synthetic click after swipe is swallowed');
App.bindDrawerSwipe(handle,1,()=>true,()=>swipes++);
handlers.pointerdown(event(0,200));handlers.pointerup(event(70,205));assert.equal(swipes,2,'Visualizer drawer opens rightward from the left edge');
handlers.pointerdown(event(0,200));handlers.pointercancel();handlers.pointerup(event(70,205));assert.equal(swipes,2,'Cancelled gesture is ignored');
console.log('PASS: global colors continue with background off, reduction/re-enable parity; compact playlist accessibility/focus/backdrop; swipe directions, scroll rejection and synthetic-click suppression.');

// Run the actual desktop drawer drawerHandlers: hidden initially, mouse-edge reveal,
// selection closes it, and Escape returns focus to the accessible drawerHandle.
const docEvents={},timers=new Map();let timerId=0;
const node=()=>{const set=new Set();return {classList:{contains:n=>set.has(n),add:n=>set.add(n),toggle:(n,on)=>on?set.add(n):set.delete(n)},events:{},setAttribute(k,v){this[k]=v;},addEventListener(k,fn){(this.events[k]||=[]).push(fn);},contains:e=>e?.inDock,focus(){this.focused=true;}};};
const dock=node(),drawerApp=node();let drawerHandle;
const drawerDocument={documentElement:{lang:'en'},activeElement:{},createElement:()=>node(),addEventListener:(name,fn)=>docEvents[name]=fn};
drawerApp.append=e=>drawerHandle=e;
const drawerScope={window:{Aurora:App},document:drawerDocument,performance:{now:()=>now},MutationObserver:class{observe(){}},matchMedia:()=>({matches:false,addEventListener(){}}),setTimeout:fn=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id)};
vm.runInNewContext(fs.readFileSync('compact-player.js','utf8'),drawerScope);
App.app=drawerApp;App.el=()=>dock;App.compactPlayer=false;App.mountVisualizerDrawer();
assert.equal(dock.inert,true,'Desktop visualizer drawer starts hidden');
docEvents.pointermove({pointerType:'mouse',clientX:4});assert.equal(timers.size,1);
for(const fn of timers.values())fn();timers.clear();
assert.equal(dock.inert,false,'Resting the mouse at the left edge opens the desktop drawer');
assert.equal(drawerHandle['aria-expanded'],'true');
for(const fn of dock.events.click)fn({target:{closest:()=>({})}});assert.equal(dock.inert,true,'Selecting a visualizer closes the desktop drawer');
for(const fn of drawerHandle.events.click)fn();drawerDocument.activeElement={inDock:true};
docEvents.keydown({key:'Escape',preventDefault(){}});assert.equal(dock.inert,true);assert.equal(drawerHandle.focused,true);
console.log('PASS: hidden desktop visualizer drawer, mouse-edge reveal, selection closing and Escape focus return.');

// Bass bins above the old -30 dB byte ceiling must still change with amplitude.
const dspText=fs.readFileSync('workers.js','utf8'),fftStart=dspText.indexOf('function fftPlan(n)'),fftEnd=dspText.indexOf('function db(samples)',fftStart);
const fftScope={};vm.runInNewContext('const fftCache=new Map(),fftPlans=new Map();'+dspText.slice(fftStart,fftEnd)+';globalThis.fft=fft;globalThis.cache=fftCache;',fftScope);
let lastPeak=0;
for(const amplitude of [.05,.1,.25,.5,.9]){
 const samples=Float32Array.from({length:4096},(_,i)=>amplitude*Math.sin(2*Math.PI*8*i/4096));
 fftScope.fft(samples,'main');const levels=fftScope.cache.get('4096|main').visualLevels,peak=levels[8];
 assert(peak>lastPeak+.02,'Bass level continues moving as a loud tone gets stronger');assert(peak<1,'Loud bass retains headroom');lastPeak=peak;
}
console.log('PASS: DSP bass dynamics above the former -30 dB ceiling, including loud normalized tones.');

const sceneApp={settings:{bgEnabled:true,postFish:.8,postZoom:1.4,postChroma:8,postGlitch:.5,postGray:.4,postHue:120,postPixel:12},addStyle(){},define(){}};
vm.runInNewContext(fs.readFileSync('scene-effects.js','utf8'),{window:{Aurora:sceneApp}});
sceneApp.mobileSceneDisabled=true;const mobileSettings=sceneApp.getSceneSettings();
assert.equal(mobileSettings.bgEnabled,false);assert.equal(mobileSettings.postZoom,1);
for(const key of ['postFish','postPixel','postChroma','postGlitch','postEdges','postGray','postHue','postVignette'])assert.equal(mobileSettings[key],0);
assert.equal(sceneApp.settings.bgEnabled,true,'Mobile rendering restriction preserves saved desktop background');assert.equal(sceneApp.settings.postFish,.8);
sceneApp.mobileSceneDisabled=false;assert.equal(sceneApp.getSceneSettings(),sceneApp.settings,'Desktop uses the original preferences after resizing back');
console.log('PASS: mobile background/shader restrictions preserve and restore desktop preferences.');
