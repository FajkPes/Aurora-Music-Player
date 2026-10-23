// Optional native Chromium verification of the complete settings hierarchy.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.AURORA_PLAYWRIGHT||'playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.AURORA_CHROME,headless:true});
 try{
  const problems=[],counts=[];
  for(const [width,height,lang] of [[1080,1136,'en'],[760,900,'en'],[390,844,'cs']]){
   const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(pathToFileURL(path.resolve('index.html')).href);
   await page.evaluate(lang=>{const a=Aurora;a.SettingsUI.uiPrefs.motion=false;a.SettingsUI.open(true);const select=document.getElementById('auroraLanguage');select.value=lang;select.dispatchEvent(new Event('change',{bubbles:true}));},lang);
   await page.waitForTimeout(100);
   const inventory=await page.evaluate(()=>{
    const s=Aurora.SettingsUI,root=s.content,controls=[...root.querySelectorAll('input:not([type=file]),select,.switch')];
    const visibleBasics=controls.filter(c=>!c.closest('[data-advanced]')).length;
    const ids=[...document.querySelectorAll('[id]')].map(n=>n.id),duplicates=ids.filter((id,i)=>ids.indexOf(id)!==i);
    return {all:controls.length,basic:visibleBasics,duplicates,settings:JSON.stringify(Aurora.settings),pages:Object.entries(s.groups).flatMap(([key,g])=>g.pages.map(p=>({key,page:p.key,advanced:!!p.advanced})))};
   });
   counts.push({width,all:inventory.all,basic:inventory.basic});assert(inventory.basic<inventory.all*.4,'Basic mode removes most fine controls');assert.deepEqual(inventory.duplicates,[]);
   for(const advanced of [false,true]){
    await page.evaluate(advanced=>{Aurora.SettingsUI.advanced=advanced;Aurora.SettingsUI.applyAdvanced();},advanced);
    for(const item of inventory.pages.filter(p=>advanced||!p.advanced)){
     await page.evaluate(item=>{
      const s=Aurora.SettingsUI;s.select(item.key,true,item.page);
      if(item.key==='background'&&item.page==='background'){Aurora.openLayerGear=0;Aurora.renderBgLayers();}
      const panel=s.groups[item.key].pages.find(p=>p.key===item.page).panel;
      panel.querySelectorAll('details:not(.settings-help)').forEach(d=>d.open=true);
     },item);
     const audit=await page.evaluate(async()=>{
      await new Promise(requestAnimationFrame);
      const root=Aurora.SettingsUI.panel,visible=n=>n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden';
      const clipped=[...root.querySelectorAll('button,.range-label-row,.map-subrow-label,.settings-field-grid,.layer-control-grid')].filter(visible).filter(n=>n.scrollWidth>n.clientWidth+3).map(n=>({id:n.id,cls:n.className,text:n.textContent.trim().slice(0,80),w:n.clientWidth,scroll:n.scrollWidth}));
      return {clipped,leakedAdvanced:!Aurora.SettingsUI.advanced&&[...root.querySelectorAll('[data-advanced]')].some(visible),contentHeight:Aurora.SettingsUI.content.clientHeight,contentOverflow:Aurora.SettingsUI.content.scrollWidth-Aurora.SettingsUI.content.clientWidth};
     });
     if(audit.clipped.length||audit.leakedAdvanced||audit.contentOverflow>3||audit.contentHeight<120)problems.push({width,lang,advanced,...item,...audit});
    }
   }
   // Changing the mode is presentation only: it cannot overwrite preferences.
   assert.equal(await page.evaluate(()=>JSON.stringify(Aurora.settings)),inventory.settings);
   if(width===1080){
    assert.equal(await page.locator('#ctl-fxScanlines').evaluate(n=>n.closest('.settings-page').id),'page-appearance-filters');
    assert.equal(await page.locator('#bgCustomColor1').evaluate(n=>n.closest('.settings-page').id),'page-background-colors');
    assert.equal(await page.locator('#ctl-ctrlTrackAlign').evaluate(n=>n.closest('.settings-page').id),'page-appearance-cards');
    await page.evaluate(()=>{const s=Aurora.SettingsUI;s.advanced=false;s.applyAdvanced();});
    await page.locator('#settingsSearch').fill('fft');await page.waitForTimeout(180);
    assert(await page.locator('.settings-result').count()>0,'Hidden advanced options remain searchable');
    await page.locator('.settings-result').first().click();
    assert(await page.evaluate(()=>Aurora.SettingsUI.advanced));assert(await page.locator('#ctl-fftIdx').isVisible());
    await page.locator('.settings-advanced').click();
    assert.equal(await page.evaluate(()=>Aurora.SettingsUI.advanced),false);
    assert(await page.evaluate(()=>!Aurora.SettingsUI.groups.live.pages.find(p=>p.key===Aurora.SettingsUI.groups.live.selected).advanced),'Hiding advanced switches to an available page');
    await page.evaluate(()=>{Aurora.SettingsUI.select('visualizers',true,'general');});
    assert.equal(await page.locator('#ctl-vizStaticColor').isVisible(),false);
    await page.locator('#ctl-vizColorMode').selectOption('static',{force:true});assert(await page.locator('#ctl-vizStaticColor').isVisible());
    await page.locator('#ctl-vizColorMode').selectOption('theme',{force:true});assert.equal(await page.locator('#ctl-vizStaticColor').isVisible(),false);
   }
   await page.evaluate(()=>{const s=Aurora.SettingsUI;s.advanced=false;s.applyAdvanced();s.select('playback',true,'general');});
   await page.screenshot({path:`review-screenshots/settings-general-${width}-${lang}.png`});
   await page.evaluate(()=>{Aurora.SettingsUI.select('background',true,'background');});
   await page.screenshot({path:`review-screenshots/settings-background-${width}-${lang}.png`});
   assert.deepEqual(errors,[]);await context.close();
  }
  fs.writeFileSync('backups/settings-reorganization-2026-10-01/layout-audit.json',JSON.stringify({counts,problems},null,2));
  assert.deepEqual(problems,[],'Every settings page must fit in basic/advanced modes at desktop, tablet and mobile widths');
  console.log('PASS: all settings pages, basic/advanced policy, saved values, search, conditional controls, unique IDs and responsive sizing. '+JSON.stringify(counts));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
