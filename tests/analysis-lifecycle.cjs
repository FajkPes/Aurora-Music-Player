const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const modules=new Map(),parts={};
const App={define:(id,fn)=>modules.set(id,fn),addParts(id,p){Object.assign(parts[id]??={},p);},settings:{cacheWaveform:true,timelineLoudnessWaveform:true},trackKey:t=>t.name};
const scope={window:{Aurora:App},console,setTimeout,clearTimeout,localStorage:{getItem:()=>null,setItem(){}}};
for(const name of ['audio.js','visualizers.js'])vm.runInNewContext(fs.readFileSync(name,'utf8'),scope);
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
async function run(){
 modules.get('audio/normalization')();
 const measure=App.measureIntegratedLufsOnce;
 let count=0,needed=true;const gate=deferred(),file={};
 App.measureIntegratedLufsOnce=async()=>{count++;return gate.promise;};
 const first=App.measureIntegratedLufs(file,null,()=>needed);
 const shared=App.measureIntegratedLufs(file,null,()=>true);
 assert.equal(first,shared,'Consumers share a single decode');
 await Promise.resolve();
 let staleProgress=0;
 const skipped=App.measureIntegratedLufs({},()=>staleProgress++,()=>needed);
 const rejected=assert.rejects(skipped,{name:'AbortError'});
 needed=false;gate.resolve({lufs:-20,waveformDb:[-30]});
 await shared;await rejected;
 assert.equal(count,1,'Skipped queued track never decodes');assert.equal(staleProgress,0);
 assert.equal(await App.analysisQueue,undefined,'Queue does not retain the last analysis result');
 assert.equal(App.analysisJobs.has(file),false);

 // Native decode cannot be interrupted, but stale work must stop before offline rendering.
 const decoded=deferred(),decoding=deferred();let closed=0,offline=0,current=true;
 scope.window.AudioContext=class{decodeAudioData(){decoding.resolve();return decoded.promise;}async close(){closed++;}};
 scope.window.OfflineAudioContext=class{constructor(){offline++;}decodeAudioData(){decoding.resolve();return decoded.promise;}};
 const task=measure({arrayBuffer:async()=>new ArrayBuffer(8)},null,()=>{if(!current){const e=new Error();e.name='AbortError';throw e;}});
 await decoding.promise;current=false;decoded.resolve({sampleRate:48000});
 await assert.rejects(task,{name:'AbortError'});assert.equal(closed,0);assert.equal(offline,1,'Only the minimal decoder is created; stale work never starts full-track rendering');

 modules.get('timeline/waveform')();
 const jobs=[];App.ProfileStore={getWaveform:()=>null,get:()=>undefined,set(){}};
 App.measureIntegratedLufs=(file,onProgress,isNeeded)=>{const d=deferred();jobs.push({...d,isNeeded});return d.promise;};
 const a={name:'a',file:{}},b={name:'b',file:{}};
 App.TimelineWaveform.setTrack(a);App.TimelineWaveform.setTrack(b);
 assert.equal(jobs[0].isNeeded(),false);assert.equal(jobs[1].isNeeded(),true);
 jobs[0].resolve({waveformDb:[-25],lufs:-20});await Promise.resolve();
 assert.equal(App.TimelineWaveform._computing,'b','Old completion cannot clear the new job marker');
 jobs[1].resolve({waveformDb:[-25,-20],lufs:-20});await Promise.resolve();
 assert.equal(App.TimelineWaveform.data.length,2);

 modules.get('storage/profiles')();
 for(let i=0;i<100;i++)App.ProfileStore.set('track'+i,-20,new Array(1000).fill(.5));
 clearTimeout(App.ProfileStore._persistTimer);
 assert.equal(App.ProfileStore.count(),100,'LUFS metadata survives waveform eviction');
 assert.equal([...App.ProfileStore._cache.values()].filter(e=>e.waveform).length,16);
 assert.equal(App.ProfileStore.getWaveform('track0'),undefined);
 assert.equal(App.ProfileStore.getWaveform('track99').length,1000);
 App.ProfileStore.set('huge',-20,new Array(262145).fill(.5));clearTimeout(App.ProfileStore._persistTimer);
 assert.equal(App.ProfileStore.getWaveform('huge'),undefined);
 assert.equal(App.ProfileStore.getWaveform('track99').length,1000,'Oversized entry does not evict smaller useful entries');
 App.settings.cacheWaveform=false;App.ProfileStore._trimWaveforms();
 assert.equal([...App.ProfileStore._cache.values()].filter(e=>e.waveform).length,0);
 // Stopping bulk work invalidates queued/in-flight analysis consumers as well.
 App.el=()=>({addEventListener(){}});
 modules.get('audio/bulk-analysis')();
 const bulk=App.BulkAnalyzer,bulkJobs=[];
 App.state={tracks:Array.from({length:10},(_,i)=>({name:'bulk'+i,file:{name:'bulk'+i}}))};
 App.renderTrackList=App.updateProfileCount=()=>{};
 bulk._setUIRunning=bulk._updateProgress=bulk._flashLabel=()=>{};
 App.analyzeTrack=(track,progress,isNeeded)=>new Promise((resolve,reject)=>bulkJobs.push({isNeeded,reject}));
 const bulkDone=bulk.start();
 assert.equal(bulkJobs.length,3);assert(bulkJobs.every(j=>j.isNeeded()));
 bulk.stop();assert(bulkJobs.every(j=>!j.isNeeded()),'Stop propagates to every analysis consumer');
 for(const job of bulkJobs)job.reject(Object.assign(new Error('Stopped'),{name:'AbortError'}));
 await bulkDone;assert.equal(bulk.running,false);assert.equal(bulkJobs.length,3,'Stop cannot enqueue remaining tracks');
 console.log('PASS: shared/obsolete analysis jobs, native decode cleanup, queue retention, waveform races and bounded sample cache.');
}
run().catch(e=>{console.error(e);process.exitCode=1;});
