// Optional native DOM retention test; same Playwright/Chrome environment as memory-browser.cjs.
const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.AURORA_PLAYWRIGHT||'playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.AURORA_CHROME,headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.resolve('index.html')).href);
  const cdp=await page.context().newCDPSession(page);
  await page.evaluate(()=>{
   const a=Aurora;a.SettingsUI.uiPrefs.motion=false;a.SettingsUI.open(true);a.SettingsUI.select('background');
   a.openLayerGear=0;
   for(const t of a.BG_MAP_TARGETS)a.settings.bgLayers[0].overrides[t.overrideKey]=a.createLayerOverride(t);
   a.renderBgLayers();a.renderBgMappingRows();a.updateBgMapLiveValues();
  });
  await page.waitForTimeout(250);await cdp.send('HeapProfiler.collectGarbage');
  const before=await cdp.send('Memory.getDOMCounters');
  for(let batch=0;batch<6;batch++){
   for(let i=0;i<10;i++){
    await page.evaluate(()=>{
     const a=Aurora;a.SettingsUI.index();a.renderBgLayers();a.renderBgMappingRows();a.updateBgMapLiveValues();
    });
    await page.evaluate(()=>Aurora.el('bgLayerList').querySelector('select')._auroraSelectButton.click());
    await page.keyboard.press('Escape');
   }
   await page.waitForTimeout(150);await cdp.send('HeapProfiler.collectGarbage');
   console.log(JSON.stringify({batch,dom:await cdp.send('Memory.getDOMCounters')}));
  }
  const retained=await page.evaluate(()=>({menu:Aurora.el('auroraSelectMenu').childElementCount,detachedReadouts:[...Aurora._liveValNodeCache.values()].filter(v=>v.pill&&!v.pill.isConnected).length,staleSearch:Aurora.SettingsUI.results.filter(r=>r.row&&!r.row.isConnected).length,paletteSheets:document.querySelectorAll('#aurora-live-palette').length}));
  assert.equal(retained.menu,0);assert.equal(retained.detachedReadouts,0);assert.equal(retained.staleSearch,0);assert.equal(retained.paletteSheets,1);
  const after=await cdp.send('Memory.getDOMCounters');
  assert(after.nodes<before.nodes+1000,`Detached panels must be collectable: ${JSON.stringify({before,after})}`);
  assert(after.jsEventListeners<before.jsEventListeners+100,'Rebuilding panels must not accumulate handlers');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({pass:true,before,after,retained}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
