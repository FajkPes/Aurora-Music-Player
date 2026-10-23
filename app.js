/* app.js — Sdílený stav, registrace, inicializace, threading a diagnostika. */

// ── Application registry ──
(function(global){
  const styleParts=new Map();
  const modules=new Map(), workers=new Map(), workerChunks=new Map(), templates=new Map();
  const App={
    parts:Object.create(null), workerSources:Object.create(null), started:false,
    addStyle(order,css){
      if(styleParts.has(order))throw new Error('Duplicate stylesheet: '+order);
      styleParts.set(order,css);
    },
    mountStyles(){
      const style=document.createElement('style');
      style.textContent=[...styleParts].sort((a,b)=>a[0]-b[0]).map(item=>item[1]).join('');
      document.head.appendChild(style);
    },
    define(name,initialize,exports=[]){
      if(modules.has(name))throw new Error('Duplicate module: '+name);
      modules.set(name,{initialize,exports});
    },
    addParts(name,methods){
      const target=this.parts[name] ||= Object.create(null);
      for(const key of Object.keys(methods)){
        if(Object.hasOwn(target,key))throw new Error('Duplicate method: '+name+'.'+key);
        target[key]=methods[key];
      }
    },
    registerTemplate(name,html){
      if(templates.has(name))throw new Error('Duplicate template: '+name);
      templates.set(name,html);
    },
    renderTemplate(name,parents=[]){
      if(!templates.has(name))throw new Error('Missing template: '+name);
      if(parents.includes(name))throw new Error('Template cycle: '+name);
      return templates.get(name).replace(/@@AURORA:([a-z0-9-]+)@@/g,(_,child)=>this.renderTemplate(child,[...parents,name]));
    },
    mountUI(){document.getElementById('aurora-root').outerHTML=this.renderTemplate('shell');},
    registerWorkerPart(name,fragment){
      if(workerChunks.has(name))throw new Error('Duplicate worker fragment: '+name);
      const source=Function.prototype.toString.call(fragment);
      workerChunks.set(name,source.slice(source.indexOf('{')+1,source.lastIndexOf('}')));
    },
    registerWorker(name,entry){
      if(workers.has(name))throw new Error('Duplicate worker: '+name);
      workers.set(name,entry);
    },
    prepareWorkers(){
      for(const [name,entry] of workers){
        let shared='';
        if(name==='library'){
          const parser=modules.get('library/artist-detection');
          shared='const App={settings:{smartTitleParsing:true}};\n';
          for(const key of parser.exports){
            if(typeof this[key]==='function')shared+='App.'+key+' = '+this[key].toString()+';\n';
          }
          shared+='('+parser.initialize.toString()+')();\n';
        }
        const source=Array.isArray(entry)?entry.map(key=>{
          if(!workerChunks.has(key))throw new Error('Missing worker fragment: '+key);
          return workerChunks.get(key);
        }).join('\n'):'('+entry.toString()+')();';
        this.workerSources[name]=shared+source;
      }
    },
    start(order){
      if(this.started)throw new Error('Aurora has already started');
      for(const name of order)if(!modules.has(name))throw new Error('Missing module: '+name);
      this.mountStyles();
      this.mountUI();
      for(const name of order){
        if(name==='threading/manager')this.prepareWorkers();
        try{modules.get(name).initialize();}
        catch(error){console.error('Aurora initialization failed in '+name,error);throw error;}
      }
      this.started=true;
    },
    scenePixelRatio(width,height){
      // Bound each full-scene backing store to four million pixels (~16 MB).
      return Math.min(1.5,global.devicePixelRatio||1,Math.sqrt(4000000/Math.max(1,width*height)));
    },
    moduleInfo(){return [...modules].map(([name,module])=>({name,exports:[...module.exports]}));}
  };
  global.Aurora=App;
})(window);

// ── core/state ──
(function(App){
  App.define("core/state", function initialize(){
App.state = {
    tracks: [],
    currentIndex: -1,
    isPlaying: false,
  };
App.el = (id) => document.getElementById(id);
  }, ["state","el"]);
})(window.Aurora);

