// CPU regression tests: no claims about measured browser RAM or GPU rendering.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const modules=new Map(),parts={},templates=new Map();
const App={define:(id,fn)=>modules.set(id,fn),addStyle(){},addParts(id,p){Object.assign(parts[id]??={},p);},registerTemplate:(id,s)=>templates.set(id,s),registerWorkerPart(){}};
const listeners={},document={hidden:false,hasFocus:()=>false,body:{classList:{toggle(){}}},addEventListener:(id,fn)=>listeners[id]=fn};
const scope=vm.createContext({window:{Aurora:App,devicePixelRatio:1,addEventListener:(id,fn)=>listeners[id]=fn},document,console,setTimeout,clearTimeout,localStorage:{getItem:()=>null}});
for(const file of ['ui.js','settings.js','visualizers.js','templates.js'])vm.runInContext(fs.readFileSync(file,'utf8'),scope);
modules.get('core/settings')();modules.get('ui/render-lifecycle')();
assert.equal(App.VisualRenderState.active,true,'Visible unfocused window continues by default');
App.settings.powerSaveMode='blur';App.VisualRenderState.refresh();assert.equal(App.VisualRenderState.active,false);
App.settings.powerSaveMode='hidden';App.VisualRenderState.refresh();listeners.blur();assert.equal(App.VisualRenderState.active,true);
document.hidden=true;listeners.visibilitychange();assert.equal(App.VisualRenderState.active,false);
document.hidden=false;listeners.visibilitychange();assert.equal(App.VisualRenderState.active,true);
App.settings.powerSaveMode='off';document.hidden=true;App.VisualRenderState.refresh();assert.equal(App.VisualRenderState.active,true);
listeners.pagehide();assert.equal(App.VisualRenderState.active,false,'Page teardown stops even with power saving off');
for(const mode of ['soft','fit','clip']){
 const heights=[],ctx={save(){},restore(){},beginPath(){},fill(){},roundRect(x,y,w,h){heights.push(h);}};
 const levels=Float32Array.from({length:64},(_,i)=>1+i/12);
 App.drawMusicVisualizer(ctx,900,600,'equalizer',levels,new Float32Array(260),{...App.defaultSettings,vizEqCount:64,vizEqGain:1,vizEqFade:0,vizEqGlow:0,vizEqPeakMode:mode,vizEqTips:false},0);
 if(mode!=='clip')for(let i=1;i<heights.length;i++)assert(heights[i]>heights[i-1],`${mode} preserves loud peak differences`);
 assert(heights.every(h=>h<=600*.94),'Peaks fit the scene');
 if(mode==='fit')assert(Math.abs(heights[20]/heights[21]-levels[20]/levels[21])<1e-6,'Fit preserves ratios');
}
// Execute both the fallback and serialized worker spectrum cache implementations.
const workerText=fs.readFileSync('workers.js','utf8');
const part=workerText.split('function(){const Spectrogram = {')[1].split('// ── workers/spectrum/03-targets')[0];
const workerScope=vm.createContext({settings:App.settings});
vm.runInContext('const Spectrogram = {'+part.slice(0,part.lastIndexOf('});'))+';globalThis.spectrum=Spectrogram;',workerScope);
for(const spectrum of [{...parts.Spectrogram},workerScope.spectrum]){
 spectrum._ensurePaletteLUT=()=>new Uint8Array(768);
 const ctx={createImageData:(w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)}),putImageData(){}};
 for(let width=1;width<=64;width++)spectrum._paintColumns(ctx,{width:128,height:20},0,width,new Float32Array(20));
 assert(spectrum._columnImageCache.size<=8);
 assert([...spectrum._columnImageCache.values()].reduce((n,img)=>n+img.data.byteLength,0)<=4*1024*1024);
 const first=spectrum._columnImageCache.get('64x20');spectrum._paintColumns(ctx,{width:128,height:20},0,64,new Float32Array(20));
 assert.equal(spectrum._columnImageCache.get('64x20'),first,'Unchanged runs reuse storage');
}
assert(templates.get('page-playback-general').includes('data-extra-select="powerSaveMode"'));
console.log('PASS: render power modes, non-flat equalizer peaks, proportional fit, bounded/reused spectrum buffers in both render paths.');
// Only one object URL is live while changing tracks; revisiting recreates it.
vm.runInContext(fs.readFileSync('library-player.js','utf8'),scope);
const live=new Set(),revoked=[];let sequence=0;
scope.URL={createObjectURL(){const id='blob:'+ ++sequence;live.add(id);return id;},revokeObjectURL(id){live.delete(id);revoked.push(id);}};
App.state={currentIndex:-1,tracks:[{file:{name:'a'},url:null},{file:{name:'b'},url:null}]};
App.recordPlayedIndex=()=>{};App.audio={};const reachedUI=new Error('resource setup complete');App.el=()=>{throw reachedUI;};
for(const index of [0,0,1,0]){assert.throws(()=>App.loadTrack(index,false),e=>e===reachedUI);assert.equal(live.size,1);assert(live.has(App.audio.src));}
assert.equal(sequence,3);assert.equal(revoked.length,2);
console.log('PASS: lazy track URLs, release on track switch, and recreation on revisit.');
// Responsive label must settle even when moving inside changes its measured width.
vm.runInContext(fs.readFileSync('mobile.js','utf8'),scope);
const classes=initial=>{const set=new Set(initial);return {contains:c=>set.has(c),toggle(c,on){if(on)set.add(c);else set.delete(c);}};};
let room=145,mutations=0;
const labelClasses=classes([]),label={classList:{contains:labelClasses.contains,toggle(c,on){mutations++;labelClasses.toggle(c,on);}},get offsetWidth(){return labelClasses.contains('label-inside')?90:130;}};
const elements={controlBar:{classList:classes([]),getBoundingClientRect:()=>({left:30,right:700})},playlistPanel:{getBoundingClientRect:()=>({left:800})},timelineTimeLabel:label,timelineIsland:{getBoundingClientRect:()=>({left:30,right:788-room})}};
App.el=id=>elements[id];const layoutVars={};App.app={classList:classes([]),style:{setProperty:(key,value)=>layoutVars[key]=value}};scope.innerWidth=1200;
  App.settings.timelineLoudnessWaveform=true;App.settings.timelineWaveformHeight=2;App.settings.timelineWaveformOffset=10;
