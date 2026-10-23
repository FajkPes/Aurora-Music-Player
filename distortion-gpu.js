/* High precision analytic distortion. Worker canvases are sampled directly as textures. */
(function(App){
App.distortionMask=function(u,v,cx,cy,radius,softness,invert,panorama=false){
 const distance=panorama?Math.abs(u-cx)/Math.max(cx,1-cx,.001):Math.hypot((u-cx)/Math.max(cx,1-cx,.001),(v-cy)/Math.max(cy,1-cy,.001));
 const t=radius>=1?0:Math.max(0,Math.min(1,(distance-radius)/Math.max(softness,.001)));
 const mask=t*t*(3-2*t);return invert?1-mask:mask;
};
App.distortionFragment=`precision highp float;
uniform sampler2D bgTex,vizTex,specTex;
uniform vec2 size,center;
uniform vec4 specRect,viewRect;
uniform float amount,radius,softness,zoom,inverted,bgOpacity,vizOpacity,specOpacity,vizBlur,specHue,sideVertical,scanAmount,cssHeight,chromaPixels;
uniform int kind,edges,target,panorama;
uniform float sceneGray;
uniform vec2 sceneHue;
vec2 warp(vec2 uv){
 if(amount==0.0&&zoom==1.0)return uv;
 vec2 local=(uv-viewRect.xy)/viewRect.zw;
 if(local.x<0.0||local.y<0.0||local.x>1.0||local.y>1.0)return uv;
 vec2 viewSize=size*viewRect.zw,aspect=viewSize/min(viewSize.x,viewSize.y),d=(local-center)*aspect;
 float r=length(d),distanceToCenter=length((local-center)/max(max(center,1.0-center),vec2(.001)));
 if(panorama==1)distanceToCenter=abs(local.x-center.x)/max(max(center.x,1.0-center.x),.001);
 float mask=radius>=1.0?0.0:smoothstep(radius,radius+max(softness,.001),distanceToCenter);
 mask=mix(mask,1.0-mask,inverted);if(mask<=0.0)return uv;float a=amount*mask;vec2 q=d;
 if(panorama==1){float xRadius=abs(d.x),k=1.0;if(kind==1)k=exp(-a*.65);else if(kind==3)k=exp(a*.8);else if(kind==4||kind==2)k=exp(a*sin(xRadius*7.0)*.3);else k=exp(clamp(a*xRadius*xRadius*.45,-2.0,2.0));q=d*k;}
 else if(kind==2){float t=a*2.5;q=mat2(cos(t),-sin(t),sin(t),cos(t))*d;}
 else {float k=1.0;if(kind==1)k=exp(-a*.65);else if(kind==3)k=exp(a*.8);else if(kind==4)k=1.0+a*sin(r*14.0)*.12;else k=exp(clamp(a*r*r*.45,-2.0,2.0));q=d*k;}
 vec2 mapped=center+q/mix(1.0,zoom,mask)/aspect;
 if(panorama==1)mapped.y=mix(local.y,center.y+q.y/mix(1.0,zoom,mask)/aspect.y,sideVertical);
 return viewRect.xy+mapped*viewRect.zw;
}
vec2 wrapUV(vec2 p){vec2 local=(p-viewRect.xy)/viewRect.zw;if(edges==1)local=1.0-abs(mod(local,2.0)-1.0);else if(edges==2)local=fract(local);return clamp(viewRect.xy+local*viewRect.zw,viewRect.xy+.5/size,viewRect.xy+viewRect.zw-.5/size);}
bool outside(vec2 p){return p.x<0.0||p.y<0.0||p.x>1.0||p.y>1.0;}
bool outsideView(vec2 p){return outside((p-viewRect.xy)/viewRect.zw);}
vec4 background(vec2 p){
 if(target==2){vec4 b=texture2D(bgTex,p)*bgOpacity;vec4 color=b+vec4(.0392,.0431,.0627,1.0)*(1.0-b.a);color.rgb*=1.0-scanAmount*(1.0-step(1.0,mod(gl_FragCoord.y*cssHeight/size.y,3.0)));return color;}
 if(edges==3&&outsideView(p))return vec4(0.0);p=wrapUV(p);
 vec4 b=texture2D(bgTex,p)*bgOpacity;
 vec2 ellipse=(p-vec2(.5,.2))*size/vec2(1000.0,500.0);
 float glow=.1*(1.0-smoothstep(0.0,.6,length(ellipse)));
 vec3 base=mix(vec3(.0392,.0431,.0627),vec3(.486,.227,.929),glow);
 vec4 color=b+vec4(base,1.0)*(1.0-b.a);color.rgb*=1.0-scanAmount*(1.0-step(1.0,mod(gl_FragCoord.y*cssHeight/size.y,3.0)));return color;
}
vec4 visual(vec2 p){
 if(target!=1){if(edges==3&&outsideView(p))return vec4(0.0);p=wrapUV(p);}
 vec4 v=vec4(0.0);
 if(vizOpacity>0.0){v=texture2D(vizTex,p);
 if(vizBlur>0.0){vec2 d=vec2(vizBlur)/size;v=(v*4.0+texture2D(vizTex,p+vec2(d.x,0.0))+texture2D(vizTex,p-vec2(d.x,0.0))+texture2D(vizTex,p+vec2(0.0,d.y))+texture2D(vizTex,p-vec2(0.0,d.y)))/8.0;}}
 v*=vizOpacity;
 vec2 sp=(p-specRect.xy)/max(specRect.zw,vec2(.00001));
 if(!outside(sp)&&specOpacity>0.0){vec4 s=texture2D(specTex,sp)*specOpacity;
  float c=cos(specHue),sn=sin(specHue);vec3 axis=normalize(vec3(1.0));s.rgb=s.rgb*c+cross(axis,s.rgb)*sn+axis*dot(axis,s.rgb)*(1.0-c);
  v=s+v*(1.0-s.a);
 }return v;
}
vec4 compositeAt(vec2 uv){if(outside(uv))return vec4(0.0);vec2 p=warp(uv);vec4 b=background(target==2?uv:p),v=visual(target==1?uv:p);return v+b*(1.0-v.a);}
void main(){
 vec2 uv=vec2(gl_FragCoord.x/size.x,1.0-gl_FragCoord.y/size.y);vec4 c=compositeAt(uv);
 if(chromaPixels>0.0){vec2 shift=vec2(chromaPixels/size.x,0.0);vec4 r=compositeAt(uv-shift),b=compositeAt(uv+shift);c=vec4(r.r,c.g,b.b,1.0-(1.0-r.a)*(1.0-c.a)*(1.0-b.a));}
 if(sceneGray>0.0)c.rgb=mix(c.rgb,vec3(dot(c.rgb,vec3(.213,.715,.072))),sceneGray);
 if(sceneHue.x!=1.0||sceneHue.y!=0.0){
 float hc=sceneHue.x,hs=sceneHue.y;
 c.rgb=clamp(vec3(
 dot(c.rgb,vec3(.213+.787*hc-.213*hs,.715-.715*hc-.715*hs,.072-.072*hc+.928*hs)),
 dot(c.rgb,vec3(.213-.213*hc+.143*hs,.715+.285*hc+.140*hs,.072-.072*hc-.283*hs)),
 dot(c.rgb,vec3(.213-.213*hc-.787*hs,.715-.715*hc+.715*hs,.072+.928*hc+.072*hs))),0.0,c.a);
 }
 gl_FragColor=c;
}`;
App.mountDistortionGPU=function(){
 const scene=App.el('sceneContent'),background=App.el('sceneBackground'),visuals=App.el('sceneVisualizers'),status=App.el('distortionStatus');
 const canvas=document.createElement('canvas');canvas.id='distortionGPU';canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:5;pointer-events:none;display:none';scene.append(canvas);
 // Keep legacy CSS effects visible; final scanlines already have their separate layer.
 const legacy=App.el('bgFxOverlay');scene.append(legacy);legacy.style.zIndex='6';
 let gl,program,vertexBuffer,raf=0,last=0,nextFrame=0,broken=false,sizeKey='',maxTexture=4096,uniforms={},textures=[],allocated=[];
 const empty=new Uint8Array(4);
 let completionExt=null,submittedQueries=[],freeQueries=[],activeQuery=null;
 const metrics=App.SceneRenderMetrics={frames:0,cpuMsTotal:0,cpuMsMax:0,textureUploads:0,submittedTextureBytes:0,uniformWrites:0,chromaInShader:false};
 let uniformValues=new Map();
 function uniform1(method,key,value){if(uniformValues.get(key)===value)return;uniformValues.set(key,value);gl[method](uniforms[key],value);metrics.uniformWrites++;}
 function uniform2(key,a,b){const old=uniformValues.get(key);if(old&&old[0]===a&&old[1]===b)return;uniformValues.set(key,[a,b]);gl.uniform2f(uniforms[key],a,b);metrics.uniformWrites++;}
 function uniform4(key,a,b,c,d){const old=uniformValues.get(key);if(old&&old[0]===a&&old[1]===b&&old[2]===c&&old[3]===d)return;uniformValues.set(key,[a,b,c,d]);gl.uniform4f(uniforms[key],a,b,c,d);metrics.uniformWrites++;}
 const gpuChroma=s=>Number(s.postChroma)>0&&!Number(s.postGlitch)&&!s.fxChromaEnabled&&!s.fxDistortEnabled;
 const gpuColor=s=>!Number(s.postGlitch)&&!Number(s.postEdges)&&!s.fxChromaEnabled&&!s.fxDistortEnabled;
 function markColor(active){if(!!App.sceneGPUColorActive===active)return;App.sceneGPUColorActive=active;App.refreshSceneEffects?.();}
 function markChroma(active){if(!!App.sceneGPUChromaActive===active)return;App.sceneGPUChromaActive=active;App.refreshSceneEffects?.();}
 const n=(key,fallback,min,max)=>Math.max(min,Math.min(max,Number.isFinite(Number(App.settings[key]))?Number(App.settings[key]):fallback));
 function restore(message=''){markChroma(false);markColor(false);background.style.opacity='';visuals.style.opacity='';canvas.style.display='none';if(status)status.textContent=message;}
 function release(){
  if(gl&&completionExt&&activeQuery){completionExt.endQueryEXT(completionExt.TIME_ELAPSED_EXT);submittedQueries.push(activeQuery);}
  activeQuery=null;
  if(gl&&completionExt){for(const query of [...submittedQueries,...freeQueries])completionExt.deleteQueryEXT(query);}
  completionExt=null;submittedQueries=[];freeQueries=[];
  if(gl){gl.useProgram(null);textures.forEach(t=>gl.deleteTexture(t));if(vertexBuffer)gl.deleteBuffer(vertexBuffer);if(program)gl.deleteProgram(program);}
  textures=[];allocated=[];uniforms={};vertexBuffer=null;program=null;gl=null;sizeKey='';
  if(canvas.width!==1||canvas.height!==1){canvas.width=1;canvas.height=1;}
 }
 function stop(){if(raf)cancelAnimationFrame(raf);raf=0;last=0;nextFrame=0;restore();release();}
 function init(){
  uniformValues.clear();
  gl=canvas.getContext('webgl',{alpha:true,antialias:false,depth:false,stencil:false,premultipliedAlpha:true,powerPreference:'high-performance'});if(!gl)throw Error('WebGL unavailable');maxTexture=gl.getParameter(gl.MAX_TEXTURE_SIZE);
  completionExt=gl.getExtension('EXT_disjoint_timer_query');submittedQueries=[];freeQueries=[];activeQuery=null;
  const compile=(type,text)=>{const shader=gl.createShader(type);gl.shaderSource(shader,text);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw Error(error);}return shader;};
  let v,f;
  try{
    v=compile(gl.VERTEX_SHADER,'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}');f=compile(gl.FRAGMENT_SHADER,App.distortionFragment);
    program=gl.createProgram();gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);
  }finally{if(v)gl.deleteShader(v);if(f)gl.deleteShader(f);}
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
  vertexBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const p=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,2,gl.FLOAT,false,0,0);
  for(const key of ['bgTex','vizTex','specTex','size','center','specRect','viewRect','panorama','amount','radius','softness','zoom','inverted','kind','edges','target','bgOpacity','vizOpacity','specOpacity','vizBlur','specHue','sideVertical','scanAmount','cssHeight','chromaPixels'])uniforms[key]=gl.getUniformLocation(program,key);
  textures=[0,1,2].map(i=>{const t=gl.createTexture();gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,t);for(const key of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,key,gl.LINEAR);for(const key of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,key,gl.CLAMP_TO_EDGE);return t;});
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);['bgTex','vizTex','specTex'].forEach((key,i)=>gl.uniform1i(uniforms[key],i));allocated=[];sizeKey='';
  uniforms.sceneGray=gl.getUniformLocation(program,'sceneGray');uniforms.sceneHue=gl.getUniformLocation(program,'sceneHue');
 }
 function upload(i,source){
  gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,textures[i]);
  if(!source||!source.width||!source.height){if(allocated[i]!=='empty'){gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,empty);allocated[i]='empty';}return;}
  metrics.textureUploads++;metrics.submittedTextureBytes+=source.width*source.height*4;
  const key=source.width+'|'+source.height;
  if(allocated[i]===key)gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,gl.RGBA,gl.UNSIGNED_BYTE,source);
  else {gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);allocated[i]=key;}
 }
 function opacity(el){if(!el)return 0;const css=getComputedStyle(el);return css.display==='none'||css.visibility==='hidden'?0:Number(css.opacity);}
 function frame(now){
  raf=0;const s=App.getSceneSettings?.()||App.settings;
  if(document.hidden||!App.VisualRenderState.active||(!Number(s.postFish)&&(Number(s.postZoom)||1)===1&&!gpuChroma(s))){stop();return;}
  const budget=1000/n('postDistortFps',60,30,240);if(now+.15<nextFrame){raf=requestAnimationFrame(frame);return;}
  nextFrame=nextFrame?nextFrame+budget*(1+Math.floor(Math.max(0,now-nextFrame)/budget)):now+budget;last=now;
  const started=typeof performance!=='undefined'?performance.now():0;
  try{
   if(!gl)init();const bg=App.el('bgWorkerCanvas'),viz=App.el('musicVisualizerCanvas'),spec=App.el('spectrogramCanvas'),specLayer=App.el('spectrogramLayer');
   // Bound in-flight compositor submissions without waiting on the GPU. A slow
   // driver must not accumulate an unlimited queue of full-canvas uploads.
   if(completionExt){
     while(submittedQueries.length&&completionExt.getQueryObjectEXT(submittedQueries[0],completionExt.QUERY_RESULT_AVAILABLE_EXT))freeQueries.push(submittedQueries.shift());
     if(submittedQueries.length>=3){metrics.gpuBackpressureSkips=(metrics.gpuBackpressureSkips||0)+1;raf=requestAnimationFrame(frame);return;}
   }
   if(s.bgEnabled!==false&&!bg){restore('Distortion requires the background canvas renderer.');raf=requestAnimationFrame(frame);return;}
   const rect=scene.getBoundingClientRect(),dpr=App.scenePixelRatio(rect.width,rect.height),w=Math.max(1,Math.min(maxTexture,Math.round(rect.width*dpr))),h=Math.max(1,Math.min(maxTexture,Math.round(rect.height*dpr))),key=w+'|'+h;
   // Finish layout/style reads before resizing the output or submitting GL work.
   const ba=s.bgEnabled===false?0:opacity(App.el('bgGlow')),va=s.vizMode==='none'?0:opacity(viz),sa=s.specEnabled===false||s.specInsideIsland?0:opacity(spec)*opacity(specLayer);
   const sr=sa?spec.getBoundingClientRect():rect;
   if(sizeKey!==key){canvas.width=w;canvas.height=h;sizeKey=key;gl.viewport(0,0,w,h);}
   gl.useProgram(program);
   const completion=completionExt?(freeQueries.pop()||completionExt.createQueryEXT()):null;
   if(completion){completionExt.beginQueryEXT(completionExt.TIME_ELAPSED_EXT,completion);activeQuery=completion;}
   upload(0,ba?bg:null);upload(1,va?viz:null);upload(2,sa?spec:null);
   // Producers and shader share the actual visible scene surface.
   uniform4('viewRect',0,0,1,1);
   const chroma=gpuChroma(s)?n('postChroma',0,0,24):0;uniform1('uniform1f','chromaPixels',chroma*w/rect.width);
   const color=gpuColor(s),hue=color?n('postHue',0,0,360)*Math.PI/180:0;
   uniform1('uniform1f','sceneGray',color?n('postGray',0,0,1):0);uniform2('sceneHue',Math.cos(hue),Math.sin(hue));
   uniform1('uniform1f','sideVertical',n('postPanoramaVertical',1,0,1));
   uniform1('uniform1f','scanAmount',s.scanlineTarget==='background'?n('fxScanlines',0,0,1)*.9*.35:0);uniform1('uniform1f','cssHeight',rect.height);
   uniform1('uniform1i','panorama',s.postMaskShape==='panorama'?1:0);
   uniform2('size',w,h);uniform2('center',n('postCenterX',.5,0,1),n('postCenterY',.5,0,1));
   uniform4('specRect',(sr.left-rect.left)/rect.width,(sr.top-rect.top)/rect.height,sr.width/rect.width,sr.height/rect.height);
   for(const [uniform,key,f,min,max] of [['amount','postFish',0,-1,1],['radius','postRadius',.7,0,1],['softness','postMaskSoftness',.2,.01,1],['zoom','postZoom',1,.5,2]])uniform1('uniform1f',uniform,n(key,f,min,max));
   uniform1('uniform1f','inverted',s.postInvertMask?1:0);uniform1('uniform1f','bgOpacity',ba);uniform1('uniform1f','vizOpacity',va);uniform1('uniform1f','specOpacity',sa);
   uniform1('uniform1f','vizBlur',n(s.vizMode==='ring'?'vizRingBlur':s.vizMode==='wave'?'vizWaveBlur':'vizEqBlur',0,0,12)*dpr);uniform1('uniform1f','specHue',n('specHueOffset',0,-180,180)*Math.PI/180);
   uniform1('uniform1i','kind',Math.max(0,['fisheye','bubble','twist','pinch','waves'].indexOf(s.postWarpType)));uniform1('uniform1i','edges',Math.max(0,['clamp','mirror','repeat','transparent'].indexOf(s.postEdgeMode||'mirror')));uniform1('uniform1i','target',s.postDistortTarget==='background'?1:s.postDistortTarget==='visualizers'?2:0);
   gl.drawArrays(gl.TRIANGLES,0,6);
   if(completion){completionExt.endQueryEXT(completionExt.TIME_ELAPSED_EXT);submittedQueries.push(completion);activeQuery=null;}
   if(background.style.opacity!=='0')background.style.opacity='0';
   if(visuals.style.opacity!=='0')visuals.style.opacity='0';
   if(canvas.style.display!=='block')canvas.style.display='block';
   if(status&&status.textContent)status.textContent='';
   raf=requestAnimationFrame(frame);markChroma(chroma>0);markColor(color);
   const elapsed=typeof performance!=='undefined'?performance.now()-started:0;metrics.frames++;metrics.cpuMsTotal+=elapsed;metrics.cpuMsMax=Math.max(metrics.cpuMsMax,elapsed);metrics.chromaInShader=chroma>0;
  }catch(error){broken=true;release();restore('Distortion unavailable: '+error.message);console.warn('Aurora distortion:',error);}
 }
 function refresh(){if(!broken&&!raf)raf=requestAnimationFrame(frame);}
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();if(raf)cancelAnimationFrame(raf);raf=0;gl=null;release();broken=true;restore('Restoring distortion renderer…');});canvas.addEventListener('webglcontextrestored',()=>{broken=false;refresh();});
 window.addEventListener('pagehide',event=>{stop();if(!event.persisted&&gl){textures.forEach(t=>gl.deleteTexture(t));gl.deleteBuffer(vertexBuffer);gl.deleteProgram(program);gl=null;}});
 App.refreshDistortionGPU=refresh;App.VisualRenderState.subscribe(refresh);refresh();
};
})(window.Aurora);
