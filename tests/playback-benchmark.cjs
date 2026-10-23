const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let initialize,now=0,next=0;const frames=new Map(),timers=new Map();
const nodes={runPerformanceTest:{addEventListener(){}},savePerformanceTest:{addEventListener(){}},performanceTestStatus:{}};
const document={hidden:false,documentElement:{lang:'en'},addEventListener(){},querySelectorAll:()=>[]};
const App={define(id,fn){initialize=fn;},el:id=>nodes[id],settings:{vizMode:'ring',vizOpacity:1,bgEnabled:true,vizFps:120},state:{isPlaying:true,tracks:Array.from({length:268},()=>({})),currentIndex:0},audio:{paused:false,ended:false,currentTime:20},VisualRenderState:{active:true},Threads:{metrics:{background:{fps:120,cpuMs:1,maxGap:9}}},vt:{pool:Array(15)}};
const scope={window:{Aurora:App,addEventListener(){}},document,performance:{now:()=>now,memory:{usedJSHeapSize:200000000}},innerWidth:1920,innerHeight:1080,devicePixelRatio:1,requestAnimationFrame:fn=>{frames.set(++next,fn);return next;},cancelAnimationFrame:id=>frames.delete(id),setInterval:fn=>{timers.set(++next,fn);return next;},clearInterval:id=>timers.delete(id)};
vm.runInNewContext(fs.readFileSync('performance-test.js','utf8'),scope);initialize();
App.audio.paused=true;assert.equal(App.PlaybackBenchmark.start(),false,'Cannot benchmark without actual playback');App.audio.paused=false;
App.state.tracks.length=2;assert.equal(App.PlaybackBenchmark.start(),false,'Large playlist is mandatory');App.state.tracks=Array(268);
assert.equal(App.PlaybackBenchmark.start({seconds:10,warmupSeconds:0}),true);
for(let i=0;i<1210&&frames.size;i++){now+=1000/120;const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(now));if(i%120===0)[...timers.values()].forEach(fn=>fn());}
let report=App.PlaybackBenchmark.report();assert.equal(report.valid,true);assert(Math.abs(report.ui.fps-120)<.01);assert(report.samples.length>=9);assert.equal(timers.size,0);assert.equal(frames.size,0);
assert.equal(report.samples[0].playlistTracks,268);assert.equal(report.samples[0].trackIndex,0);
App.PlaybackBenchmark.start();document.hidden=true;const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(now+10));assert.equal(App.PlaybackBenchmark.report().valid,false);assert.equal(timers.size,0);
console.log('PASS: benchmark conditions, 268-track workload metadata, timing math, interruption and timer cleanup (simulated clock, NOT a real performance result).');