for(let i=0;i<30;i++)App.refreshResponsiveLayout();
assert.equal(layoutVars['--timeline-waveform-clearance'],'38px','Time label reserves the waveform height and positive offset');
  assert.equal(mutations,1,'Inside label settles instead of alternating every frame');
room=190;for(let i=0;i<30;i++)App.refreshResponsiveLayout();
assert.equal(mutations,2,'Label returns outside once, with hysteresis');
scope.innerWidth=1000;room=145;for(let i=0;i<30;i++)App.refreshResponsiveLayout();
assert.equal(mutations,2,'Compact drawer does not reserve sidebar space or force the time label inside');
let allocatedSprites=0;
const sprites=vm.createContext({OffscreenCanvas:class{constructor(){allocatedSprites++;this.fills=0;this.clears=0;}getContext(){return {setTransform(){},clearRect:()=>this.clears++,scale(){},translate(){},fill:()=>this.fills++};}},Path2D:class{},BlobShapes:{circle:{path:()=>''}}});
const spriteSource=workerText.slice(workerText.indexOf('const pathCache=new Map();'),workerText.indexOf('function stamp('));
vm.runInContext(spriteSource+';globalThis.sprite=blobSprite;',sprites);
const firstSprite=sprites.sprite('circle',0,0);
for(let i=1;i<100;i++)sprites.sprite('circle',0,i);
assert.equal(allocatedSprites,80,'Sprite surface allocation stops at the cache limit');
assert.equal(firstSprite.fills,2,'Least recently used surface is recycled');
assert.equal(firstSprite.clears,firstSprite.fills,'Recycled surfaces are cleared before repainting');
const latest=sprites.sprite('circle',0,99),fills=latest.fills;
assert.equal(sprites.sprite('circle',0,99),latest);
assert.equal(latest.fills,fills,'Cache hits do not repaint');
console.log('PASS: stable responsive label placement and bounded background sprite recycling.');
