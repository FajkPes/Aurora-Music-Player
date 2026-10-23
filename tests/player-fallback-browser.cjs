const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.AURORA_PLAYWRIGHT||'playwright');
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.AURORA_CHROME,headless:true,args:['--autoplay-policy=no-user-gesture-required']});
  try{
    for(const mode of ['workers-off','storage-denied']){
      const page=await browser.newPage({viewport:{width:1100,height:800}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
      await page.addInitScript(mode=>{
        if(mode==='workers-off')window.Worker=undefined;
        else{
          Storage.prototype.getItem=()=>{throw new DOMException('denied','SecurityError');};
          Storage.prototype.setItem=()=>{throw new DOMException('denied','SecurityError');};
          Object.defineProperty(window,'indexedDB',{value:undefined});
        }
      },mode);
      await page.goto(pathToFileURL(path.resolve('index.html')).href);assert(await page.evaluate(()=>Aurora.started));
      await page.evaluate(async()=>{
        const a=Aurora;a.settings.normalize=false;a.settings.timelineLoudnessWaveform=false;a.settings.autoplayOnImport=false;a.settings.randomFirstTrack=false;
        // A deliberately corrupt media file exercises actual decoder failure.
        await a.addFiles([new File(['not audio'],'Žlutý kůň - Rozbitá.wav',{type:'audio/wav'})]);
      });
      await page.waitForFunction(()=>Aurora.audio.error!==null);
      assert.equal(await page.evaluate(()=>Aurora.state.isPlaying||Aurora.playbackPending),false);
      await page.evaluate(async()=>{
        const a=Aurora;a.searchInputEl.value='kun rozbita';await a.renderTrackList();
      });
      assert.equal(await page.evaluate(()=>Aurora.vt.filtered.length),1);
      await page.evaluate(async()=>{Aurora.searchInputEl.value='missing';await Aurora.renderTrackList();await Aurora.renderTrackList();});
      assert.equal(await page.evaluate(()=>Aurora.vt.filtered.length),0);assert(await page.locator('#dropHint').isVisible());
      await page.evaluate(()=>{Aurora.Session.save();Aurora.ProfileStore._flushPersist();});
      if(mode==='storage-denied'){
        await page.evaluate(()=>Aurora.LibraryStorage.configure());
        await page.getByRole('button',{name:'Turn on remembering',exact:true}).click();
        assert.equal(await page.evaluate(()=>Aurora.LibraryStorage.enabled),false);
        assert(await page.locator('.notice-error').isVisible());await page.keyboard.press('Escape');
      }
      assert.deepEqual(errors,[]);await page.close();
    }
    console.log('PASS: startup without storage, unsupported persistent library, worker fallback search, cached empty results and real media decode errors.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
