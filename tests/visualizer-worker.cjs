// Exercises the actual serialized worker and the main-thread fallback without a browser.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('visualizers.js','utf8').split('// Stage visualizers:')[1];
for(const support of [true,false]){
  let init,blobSource,worker,frames=0,cancelled=0,timer=0;const pending=new Map(),timeouts=new Map(),messages=[],translations=[];
  const ctx={fillRect(){},save(){},restore(){},clearRect(){},setTransform(){},translate(x,y){frames++;translations.push([x,y]);},createLinearGradient(){return {addColorStop(){}};},beginPath(){},moveTo(){},lineTo(){},roundRect(){},arc(){},fill(){},stroke(){}};
  const rects={stage:{left:0,top:0,width:1600,height:1000},sceneContent:{left:0,top:0,width:1300,height:1000},playlistPanel:{left:1300,top:0,width:300,height:1000},controlBar:{top:900,height:80},timelineIsland:{top:860,height:40}};
  const element=id=>({style:{},dataset:{},addEventListener(){},getBoundingClientRect:()=>rects[id],querySelectorAll:()=>[],cloneNode(){return element(id);},replaceWith(){},getContext:()=>ctx,...(support?{transferControlToOffscreen:()=>({getContext:()=>ctx})}:{})});
  const elements=Object.fromEntries(['stage','sceneContent','playlistPanel','controlBar','timelineIsland','musicVisualizerCanvas','visualizerDock'].map(id=>[id,element(id)]));
  const schedule=fn=>{const id=++timer;pending.set(id,fn);return id;},cancel=id=>{pending.delete(id);cancelled++;};
  const settings={vizMode:'equalizer',vizOpacity:.65,vizFps:120,vizEqCount:64,vizEqSmooth:.65};
  const App={define(name,fn){if(name==='stage/music-visualizers')init=fn;},settings,el:id=>elements[id],stage:elements.stage,app:{classList:{contains:()=>false}},state:{isPlaying:true},PlayerColors:{_lastC1:'#ff00ff',_lastC2:'#00ffff'},audio:{addEventListener(){}},VisualRenderState:{active:true,subscribe(fn){fn();}},Threads:{workers:new Map(),audioActive:false}};
  const global={window:{Aurora:App,addEventListener(){}},document:{hidden:false,addEventListener(){}},innerWidth:1600,devicePixelRatio:1,ResizeObserver:class{observe(){}disconnect(){}},requestAnimationFrame:schedule,cancelAnimationFrame:cancel,setTimeout:(fn,ms)=>{const id=++timer;timeouts.set(id,{fn,ms});return id;},clearTimeout:id=>timeouts.delete(id),URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},Blob:class{constructor(parts){blobSource=parts.join('');}},Worker:class{constructor(){worker=this;this.messages=[];}postMessage(m){this.messages.push(m);}terminate(){this.terminated=true;}},console};
  vm.runInNewContext('(function(){ // Stage visualizers:'+source+'\n})();',global);
  App.scenePixelRatio=()=>1;
  init();
  assert.equal(support?worker.messages[0].type:'fallback',''+(support?'init':'fallback'));
  if(support){
    const canvas=elements.musicVisualizerCanvas;
    assert.equal(canvas.style.opacity,'0.65');assert.equal(canvas.style.transitionDuration,'160ms');
    App.state.isPlaying=false;App.refreshMusicVisualizer();
    assert.equal(canvas.style.opacity,'0');assert.equal(canvas.style.transitionDuration,'800ms');
    assert.equal(worker.messages.filter(m=>m.type==='state').at(-1).active,true,'Preserve image while fading');
    const fading=[...timeouts.values()].find(t=>t.ms===800);assert(fading);
    App.state.isPlaying=true;App.refreshMusicVisualizer();
    assert(![...timeouts.values()].some(t=>t.ms===800),'Resume cancels delayed canvas clearing');
    App.state.isPlaying=false;App.refreshMusicVisualizer();
    [...timeouts.values()].find(t=>t.ms===800).fn();
    assert.equal(worker.messages.at(-1).active,false,'Fade completion clears and sleeps');
    App.refreshMusicVisualizer();assert.equal(worker.messages.filter(m=>m.type==='state').at(-1).active,false,'Home/paused remains hidden');
    App.SettingsUI={motionDuration:()=>0};App.state.isPlaying=true;App.refreshMusicVisualizer();
    App.state.isPlaying=false;App.refreshMusicVisualizer();
    assert.equal(canvas.style.transitionDuration,'0ms');assert.equal(worker.messages.filter(m=>m.type==='state').at(-1).active,false);
    delete App.SettingsUI;App.state.isPlaying=true;App.refreshMusicVisualizer();
    const scope={requestAnimationFrame:schedule,cancelAnimationFrame:cancel,postMessage:m=>messages.push(m),performance:{now:()=>0},setTimeout,clearTimeout};
    vm.createContext(scope);vm.runInContext(blobSource,scope);
    for(const m of worker.messages)scope.onmessage({data:m});
    const layout=worker.messages.find(m=>m.type==='layout');
    assert.equal(layout.box.x+layout.box.w/2,650,'Centered between left edge and playlist');
    assert.equal(layout.box.y+layout.box.h/2,(110+828)/2,'Centered above timeline');
    const tick=t=>{const callbacks=[...pending.values()];pending.clear();callbacks.forEach(fn=>fn(t));};
    tick(100);const first=frames;tick(104);assert.equal(frames,first,'120 FPS limit skips early frames');tick(109);assert.equal(frames,first+1);
    scope.onmessage({data:{type:'audio',freq:new Uint8Array(1024).fill(200),wave:new Float32Array(260)}});
    assert.equal(messages.at(-1).type,'audio-ack','Fallback packets acknowledge backpressure');
    scope.onmessage({data:{type:'state',settings,playing:true,active:false}});assert.equal(pending.size,0,'Hidden worker stops scheduling');
    scope.onmessage({data:{type:'state',settings:{...settings,vizFps:15},playing:true,active:true}});tick(200);const low=frames;tick(220);assert.equal(frames,low);tick(268);assert.equal(frames,low+1);
    scope.onmessage({data:{type:'state',settings,playing:false,active:true}});tick(400);assert.equal(pending.size,0,'Paused canvas draws once, then sleeps');
    scope.onmessage({data:{type:'state',settings:{...settings,vizFps:240},playing:true,active:false}});
    scope.onmessage({data:{type:'state',settings:{...settings,vizFps:240},playing:true,active:true}});
    const high=frames;for(let i=0;i<240;i++)tick(500+i*1000/240);
    assert.equal(frames-high,240,'240 Hz callbacks produce 240 actual visualizer draws');
    worker.onerror();assert(worker.terminated,'Worker failure switches to fallback');
  }
}
console.log('PASS: serialized visualizer worker, 15/120/240 FPS pacing, centered bounds, audio ACK, visibility/pause and unsupported/failed-worker fallback.');