// ── debug/performance ──
(function(App){
  App.define("debug/performance", function initialize(){
App.PerfDebug = {
    enabled: false,
    panelEl: null,
    times: { bgreact: 0, playercolors: 0, spectrogram: 0, total: 0 },
    history: [],
    HISTORY_LEN: 90,
    frameCount: 0,
    lastFpsCalcT: 0,
    fps: 0,
    init(){
      window.addEventListener('keydown', (e)=>{
        if(e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')){
          e.preventDefault();
          this.toggle();
        }
      });
    },
    toggle(){
      this.enabled = !this.enabled;
      if(this.enabled) this._ensurePanel();
      if(this.panelEl) this.panelEl.style.display = this.enabled ? 'block' : 'none';
    },
    _ensurePanel(){
      if(this.panelEl) return;
      const p = document.createElement('div');
      p.id = 'perfDebugPanel';
      p.style.cssText = `
        position:fixed; top:12px; left:12px; z-index:99999;
        width:340px; max-height:80vh; overflow-y:auto;
        background:rgba(6,7,11,0.94); backdrop-filter:none;
        border:1px solid rgba(255,255,255,0.15); border-radius:10px;
        padding:12px 14px; font-family:'JetBrains Mono',monospace;
        font-size:11px; line-height:1.6; color:#d7dae2;
        pointer-events:auto; user-select:text; box-shadow:0 20px 50px rgba(0,0,0,0.6);
      `;
      document.body.appendChild(p);
      this.panelEl = p;
    },
    beginFrame(){
      if(!this.enabled) return;
      this._t0 = performance.now();
      this._section = null;
      this._sectionStart = 0;
    },
    mark(section){
      if(!this.enabled) return;
      const now = performance.now();
      if(this._section){
        this.times[this._section] = (this.times[this._section] || 0) + (now - this._sectionStart);
      }
      this._section = section;
      this._sectionStart = now;
    },
    endFrame(){
      if(!this.enabled) return;
      const now = performance.now();
      if(this._section){
        this.times[this._section] = (this.times[this._section] || 0) + (now - this._sectionStart);
      }
      this.times.total = now - this._t0;
      this.history.push({ ...this.times, ts: now });
      if(this.history.length > this.HISTORY_LEN) this.history.shift();
      this.times = { bgreact: 0, playercolors: 0, spectrogram: 0, total: 0 };
      this.frameCount++;
      if(now - this.lastFpsCalcT >= 500){
        this.fps = Math.round(this.frameCount / ((now - this.lastFpsCalcT)/1000));
        this.frameCount = 0;
        this.lastFpsCalcT = now;
      }
      this._render();
    },
    _avg(key){
      if(!this.history.length) return 0;
      let sum = 0;
      for(const h of this.history) sum += (h[key]||0);
      return sum / this.history.length;
    },
    _render(){
    if(!this.panelEl||!this.enabled)return;
    const now=performance.now();if(now-(this._lastRenderT||0)<250)return;this._lastRenderT=now;
    let node=this.panelEl.querySelector('.worker-metrics');if(!node){node=document.createElement('pre');node.className='worker-metrics';this.panelEl.prepend(node);}
    node.style.cssText='white-space:pre-wrap;margin:0;line-height:1.8;font:11px var(--font-mono);';
    const lines=Object.entries(App.Threads.metrics).map(([name,m])=>`${name}: ${m.fps.toFixed(0)} FPS · ${m.cpuMs.toFixed(2)} ms JS · gap ${m.maxGap.toFixed(0)} ms${m.paintFps===undefined?'':' · paint '+m.paintFps.toFixed(0)+'/s'}`);
    node.textContent=['AURORA PERFORMANCE · Ctrl+Shift+D','',`UI: ${this.fps} FPS · ${this._avg('total').toFixed(2)} ms JS`,`Rendering: ${App.VisualRenderState.active?'active':'suspended'}`,...lines,'',App.Threads.audioActive?'Audio capture: AudioWorklet':'Audio capture: browser fallback',`Background objects: ${App.Threads.backgroundActive?App.Threads.blobCount:(App.BgReact.blobs||[]).length}`,`Playlist DOM rows: ${App.vt.pool.length}`,`Workers: ${[...App.Threads.workers.keys()].join(', ')}`,'',`JS heap: ${performance.memory?(performance.memory.usedJSHeapSize/1048576).toFixed(0)+' MiB':'unavailable'} (excludes GPU/process RAM)`,`Worker canvas storage estimate: ${(Object.values(App.Threads.metrics).reduce((sum,m)=>sum+(m.resources?.canvasBytes||0)+(m.resources?.pixelCacheBytes||0),0)/1048576).toFixed(0)} MiB`,'CPU/GPU resources are shared. JS times exclude GPU cost.',...App.Threads.failures.map(f=>f.name+': '+f.reason)].join('\n');
  }
  };
App.PerfDebug.init();
  }, ["PerfDebug"]);
})(window.Aurora);

