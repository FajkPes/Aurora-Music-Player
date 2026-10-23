// Compare native computed colors with the compatible inherited palette path.
const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.AURORA_PLAYWRIGHT||'playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.AURORA_CHROME,headless:true});
 try{
  const samples=[];
  for(const inherited of [true,false]){
   const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   if(inherited)await page.addInitScript(()=>{CSS.registerProperty=undefined;});
   await page.goto(pathToFileURL(path.resolve('index.html')).href);
   await page.evaluate(()=>{
    const a=Aurora;a.VisualRenderState.setActive(false);a.settings.playerColorSync=false;
    a.settings.playerColor1='#18dd66';a.settings.playerColor2='#6633ee';a.settings.playerSyncScanline=true;a.PlayerColors.update();
    a.SettingsUI.uiPrefs.motion=false;a.SettingsUI.open(true);a.SettingsUI.select('appearance','', 'colors');
    const s=document.createElement('style');s.textContent='*,*::before,*::after{animation:none!important;transition:none!important;}';document.head.append(s);
   });
   await page.waitForTimeout(100);
   const sample=await page.evaluate(()=>{
    const selectors=new Set(),visit=rules=>{for(const r of rules){if(r.style&&r.selectorText&&/var\(\s*--player-c[12](?:\b|-)/.test(r.style.cssText))selectors.add(r.selectorText);if(r.cssRules)visit(r.cssRules);}};
    for(const sheet of document.styleSheets)try{visit(sheet.cssRules);}catch{}
    const values={};
    for(const selector of selectors){
     const pseudos=['',...(selector.includes('::before')?['::before']:[]),...(selector.includes('::after')?['::after']:[])];
     const nodes=document.querySelectorAll(selector.replace(/::(?:before|after)/g,''));
     nodes.forEach((node,i)=>{for(const pseudo of pseudos){const css=getComputedStyle(node,pseudo||null);values[selector+'|'+i+pseudo]=['color','backgroundImage','backgroundColor','borderColor','boxShadow','fill','stroke','outlineColor'].map(k=>css[k]);}});
    }
    return values;
   });
   assert.deepEqual(errors,[]);samples.push(sample);await page.close();
  }
  assert(Object.keys(samples[0]).length>=20,'Compare real consumers, including controls and pseudo-elements');
  assert.deepEqual(samples[1],samples[0],'Targeted palette preserves actual rendered CSS colors');
  console.log('PASS: native CSS palette parity for '+Object.keys(samples[0]).length+' element/pseudo-element matches.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
