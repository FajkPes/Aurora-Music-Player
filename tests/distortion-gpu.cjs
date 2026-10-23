// Tests JS integration with a fake GL driver; does not assert real shader compilation or FPS.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
for(const supported of [true,false,'compile-error']){
 const queue=new Map(),draws=[],uniforms=new Map(),uploads=[];let next=0,gpu;
 const shaderGL={};
 for(const name of ['VERTEX_SHADER','FRAGMENT_SHADER','COMPILE_STATUS','LINK_STATUS','MAX_TEXTURE_SIZE','TEXTURE0','TEXTURE_2D','TEXTURE_MIN_FILTER','TEXTURE_MAG_FILTER','LINEAR','TEXTURE_WRAP_S','TEXTURE_WRAP_T','CLAMP_TO_EDGE','RGBA','UNSIGNED_BYTE','UNPACK_PREMULTIPLY_ALPHA_WEBGL','ARRAY_BUFFER','STATIC_DRAW','FLOAT','TRIANGLES'])shaderGL[name]=name;
 for(const name of ['shaderSource','compileShader','attachShader','linkProgram','deleteShader','useProgram','bindBuffer','bufferData','enableVertexAttribArray','vertexAttribPointer','activeTexture','bindTexture','texParameteri','pixelStorei','viewport','deleteTexture','deleteBuffer','deleteProgram'])shaderGL[name]=()=>{};
 for(const name of ['createShader','createProgram','createBuffer','createTexture'])shaderGL[name]=()=>({});
 const shaders=new Set();shaderGL.createShader=type=>{const shader={type};shaders.add(shader);return shader;};shaderGL.deleteShader=shader=>shaders.delete(shader);
 shaderGL.getExtension=()=>null;shaderGL.getParameter=()=>4096;shaderGL.getShaderParameter=shaderGL.getProgramParameter=()=>true;shaderGL.getAttribLocation=()=>0;shaderGL.getUniformLocation=(p,n)=>n;
 if(supported==='compile-error'){shaderGL.getShaderParameter=shader=>shader.type!==shaderGL.FRAGMENT_SHADER;shaderGL.getShaderInfoLog=()=> 'Test compilation failure';}
 for(const name of ['uniform1f','uniform1i','uniform2f','uniform4f'])shaderGL[name]=(key,...values)=>uniforms.set(key,values);
 shaderGL.texImage2D=(...args)=>uploads.push(['allocate',args.at(-1)]);shaderGL.texSubImage2D=(...args)=>uploads.push(['update',args.at(-1)]);shaderGL.drawArrays=()=>draws.push(true);
 const rect={left:0,top:0,width:800,height:600};
 const element=()=>({style:{opacity:'1'},width:800,height:600,events:{},append(){},getBoundingClientRect:()=>rect,addEventListener(name,fn){this.events[name]=fn;},getContext:()=>supported?shaderGL:null});
 const ids=Object.fromEntries(['sceneContent','sceneBackground','sceneVisualizers','distortionStatus','bgFxOverlay','bgWorkerCanvas','bgGlow','musicVisualizerCanvas','spectrogramCanvas','spectrogramLayer'].map(id=>[id,element()]));
 const App={settings:{postFish:0,postZoom:1,postDistortTarget:'both',postEdgeMode:'mirror'},el:id=>ids[id],VisualRenderState:{active:true,subscribe(fn){fn();}}};
 const scope={window:{Aurora:App,addEventListener(){}},document:{hidden:false,createElement(){gpu=element();return gpu;}},devicePixelRatio:1,requestAnimationFrame:fn=>{queue.set(++next,fn);return next;},cancelAnimationFrame:id=>queue.delete(id),getComputedStyle:el=>({display:'block',visibility:'visible',opacity:el.style.opacity??'1'}),console:{warn(){}}};
 vm.runInNewContext(fs.readFileSync('distortion-gpu.js','utf8'),scope);assert.equal(App.distortionMask(.5,.5,.5,.5,.6,.2,false),0);
 assert.equal(App.distortionMask(.6,.5,.5,.5,.6,.2,false),0);
 assert.equal(App.distortionMask(1,.5,.5,.5,.6,.2,false),1);
 assert.equal(App.distortionMask(.5,0,.5,.5,.6,.2,false),1);
 assert.equal(App.distortionMask(.5,.5,.5,.5,.6,.2,true),1);
 assert.equal(App.distortionMask(0,0,.5,.5,1,.2,false),0);
 const mid=App.distortionMask(.85,.5,.5,.5,.6,.2,false);assert(Math.abs(mid-.5)<1e-9);
 for(const y of [0,.25,.5,.75,1]){
  assert.equal(App.distortionMask(.5,y,.5,.5,.6,.2,false,true),0,'Panorama protects the center at all heights');
  assert.equal(App.distortionMask(0,y,.5,.5,.6,.2,false,true),1);
  assert.equal(App.distortionMask(1,y,.5,.5,.6,.2,false,true),1);
 }
 App.scenePixelRatio=()=>1;
 App.mountDistortionGPU();
 const tick=t=>{const jobs=[...queue.values()];queue.clear();for(const fn of jobs)fn(t);};
 tick(0);assert.equal(draws.length,0,'Disabled distortion never initializes GL');
 App.settings.postFish=.7;App.refreshDistortionGPU();tick(100);
 if(!supported){assert.equal(gpu.style.display,'none');assert(ids.distortionStatus.textContent.includes('WebGL unavailable'));continue;}
 if(supported==='compile-error'){assert.equal(shaders.size,0,'Fragment compilation failure also deletes the compiled vertex shader');assert.equal(draws.length,0);continue;}
 assert.equal(draws.length,1);assert.equal(ids.sceneBackground.style.opacity,'0');assert.equal(gpu.style.display,'block');assert.deepEqual(uniforms.get('edges'),[1]);
 scope.window.innerWidth=1200;
 ids.playlistPanel=element();ids.playlistPanel.getBoundingClientRect=()=>({left:600,top:0,width:200,height:600});
 ids.sceneContent.getBoundingClientRect=()=>({...rect,width:600});
 tick(118);assert.deepEqual(uniforms.get('viewRect'),[0,0,1,1],'Shader uses the entire physically bounded scene');assert.equal(gpu.width,600,'Compositor surface stops before the playlist');
 ids.playlistPanel.getBoundingClientRect=()=>({left:800,top:0,width:200,height:600});
 ids.sceneContent.getBoundingClientRect=()=>rect;
 tick(136);assert.deepEqual(uniforms.get('viewRect'),[0,0,1,1],'Hidden playlist restores full width');
 const count=uploads.filter(([type])=>type==='allocate').length;tick(156);assert.equal(uploads.filter(([type])=>type==='allocate').length,count,'Same size texture storage is reused');
 App.settings.postInvertMask=true;App.settings.postDistortTarget='visualizers';App.settings.postEdgeMode='repeat';App.settings.postPanoramaVertical=.5;App.settings.scanlineTarget='background';App.settings.fxScanlines=.4;tick(176);
 assert.deepEqual(uniforms.get('sideVertical'),[.5]);assert(Math.abs(uniforms.get('scanAmount')[0]-.126)<1e-9,'Background scanlines are applied before foreground composition');
 assert.deepEqual(uniforms.get('inverted'),[1]);assert.deepEqual(uniforms.get('target'),[2]);assert.deepEqual(uniforms.get('edges'),[2]);
 App.settings.postFish=0;tick(196);assert.equal(queue.size,0);assert.equal(gpu.style.display,'none');assert.equal(ids.sceneBackground.style.opacity,'');
 App.settings.postFish=.5;App.refreshDistortionGPU();tick(216);gpu.events.webglcontextlost({preventDefault(){}});assert.equal(queue.size,0);assert.equal(gpu.style.display,'none');gpu.events.webglcontextrestored();tick(236);assert.equal(gpu.style.display,'block');
 App.settings.postFish=0;App.settings.postChroma=1;tick(256);
 assert.equal(App.sceneGPUChromaActive,true,'Chroma uses the existing GPU compositor');assert.deepEqual(uniforms.get('chromaPixels'),[1]);
 assert.equal(App.SceneRenderMetrics.chromaInShader,true);assert(App.SceneRenderMetrics.textureUploads>0);
 const writes=App.SceneRenderMetrics.uniformWrites;tick(274);assert.equal(App.SceneRenderMetrics.uniformWrites,writes,'Identical shader uniforms are not resubmitted');
 App.settings.postGlitch=.2;tick(276);assert.equal(App.sceneGPUChromaActive,false,'Glitch before chroma retains SVG ordering');
 App.settings.postGlitch=0;App.refreshDistortionGPU();tick(296);assert.equal(App.sceneGPUChromaActive,true);
 gpu.events.webglcontextlost({preventDefault(){}});assert.equal(App.sceneGPUChromaActive,false,'Context loss restores the SVG fallback');gpu.events.webglcontextrestored();tick(316);
 App.VisualRenderState.active=false;tick(336);assert.equal(queue.size,0,'Hidden rendering sleeps');
}
console.log('PASS: distortion GL integration, texture reuse, mask/target uniforms, default bypass, missing WebGL and context recovery.');
