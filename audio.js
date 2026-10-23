/* audio.js — Audio graf, MusicSense, tempo, normalizace LUFS a analytické profily. */

// ── storage/profiles ──
(function(App){
  App.define("storage/profiles", function initialize(){
App.PROFILES_KEY = 'musicviz-lufs-profiles-v1';
App.ProfileStore = {
    _cache: null,
    sanitize(value){
      if(typeof value==='number')return Number.isFinite(value)?{lufs:value}:null;
      if(!value||typeof value!=='object'||Array.isArray(value))return null;
      const entry={};
      for(const key of ['lufs','analyzedAt','duration','playCount','lastPlayedAt'])if(Number.isFinite(value[key])&&(key==='lufs'||value[key]>=0))entry[key]=value[key];
      if(value.liked===true)entry.liked=true;
      if(Array.isArray(value.waveform)&&value.waveform.length<=16384&&value.waveform.every(Number.isFinite))entry.waveform=value.waveform;
      return Object.keys(entry).length?entry:null;
    },
    _load(){
      if(this._cache) return this._cache;
      this._cache = new Map();
      try{
        const raw = localStorage.getItem(App.PROFILES_KEY);
        if(raw){
          const parsed = JSON.parse(raw);
          if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))Object.keys(parsed).forEach(name=>{const entry=this.sanitize(parsed[name]);if(entry)this._cache.set(name,entry);});
        }
      } catch(e){  }
      this._trimWaveforms();
      return this._cache;
    },
    _trimWaveforms(){
      // Keep lightweight LUFS/favorites metadata, but bound optional sample arrays.
      let count=0,samples=0;
      for(const entry of [...this._cache.values()].reverse()){
        if(!Array.isArray(entry?.waveform))continue;
        if(App.settings.cacheWaveform===false||count>=16||samples+entry.waveform.length>262144)delete entry.waveform;
        else{count++;samples+=entry.waveform.length;}
      }
    },
    _persistTimer: null,
    _persist(){
      if(this._persistTimer) clearTimeout(this._persistTimer);
      this._persistTimer = setTimeout(()=> this._flushPersist(), 300);
    },
    _flushPersist(){
      this._persistTimer = null;
      const obj=Object.create(null);
      this._load().forEach((v,k)=>{obj[k]=v;});
      try{
        localStorage.setItem(App.PROFILES_KEY, JSON.stringify(obj));
        this._writeFailed=false;
      } catch(e){
        // Optional waveforms can fill localStorage; preserve favorites, statistics and LUFS first.
        for(const key of Object.keys(obj)){const {waveform,...metadata}=obj[key];obj[key]=metadata;}
        try{localStorage.setItem(App.PROFILES_KEY,JSON.stringify(obj));this._writeFailed=false;}
        catch{
          if(!this._writeFailed)App.notify?.('Profily a oblíbené skladby se nepodařilo uložit. Exportujte je v Nastavení → Data.',{error:true});
          this._writeFailed=true;
        }
      }
    },
    get(filename){
      const entry = this._load().get(filename);
      return Number.isFinite(entry?.lufs) ? entry.lufs : undefined;
    },
    has(filename){
      return this.get(filename) !== undefined;
    },
    set(filename, lufs, waveform){
      const existing = this._load().get(filename);
      const entry = { lufs, analyzedAt: Date.now() };
      if(existing && existing.liked) entry.liked = true;
      if(existing && typeof existing.duration === 'number') entry.duration = existing.duration;
      if(existing && typeof existing.playCount === 'number') entry.playCount = existing.playCount;
      if(existing && typeof existing.lastPlayedAt === 'number') entry.lastPlayedAt = existing.lastPlayedAt;
      if(App.settings.cacheWaveform !== false){
        if(Array.isArray(waveform) && waveform.length) entry.waveform = waveform;
        else if(existing && Array.isArray(existing.waveform)) entry.waveform = existing.waveform;
      } else if(existing && Array.isArray(existing.waveform)){
        delete existing.waveform;
      }
      this._load().delete(filename);
      this._cache.set(filename, entry);
      this._trimWaveforms();
      this._persist();
    },
    getWaveform(filename){
      if(App.settings.cacheWaveform===false){this._load();this._trimWaveforms();return undefined;}
      const entry = this._load().get(filename);
      if(entry){this._cache.delete(filename);this._cache.set(filename,entry);}
      return entry && Array.isArray(entry.waveform) ? entry.waveform : undefined;
    },
    count(){
      let count=0;for(const entry of this._load().values())if(Number.isFinite(entry?.lufs))count++;
      return count;
    },
    exportJson(){
      const obj = Object.create(null);
      this._load().forEach((v,k)=>{ obj[k]=v; });
      return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), profiles: obj }, null, 2);
    },
    importJson(jsonText){
      const parsed = JSON.parse(jsonText);
      const profiles = parsed && parsed.profiles ? parsed.profiles : parsed;
      if(!profiles || typeof profiles !== 'object'||Array.isArray(profiles)) throw new Error('Neplatný formát souboru');
      let count = 0;
      Object.keys(profiles).forEach(name=>{
        const entry = this.sanitize(profiles[name]);
        if(entry){
          const existing = this._load().get(name);
          const newEntry = { ...existing,...entry };
          if(Number.isFinite(entry.lufs))newEntry.analyzedAt=entry.analyzedAt||Date.now();
          if(entry && entry.liked) newEntry.liked = true;
          else if(existing && existing.liked) newEntry.liked = true;
          if(entry && typeof entry.duration === 'number') newEntry.duration = entry.duration;
          else if(existing && typeof existing.duration === 'number') newEntry.duration = existing.duration;
          if(entry && typeof entry.playCount === 'number') newEntry.playCount = entry.playCount;
          else if(existing && typeof existing.playCount === 'number') newEntry.playCount = existing.playCount;
          if(entry && typeof entry.lastPlayedAt === 'number') newEntry.lastPlayedAt = entry.lastPlayedAt;
          else if(existing && typeof existing.lastPlayedAt === 'number') newEntry.lastPlayedAt = existing.lastPlayedAt;
          if(App.settings.cacheWaveform !== false){
            if(entry && Array.isArray(entry.waveform)) newEntry.waveform = entry.waveform;
            else if(existing && Array.isArray(existing.waveform)) newEntry.waveform = existing.waveform;
          }
          this._load().set(name, newEntry);
          count++;
        }
      });
      this._trimWaveforms();
      App.favoritesVersion=(App.favoritesVersion||0)+1;
      this._persist();
      return count;
    }
  };
  }, ["PROFILES_KEY","ProfileStore"]);
})(window.Aurora);

