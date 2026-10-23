// Regression coverage for factory defaults, persistence, analysis metadata and
// curve editor lifetime. DOM/timing simulations are not hardware benchmarks.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const modules=new Map(),storage=new Map(),events=new Map(),frames=new Map(),timers=new Map();let next=0;
const App={define:(id,fn)=>modules.set(id,fn)};
const status={dataset:{},removeAttribute(name){if(name==='data-save-error')delete this.dataset.saveError;}};
let rejectWrites=false;
const scope={window:{Aurora:App,addEventListener(name,fn){const list=events.get(name)||[];list.push(fn);events.set(name,list);}},
 localStorage:{getItem:key=>storage.get(key)||null,setItem(key,value){if(rejectWrites)throw Error('Quota');storage.set(key,value);}},
 console:{warn(){}},setTimeout:fn=>{timers.set(++next,fn);return next;},clearTimeout:id=>timers.delete(id),
 requestAnimationFrame:fn=>{frames.set(++next,fn);return next;},cancelAnimationFrame:id=>frames.delete(id)};
for(const file of ['settings.js','audio.js'])vm.runInNewContext(fs.readFileSync(file,'utf8'),scope);
modules.get('core/settings')();
const preset=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'fixtures','factory-settings.json'),'utf8')).settings;
for(const key of Object.keys(preset))assert.deepEqual(JSON.parse(JSON.stringify(App.settings[key])),preset[key],key);
const copy=App.loadSettings();copy.bgLayers[0].overrides.blur.enabled=true;
assert.equal(App.defaultSettings.bgLayers[0].overrides.blur.enabled,false,'Factory data is isolated from mutable settings');
storage.set(App.STORAGE_KEY,JSON.stringify({vizMode:'wave',bgLayers:[{count:12,overrides:{speed:{sensitivity:1.3,colorMode:'custom',customColor:'#112233'}}}]}));
const saved=App.loadSettings();assert.equal(saved.vizMode,'wave');assert.equal(saved.bgLayers[0].count,12);
assert.equal(saved.bgLayers[0].overrides.speed.sensitivity,1.3);assert.equal(saved.bgLayers[0].overrides.speed.colorMode,'custom');
assert.equal(saved.bgLayers[0].overrides.speed.tempoSync,preset.bgMapSpeed.tempoSync,'Incomplete maps inherit working defaults');
assert.equal(saved.bgLayers[1].count,preset.bgLayers[1].count);
const cleared=App.mergeSettings({bgLayers:[{overrides:{}}]});assert.equal(Object.keys(cleared.bgLayers[0].overrides).length,0,'Removed per-layer overrides stay removed');
const invalid=App.mergeSettings(JSON.parse('{"bgLayers":null,"bgMapSpeed":{"curvePoints":[null,{"x":0.5,"y":0.8},{"x":"bad","y":1}]},"fftIdx":"broken","normalize":null,"__proto__":{"polluted":true}}'));
assert.equal(invalid.fftIdx,preset.fftIdx);assert.equal(invalid.normalize,preset.normalize);assert.equal(invalid.bgLayers.length,4);
assert.equal(invalid.bgMapSpeed.curvePoints.length,1);assert.equal({}.polluted,undefined);
App.el=()=>status;
App.saveSettings();rejectWrites=true;App._flushSettings();assert.equal(App._settingsDirty,true);assert.equal(status.dataset.saveError,'true');
rejectWrites=false;events.get('pagehide')[0]();assert.equal(App._settingsDirty,false);assert.equal(status.dataset.saveError,undefined);
assert.equal(JSON.parse(storage.get(App.STORAGE_KEY)).vizMode,preset.vizMode);
modules.get('storage/profiles')();const profiles=App.ProfileStore._load();
profiles.set('favorite',{liked:true});profiles.set('duration',{duration:100});profiles.set('bad',{lufs:NaN});profiles.set('analyzed',{lufs:-18,liked:true});
for(const key of ['favorite','duration','bad']){assert.equal(App.ProfileStore.has(key),false);assert.equal(App.ProfileStore.get(key),undefined);}
assert.equal(App.ProfileStore.count(),1);assert.equal(App.ProfileStore.has('analyzed'),true);
let gainWrites=0;App.normGain={gain:{setTargetAtTime(){gainWrites++;}}};App.audioCtx={currentTime:0};
App.setGainFromLufs(undefined);App.setGainFromLufs(NaN);App.setGainFromLufs(-18);assert.equal(gainWrites,1);
// Repeated initialization must not retain global pointer listeners. Captured
// pointer events redraw at most once per frame, preserving the final position.
const map={curvePoints:[{x:.5,y:.5}]},listeners=new Map();let redraws=0,saves=0;
const dot={style:{left:'50',top:'50'},classList:{add(){}}};
const wrap={isConnected:true,getBoundingClientRect:()=>({left:0,top:0,width:100,height:100}),setPointerCapture(){},
 querySelectorAll:()=>[dot],addEventListener(name,fn){const list=listeners.get(name)||[];list.push(fn);listeners.set(name,list);}};
