// Native browser checks for help, keyboard/touch access and dynamic editors.
const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.AURORA_PLAYWRIGHT||'playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.AURORA_CHROME,headless:true});
 try{
  for(const width of [1440,760,390]){
   const context=await browser.newContext({viewport:{width,height:1000},hasTouch:width===390}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.resolve('index.html')).href);
   await page.evaluate(()=>{const s=Aurora.SettingsUI;s.uiPrefs.motion=false;s.open(true);s.select('playback',true,'general');});
   const label=page.locator('#sw-autoplayOnImport').locator('..').locator('[data-settings-help]'),tip=page.locator('#settingsHelpTooltip');
   const settings=await page.evaluate(()=>JSON.stringify(Aurora.settings));
   if(width===390)await label.tap();else await label.hover();
   await tip.waitFor({state:'visible'});assert.match(await tip.innerText(),/playback|starts/);
   assert.equal(await label.getAttribute('title'),null,'Native title does not compete with description');
   const rect=await tip.boundingBox();assert(rect.x>=11&&rect.x+rect.width<=width-11&&rect.y>=11&&rect.y+rect.height<=1000-11);
   await page.screenshot({path:`review-screenshots/hover-settings-${width}.png`});
   await page.mouse.move(1,1);await page.locator('#settingsSearch').focus();await tip.waitFor({state:'hidden'});
   await label.focus();await tip.waitFor({state:'visible'});assert(await label.getAttribute('aria-describedby'));
   assert(await page.locator('#sw-autoplayOnImport').getAttribute('aria-describedby'));
   await page.keyboard.press('Escape');await tip.waitFor({state:'hidden'});
   await page.evaluate(()=>{const s=Aurora.SettingsUI;s.open(true);s.select('appearance',true,'player');});
   const heading=page.locator('#sec-player-values > h3');assert.match(await heading.innerText(),/MusicSense.*on screen live values/);
   await heading.scrollIntoViewIfNeeded();await heading.focus();await tip.waitFor({state:'visible'});assert.match(await tip.innerText(),/bass, mid, high/);
   await page.evaluate(()=>{const n=document.getElementById('auroraLanguage');n.value='cs';n.dispatchEvent(new Event('change',{bubbles:true}));});
   await heading.focus();await heading.click();await tip.waitFor({state:'visible'});assert.match(await heading.innerText(),/živé hodnoty/);assert.match(await tip.innerText(),/Živé hodnoty basů/);
   assert.equal(await page.locator('.settings-help').count(),0,'No Details disclosure buttons remain');
   assert.equal(await page.evaluate(()=>JSON.stringify(Aurora.settings)),settings,'Reading help preserves all settings');
   await page.evaluate(()=>{const s=Aurora.SettingsUI;s.advanced=true;s.applyAdvanced();s.select('background',true,'background');Aurora.openLayerGear=0;Aurora.renderBgLayers();});
   const before=await page.locator('[data-settings-help]').count();
   await page.evaluate(()=>{for(let i=0;i<15;i++)Aurora.renderBgLayers();});
   assert.equal(await page.locator('[data-settings-help]').count(),before,'Repeated editors do not duplicate help');
   const audit=await page.evaluate(()=>{
    const labels=[...document.querySelectorAll('[data-settings-help]')];
    return {broken:labels.filter(n=>(n.getAttribute('aria-describedby')||'').split(' ').some(id=>!document.getElementById(id))).map(n=>n.textContent),fpsHelp:document.getElementById('senseFps').hasAttribute('data-settings-help'),remaining:[...Aurora.SettingsUI.content.querySelectorAll('.hint,.range-hint')].filter(n=>!n.id&&!n.hidden&&!n.querySelector('button,input,a')).map(n=>n.textContent),max:['renderFps','vizFps','postDistortFps'].map(k=>document.getElementById('ctl-'+k).max)};
   });
   assert.deepEqual(audit.broken,[]);assert.equal(audit.fpsHelp,false);assert.deepEqual(audit.remaining,[]);assert.deepEqual(audit.max,['240','240','240']);
   assert.deepEqual(errors,[]);await context.close();
  }
  console.log('PASS: contextual help at 1440/760/390 px, hover/focus/touch, language changes, ARIA links, no setting changes, dynamic editors and 240 FPS controls.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