// ── audio/audio-graph ──
(function(App){
App.initAudioGraph = function initAudioGraph(){
    if(App.audioCtx) return;
    App.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    App.sourceNode = App.audioCtx.createMediaElementSource(App.audio);
    App.normGain = App.audioCtx.createGain();
    App.normGain.gain.value = 1;
    App.analyserNode = App.audioCtx.createAnalyser();
    App.analyserNode.fftSize = App.FFT_SIZES[App.settings.fftIdx];
    App.analyserNode.smoothingTimeConstant = App.settings.smoothing;
    App.volumeGain = App.audioCtx.createGain();
    App.volumeGain.gain.value = App.pendingVolume;
    App.sourceNode.connect(App.normGain);
    App.normGain.connect(App.analyserNode);
    App.analyserNode.connect(App.volumeGain);
    App.volumeGain.connect(App.audioCtx.destination);
    App.bassFilter = App.audioCtx.createBiquadFilter();
    App.bassFilter.type = 'lowpass';
    App.bassFilter.frequency.value = 250;
    App.bassFilter.Q.value = 0.707;
    App.midFilter = App.audioCtx.createBiquadFilter();
    App.midFilter.type = 'bandpass';
    App.midFilter.frequency.value = Math.sqrt(250*4000);
    App.midFilter.Q.value = 0.6;
    App.highFilter = App.audioCtx.createBiquadFilter();
    App.highFilter.type = 'highpass';
    App.highFilter.frequency.value = 4000;
    App.highFilter.Q.value = 0.707;
    App.bassAnalyser = App.audioCtx.createAnalyser();
    App.midAnalyser = App.audioCtx.createAnalyser();
    App.highAnalyser = App.audioCtx.createAnalyser();
    [App.bassAnalyser, App.midAnalyser, App.highAnalyser].forEach(a=>{
      a.fftSize = 1024;
      a.smoothingTimeConstant = 0;
    });
    App.normGain.connect(App.bassFilter); App.bassFilter.connect(App.bassAnalyser);
    App.normGain.connect(App.midFilter);  App.midFilter.connect(App.midAnalyser);
    App.normGain.connect(App.highFilter); App.highFilter.connect(App.highAnalyser);
    App.audio.volume = 1;
    App.MusicSense.init(App.analyserNode.frequencyBinCount);
    if(App.Threads) App.Threads.initAudio();
  };
App.applyAnalyserParams = function applyAnalyserParams(){
    if(!App.analyserNode) return;
    App.analyserNode.fftSize = App.FFT_SIZES[App.settings.fftIdx];
    App.analyserNode.smoothingTimeConstant = App.settings.smoothing;
  };
  App.define("audio/audio-graph", function initialize(){
App.FFT_SIZES = [512, 1024, 2048, 4096, 8192];
App.audioCtx = undefined;
App.analyserNode = undefined;
App.sourceNode = undefined;
App.normGain = undefined;
App.volumeGain = undefined;
App.DEFAULT_VOLUME = 0.2;
App.pendingVolume = App.DEFAULT_VOLUME;
App.bassFilter = undefined;
App.midFilter = undefined;
App.highFilter = undefined;
App.bassAnalyser = undefined;
App.midAnalyser = undefined;
App.highAnalyser = undefined;
  }, ["FFT_SIZES","audioCtx","analyserNode","sourceNode","normGain","volumeGain","DEFAULT_VOLUME","pendingVolume","bassFilter","midFilter","highFilter","bassAnalyser","midAnalyser","highAnalyser","initAudioGraph","applyAnalyserParams"]);
})(window.Aurora);