const root={querySelector:()=>wrap};App.getMapByKey=()=>map;App.redrawCurveEditor=()=>redraws++;App.saveSettings=()=>saves++;
App.CurveMath={clampPointX:(list,index,x)=>x};App.MAX_CURVE_POINTS=3;
for(let i=0;i<20;i++)App.initCurveEditor('bgMapSpeed',root);
assert.equal(listeners.get('pointermove').length,1);assert.equal(events.has('pointermove'),false);
const dispatch=(name,event)=>listeners.get(name).forEach(fn=>fn(event));
dispatch('pointerdown',{button:0,pointerId:7,clientX:50,clientY:50,preventDefault(){}});
for(let i=0;i<100;i++)dispatch('pointermove',{pointerId:7,clientX:60,clientY:40});
assert.equal(frames.size,1);assert.equal(redraws,1);
for(const [id,fn] of frames){frames.delete(id);fn();}
assert.equal(redraws,2);assert.equal(map.curvePoints[0].x,.6);assert.equal(map.curvePoints[0].y,.6);
dispatch('lostpointercapture',{pointerId:7});assert.equal(saves,1);assert.equal(frames.size,0);
dispatch('pointerup',{pointerId:7});assert.equal(saves,1,'Capture cancellation finalizes once');
console.log('PASS: exact preset, isolated defaults, typed deep merging, pagehide/save failure handling, real LUFS profiles and bounded curve editor listeners/redraws.');
const colorModules=new Map(),colorWrites=new Map();
const colorApp={define:(id,fn)=>colorModules.set(id,fn),addParts(){},state:{tracks:[]},Threads:{backgroundActive:false},BgReact:{_hueAccum:0},settings:{...App.defaultSettings,playerColorSync:true,bgMapColorSpeed:{enabled:true}}};
let paletteSheets=0,paletteWrites=0;
const colorDocument={head:{appendChild(){paletteSheets++;}},createElement:()=>({sheet:{insertRule(){},cssRules:[{style:{setProperty(key,value){paletteWrites++;colorWrites.set(key,value);}}}]}}),documentElement:{style:{setProperty(){assert.fail('Animated colors must not mutate inherited root inline styles');}}}};
vm.runInNewContext(fs.readFileSync('background.js','utf8'),{window:{Aurora:colorApp},performance:{now:()=>0},document:colorDocument});
colorModules.get('background/player-colors')();colorApp.PlayerColors.update();
assert.equal(colorWrites.get('--player-c1'),App.defaultSettings.playerColor1,'Empty player keeps the MusicViz palette instead of zero-hue orange');
assert.equal(colorWrites.get('--player-c1-play'),App.defaultSettings.playerColor1);
colorApp.state.tracks=[{}];colorApp.PlayerColors.update();
assert.notEqual(colorWrites.get('--player-c1'),App.defaultSettings.playerColor1,'Music hue synchronization remains available with loaded tracks');
console.log('PASS: empty-player palette and music-driven color synchronization.');

// Scrolling may reduce unrelated UI work, but synchronized colors must remain live.
colorApp.isActivelyScrolling=()=>true;
for(const key of ['playerSyncThumbs','playerSyncPlayBtn','playerSyncGear','playerSyncScanline'])colorApp.settings[key]=true;
for(const hue of [40,80,120]){
  colorApp.BgReact._hueAccum=hue;colorApp.PlayerColors.update();
  for(const suffix of ['','-thumb','-play','-gear','-scanline']){
    assert.equal(colorWrites.get('--player-c1'+suffix),colorApp.hslToHex(hue,80,60),'Colors update during continuous playlist scroll: '+suffix);
    assert.equal(colorWrites.get('--player-c2'+suffix),colorApp.hslToHex(hue+40,80,55));
  }
}
console.log('PASS: synchronized panel, thumbnail, playback, settings and scanline colors remain live during scrolling.');
const previousWrites=paletteWrites;colorApp.PlayerColors.update();assert.equal(paletteWrites,previousWrites,'Unchanged colors do not invalidate styles');
for(let i=0;i<10000;i++){colorApp.BgReact._hueAccum=i*.23;colorApp.PlayerColors.update();}
assert.equal(paletteSheets,1,'A long-running color cycle reuses one stylesheet rule');
assert.equal(colorWrites.size,10,'All palette channels stay bounded and synchronized');
console.log('PASS: live palette avoids root inline style churn and reuses one stylesheet for 10,000 updates.');
