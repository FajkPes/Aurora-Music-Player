// Optional real Chromium soak test. Usage: node tests/memory-browser.cjs [seconds] [mode]
// Requires Playwright; AURORA_PLAYWRIGHT / AURORA_CHROME can point to local installations.
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{execFileSync}=require('node:child_process');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.AURORA_PLAYWRIGHT||'playwright');
const seconds=Number(process.argv[2])||60,mode=process.argv[3]||'default';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.AURORA_CHROME,headless:true,args:['--autoplay-policy=no-user-gesture-required','--enable-precise-memory-info']});
 try{
  const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  if(mode==='fallback')await page.addInitScript(()=>{window.Worker=undefined;});
  if(mode.includes('inline-baseline')||mode==='inherited-palette')await page.addInitScript(()=>{CSS.registerProperty=undefined;});
  await page.goto(pathToFileURL(path.resolve('index.html')).href);
  await page.evaluate(mode=>{
   const a=Aurora;
   if(mode.includes('inline-baseline'))a.PlayerColors._writeColors=changes=>{for(const [key,value] of changes)document.documentElement.style.setProperty(key,value);};
   if(mode==='no-gpu'){a.settings.postFish=0;a.settings.postZoom=1;a.settings.postChroma=0;}
   if(mode==='no-bg'||mode==='no-bg-inline-baseline')a.settings.bgEnabled=false;
   if(mode==='no-spec')a.settings.specEnabled=false;
   if(mode==='no-viz')a.settings.vizMode='none';
   if(mode==='static-ui')a.PlayerColors.update=()=>{};
   if(mode==='no-timeline'){a.Threads.send('timeline',{type:'active',active:false});a.Threads.timelineState=()=>{};}
   if(mode==='ui-only'){a.settings.bgEnabled=false;a.settings.specEnabled=false;a.settings.vizMode='none';a.settings.postFish=0;a.settings.postZoom=1;a.settings.postChroma=0;a.Threads.send('timeline',{type:'active',active:false});a.Threads.timelineState=()=>{};}
   if(mode==='no-ui-loop')a.bgLoop=()=>{};
   if(mode==='no-motion'){const s=document.createElement('style');s.textContent='*,*::before,*::after{animation:none!important;transition:none!important;}';document.head.append(s);}
   if(mode==='background-stress'){a.settings.bgLayers.forEach(l=>{l.enabled=true;l.trailEnabled=true;l.trailLength=.4;});a.settings.sparklesEnabled=true;}
   if(mode==='background-only'){a.settings.specEnabled=false;a.settings.vizMode='none';a.settings.postFish=0;a.settings.postZoom=1;a.settings.postChroma=0;}
   if(mode==='hidden')a.VisualRenderState.setActive(false);
   a.Threads.settingsChanged();a.refreshSceneEffects();a.refreshMusicVisualizer();
   // PCM generated in memory: exercise real playback/DSP without retaining decoded analysis.
   const rate=48000,n=rate*8,buffer=new ArrayBuffer(44+n*2),v=new DataView(buffer);
   const text=(at,s)=>{for(let i=0;i<s.length;i++)v.setUint8(at+i,s.charCodeAt(i));};
   text(0,'RIFF');v.setUint32(4,36+n*2,true);text(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);text(36,'data');v.setUint32(40,n*2,true);
   for(let i=0;i<n;i++)v.setInt16(44+i*2,(mode==='background-stress'?(Math.sin(i/rate*80*Math.PI*2)+Math.sin(i/rate*440*Math.PI*2)+Math.sin(i/rate*7000*Math.PI*2))/3:Math.sin(i/rate*440*Math.PI*2))*10000*(.6+.4*Math.sin(i/rate*4*Math.PI)),true);
   a.settings.normalize=false;a.settings.timelineLoudnessWaveform=false;
   a.addFiles([new File([buffer],'Memory probe.wav',{type:'audio/wav'})]);
   a.audio.loop=true;
  },mode);
  await page.waitForFunction(()=>Aurora.audio.currentTime>0,{timeout:15000});
  const cdp=await page.context().newCDPSession(page),root=await browser.newBrowserCDPSession();
  await cdp.send('Performance.enable');
  let backgroundWorker;
  if(process.env.AURORA_PROFILE_BACKGROUND){
   for(const worker of page.workers())if(await worker.evaluate(()=>self.name)==='Aurora background')backgroundWorker=worker;
   if(backgroundWorker)await backgroundWorker.evaluate(()=>{
    self.probe={stamps:0,tints:0,masks:0,blobMs:0};
    const oldStamp=stamp,oldSprite=blobSprite,oldUpdate=BgReact.update;
    stamp=function(...args){self.probe.stamps++;return oldStamp(...args);};
    blobSprite=function(...args){self.probe.tints++;if(!spriteCache.has(args.join('|')))self.probe.masks++;return oldSprite(...args);};
    BgReact.update=function(){const t=performance.now();try{return oldUpdate.call(this);}finally{self.probe.blobMs+=performance.now()-t;}};
   });
  }
  const started=Date.now();
  console.log(JSON.stringify({mode,gpu:(await root.send('SystemInfo.getInfo')).gpu.devices}));
  let warmMemory=null,lastMemory=null;
  for(let t=0;t<=seconds;t+=5){
   if(t)await page.waitForTimeout(5000);
   const processes=(await root.send('SystemInfo.getProcessInfo')).processInfo;
   let memory=[];
   if(process.platform==='win32'){
    const ids=processes.map(p=>p.id).filter(Number.isInteger).join(',');
    const data=JSON.parse(execFileSync('powershell.exe',['-NoProfile','-Command',`Get-Process -Id ${ids} -ErrorAction SilentlyContinue | Select-Object Id,PrivateMemorySize64,WorkingSet64 | ConvertTo-Json -Compress`],{encoding:'utf8',windowsHide:true}));
    memory=(Array.isArray(data)?data:[data]).map(p=>({type:processes.find(x=>x.id===p.Id)?.type,privateMiB:Math.round(p.PrivateMemorySize64/1048576),workingMiB:Math.round(p.WorkingSet64/1048576)}));
   }
   const heap=await cdp.send('Runtime.getHeapUsage'),dom=await cdp.send('Memory.getDOMCounters');
   const resources=await page.evaluate(()=>Object.fromEntries(Object.entries(Aurora.Threads.metrics).map(([k,m])=>[k,{fps:Math.round(m.fps),cpuMs:m.cpuMs,maxGap:m.maxGap,canvasMiB:Math.round((m.resources?.canvasBytes||0)/1048576)}])));
   const performance=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.filter(m=>['TaskDuration','ScriptDuration','RecalcStyleDuration','LayoutDuration'].includes(m.name)).map(m=>[m.name,m.value]));
   lastMemory=memory.filter(p=>p.type==='renderer').reduce((n,p)=>n+p.privateMiB,0);
   if(t===20)warmMemory=lastMemory;
   const cpu=Object.fromEntries(['renderer','GPU','browser'].map(type=>[type,processes.filter(p=>p.type===type).reduce((n,p)=>n+p.cpuTime,0)]));
   const background=backgroundWorker?await backgroundWorker.evaluate(()=>({...self.probe,blobs:BgReact.blobs.length,layers:settings.bgLayers.map(l=>({enabled:l.enabled,count:l.count,blur:l.blur,blurEnabled:l.blurEnabled}))})):undefined;
   console.log(JSON.stringify({t,background,wallSeconds:(Date.now()-started)/1000,heapMiB:Math.round(heap.usedSize/1048576),dom,memory,resources,performance,cpu,errors}));
  }
  if(process.env.AURORA_SCREENSHOT)await page.screenshot({path:process.env.AURORA_SCREENSHOT});
  assert.deepEqual(errors,[],'Playback must not raise page errors');
  if(process.platform==='win32'&&seconds>=60&&!mode.includes('inline-baseline'))assert(lastMemory-warmMemory<256,'Renderer memory must settle instead of growing by hundreds of MiB after warmup');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
