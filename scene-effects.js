/* Scene-only postprocessing. DOM/canvas workers remain independent producers;
   browser SVG filters operate on their composed surface, never on the UI. */
(function(App){
// Mobile restrictions affect rendering only; desktop preferences stay saved.
App.getSceneSettings=function(){
  if(!App.mobileSceneDisabled)return App.settings;
  const settings={...App.settings,bgEnabled:false,fxOverallOpacity:0,postZoom:1};
  for(const key of ['postFish','postPixel','postChroma','postGlitch','postEdges','postGray','postHue','postVignette','fxScanlines'])settings[key]=0;
  return settings;
};
App.addStyle(42,`
#sceneContent{position:absolute;inset:0 var(--player-reserve,0px) 0 0;pointer-events:none;isolation:isolate;z-index:0;overflow:hidden;background:radial-gradient(1000px 500px at 50% 20%,#7c3aed19,transparent 60%),#0a0b10;}
#sceneBackground,#sceneVisualizers{position:absolute;inset:0;pointer-events:none;}
#sceneBackground{background:radial-gradient(1000px 500px at 50% 20%,#7c3aed19,transparent 60%),#0a0b10;}
#sceneFinalOverlay{position:absolute;inset:0 var(--player-reserve,0px) 0 0;pointer-events:none;z-index:1;overflow:hidden;}
#sceneVignette{position:absolute;inset:0;pointer-events:none;}
#sceneVignette{background:radial-gradient(ellipse at center,transparent 30%,#000 100%);}

#sceneFinalOverlay .fx-scanline-layer{z-index:2;}
#ctl-vizStaticColor{width:160px;max-width:100%;padding:9px 12px;border:1px solid #ffffff28;border-radius:10px;background:#151520;color:var(--text,#eee);font:500 13px var(--font-mono,monospace);color-scheme:dark;outline:none;}
#ctl-vizStaticColor:focus{border-color:var(--player-c1);box-shadow:0 0 0 2px color-mix(in srgb,var(--player-c1) 20%,transparent);}
#ctl-vizStaticColor[aria-invalid="true"]{border-color:#ff405c;}
`);
// Inverse mapping: negative strength reverses every deformation.
App.sceneWarpPoint=function(s,u,v,out=[]){
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const n=(key,fallback,a,b)=>clamp(Number.isFinite(Number(s[key]))?Number(s[key]):fallback,a,b);
  const amount=n('postFish',0,-1,1),cx=n('postCenterX',.5,0,1),cy=n('postCenterY',.5,0,1),zoom=n('postZoom',1,.5,2);
  let x=(u-cx)/zoom,y=(v-cy)/zoom;
  const radius=n('postRadius',.7,.1,1.5),r=Math.hypot(x,y)/radius,fall=Math.max(0,1-r),type=s.postWarpType||'fisheye';
  if(type==='twist'){
    const angle=amount*fall*fall*3,c=Math.cos(angle),sn=Math.sin(angle),xx=x*c-y*sn;y=x*sn+y*c;x=xx;
  }else{
    let scale=1;
    if(type==='bubble')scale=1-amount*fall*fall*.75;
    else if(type==='pinch')scale=1+amount*fall*fall*1.8;
    else if(type==='waves')scale=1+amount*Math.sin(r*18)*fall*fall*.18;
    else scale=1+amount*(r*r/(1+r*r))*.9;
    scale=clamp(scale,.1,4);x*=scale;y*=scale;
  }
  out[0]=cx+x;out[1]=cy+y;return out;
};
App.scenePixelSize=function(s){const requested=Number(s.postPixel)||0;return requested>=2?Math.min(65,Math.floor(requested/2)*2+1):0;};
App.buildSceneFilter=function(s,mapUrl,w,h,phase=0){
  const num=(key,max)=>Math.max(0,Math.min(max,Number(s[key])||0));
  let current='SourceGraphic',out='',i=0;
  const next=()=> 'scene'+(++i);
  if(mapUrl){
    const result=next();out+=`<feImage href="${typeof mapUrl==='string'?mapUrl:mapUrl.url}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="warpRaw"/><feGaussianBlur in="warpRaw" stdDeviation="1.5" edgeMode="duplicate" result="warp"/><feDisplacementMap in="${current}" in2="warp" scale="${typeof mapUrl==='string'?Math.max(w,h)*2:mapUrl.scale}" xChannelSelector="R" yChannelSelector="G" result="${result}"/>`;current=result;
  }
  const glitch=num('postGlitch',1);
  if(glitch){
    const result=next();out+=`<feTurbulence type="turbulence" baseFrequency="0.002 0.16" numOctaves="1" seed="${Math.floor(phase)}" result="noise"/><feDisplacementMap data-glitch="true" in="${current}" in2="noise" scale="${glitch*(phase%7===0?65:8)}" xChannelSelector="R" yChannelSelector="G" result="${result}"/>`;current=result;
  }
  const chroma=num('postChroma',24);
  if(chroma){
    const result=next();
    out+=`<feOffset in="${current}" dx="${chroma}" result="redOffset"/><feOffset in="${current}" dx="${-chroma}" result="blueOffset"/>`;
    out+='<feColorMatrix in="redOffset" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red"/>';
    out+=`<feColorMatrix in="${current}" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green"/>`;
    out+='<feColorMatrix in="blueOffset" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue"/>';
    out+=`<feBlend in="red" in2="green" mode="screen" result="rg"/><feBlend in="rg" in2="blue" mode="screen" result="${result}"/>`;current=result;
  }
  const edges=num('postEdges',1);
  if(edges){
    const result=next();out+=`<feConvolveMatrix in="${current}" order="2 2" kernelMatrix="0 0 0 1" targetX="0" targetY="0" edgeMode="duplicate" preserveAlpha="true" result="edgeNeighbor"/><feBlend in="${current}" in2="edgeNeighbor" mode="difference" result="edgeDelta"/><feComposite in="edgeDelta" in2="${current}" operator="arithmetic" k1="0" k2="${edges*3}" k3="${1-edges}" k4="0" result="${result}"/>`;current=result;
  }
  if(num('postGray',1)){const result=next();out+=`<feColorMatrix in="${current}" type="saturate" values="${1-num('postGray',1)}" result="${result}"/>`;current=result;}
  if(num('postHue',360)){const result=next();out+=`<feColorMatrix in="${current}" type="hueRotate" values="${num('postHue',360)}" result="${result}"/>`;current=result;}
  const pixel=App.scenePixelSize(s);
  if(pixel){
    // Sample one source pixel per cell, then expand it into a uniform square.
    // No displacement interpolation, so the output has a regular, crisp grid.
    const radius=(pixel-1)/2,result=next();
    const tile='data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${pixel}" height="${pixel}"><rect x="${radius}" y="${radius}" width="1" height="1" fill="white"/></svg>`);
    out+=`<feImage href="${tile}" x="0" y="0" width="${pixel}" height="${pixel}" result="pixelTile"/><feTile in="pixelTile" x="0" y="0" width="${w}" height="${h}" result="pixelGrid"/><feComposite in="${current}" in2="pixelGrid" operator="in" result="pixelSamples"/><feMorphology in="pixelSamples" operator="dilate" radius="${radius}" result="${result}"/>`;current=result;

  }
  return out;
};
App.define('stage/scene-effects',function(){
  const scene=App.el('sceneContent'),overlay=App.el('sceneFinalOverlay');
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
  svg.setAttribute('width','0');svg.setAttribute('height','0');svg.setAttribute('aria-hidden','true');svg.style.position='absolute';
  const filter=document.createElementNS(ns,'filter');filter.id='auroraSceneFilter';filter.setAttribute('filterUnits','userSpaceOnUse');filter.setAttribute('color-interpolation-filters','sRGB');svg.append(filter);App.stage.append(svg);
  const vignette=document.createElement('div');vignette.id='sceneVignette';overlay.prepend(vignette);
  let graphKey='',settingsKey='',timer=0,phase=0,raf=0;
  App.mountDistortionGPU();
  function apply(){
    raf=0;const s=App.getSceneSettings(),r=scene.getBoundingClientRect(),w=Math.max(1,Math.round(r.width)),h=Math.max(1,Math.round(r.height));
    const nextKey=JSON.stringify([w,h,!!App.sceneGPUChromaActive,!!App.sceneGPUColorActive,...['postPixel','postDistortTarget','postFish','postWarpType','postCenterX','postCenterY','postZoom','postRadius','postChroma','postGlitch','postEdges','postGray','postHue'].map(k=>s[k])]);
    if(nextKey!==settingsKey){
      settingsKey=nextKey;
      const remaining={...s};if(App.sceneGPUChromaActive)remaining.postChroma=0;if(App.sceneGPUColorActive){remaining.postGray=0;remaining.postHue=0;}
      graphKey=App.buildSceneFilter(remaining,'',w,h,0);filter.innerHTML=graphKey;
    }
    if(s.postGlitch>0){filter.querySelector('feTurbulence')?.setAttribute('seed',phase);filter.querySelector('[data-glitch]')?.setAttribute('scale',Math.max(0,Math.min(1,Number(s.postGlitch)||0))*(phase%7===0?65:8));}
    for(const node of [filter]){node.setAttribute('x','0');node.setAttribute('y','0');node.setAttribute('width',w);node.setAttribute('height',h);}
    scene.style.filter=graphKey?'url(#auroraSceneFilter)':'none';
    vignette.style.opacity=String(Math.max(0,Math.min(1,Number(s.postVignette)||0)));
    const scan=App.FxEngine?._scanEl,parent=App.el(s.scanlineTarget==='background'?'sceneBackground':'sceneFinalOverlay');
    if(scan&&parent&&scan.parentElement!==parent)parent.append(scan);
    const preview=App.el('vizColorPreview');if(preview)preview.style.background=s.vizStaticColor;
    clearTimeout(timer);timer=0;
    if(s.postGlitch>0&&!document.hidden&&App.VisualRenderState.active)timer=setTimeout(()=>{phase++;refresh();},1000/15);
  }
  function refresh(){App.refreshDistortionGPU?.();if(!raf)raf=requestAnimationFrame(apply);}
  const colors=App.el('vizColorSwatches');
  if(colors)for(const color of ['#7c3aed','#55eaff','#ff2ec4','#ff304f','#a9ff37','#ffffff']){
    const button=document.createElement('button');button.type='button';button.className='swatch';button.style.background=color;button.setAttribute('aria-label',color);
    button.addEventListener('click',()=>{const input=App.el('ctl-vizStaticColor');input.value=color;input.dispatchEvent(new Event('change',{bubbles:true}));});colors.append(button);
  }
  App.refreshSceneEffects=refresh;new ResizeObserver(refresh).observe(scene);App.VisualRenderState.subscribe(refresh);document.addEventListener('visibilitychange',refresh);refresh();
},['sceneWarpPoint','scenePixelSize','buildSceneFilter','refreshSceneEffects']);
})(window.Aurora);