// ── audio/normalization ──
(function(App){
App.createKWeightingFilters = function createKWeightingFilters(ctx){
    const preFilter = ctx.createBiquadFilter();
    preFilter.type = 'highshelf';
    preFilter.frequency.value = 1500;
    preFilter.gain.value = 4;
    const highPass = ctx.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.value = 38;
    highPass.Q.value = 0.5;
    preFilter.connect(highPass);
    return { input: preFilter, output: highPass };
  };
App.measureIntegratedLufs = function measureIntegratedLufs(file, onProgress, isNeeded = ()=>true){
    let job = App.analysisJobs.get(file);
    if(!job){
      const listeners = new Set();
      const check = ()=>{
        if(![...listeners].some(client=>client.isNeeded())){
          const error=new Error('Analysis no longer needed');error.name='AbortError';throw error;
        }
      };
      job = {listeners};
      job.promise = App.analysisQueue.then(()=>{check();return App.measureIntegratedLufsOnce(file, pct=>listeners.forEach(client=>{if(client.isNeeded())client.onProgress?.(pct);}), check);});
      // The queue must not retain the previous result and its waveform.
      App.analysisQueue = job.promise.then(()=>{},()=>{});
      App.analysisJobs.set(file,job);
      job.promise.finally(()=>{listeners.clear();App.analysisJobs.delete(file);}).catch(()=>{});
    }
    job.listeners.add({onProgress,isNeeded});
    return job.promise;
  };
App.measureIntegratedLufsOnce = async function measureIntegratedLufsOnce(file, onProgress, check = ()=>{}){
    check();
    onProgress && onProgress(5);
    let arrayBuffer = await file.arrayBuffer();
    check();
    onProgress && onProgress(20);
    const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    // Decode without opening another real-time audio device/context per song.
    let tmpCtx = new OfflineCtx(1,1,App.audioCtx?.sampleRate||48000);
    let decoded;
    try{
      decoded = await tmpCtx.decodeAudioData(arrayBuffer);
    } finally {
      arrayBuffer = null;
      tmpCtx = null;
    }
    check();
    onProgress && onProgress(45);
    const sampleRate = decoded.sampleRate;
    if(App.Threads?.analysis){
      // Weight in-place on the analysis worker: no full-track offline output.
      const channels=[];
      for(let c=0;c<decoded.numberOfChannels;c++){
        const data=decoded.getChannelData(c),copy=new Float32Array(data.length);
        // Bound each main-thread copy; a long recording must not monopolize UI.
        for(let offset=0;offset<data.length;offset+=262144){
          copy.set(data.subarray(offset,Math.min(data.length,offset+262144)),offset);
          await new Promise(resolve=>setTimeout(resolve,0));check();
        }
        channels.push(copy);
      }
      decoded=null;check();onProgress&&onProgress(75);
      const result=await App.Threads.analyze(channels,sampleRate,true);
      check();onProgress&&onProgress(100);return result;
    }
    let offline = new OfflineCtx(decoded.numberOfChannels, decoded.length, sampleRate);
    let src = offline.createBufferSource();
    src.buffer = decoded;
    let { input, output } = App.createKWeightingFilters(offline);
    src.connect(input);
    output.connect(offline.destination);
    src.start();
    let rendered;
    try{rendered = await offline.startRendering();}
    finally{src.disconnect();src.buffer = null;decoded = null;input.disconnect();output.disconnect();src=null;input=null;output=null;offline=null;}
    check();
    onProgress && onProgress(75);
    const blockSize = Math.floor(sampleRate * 0.4);
    const hop = Math.floor(blockSize * 0.25);
    const channels = [];
    for(let c=0;c<rendered.numberOfChannels;c++) channels.push(rendered.getChannelData(c));
    const numBlocks = Math.max(0, Math.floor((rendered.length - blockSize) / hop) + 1);
    const blockLoudness = [];
    for(let b=0; b<numBlocks; b++){
      if(b%32===0){await new Promise(resolve=>setTimeout(resolve,0));check();}
      const start = b*hop;
      let sumSquares = 0;
      for(let c=0;c<channels.length;c++){
        const data = channels[c];
        let s = 0;
        for(let i=start;i<start+blockSize;i+=4){
          const v = data[i] || 0;
          s += v*v;
        }
        sumSquares += s / (blockSize/4);
      }
      const meanSquare = sumSquares / channels.length;
      const loudness = -0.691 + 10*Math.log10(meanSquare + 1e-12);
      blockLoudness.push(loudness);
    }
    onProgress && onProgress(95);
    let integrated;
    if(!blockLoudness.length){
      integrated = -23;
    } else {
      const absGated = blockLoudness.filter(l => l > -70);
      if(!absGated.length){
        integrated = -23;
      } else {
        const meanAbs = absGated.reduce((a,b)=>a+b,0)/absGated.length;
        const relThresh = meanAbs - 10;
        const relGated = absGated.filter(l => l > relThresh);
        const finalSet = relGated.length ? relGated : absGated;
        integrated = finalSet.reduce((a,b)=>a+b,0)/finalSet.length;
      }
    }
    const normDiffDb = App.settings.targetLufs - integrated;
    const normClampedDb = Math.max(-24, Math.min(24, normDiffDb));
    const normLinearGain = App.settings.normalize ? Math.pow(10, normClampedDb/20) : 1;
    const normGainSq = normLinearGain * normLinearGain;
    const samplesPerSec = Math.max(0.2, Math.min(8, typeof App.settings.timelineWaveformSamplesPerSec === 'number' ? App.settings.timelineWaveformSamplesPerSec : 1));
    const secSamples = Math.max(1, Math.round((rendered.duration || (rendered.length/sampleRate)) * samplesPerSec));
    const secLen = Math.max(1, Math.floor(rendered.length / secSamples));
    const waveformDb = new Array(secSamples);
    for(let s=0; s<secSamples; s++){
      if(s%128===0){await new Promise(resolve=>setTimeout(resolve,0));check();}
      const start = s*secLen;
      const end = Math.min(rendered.length, start+secLen);
      let sumSquares = 0;
      let n = 0;
      for(let c=0;c<channels.length;c++){
        const data = channels[c];
        let sq = 0;
        for(let i=start;i<end;i+=8){ const v = data[i]||0; sq += v*v; n++; }
        sumSquares += sq;
      }
      const meanSquare = (n>0 ? sumSquares/n : 0) * normGainSq;
      waveformDb[s] = -0.691 + 10*Math.log10(meanSquare + 1e-12);
    }
    onProgress && onProgress(100);
    return { lufs: integrated, waveformDb };
  };
App.buildTimelineWaveform = function buildTimelineWaveform(waveformDb){
    if(!waveformDb || !waveformDb.length) return [];
    const floorDb = -50, ceilDb = -8;
    const span = Math.max(1e-6, ceilDb - floorDb);
    const norm = waveformDb.map(db => Math.max(0, Math.min(1, (db - floorDb)/span)));
    const radius = Math.max(1, Math.min(3, Math.round(norm.length/60)));
    const smoothed = new Array(norm.length);
    for(let i=0;i<norm.length;i++){
      let sum=0, cnt=0;
      for(let k=-radius;k<=radius;k++){
        const idx = i+k;
        if(idx>=0 && idx<norm.length){ sum+=norm[idx]; cnt++; }
      }
      smoothed[i] = Math.round((sum/cnt)*1000)/1000;
    }
    return smoothed;
  };
App.analyzeTrack = async function analyzeTrack(track, onProgress, isNeeded = ()=>true){
    const key = App.trackKey(track);
    const cached = App.ProfileStore.get(key);
    if(cached !== undefined){
      onProgress && onProgress(100);
      return cached;
    }
    const result = await App.measureIntegratedLufs(track.file, onProgress, isNeeded);
    if(!isNeeded()){const error=new Error('Analysis no longer needed');error.name='AbortError';throw error;}
    const lufs = result.lufs;
    const waveform = App.buildTimelineWaveform(result.waveformDb);
    App.ProfileStore.set(key, lufs, waveform);
    App.TimelineWaveform.onTrackAnalyzed(track, waveform);
    if(App.TimelineWaveform._computing === key) App.TimelineWaveform._computing = null;
    return lufs;
  };
App.applyNormalizationForTrack = async function applyNormalizationForTrack(index, onProgress){
    if(!App.settings.normalize){
      if(App.normGain) App.normGain.gain.setTargetAtTime(1, App.audioCtx.currentTime, 0.05);
      return;
    }
    const track = App.state.tracks[index];
    if(!track) return;
    const generation=App.playbackGeneration;
    const isNeeded=()=>App.settings.normalize&&App.playbackGeneration===generation&&App.state.tracks[App.state.currentIndex]===track;
    try{
      const lufs = await App.analyzeTrack(track, onProgress, isNeeded);
      if(isNeeded()){
        App.setGainFromLufs(lufs);
      }
      App.renderTrackList();
      App.updateProfileCount();
    } catch(err){
      if(err.name==='AbortError')return;
      console.warn('Normalizace selhala:', err);
    }
  };
App.setGainFromLufs = function setGainFromLufs(measuredLufs){
    if(!App.normGain || !Number.isFinite(measuredLufs)) return;
    const diffDb = App.settings.targetLufs - measuredLufs;
    const clampedDb = Math.max(-24, Math.min(24, diffDb));
    const linearGain = Math.pow(10, clampedDb/20);
    App.normGain.gain.setTargetAtTime(linearGain, App.audioCtx.currentTime, 0.08);
  };
  App.define("audio/normalization", function initialize(){
App.analysisJobs = new WeakMap();
App.analysisQueue = Promise.resolve();
  }, ["createKWeightingFilters","analysisJobs","analysisQueue","measureIntegratedLufs","measureIntegratedLufsOnce","buildTimelineWaveform","analyzeTrack","applyNormalizationForTrack","setGainFromLufs"]);
})(window.Aurora);

