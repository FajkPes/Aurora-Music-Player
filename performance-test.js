/* Opt-in measurements of real playback; no synthetic playlist or simulated audio. */
(function(App){
App.define('debug/playback-benchmark',function(){
  const startButton=App.el('runPerformanceTest'),saveButton=App.el('savePerformanceTest'),status=App.el('performanceTestStatus');
  let job=null,lastReport=null;
  const text=(cs,en)=>document.documentElement.lang==='cs'?cs:en;
  const say=value=>{if(status)status.textContent=value;};
  const reason=()=>document.hidden||!App.VisualRenderState.active?'hidden':!App.state.isPlaying||App.audio.paused||App.audio.ended?'paused':App.settings.vizMode==='none'||!Number(App.settings.vizOpacity)?'visualizer':!App.settings.bgEnabled?'background':App.state.tracks.length<100?'playlist':null;
  function snapshot(){
    const memory=performance.memory;
    return {at:performance.now(),jsHeapBytes:memory?.usedJSHeapSize??null,jsHeapLimit:memory?.jsHeapSizeLimit??null,
      compositor:App.SceneRenderMetrics?{...App.SceneRenderMetrics}:null,workers:JSON.parse(JSON.stringify(App.Threads?.metrics||{})),playlistRows:App.vt?.pool?.length??null,
      playlistTracks:App.state.tracks.length,trackIndex:App.state.currentIndex,playbackSeconds:App.audio.currentTime,visualizer:App.settings.vizMode,
      visibleCanvasBytes:[...document.querySelectorAll('canvas')].reduce((bytes,c)=>bytes+c.width*c.height*4,0)};
  }
  function finish(interrupted){
    const current=job;if(!current)return;
    job=null;cancelAnimationFrame(current.frame);clearInterval(current.timer);
    const values=Array.from(current.gaps.subarray(0,current.count)).sort((a,b)=>a-b);
    const quantile=p=>values.length?values[Math.min(values.length-1,Math.floor((values.length-1)*p))]:null;
    const total=values.reduce((sum,n)=>sum+n,0);
    lastReport={version:1,startedAt:current.date,valid:!interrupted&&values.length>0,interrupted:interrupted||null,
      durationSeconds:total/1000,warmupSeconds:current.warmup/1000,requestedFps:Math.max(current.settings.renderFps||120,current.settings.vizFps||60,current.settings.postDistortFps||60),
      frameLimits:{background:current.settings.renderFps||120,visualizer:current.settings.vizFps||60,compositor:current.settings.postDistortFps||60},
      ui:{fps:total?values.length*1000/total:0,p50Ms:quantile(.5),p95Ms:quantile(.95),p99Ms:quantile(.99),maxMs:values.at(-1)??null,framesOver16_7Ms:values.filter(v=>v>16.7).length,framesOver8_3Ms:values.filter(v=>v>1000/120+.15).length,framesOver4_2Ms:values.filter(v=>v>1000/240+.15).length},
      settings:current.settings,viewport:current.viewport,samples:current.samples,
      notes:['UI FPS measures requestAnimationFrame delivery, not GPU completion.','JS heap does not include total tab, driver or GPU memory. Canvas bytes estimate raw RGBA storage only.','Compare identical settings, song section and window sizes. Two instances must be measured simultaneously.']};
    if(startButton)startButton.disabled=false;if(saveButton)saveButton.hidden=false;
    say(interrupted?text('Měření přerušeno: ','Measurement interrupted: ')+interrupted:
      text('Hotovo. UI: ','Complete. UI: ')+lastReport.ui.fps.toFixed(1)+' FPS · p95 '+(quantile(.95)||0).toFixed(1)+' ms. '+text('Ulož JSON pro porovnání.','Save JSON for comparison.'));
    return lastReport;
  }
  function start({seconds=60,warmupSeconds=10}={}){
    if(job)return false;
    const invalid=reason();
    if(invalid){say(text('Zapni hudbu, pozadí a vizualizér; načti alespoň 100 skladeb a nech kartu viditelnou.','Play music with background and a visualizer enabled; load at least 100 tracks and keep the tab visible.'));return false;}
    const warmup=Math.max(0,Math.min(60,warmupSeconds))*1000,duration=Math.max(10,Math.min(600,seconds))*1000;
    job={date:new Date().toISOString(),start:performance.now(),warmup,duration,gaps:new Float32Array(144000),count:0,last:0,frame:0,timer:0,samples:[],settings:JSON.parse(JSON.stringify(App.settings)),viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},mode:App.settings.vizMode};
    if(startButton)startButton.disabled=true;if(saveButton)saveButton.hidden=true;
    const current=job;
    const check=()=>reason()||(App.settings.vizMode!==current.mode?'visualizer changed':null);
    const frame=now=>{
      if(job!==current)return;
      const invalid=check();if(invalid){finish(invalid);return;}
      const elapsed=now-current.start;
      if(elapsed>=warmup){if(current.last&&current.count<current.gaps.length)current.gaps[current.count++]=now-current.last;current.last=now;}
      if(elapsed>=warmup+duration){finish();return;}
      current.frame=requestAnimationFrame(frame);
    };
    const sample=()=>{
      if(job!==current)return;
      const invalid=check();if(invalid){finish(invalid);return;}
      if(JSON.stringify(App.settings)!==JSON.stringify(current.settings)){finish('settings changed');return;}
      const elapsed=performance.now()-current.start;
      if(elapsed>=warmup)current.samples.push(snapshot());
      say(elapsed<warmup?text('Zahřívání… ','Warming up… ')+Math.ceil((warmup-elapsed)/1000)+' s':text('Měření… ','Measuring… ')+Math.max(0,Math.ceil((warmup+duration-elapsed)/1000))+' s');
    };
    sample();current.timer=setInterval(sample,1000);current.frame=requestAnimationFrame(frame);return true;
  }
  function download(){
    if(!lastReport)return;
    const url=URL.createObjectURL(new Blob([JSON.stringify(lastReport,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='aurora-performance-'+Date.now()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  App.PlaybackBenchmark={start,stop:()=>finish('stopped'),report:()=>lastReport,snapshot};
  startButton?.addEventListener('click',()=>start());saveButton?.addEventListener('click',download);
  document.addEventListener('visibilitychange',()=>{if(job&&document.hidden)finish('hidden');});
  window.addEventListener('pagehide',()=>{if(job)finish('page hidden');});
});
})(window.Aurora);