// ── threading/manager ──
(function(App){
  App.define("threading/manager", function initialize(){
App.Threads = {
    workers:new Map(), metrics:{}, failures:[], pendingJobs:new Map(), nextJob:1,
    backgroundActive:false,spectrumActive:false,timelineActive:false,audioActive:false,
    create(name){
      const url=URL.createObjectURL(new Blob([App.WORKER_SOURCES[name]],{type:'text/javascript'}));
      let worker;
      try{worker=new Worker(url,{name:'Aurora '+name});}finally{URL.revokeObjectURL(url);}
      const entry={worker,name,settingsBusy:false,settingsPending:false};this.workers.set(name,entry);
      worker.addEventListener('message',({data:m})=>{
        if(m.type==='ready'){entry.ready=true;clearTimeout(entry.readyTimer);}
        if(m.type==='metrics')this.metrics[name]=m;
        if(m.type==='hue') { App.PlayerColors.receiveHue(m.hue);App.BgReact._hueAccum=m.hue;this.blobCount=m.blobs; }
        if(m.type==='settings-ack'){entry.settingsBusy=false;if(entry.settingsPending)this.sendSettings(entry);}
        if(m.type==='timeline-ack')this.timelineBusy=false;
        if(m.type==='spectrum-ack')this.spectrumBusy=false;
        if(m.type==='sense-ack')this.senseBusy=false;
        if(name==='analysis'||name==='library'){
          const job=this.pendingJobs.get(m.id);if(job){clearTimeout(job.timer);this.pendingJobs.delete(m.id);m.error?job.reject(new Error(m.error)):job.resolve(m.result);}
        }
      });
      worker.addEventListener('error',e=>{e.preventDefault();this.fail(name,e.message||'Worker error');});
      worker.addEventListener('messageerror',()=>this.fail(name,'Message could not be read'));
      if(['background','spectrum','timeline'].includes(name))entry.readyTimer=setTimeout(()=>{if(!entry.ready)this.fail(name,'Startup timeout');},8000);
      return worker;
    },
    send(name,message,transfer=[]){this.workers.get(name)?.worker.postMessage(message,transfer);},
    sendSettings(entry){
      if(entry.settingsBusy){entry.settingsPending=true;return;}
      entry.settingsPending=false;entry.settingsBusy=true;
      entry.worker.postMessage({type:'settings',settings: (App.getSceneSettings?.()||App.settings)});
    },
    settingsChanged(){
      clearTimeout(this.settingsTimer);
      this.settingsTimer=setTimeout(()=>{
        for(const entry of this.workers.values())if(!['analysis','library'].includes(entry.name))this.sendSettings(entry);
        this.capture?.port.postMessage({type:'settings',fftSize:App.FFT_SIZES[App.settings.fftIdx]||2048});
        this.layout();this.resizeTimeline();this.staticEffects();
      },40);
    },
    replaceCanvas(id){
      const old=App.el(id),next=old.cloneNode(false);old.replaceWith(next);return next;
    },
    fail(name,reason){
      const entry=this.workers.get(name);if(!entry)return;
      clearTimeout(entry.readyTimer);entry.worker.terminate();this.workers.delete(name);
      this.failures.push({name,reason});console.warn('Aurora fallback:',name,reason);
      if(name==='background'){
        this.backgroundActive=false;App.el('bgWorkerCanvas')?.remove();App.BgReact.blobs=null;App.BgReact._layerSignature='';
        App.TrailFx._canvas=null;App.TrailFx._ctx=null;
      }
      if(name==='spectrum'){
        this.spectrumActive=false;
        this.sensePort?.postMessage({type:'demand',spectrum:true});
        for(const id of this.specIds)this.replaceCanvas(id);
        Object.assign(App.Spectrogram,this.legacySpec);App.Spectrogram._canvas=null;App.Spectrogram._ctx=null;App.Spectrogram._lastGlassKey=null;App.Spectrogram.ensure();
      }
      if(name==='timeline'){
        this.timelineActive=false;App.progressCanvas=this.replaceCanvas('progressCanvas');App.waveformOverlayCanvas=this.replaceCanvas('waveformOverlayCanvas');
        App.pCtx=App.progressCanvas.getContext('2d');App.wCtx=App.waveformOverlayCanvas.getContext('2d');App.tlState._lastDrawKey=null;App.tlState._waveformDrawCache=null;App.tlResize();
      }
      if(name==='dsp'){
        this.audioActive=false;
        if(this.sensePort){this.sensePort.onmessage=null;this.sensePort.close();this.sensePort=null;}
        // A processor returning true keeps running after its graph is disconnected.
        // Stop its sample loop and close its transferred port before dropping it.
        this.capture?.port.postMessage({type:'dispose'});
        this.capture?.port.close();
        this.capture?.disconnect();this.captureSink?.disconnect();
        if(this.capture){try{App.normGain.disconnect(this.capture);App.bassFilter.disconnect(this.capture);App.midFilter.disconnect(this.capture);App.highFilter.disconnect(this.capture);}catch{}}
        this.capture=null;this.captureSink=null;
      }
      if(name==='analysis'){
        this.analysis=null;
        for(const [id,job] of this.pendingJobs){if(job.worker==='analysis'){clearTimeout(job.timer);this.pendingJobs.delete(id);job.reject(new Error(reason));}}
      }
      if(name==='library'){
        this.library=null;
        for(const [id,job] of this.pendingJobs){if(job.worker==='library'){clearTimeout(job.timer);this.pendingJobs.delete(id);job.reject(new Error(reason));}}
      }
    },
    start(){
      if(typeof Worker!=='undefined'){
        try{this.analysis=this.create('analysis');}catch(e){this.failures.push({name:'analysis',reason:e.message});}
        try{this.library=this.create('library');}catch(e){this.failures.push({name:'library',reason:e.message});}
      }
      if(!App.THREAD_SUPPORT){if(!App.pCtx)App.pCtx=App.progressCanvas.getContext('2d');if(!App.wCtx)App.wCtx=App.waveformOverlayCanvas.getContext('2d');return;}
      const size={...App.stageBox},dpr=App.scenePixelRatio(size.w,size.h);
      try{
        const worker=this.create('background'),canvas=document.createElement('canvas');canvas.id='bgWorkerCanvas';
        canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
        App.el('bgGlow').append(canvas);const offscreen=canvas.transferControlToOffscreen();this.backgroundActive=true;
        worker.postMessage({type:'init',canvas:offscreen,settings: (App.getSceneSettings?.()||App.settings),size,dpr,active:App.VisualRenderState.active},[offscreen]);
      }catch(e){this.fail('background',e.message);}
      this.specIds=['spectrogramCanvas','spectrogramCanvasInner','spectrogramCanvasTimeline'];
      this.legacySpec={ensure:App.Spectrogram.ensure,resetForNewTrack:App.Spectrogram.resetForNewTrack,onLiveFrame:App.Spectrogram.onLiveFrame};
      try{
        const worker=this.create('spectrum');
        const canvases=this.specIds.map(id=>App.el(id).transferControlToOffscreen());this.spectrumActive=true;
        App.Spectrogram.ensure=()=>{};
        App.Spectrogram._canvas=App.el(this.specIds[0]);App.Spectrogram._innerCanvas=App.el(this.specIds[1]);App.Spectrogram._timelineCanvas=App.el(this.specIds[2]);
        App.Spectrogram.resetForNewTrack=()=>{this.send('spectrum',{type:'reset'});this.playback(true);};
        App.Spectrogram.onLiveFrame=(freq,bins,sampleRate)=>{
          if(this.audioActive||this.spectrumBusy)return;
          this.spectrumBusy=true;this.send('spectrum',{type:'spectrum',freq,sampleRate,time:App.audioCtx?.currentTime||0,playing:App.state.isPlaying});
        };
        const layout=this.spectrumLayout();
        worker.postMessage({type:'init',canvases,settings: (App.getSceneSettings?.()||App.settings),layout,active:App.VisualRenderState.active},canvases);
      }catch(e){this.fail('spectrum',e.message);}
      try{
        const worker=this.create('timeline'),layout=this.timelineLayout();
        const canvases=[App.progressCanvas,App.waveformOverlayCanvas].map(c=>c.transferControlToOffscreen());this.timelineActive=true;
        worker.postMessage({type:'init',canvases,settings: (App.getSceneSettings?.()||App.settings),layout,active:App.VisualRenderState.active},canvases);
      }catch(e){this.fail('timeline',e.message);}
      this.staticEffects();
      const schedule=()=>{if(this.layoutScheduled)return;this.layoutScheduled=requestAnimationFrame(()=>{this.layoutScheduled=0;this.layout();this.resizeTimeline();});};
      this.resizeObserver=new ResizeObserver(schedule);
      for(const id of ['stage','sceneContent','controlBar','timelineIsland','progressTrack','playlistPanel'])this.resizeObserver.observe(App.el(id));
      window.addEventListener('resize',schedule,{passive:true});
      App.el('btnPlaylistToggle').addEventListener('click',()=>{schedule();setTimeout(schedule,180);setTimeout(schedule,380);});
      for(const event of ['play','pause','ended','seeking','seeked','loadedmetadata','ratechange'])App.audio.addEventListener(event,()=>{this.playback(event==='loadedmetadata');this.timelineKey='';this.timelineState();});
      App.VisualRenderState.subscribe(active=>{
        for(const name of ['background','spectrum','timeline','dsp'])this.send(name,{type:'active',active});
        this.capture?.port.postMessage({type:'active',active});
        if(active){this.layout();this.timelineKey='';this.timelineState();}
      });
    },
    staticEffects(){
      if(!this.backgroundActive)return;
      if(App.mobileSceneDisabled){App.el('bgGlow').style.opacity='0';App.FxEngine.setBaseOpacity(0);return;}
      App.FxEngine._ensureOverlayNodes();
      App.FxEngine._vignetteEl.style.opacity=String(App.clamp01(App.settings.fxVignette||0));
      App.FxEngine._scanEl.style.opacity=String(App.clamp01(App.settings.fxScanlines||0)*.9);
      App.el('bgGlow').style.opacity='1';App.el('bgGlow').style.filter='';
    },
    spectrumLayout(){
      const rect=(App.el('sceneContent')||App.stage).getBoundingClientRect(),bar=App.el('controlBar').getBoundingClientRect(),tl=App.el('timelineIsland').getBoundingClientRect();
      const pl=App.el('playlistPanel').getBoundingClientRect(),offset=App.settings.specAnchor!=='center'&&App.settings.specPlaylistOffset&&!App.app.classList.contains('playlist-closed');
      const inset=offset?Math.max(0,rect.right-pl.left):0;
      const top=Math.min(bar.top,tl.height?tl.top:bar.top),bottom=Math.max(bar.bottom,tl.bottom);
      const h=Math.max(20,Math.round(App.settings.specHeight),Math.round(bottom-top)),w=Math.max(20,rect.width-inset);
      const layer=App.el('spectrogramLayer');layer.style.top=Math.round((top+bottom)/2-rect.top-h/2)+'px';layer.style.height=h+'px';layer.style.right=Math.round(inset)+'px';
      const inside=!!App.settings.specInsideIsland,on=!!App.settings.specEnabled;
      layer.classList.toggle('show',on&&!inside);App.el('spectrogramCanvasInner').classList.toggle('show',on&&inside);
      App.el('spectrogramCanvasTimeline').classList.toggle('show',on&&inside&&App.settings.specInsideIslandBothPanels!==false);
      const now=App.settings.specAnchor==='center'?w/2:w;
      App.el('spectroPlayhead').style.left=Math.round(now)+'px';App.el('spectroIslandGlow').style.left=Math.round(now)+'px';
      App.el('spectroPlayhead').classList.toggle('show',on&&!inside);
      App.el('spectroIslandGlow').classList.toggle('show',on&&!inside&&App.settings.specGlassMode);
      App.el('spectroIslandGlow').style.opacity=String(Math.max(0,Math.min(2,App.settings.specGlowStrength))*.5);
      App.Spectrogram._applyGlassMode(on);
      for(const id of this.specIds){
        const blur=Math.max(0,App.settings.specSmoothBlur||0)+(inside&&App.settings.specGlassMode?Math.max(0,App.settings.specGlassBlur):0);
        App.el(id).style.filter=`blur(${blur}px) hue-rotate(${Number(App.settings.specHueOffset)||0}deg)`;
      }
      return {dpr:Math.min(2,devicePixelRatio||1),boxes:[{w,h,inset:0},{w:bar.width,h:bar.height,inset:offset?Math.max(0,bar.right-pl.left):0},{w:tl.width,h:tl.height,inset:offset?Math.max(0,tl.right-pl.left):0}]};
    },
    layout(){
      if(this.backgroundActive){
        const size={...App.stageBox},dpr=App.scenePixelRatio(size.w,size.h),key=size.w+'|'+size.h+'|'+dpr;
        if(key!==this.bgLayoutKey){this.bgLayoutKey=key;this.send('background',{type:'resize',size,dpr});}
      }
      if(this.spectrumActive){const layout=this.spectrumLayout(),key=JSON.stringify(layout);if(key!==this.layoutKey){this.layoutKey=key;this.send('spectrum',{type:'resize',...layout});}}
    },
    timelineLayout(){
      const rect=App.progressTrack.getBoundingClientRect(),island=App.el('timelineIsland').getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);
      const mult=Math.max(.1,Math.min(6,App.settings.timelineWaveformHeight??1)),offset=App.settings.timelineWaveformOffset??3;
      const top=14*mult+Math.max(0,offset),height=rect.height+top+Math.max(0,-offset);
      App.progressCanvas.style.width=rect.width+'px';App.waveformOverlayCanvas.style.height=height+'px';App.waveformOverlayCanvas.style.top=-top+'px';
      const canvasMult=App.settings.timelineWaveSymmetry?2*App.CANVAS_HEIGHT_MULT-1:App.CANVAS_HEIGHT_MULT;
      App.progressCanvas.style.height=canvasMult*100+'%';App.progressCanvas.style.bottom=App.settings.timelineWaveSymmetry?-(App.CANVAS_HEIGHT_MULT-1)*100+'%':'0';
      const state={dpr,cachedBoxH:rect.height*canvasMult,cachedTrackH:rect.height||4,wfOverlayOffsetPx:offset,wfOverlayTopExtent:top,wfOverlayTrackH:rect.height,wfOverlayPadLeft:rect.left-island.left,wfOverlayPadRight:island.right-rect.right};
      return {state,progress:{w:Math.round(rect.width*dpr),h:Math.round(rect.height*canvasMult*dpr)},waveform:{w:Math.round(island.width*dpr),h:Math.round(height*dpr)}};
    },
    resizeTimeline(){if(this.timelineActive){const layout=this.timelineLayout(),key=JSON.stringify(layout);if(key!==this.tlLayoutKey){this.tlLayoutKey=key;this.send('timeline',{type:'resize',...layout});}}},
    timelineState(){
      if(!this.timelineActive)return;
      if(this.waveformData!==App.TimelineWaveform.data){this.waveformData=App.TimelineWaveform.data;this.send('timeline',{type:'waveform',data:this.waveformData});}
      if(this.timelineBusy)return;
      // The worker advances playback from its own clock. Send periodic anchors,
      // while pointer, seek, pause and color changes still propagate immediately.
      const playing=!App.audio.paused&&!App.audio.ended;
      const positionKey=playing&&!App.tlState.seeking?Math.floor((App.audio.currentTime||0)*2):Math.round(App.tlState.progress*10000);
      const key=[App.tlState.mouseX,App.tlState.hovering,App.tlState.seeking,positionKey,playing,App.audio.playbackRate,App.audio.duration,App.PlayerColors._lastC1,App.PlayerColors._lastC2].join('|');
      if(key===this.timelineKey)return;this.timelineKey=key;this.timelineBusy=true;
      this.send('timeline',{type:'timeline',state:{mouseX:App.tlState.mouseX,hovering:App.tlState.hovering,seeking:App.tlState.seeking,progress:App.tlState.progress},colors:{_lastC1:App.PlayerColors._lastC1,_lastC2:App.PlayerColors._lastC2},play:{position:App.audio.currentTime||0,duration:App.audio.duration||0,rate:App.audio.playbackRate,playing:!App.audio.paused&&!App.audio.ended}});
      const colorKey=App.PlayerColors._lastC1+'|'+App.PlayerColors._lastC2;
      if(colorKey!==this.spectrumColorKey){this.spectrumColorKey=colorKey;this.send('spectrum',{type:'colors',colors:{_lastC1:App.PlayerColors._lastC1,_lastC2:App.PlayerColors._lastC2}});}
    },
    playback(reset=false){
      const playing=!App.audio.paused&&!App.audio.ended;
      for(const name of ['background','spectrum','dsp'])this.send(name,{type:'playback',playing,reset});
    },
    fallbackSense(){
      if(this.audioActive||!this.backgroundActive||this.senseBusy)return;
      this.senseBusy=true;
      const sense={};for(const key of ['bass','mid','high','loudnessPct','bpm','beatPhase','beatPulse','tempoConfidence'])sense[key]=App.MusicSense.data[key];
      this.send('background',{type:'sense',sense,playing:App.state.isPlaying});
    },
    async initAudio(){
      if(this.audioStarting||this.audioActive||!App.audioCtx?.audioWorklet||typeof AudioWorkletNode==='undefined')return;
      this.audioStarting=true;
      try{
        this.create('dsp');this.send('dsp',{type:'settings',settings: (App.getSceneSettings?.()||App.settings)});
        await App.audioCtx.audioWorklet.addModule('data:text/javascript;charset=utf-8,'+encodeURIComponent(App.WORKER_SOURCES.worklet));
        if(!this.workers.has('dsp'))return;
        this.capture=new AudioWorkletNode(App.audioCtx,'aurora-capture',{numberOfInputs:4,numberOfOutputs:1,outputChannelCount:[1],channelCount:1,channelCountMode:'explicit'});
        this.capture.addEventListener('processorerror',()=>this.fail('dsp','Audio capture processor failed'));
        const inputChannel=new MessageChannel();
        this.capture.port.postMessage({type:'connect',port:inputChannel.port1},[inputChannel.port1]);
        this.capture.port.postMessage({type:'settings',fftSize:App.FFT_SIZES[App.settings.fftIdx]||2048});
        this.send('dsp',{type:'connect',port:inputChannel.port2},[inputChannel.port2]);
        for(const name of ['background','spectrum']){
          if(!this.workers.has(name))continue;
          const channel=new MessageChannel();this.send(name,{type:'sense-port',port:channel.port1},[channel.port1]);
          this.send('dsp',{type:'sink',port:channel.port2,spectrum:name==='spectrum'},[channel.port2]);
        }
        const ui=new MessageChannel();
        ui.port1.onmessage=({data:m})=>{
          Object.assign(App.MusicSense.data,m.sense);
          if(!this.spectrumActive&&m.freq&&m.playing)App.Spectrogram.onLiveFrame(m.freq,m.freq.length,m.sampleRate,m.freq.length*2);
          ui.port1.postMessage('ack');
        };
        ui.port1.start();this.sensePort=ui.port1;this.send('dsp',{type:'sink',port:ui.port2,spectrum:!this.spectrumActive},[ui.port2]);
        App.normGain.connect(this.capture,0,0);App.bassFilter.connect(this.capture,0,1);App.midFilter.connect(this.capture,0,2);App.highFilter.connect(this.capture,0,3);
        this.captureSink=App.audioCtx.createGain();this.captureSink.gain.value=0;this.capture.connect(this.captureSink);this.captureSink.connect(App.audioCtx.destination);
        this.audioActive=true;App.connectMusicVisualizerAudio?.();this.playback(true);
        this.capture.port.postMessage({type:'active',active:App.VisualRenderState.active});this.send('dsp',{type:'active',active:App.VisualRenderState.active});
      }catch(e){this.fail('dsp',e.message);}finally{this.audioStarting=false;}
    },
    analyze(channels,sampleRate,weightRaw=false){
      const id=this.nextJob++;
      return new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>this.fail('analysis','Analysis worker timeout'),120000);
        this.pendingJobs.set(id,{resolve,reject,timer,worker:'analysis'});
        try{this.analysis.postMessage({id,channels,sampleRate,weightRaw,settings:{normalize:App.settings.normalize,targetLufs:App.settings.targetLufs,timelineWaveformSamplesPerSec:App.settings.timelineWaveformSamplesPerSec}},channels.map(c=>c.buffer));}
        catch(e){clearTimeout(timer);this.pendingJobs.delete(id);reject(e);}
      });
    },
    libraryRequest(type,payload){
      const id=this.nextJob++;
      return new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>this.fail('library','Library worker timeout'),15000);
        this.pendingJobs.set(id,{resolve,reject,timer,worker:'library'});
        try{this.library.postMessage({type,id,...payload});}
        catch(e){clearTimeout(timer);this.pendingJobs.delete(id);reject(e);}
      });
    },
    async parseFiles(names){
      try{return await this.libraryRequest('parse',{names,smart:App.settings.smartTitleParsing});}
      catch{return names.map(App.parseNameArtist);}
    },
    async findTracks(query,version){
      if(this.libraryIndexVersion!==version){
        this.libraryIndexVersion=version;
        this.send('library',{type:'index',tracks:App.state.tracks.map(t=>({name:t.name,artist:t.artist,filename:t.file.name}))});
      }
      try{return await this.libraryRequest('search',{query});}
      catch{const tokens=App.searchTokens(query);return App.state.tracks.flatMap((t,i)=>App.matchesTrack(t,tokens)?[i]:[]);}
    },
    diagnostics(){return {workers:[...this.workers.keys()],audioWorklet:this.audioActive,metrics:this.metrics,failures:this.failures,blobCount:this.blobCount||0};}
  };