// ── ui/normalization ──
(function(App){
App.updateProfileCount = function updateProfileCount(){
    const elCount = App.el('profileCount');
    if(elCount) elCount.textContent = App.ProfileStore.count();
  };
App.showNormBadge = function showNormBadge(text){
    App.el('normBadgeText').textContent = text;
    App.el('normBadge').classList.add('show');
  };
App.hideNormBadge = function hideNormBadge(){
    App.el('normBadge').classList.remove('show');
  };
App.showNormDetail = function showNormDetail(visible){
    App.el('normDetail').classList.toggle('show', visible);
  };
  App.define("ui/normalization", function initialize(){
  }, ["updateProfileCount","showNormBadge","hideNormBadge","showNormDetail"]);
})(window.Aurora);

// ── audio/bulk-analysis ──
(function(App){
App.setNormDetailPct = function setNormDetailPct(pct){
    App.el('normDetailFill').style.width = pct + '%';
    App.el('normDetailPct').textContent = Math.round(pct) + '%';
  };
  App.define("audio/bulk-analysis", function initialize(){
App.BulkAnalyzer = {
    running: false,
    stopRequested: false,
    CONCURRENCY: 3,
    async start(){
      if(this.running) return;
      const pending = App.state.tracks.filter(t => !App.ProfileStore.has(App.trackKey(t)));
      if(!pending.length){
        this._flashLabel('Vše už je analyzováno');
        return;
      }
      this.running = true;
      this.stopRequested = false;
      const total = pending.length;
      let done = 0;
      let failed = 0;
      this._setUIRunning(true);
      this._updateProgress(done, total);
      let nextIdx = 0;
      const worker = async () => {
        while(true){
          if(this.stopRequested) return;
          const myIdx = nextIdx++;
          if(myIdx >= pending.length) return;
          const track = pending[myIdx];
          try{
            await App.analyzeTrack(track, null, ()=>!this.stopRequested);
          } catch(err){
            if(err.name==='AbortError'&&this.stopRequested)return;
            failed++;
            console.warn('Bulk analýza selhala pro', track.file.name, err);
          }
          done++;
          this._updateProgress(done, total);
          App.renderTrackList();
          App.updateProfileCount();
        }
      };
      const workers = [];
      for(let i=0;i<this.CONCURRENCY;i++) workers.push(worker());
      await Promise.all(workers);
      this.running = false;
      this._setUIRunning(false);
      if(this.stopRequested){
        this._flashLabel(`Zastaveno (${done}/${total} hotovo)`);
      } else {
        this._flashLabel(failed ? `Hotovo, ${failed} chyb` : 'Hotovo');
      }
      App.renderTrackList();
      App.updateProfileCount();
    },
    stop(){
      if(!this.running) return;
      this.stopRequested = true;
    },
    _setUIRunning(isRunning){
      const btn = App.el('bulkAnalyzeBtn');
      const progress = App.el('bulkAnalyzeProgress');
      btn.classList.toggle('running', isRunning);
      progress.classList.toggle('show', isRunning);
      if(isRunning){
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="1"/></svg><span id="bulkAnalyzeBtnLabel">Zastavit analýzu</span>';
      } else {
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10M18 20V4M6 20v-4"/></svg><span id="bulkAnalyzeBtnLabel">Analyzovat vše</span>';
      }
    },
    _updateProgress(done, total){
      App.el('bulkAnalyzeCount').textContent = `${done} / ${total}`;
      App.el('bulkAnalyzeStatus').textContent = 'Analyzuji…';
      const pct = total ? (done/total*100) : 0;
      App.el('bulkAnalyzeFill').style.width = pct + '%';
    },
    _flashLabel(text){
      const status = App.el('bulkAnalyzeStatus');
      const progress = App.el('bulkAnalyzeProgress');
      progress.classList.add('show');
      status.textContent = text;
      setTimeout(()=>{ progress.classList.remove('show'); }, 2600);
    }
  };
App.el('bulkAnalyzeBtn').addEventListener('click', ()=>{
    if(App.BulkAnalyzer.running) App.BulkAnalyzer.stop();
    else {
      App.initAudioGraph();
      App.BulkAnalyzer.start();
    }
  });
  }, ["BulkAnalyzer","setNormDetailPct"]);
})(window.Aurora);

