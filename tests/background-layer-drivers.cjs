const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const parts=new Map(),mainParts={};
let now=1000;
const node=()=>({style:{},setAttribute(){},querySelector(){return this;}});
const counts=new Map(),shape={path:()=>''},settings={bgColor1:"#ff0000",bgColor2:"#0000ff",bgEnabled:true,bgBaseDrift:1,bgFlashAttack:.1,bgFlashRelease:.2,bgMapColorSpeed:{enabled:false},bgLayers:[50,7].map(count=>({enabled:true,count,size:1,rotation:0,baseAlpha:.2,blur:0,shape:'circle',overrides:{size:{enabled:true},speed:{enabled:true},blur:{enabled:true}}}))};
const App={settings,stageBox:{w:1000,h:700},define(){},addParts:(id,p)=>Object.assign(mainParts[id]||={},p),el:node,
 MappingEngine:{resolve:()=>1,resolveMap:(_,key)=>{counts.set(key,(counts.get(key)||0)+1);return 1;}},applyTempoSpeedMult:(_,v)=>v,
 FxEngine:{setBaseOpacity(){},update(){}},TrailFx:{beginFrame:()=>false},BlobShapes:{circle:shape},rgbaFromHex:()=>'',hslToHex:()=>''};
vm.runInNewContext(fs.readFileSync('background.js','utf8'),{window:{Aurora:App},performance:{now:()=>now}});
vm.runInNewContext(fs.readFileSync('workers.js','utf8'),{window:{Aurora:{registerWorker(){},registerWorkerPart:(id,fn)=>parts.set(id,fn)}}});
const scope={...App,glow:node(),performance:{now:()=>now},paintBlob(){}};
const fn=parts.get('background/05-bg-react').toString();
vm.runInNewContext(fn.slice(fn.indexOf('{')+1,fn.lastIndexOf('}'))+';globalThis.renderer=BgReact;',scope);
const worker=scope.renderer;worker.ensure();
assert.equal(worker.blobs.length,57);
const blobs=worker.blobs;
const main={...mainParts.BgReact,blobs:blobs.map(b=>({...b,wrapEl:node(),pathEl:node(),svgEl:node(),feBlur:node(),mirrorWrapEl:node(),mirror2WrapEl:node()})),ensure(){},_frameToken:0,_hueAccum:0,_flashEnv:0,_layerBeatCut:{}};
for(const renderer of [main,worker]){
 counts.clear();
 for(let i=0;i<100;i++){now+=16;renderer.update();}
 assert.equal(counts.size,6);
 for(const count of counts.values())assert.equal(count,100,'Each mapping resolves once per layer per frame, regardless of blob count');
}
assert.equal(worker.blobs,blobs,'Changing audio/frames cannot rebuild the blob array');
settings.bgLayers[0].count=2;worker.ensure();assert.equal(worker.blobs.length,9,'Only configured count changes rebuild blobs');
for(const b of main.blobs)assert.equal(b.pathEl.style.filter,'none','The SVG fallback skips Gaussian filters at zero blur');
settings.bgLayers[0].blurEnabled=true;settings.bgLayers[0].blur=20;main.update();
assert(main.blobs[0].pathEl.style.filter.startsWith('url('),'Enabling blur restores its filter');
settings.bgLayers[0].blurEnabled=false;main.update();assert.equal(main.blobs[0].pathEl.style.filter,'none');
console.log('PASS: stable blob counts, one mapping per layer/frame in both renderers, SVG blur toggling.');
