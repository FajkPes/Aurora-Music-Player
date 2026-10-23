// Native pixel regression: vector fast path against the former raster pipeline.
const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.AURORA_PLAYWRIGHT||'playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.AURORA_CHROME,headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  await page.goto(pathToFileURL(path.resolve('index.html')).href);
  await page.waitForFunction(()=>Aurora.Threads.backgroundActive);
  let worker;
  for(const w of page.workers())if(await w.evaluate(()=>self.name)==='Aurora background')worker=w;
  assert(worker);
  const results=await worker.evaluate(()=>{
   setActive(false);
   const savedCtx=sceneCtx,savedBox=stageBox;
   const results=[];
   try{
    stageBox={w:400,h:400};
    for(const shape of Object.keys(BlobShapes))for(const rotation of [0,37])for(const size of [64,240]){
     const oldCanvas=new OffscreenCanvas(400,400),newCanvas=new OffscreenCanvas(400,400);
     const old=oldCanvas.getContext('2d'),fresh=newCanvas.getContext('2d');
     // Legacy 384px white mask, colored with source-in, then transformed.
     const mask=blobSprite(shape,.4,0),tint=new OffscreenCanvas(384,384),c=tint.getContext('2d');
     c.drawImage(mask,0,0);c.globalCompositeOperation='source-in';
     c.fillStyle=BlobShapes[shape].radial?radialFill(c,'#38acde',192,64):'#38acde';c.fillRect(0,0,384,384);
     old.translate(200,200);old.scale(-1,1);old.rotate(rotation*Math.PI/180);
     old.globalAlpha=.6;old.globalCompositeOperation='screen';old.drawImage(tint,-size*1.5,-size*1.5,size*3,size*3);
     sceneCtx=fresh;stamp(200,200,size,'#38acde',.6,rotation,0,shape,.4,-1,1);
     const a=old.getImageData(0,0,400,400).data,b=fresh.getImageData(0,0,400,400).data;
     let delta=0,alphaA=0,alphaB=0;
     // Compare premultiplied RGB: RGB of nearly transparent edge pixels is irrelevant.
     for(let i=0;i<a.length;i+=4){
      alphaA+=a[i+3];alphaB+=b[i+3];delta+=Math.abs(a[i+3]-b[i+3]);
      for(let k=0;k<3;k++)delta+=Math.abs(a[i+k]*a[i+3]-b[i+k]*b[i+3])/255;
     }
     results.push({shape,rotation,size,meanDelta:delta/a.length,areaRatio:alphaB/alphaA});
    }
   }finally{sceneCtx=savedCtx;stageBox=savedBox;}
   return results;
  });
  for(const r of results){assert(r.meanDelta<1.5,JSON.stringify(r));assert(Math.abs(r.areaRatio-1)<.04,JSON.stringify(r));}
  console.log('PASS: '+results.length+' native shape/rotation/size/mirror comparisons; worst mean pixel delta '+Math.max(...results.map(r=>r.meanDelta)).toFixed(3)+'.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