// ── audio/tempo-detection ──
(function(App){
  App.define("audio/tempo-detection", function initialize(){
App.TempoTracker = {
    SAMPLE_RATE: 50,
    BUFFER_SEC: 6,
    MIN_BPM: 50,
    MAX_BPM: 200,
    PREFERRED_BPM: 120,
    PREFERRED_WIDTH: 55,
    BAND_WEIGHTS: { bass: 1.0, mid: 0.55, high: 0.35 },
    _buf: null,
    _bufLen: 0,
    _writeIdx: 0,
    _filled: 0,
    _accumTime: 0,
    _flux: 0,
    _fluxFrames: 0,
    _prevBass: null, _prevMid: null, _prevHigh: null,
    _runningFluxAvg: 0,
    _candidateBpm: 0,
    _candidateRun: 0,
    _lockedBpm: 0,
    _displayBpm: 0,
    _lastAnalysisTime: 0,
    _confidence: 0,
    _periodSec: 0,
    _phaseSec: 0,
    _phaseLocked: false,
    _lastPhaseSearchTime: 0,
    _beatPulse: 0,
    reset(){
      this._bufLen = Math.round(this.SAMPLE_RATE * this.BUFFER_SEC);
      this._buf = new Float32Array(this._bufLen);
      this._writeIdx = 0;
      this._filled = 0;
      this._accumTime = 0;
      this._flux = 0;
      this._fluxFrames = 0;
      this._prevBass = null; this._prevMid = null; this._prevHigh = null;
      this._runningFluxAvg = 0;
      this._candidateBpm = 0;
      this._candidateRun = 0;
      this._lockedBpm = 0;
      this._displayBpm = this.FALLBACK_BPM;
      this._lastAnalysisTime = 0;
      this._confidence = 0;
      this._periodSec = 60/this.FALLBACK_BPM;
      this._phaseSec = 0;
      this._phaseLocked = false;
      this._lastPhaseSearchTime = 0;
      this._beatPulse = 0;
    },
    _bandFlux(analyser, prevRef, scratchRef){
      if(!analyser) return 0;
      const bins = analyser.frequencyBinCount;
      if(!prevRef.buf || prevRef.buf.length !== bins) prevRef.buf = new Uint8Array(bins);
      if(!scratchRef.buf || scratchRef.buf.length !== bins) scratchRef.buf = new Uint8Array(bins);
      const spec = scratchRef.buf;
      analyser.getByteFrequencyData(spec);
      let flux = 0;
      const prev = prevRef.buf;
      for(let i=0;i<bins;i++){
        const diff = spec[i] - prev[i];
        if(diff > 0) flux += diff;
      }
      prevRef.buf.set(spec);
      return flux / bins;
    },
    update(dtSec, bassAnalyser, sr, midAnalyser, highAnalyser){
      if(!this._buf) this.reset();
      if(!this._prevBass) this._prevBass = {buf:null};
      if(!this._prevMid) this._prevMid = {buf:null};
      if(!this._prevHigh) this._prevHigh = {buf:null};
      if(!this._scratchBass) this._scratchBass = {buf:null};
      if(!this._scratchMid) this._scratchMid = {buf:null};
      if(!this._scratchHigh) this._scratchHigh = {buf:null};
      const w = this.BAND_WEIGHTS;
      const bassFlux = this._bandFlux(bassAnalyser, this._prevBass, this._scratchBass);
      const midFlux  = this._bandFlux(midAnalyser,  this._prevMid,  this._scratchMid);
      const highFlux = this._bandFlux(highAnalyser, this._prevHigh, this._scratchHigh);
      const frameFlux = bassFlux*w.bass + midFlux*w.mid + highFlux*w.high;
      this._flux += frameFlux;
      this._fluxFrames++;
      const dt = Math.max(0, Math.min(0.25, dtSec));
      this._accumTime += dt;
      const samplePeriod = 1/this.SAMPLE_RATE;
      let pushedAny = false;
      let lastNormalized = 0;
      while(this._accumTime >= samplePeriod){
        this._accumTime -= samplePeriod;
        const avgFrameFlux = this._fluxFrames > 0 ? this._flux/this._fluxFrames : 0;
        this._flux = 0;
        this._fluxFrames = 0;
        this._runningFluxAvg = this._runningFluxAvg*0.98 + avgFrameFlux*0.02;
        const normalized = avgFrameFlux - this._runningFluxAvg;
        lastNormalized = normalized;
        this._buf[this._writeIdx] = normalized;
        this._writeIdx = (this._writeIdx + 1) % this._bufLen;
        this._filled = Math.min(this._bufLen, this._filled + 1);
        pushedAny = true;
      }
      if(this._periodSec > 0){
        this._phaseSec += dt;
        if(pushedAny && lastNormalized > this._runningFluxAvg*0.5 + 1e-6){
          const nearestBeatDist = Math.min(
            this._phaseSec % this._periodSec,
            this._periodSec - (this._phaseSec % this._periodSec)
          );
          if(nearestBeatDist < this._periodSec*0.18){
            const mod = this._phaseSec % this._periodSec;
            const toZero = mod < this._periodSec/2 ? -mod : (this._periodSec - mod);
            this._phaseSec += toZero * 0.35;
          }
        }
        this._phaseSec = ((this._phaseSec % this._periodSec) + this._periodSec) % this._periodSec;
        const phaseFrac = this._phaseSec / this._periodSec;
        const target = Math.exp(-phaseFrac * 10);
        const k = target > this._beatPulse ? 1 : (1 - Math.exp(-dt/0.12));
        this._beatPulse += (target - this._beatPulse) * (target > this._beatPulse ? 1 : k);
      } else {
        this._beatPulse *= 0.9;
      }
      const minSamplesNeeded = Math.ceil(this.SAMPLE_RATE * (60/this.MIN_BPM) * 2);
      if(pushedAny && this._filled >= minSamplesNeeded){
        const nowSec = performance.now()/1000;
        if(nowSec - this._lastAnalysisTime >= 0.4){
          this._lastAnalysisTime = nowSec;
          this._analyze();
        }
      }
    },
    _orderedBuffer(){
      const n = this._filled;
      const out = new Float32Array(n);
      const start = (this._writeIdx - n + this._bufLen*4) % this._bufLen;
      for(let i=0;i<n;i++){
        out[i] = this._buf[(start+i) % this._bufLen];
      }
      return out;
    },
    _analyze(){
      const buf = this._orderedBuffer();
      const n = buf.length;
      const minLag = Math.max(1, Math.round(this.SAMPLE_RATE * 60/this.MAX_BPM));
      const maxLag = Math.min(n-1, Math.round(this.SAMPLE_RATE * 60/this.MIN_BPM));
      if(maxLag <= minLag) return;
      let bestLag = -1, bestScore = -Infinity;
      let scoreSum = 0, scoreSumSq = 0;
      const scores = new Float32Array(maxLag - minLag + 1);
      for(let lag=minLag; lag<=maxLag; lag++){
        let sum = 0;
        const count = n - lag;
        for(let i=0;i<count;i++){
          sum += buf[i]*buf[i+lag];
        }
        let score = count > 0 ? sum/count : 0;
        const bpmAtLag = 60 / (lag/this.SAMPLE_RATE);
        const distFromPref = (bpmAtLag - this.PREFERRED_BPM) / this.PREFERRED_WIDTH;
        const prefWeight = Math.exp(-0.5*distFromPref*distFromPref);
        score *= (0.7 + 0.3*prefWeight);
        scores[lag-minLag] = score;
        scoreSum += score;
        scoreSumSq += score*score;
        if(score > bestScore){ bestScore = score; bestLag = lag; }
      }
      if(bestLag < 0) return;
      const count = scores.length;
      const mean = scoreSum / count;
      const variance = Math.max(1e-9, scoreSumSq/count - mean*mean);
      const stdDev = Math.sqrt(variance);
      const zScore = (bestScore - mean) / stdDev;
      const confidence = Math.max(0, Math.min(1, zScore / 6));
      const idx = bestLag - minLag;
      let refinedLag = bestLag;
      if(idx > 0 && idx < scores.length-1){
        const s0 = scores[idx-1], s1 = scores[idx], s2 = scores[idx+1];
        const denom = (s0 - 2*s1 + s2);
        if(Math.abs(denom) > 1e-9){
          const offset = 0.5*(s0-s2)/denom;
          if(offset > -1 && offset < 1) refinedLag = bestLag + offset;
        }
      }
      let candidateBpm = 60 / (refinedLag/this.SAMPLE_RATE);
      if(this._lockedBpm > 0){
        const ratios = [1, 2, 0.5, 3, 1/3, 1.5, 2/3];
        let bestRatioBpm = candidateBpm, bestRatioDist = Infinity;
        for(const r of ratios){
          const folded = candidateBpm * r;
          if(folded < this.MIN_BPM || folded > this.MAX_BPM) continue;
          const dist = Math.abs(folded - this._lockedBpm) / this._lockedBpm;
          if(dist < bestRatioDist){ bestRatioDist = dist; bestRatioBpm = folded; }
        }
        if(bestRatioDist < 0.06) candidateBpm = bestRatioBpm;
      }
      const TOLERANCE = 0.035;
      const MIN_CONFIDENCE_TO_COUNT = this._lockedBpm > 0 ? 0.22 : 0.12;
      const confidentEnough = confidence >= MIN_CONFIDENCE_TO_COUNT;
      if(confidentEnough && this._candidateBpm > 0 && Math.abs(candidateBpm - this._candidateBpm)/this._candidateBpm < TOLERANCE){
        this._candidateRun++;
        this._candidateBpm += (candidateBpm - this._candidateBpm) * 0.25;
      } else if(confidentEnough){
        this._candidateBpm = candidateBpm;
        this._candidateRun = 1;
      }
      const REQUIRED_RUN = this._lockedBpm > 0 ? 4 : 3;
      if(confidentEnough && this._candidateRun >= REQUIRED_RUN){
        const bpmChanged = Math.abs(this._candidateBpm - this._lockedBpm) > 1e-6;
        this._lockedBpm = this._candidateBpm;
        this._confidence = confidence;
        const newPeriod = 60/this._lockedBpm;
        if(Math.abs(newPeriod - this._periodSec) > 1e-6){
          this._periodSec = newPeriod;
          this._searchPhase(buf);
        } else if(bpmChanged){
          this._periodSec = newPeriod;
        }
      }
      if(this._periodSec > 0){
        const nowSec2 = performance.now()/1000;
        if(nowSec2 - this._lastPhaseSearchTime > 4){
          this._lastPhaseSearchTime = nowSec2;
          this._searchPhase(buf);
        }
      }
    },
    _searchPhase(buf){
      if(this._periodSec <= 0 || !buf.length) return;
      const periodSamples = this._periodSec * this.SAMPLE_RATE;
      if(periodSamples < 2) return;
      const CANDIDATES = 24;
      let bestOffset = 0, bestScore = -Infinity;
      const lookback = Math.min(buf.length, Math.round(periodSamples * 8));
      const start = buf.length - lookback;
      for(let c=0;c<CANDIDATES;c++){
        const offsetSamples = (c/CANDIDATES) * periodSamples;
        let score = 0;
        for(let pos = buf.length - 1 - offsetSamples; pos >= start; pos -= periodSamples){
          const i0 = Math.floor(pos);
          if(i0 < 0 || i0 >= buf.length) continue;
          score += buf[i0];
          if(i0+1 < buf.length) score += buf[i0+1]*0.5;
          if(i0-1 >= 0) score += buf[i0-1]*0.5;
        }
        if(score > bestScore){ bestScore = score; bestOffset = offsetSamples; }
      }
      const offsetSec = bestOffset / this.SAMPLE_RATE;
      this._phaseSec = ((offsetSec % this._periodSec) + this._periodSec) % this._periodSec;
      this._phaseLocked = true;
    },
    FALLBACK_BPM: 120,
    getBpm(dtSec){
      const target = this._lockedBpm > 0 ? this._lockedBpm : this.FALLBACK_BPM;
      const k = 1 - Math.exp(-Math.max(0,dtSec)/0.6);
      this._displayBpm += (target - this._displayBpm) * k;
      if(this._displayBpm < 1) this._displayBpm = this.FALLBACK_BPM;
      if(this._lockedBpm <= 0){
        this._periodSec = 60/this._displayBpm;
      }
      return this._displayBpm;
    },
    getBeatPhase(){
      if(this._periodSec <= 0) return 0;
      return this._phaseSec / this._periodSec;
    },
    getBeatPulse(){
      return this._beatPulse;
    },
    getConfidence(){
      return this._confidence;
    }
  };
  }, ["TempoTracker"]);
})(window.Aurora);

