const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const callbacks=[],frames=new Map(),subscriptions=new Set(),elements=new Map();let frameId=0,plays=0;
const el=id=>{if(!elements.has(id))elements.set(id,{textContent:'',style:{},classList:{add(){},remove(){},contains:()=>false},removeAttribute(){}});return elements.get(id);};
const App={define(){},el,state:{currentIndex:-1,tracks:[{name:'a',file:{}},{name:'b',file:{}}]},settings:{normalize:true},ProfileStore:{has:()=>false},recordPlayedIndex(){},trackKey:t=>t.name,TimelineWaveform:{setTrack(){}},audioCtx:{state:'running',currentTime:0},audio:{play(){plays++;return Promise.resolve();}},MusicSense:{start(){}},Spectrogram:{resetForNewTrack(){}},PlayStatsStore:{recordPlay(){}},VisualRenderState:{active:true,subscribe(fn){subscriptions.add(fn);fn(true);return ()=>subscriptions.delete(fn);}},applyNormalizationForTrack:()=>new Promise(resolve=>callbacks.push(resolve))};
for(const name of ['updateTrackMetaHeart','initAudioGraph','showNormDetail','showNormBadge','hideNormBadge','setNormDetailPct','renderTrackList','updatePlayIcon'])App[name]=()=>{};
vm.runInNewContext(fs.readFileSync('library-player.js','utf8'),{window:{Aurora:App},URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},setTimeout(){return 1;},clearTimeout(){},requestAnimationFrame:fn=>{frames.set(++frameId,fn);return frameId;},cancelAnimationFrame:id=>frames.delete(id)});
for(const name of ['recordPlayedIndex','updateTrackMetaHeart','setTrackRowProgress','renderTrackList','updatePlayIcon'])App[name]=()=>{};
async function run(){
 App.loadTrack(0,true);App.loadTrack(1,false);
 callbacks[0]();callbacks[1]();
 for(let i=0;i<8;i++)await Promise.resolve();
 assert.equal(plays,0,'Old normalization must not autoplay a newly selected paused track');
 assert.equal(el('metaTitle').textContent,'b');
 App.ProfileStore.has=()=>true;App.applyNormalizationForTrack=()=>Promise.resolve();
 App.loadTrack(0,false);App.loadTrack(1,false);
 assert.equal(subscriptions.size,0,'Cached normalization does not animate a simulated scan');assert.equal(frames.size,0);
 console.log('PASS: stale normalization cannot autoplay new selections; cached analysis does not schedule simulated work.');
}
run().catch(e=>{console.error(e);process.exitCode=1;});