App.Threads.start();
window.AuroraDiagnostics={snapshot:()=>App.Threads.diagnostics()};
  }, []);
})(window.Aurora);

// ── Application startup ──
window.Aurora.boot = function(){
window.Aurora.start([
  "core/settings",
  "storage/profiles",
  "storage/favorites",
  "storage/play-stats",
  "core/state",
  "ui/render-lifecycle",
  "ui/scroll-performance",
  "ui/layout",
  "audio/audio-graph",
  "audio/normalization",
  "ui/normalization",
  "audio/bulk-analysis",
  "audio/tempo-detection",
  "audio/music-sense",
  "ui/music-readouts",
  "ui/mapping-readouts",
  "audio/signal-registry",
  "background/curve-math",
  "background/mapping-engine",
  "background/shapes",
  "background/motion-paths",
  "background/effects",
  "background/trails-sparkles",
  "background/renderer",
  "background/player-colors",
  "spectrum/renderer",
  "debug/performance",
  "background/render-loop",
  "ui/settings-controls",
  "ui/appearance",
  "ui/effect-controls",
  "ui/settings-reset",
  "storage/import-export",
  "ui/color-swatches",
  "ui/background-layers",
  "ui/mapping-editor",
  "ui/curve-editor",
  "library/file-picker",
  "library/artist-detection",
  "library/import-tracks",
  "library/drag-drop",
  "playlist/virtual-list",
  "playlist/favorites-ui",
  "ui/track-info",
  "player/playback",
  "player/playback-order",
  "timeline/waveform",
  "timeline/canvas-layout",
  "timeline/renderer",
  "timeline/interaction",
  "player/volume",
  "threading/manager",
  "playlist/sorting",
  "ui/interactions",
  "ui/settings-navigation",
  "stage/music-visualizers","stage/scene-effects",
  "ui/mobile",
  "ui/tooltips",
  "ui/language","ui/library-tools","player/experience","storage/library-session",
  "debug/playback-benchmark"
]);

};