// ── audio/music-sense ──
(function(App){
  App.define("audio/music-sense", function initialize(){
App.MusicSense = {
    data: {
      bass: 0, mid: 0, high: 0,
      loudnessPct: 0,
      bpm: 0,
      beatPhase: 0,
      beatPulse: 0,
      tempoConfidence: 0,
      spectrum: null, waveform: null,
    },
    _animId: null,
    _running: false,
    _boundTick: null,
    _fpsCount: 0, _fpsLast: 0, _fpsVal: 0,
    _byteFreq: null,
    _smoothed: {},
    _ready: false,
    init(bins){
      this.data.spectrum = new Float32Array(bins);
      this.data.waveform = new Uint8Array(bins);
      this._ready = true;
      this._fpsLast = performance.now();
    },
    start(){
      if(this._animId) cancelAnimationFrame(this._animId);
      this._animId = null;
      this._running = true;
      App.TempoTracker.reset();
      this._lastTickTime = 0;
      if(!this._boundTick){
        this._boundTick = () => {
          this._animId = null;
          if(!this._running || !App.VisualRenderState.active) return;
          this._fpsCount++;
          this._tick();
          this._animId = requestAnimationFrame(this._boundTick);
        };
      }
      if(App.VisualRenderState.active){
        this._animId = requestAnimationFrame(this._boundTick);
      }
    },
    _syncVisualState(active){
      if(!active){
        if(this._animId) cancelAnimationFrame(this._animId);
        this._animId = null;
        this._fpsCount = 0;
        this._fpsLast = performance.now();
      } else if(this._running && !this._animId){
        this._lastTickTime = 0;
        this._animId = requestAnimationFrame(this._boundTick);
      }
    },
    stop(){
      this._running = false;
      if(this._animId){ cancelAnimationFrame(this._animId); this._animId = null; }
      Object.assign(this.data, { bass:0, mid:0, high:0, loudnessPct:0, bpm:0, beatPhase:0, beatPulse:0, tempoConfidence:0 });
      this._smoothed = {};
      App.TempoTracker.reset();
      this._lastTickTime = 0;
      App.SenseReadout.update();
      App.updateLikedOutlinePulse();
      App.Threads?.fallbackSense();
    },
    _tick(){
      if(App.Threads?.audioActive){ App.SenseReadout.update(); App.updateLikedOutlinePulse(); return; }
      if(!App.analyserNode || !App.state.isPlaying){ App.SenseReadout.update(); return; }
      const d = this.data;
      const fftSize = App.analyserNode.frequencyBinCount;
      const sr = App.audioCtx.sampleRate || 44100;
      if(!d.spectrum || d.spectrum.length !== fftSize){
        d.spectrum = new Float32Array(fftSize);
        d.waveform = new Uint8Array(fftSize);
      }
      App.analyserNode.getFloatFrequencyData(d.spectrum);
      App.analyserNode.getByteTimeDomainData(d.waveform);
      if(App.settings.specEnabled){
        if(!this._byteFreq || this._byteFreq.length !== fftSize){
          this._byteFreq = new Uint8Array(fftSize);
        }
        App.analyserNode.getByteFrequencyData(this._byteFreq);
        App.Spectrogram.onLiveFrame(this._byteFreq, fftSize, sr, App.analyserNode.fftSize);
      }
      const floorDb = App.settings.loudFloorDb;
      const ceilDb = App.settings.loudCeilDb;
      const dbSpan = Math.max(ceilDb - floorDb, 1e-6);
      const toPctFromDb = (db) => App.clamp01((db - floorDb) / dbSpan) * 100;
      const sensDb = (sens) => sens > 0 ? 20*Math.log10(sens) : -60;
      function waveformDb(byteTimeDomain){
        let sum = 0;
        for(let i=0;i<byteTimeDomain.length;i++){
          const v = (byteTimeDomain[i]-128)/128.0;
          sum += v*v;
        }
        const rms = Math.sqrt(sum/byteTimeDomain.length);
        return rms > 0 ? 20*Math.log10(rms) : -Infinity;
      }
      d.loudnessPct = toPctFromDb(waveformDb(d.waveform));
      const globalSensDb = sensDb(App.settings.globalSens);
      if(App.bassAnalyser && App.midAnalyser && App.highAnalyser){
        if(!this._bandBuf || this._bandBuf.length !== App.bassAnalyser.fftSize){
          this._bandBuf = new Uint8Array(App.bassAnalyser.fftSize);
        }
        const buf = this._bandBuf;
        App.bassAnalyser.getByteTimeDomainData(buf);
        d.bass = toPctFromDb(waveformDb(buf) + sensDb(App.settings.sensBass) + globalSensDb);
        App.midAnalyser.getByteTimeDomainData(buf);
        d.mid  = toPctFromDb(waveformDb(buf) + sensDb(App.settings.sensMid)  + globalSensDb);
        App.highAnalyser.getByteTimeDomainData(buf);
        d.high = toPctFromDb(waveformDb(buf) + sensDb(App.settings.sensHigh) + globalSensDb);
      } else {
        d.bass = 0; d.mid = 0; d.high = 0;
      }
      {
        const smooth = App.settings.senseSmooth;
        const keys = ['loudnessPct','bass','mid','high'];
        for(let i=0;i<keys.length;i++){
          const k = keys[i];
          const prev = this._smoothed[k] || 0;
          const next = prev + (d[k] - prev) * smooth;
          this._smoothed[k] = next;
          d[k] = next;
        }
      }
      {
        const nowMs = performance.now();
        const dtSec = this._lastTickTime ? Math.min(0.25, Math.max(0, (nowMs - this._lastTickTime)/1000)) : (1/60);
        this._lastTickTime = nowMs;
        App.TempoTracker.update(dtSec, App.bassAnalyser, sr, App.midAnalyser, App.highAnalyser);
        d.bpm = App.TempoTracker.getBpm(dtSec);
        d.beatPhase = App.TempoTracker.getBeatPhase();
        d.beatPulse = App.TempoTracker.getBeatPulse();
        d.tempoConfidence = App.TempoTracker.getConfidence();
      }
      const now = performance.now();
      if(now - this._fpsLast >= 500){
        this._fpsVal = Math.round(this._fpsCount/((now-this._fpsLast)/1000));
        this._fpsCount = 0;
        this._fpsLast = now;
        App.el('senseFps').textContent = `${this._fpsVal} FPS`;
      }
      App.SenseReadout.update();
      App.updateLikedOutlinePulse();
      App.Threads?.fallbackSense();
    }
  };
App.VisualRenderState.subscribe(active => App.MusicSense._syncVisualState(active));
  }, ["MusicSense"]);
})(window.Aurora);

// ── audio/signal-registry ──
(function(App){
  App.define("audio/signal-registry", function initialize(){
App.MusicSenseRegistry = {
    outputs: [
      { key: 'loudnessPct', label: 'Loudness (%)',   domain: [0, 100], fixedDomain: true },
      { key: 'bass',        label: 'Bass (%)',        domain: [0, 100], fixedDomain: true },
      { key: 'mid',         label: 'Mid (%)',         domain: [0, 100], fixedDomain: true },
      { key: 'high',        label: 'High (%)',        domain: [0, 100], fixedDomain: true },
      { key: 'beatPulse',   label: 'Beat pulse (tempo)', domain: [0, 1], fixedDomain: true },
      { key: 'beatPhase',   label: 'Beat fáze (0-1)', domain: [0, 1], fixedDomain: true },
      { key: 'tempoConfidence', label: 'Jistota tempa (%)', domain: [0, 1], fixedDomain: true },
    ],
    byKey(key){ return this.outputs.find(o=>o.key===key) || this.outputs[0]; },
    rawValue(key){
      const v = App.MusicSense.data[key];
      return typeof v === 'number' && isFinite(v) ? v : 0;
    }
  };
  }, ["MusicSenseRegistry"]);
})(window.Aurora);
