// Native browser integration: real synthetic WAV playback, UI, storage and recovery.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.AURORA_PLAYWRIGHT||'playwright');
const url=pathToFileURL(path.resolve('index.html')).href;
function wav(seconds=12){
  const rate=16000,n=rate*seconds,b=Buffer.alloc(44+n*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(n*2,40);
  for(let i=0;i<n;i++)b.writeInt16LE(Math.round(Math.sin(i/rate*440*Math.PI*2)*5000),44+i*2);return b;
}
const files=['Žlutý kůň - Tichá noc.wav','Aurora - Alpha.wav','Aurora - Beta.wav','Aurora - Gamma.wav'].map(name=>({name,mimeType:'audio/wav',buffer:wav()}));
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.AURORA_CHROME,headless:true,args:['--autoplay-policy=no-user-gesture-required']});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
    page.on('pageerror',error=>errors.push(error.stack));
    await page.goto(url);
    await page.evaluate(()=>{
      const a=Aurora;a.settings.autoplayOnImport=false;a.settings.randomFirstTrack=false;a.settings.normalize=false;a.settings.timelineLoudnessWaveform=false;a.settings.shuffleEnabled=false;a.settings.repeatEnabled=false;a.settings.repeatOne=false;a.settings.bgEnabled=false;a.settings.playlistSort='title';a.settings.playlistSortDirection='asc';a.Threads.settingsChanged();a.saveSettings();
    });
    await page.locator('#fileInput').setInputFiles(files);
    await page.waitForFunction(()=>Aurora.state.tracks.length===4&&Aurora.audio.readyState>=1);
    assert.equal(await page.evaluate(()=>Aurora.state.tracks[Aurora.state.currentIndex].name),'Alpha','First selection follows the visible sort order');
    await page.locator('#searchInput').fill('zluty ticha');
    await page.waitForFunction(()=>Aurora.vt.filtered.length===1);
    assert.equal(await page.locator('.track-row:visible .track-info strong').filter({hasText:'Tichá noc'}).count(),1);
    await page.locator('#btnSearchClear').click();await page.waitForFunction(()=>Aurora.vt.filtered.length===4);
    await page.locator('.track-row[data-index="0"] .heart-btn').click();
    await page.locator('.library-filters button').nth(1).click();await page.waitForFunction(()=>Aurora.vt.filtered.length===1);
    await page.locator('.library-filters button').first().click();await page.waitForFunction(()=>Aurora.vt.filtered.length===4);
    await page.locator('#btnPlay').click();await page.waitForFunction(()=>Aurora.audio.currentTime>.1&&Aurora.state.isPlaying);
    assert.equal(await page.evaluate(()=>navigator.mediaSession?.metadata?.title),'Alpha');
    await page.evaluate(async()=>{for(let i=0;i<5;i++){Aurora.pausePlayback();void Aurora.playPlayback();}await Aurora.playPlayback();});
    await page.waitForFunction(()=>Aurora.state.isPlaying&&Aurora.audioCtx.state==='running');
    await page.locator('#btnPlay').click();assert.equal(await page.evaluate(()=>Aurora.audio.paused),true);
    await page.waitForFunction(()=>Aurora.audioCtx.state==='suspended'&&!Aurora.MusicSense._running);
    await page.locator('#progressWrap').focus();await page.keyboard.press('ArrowRight');
    assert(await page.evaluate(()=>Aurora.audio.currentTime>=5));
    await page.locator('.track-row[data-index="2"] .track-more').click();await page.getByRole('menuitem',{name:'Play next',exact:true}).click();
    assert.equal(await page.evaluate(()=>Aurora.playNextQueue[0].name),'Beta');
    await page.locator('#btnNext').click();await page.waitForFunction(()=>Aurora.state.currentIndex===2&&Aurora.state.isPlaying);
    assert.equal(await page.evaluate(()=>Aurora.playNextQueue.length),0);
    await page.locator('#btnPlay').click();
    await page.locator('#btnRepeat').click();assert.equal(await page.locator('#btnRepeat').getAttribute('data-repeat'),'all');
    await page.locator('#btnRepeat').click();assert.equal(await page.locator('#btnRepeat').getAttribute('data-repeat'),'one');
    assert.equal(await page.evaluate(()=>Aurora.getNextIndex(true)),2);
    await page.locator('#btnRepeat').click();assert.equal(await page.locator('#btnRepeat').getAttribute('data-repeat'),'off');
    // Removal before the selected track keeps its media and selection stable.
    const src=await page.evaluate(()=>Aurora.audio.src);
    await page.locator('.track-row[data-index="0"] .track-more').click();await page.getByRole('menuitem',{name:'Remove from library',exact:true}).click();
    assert.equal(await page.evaluate(()=>Aurora.state.tracks[Aurora.state.currentIndex].name),'Beta');
    assert.equal(await page.evaluate(()=>Aurora.audio.src),src);
    await page.locator('.aurora-notice button').first().click();assert.equal(await page.evaluate(()=>Aurora.state.tracks.length),4);
    const downloadPromise=page.waitForEvent('download');await page.evaluate(()=>Aurora.LibraryTools.exportPlaylist());
    const download=await downloadPromise,chunks=[];for await(const chunk of await download.createReadStream())chunks.push(chunk);
    const m3u=Buffer.concat(chunks).toString('utf8');assert(m3u.startsWith('#EXTM3U\n'));assert(m3u.includes('./Žlutý kůň - Tichá noc.wav'));assert.equal(m3u.match(/#EXTINF:/g).length,4);
    await page.locator('#btnShortcuts').click();assert(await page.locator('dialog').isVisible());await page.keyboard.press('Escape');
    await page.locator('dialog').waitFor({state:'detached'});
    assert.equal(await page.locator('dialog').count(),0);
    // Keyboard search opens the hidden drawer, independent of the focused transport button.
    await page.keyboard.press('Control+f');assert.equal(await page.evaluate(()=>document.activeElement.id),'searchInput');
    // Explicit library persistence stores actual files, then restores paused with position and volume.
    await page.locator('#libraryPersistenceStatus').click();await page.getByRole('button',{name:'Turn on remembering',exact:true}).click();
    await page.waitForFunction(()=>Aurora.LibraryStorage.enabled&&!Aurora.LibraryStorage.busy);
    await page.evaluate(async()=>{Aurora.seekPlayback(4);Aurora.setVolume(.37);Aurora.LibraryTools.enqueue(Aurora.state.tracks[3]);Aurora.Session.save();await Aurora.LibraryStorage.save();});
    await page.reload();await page.waitForFunction(()=>Aurora.state.tracks.length===4&&Aurora.audio.readyState>=1&&!Aurora.Session.restoringPosition);
    assert.equal(await page.evaluate(()=>Aurora.state.tracks[Aurora.state.currentIndex].name),'Beta');
    assert.equal(await page.evaluate(()=>Aurora.audio.paused),true);
    assert(Math.abs(await page.evaluate(()=>Aurora.audio.currentTime)-4)<.2);
    await page.waitForFunction(()=>Aurora.audioCtx.state==='suspended'&&!Aurora.MusicSense._running);
    assert.equal(await page.evaluate(()=>Aurora.pendingVolume),.37);
    assert.equal(await page.evaluate(()=>Aurora.playNextQueue[0].name),'Gamma');
    // No duplicate import; resetting input lets the same file be selected again.
    await page.locator('#fileInput').setInputFiles(files);await page.evaluate(()=>Aurora.importQueue);
    assert.equal(await page.evaluate(()=>Aurora.state.tracks.length),4);
    assert.equal(await page.locator('#fileInput').inputValue(),'');
    // Cancelling a pending normalization cannot start audio later.
    await page.evaluate(()=>{
      const a=Aurora;a.pausePlayback();a.settings.normalize=true;a.ProfileStore._cache.clear();
      a._originalNormalization=a.applyNormalizationForTrack;a.applyNormalizationForTrack=()=>new Promise(resolve=>a._finishTestNormalization=resolve);
      a.loadTrack(0,true);a.pausePlayback();a._finishTestNormalization();a.applyNormalizationForTrack=a._originalNormalization;a.settings.normalize=false;
    });
    await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>Aurora.state.isPlaying||!Aurora.audio.paused),false);
    // A refused play promise never leaves a false playing state or unhandled rejection.
    await page.evaluate(async()=>{
      const a=Aurora,play=a.audio.play;a.audio.play=()=>Promise.reject(new DOMException('blocked','NotAllowedError'));
      await a.playPlayback();a.audio.play=play;
    });
    assert.equal(await page.evaluate(()=>Aurora.state.isPlaying||Aurora.playbackPending),false);
    assert(await page.locator('.notice-error').isVisible());
    await page.evaluate(()=>Aurora.playPlayback());await page.waitForFunction(()=>Aurora.state.isPlaying);
    await page.evaluate(()=>Aurora.pausePlayback());
    // Removing a current track resets the old source; clearing can be undone.
    await page.evaluate(()=>Aurora.LibraryTools.remove([Aurora.state.tracks[Aurora.state.currentIndex]]));
    assert.equal(await page.evaluate(()=>Aurora.audio.paused),true);
    await page.evaluate(()=>Aurora.LibraryTools.undo());
    await page.evaluate(()=>Aurora.LibraryTools.remove(Aurora.state.tracks.slice()));
    assert.equal(await page.evaluate(()=>Aurora.state.currentIndex),-1);assert.equal(await page.evaluate(()=>Aurora.audio.getAttribute('src')),null);
    assert(await page.locator('#emptyState').isVisible());
    await page.evaluate(()=>Aurora.LibraryTools.undo());assert.equal(await page.evaluate(()=>Aurora.state.tracks.length),4);
    // Shuffle is a finite bag; Previous and Next share a history cursor.
    const shuffle=await page.evaluate(()=>{
      const a=Aurora;a.settings.shuffleEnabled=true;a.settings.repeatEnabled=false;a.playNextQueue=[];
      a.playbackOrder={bag:[],history:[],cursor:-1};a.state.currentIndex=0;a.refillShuffleBag(0);a.recordPlayedIndex(0);
      const visited=[0];for(let i=0;i<3;i++){const n=a.getNextIndex(true);visited.push(n);a.state.currentIndex=n;a.recordPlayedIndex(n);}
      const end=a.getNextIndex(true),back=[];for(let i=0;i<2;i++){const n=a.getPrevIndex();back.push(n);a.state.currentIndex=n;a.recordPlayedIndex(n);}
      const forward=a.getNextIndex(false);a.settings.shuffleEnabled=false;a.loadTrack(1,false);
      return {visited,end,back,forward};
    });
    assert.equal(new Set(shuffle.visited).size,4);assert.equal(shuffle.end,-1);assert.deepEqual(shuffle.back,[shuffle.visited[2],shuffle.visited[1]]);assert.equal(shuffle.forward,shuffle.visited[2]);
    // Profile import retains favorites without LUFS and tolerates storage quota pressure.
    assert.equal(await page.evaluate(()=>{const a=Aurora;a.ProfileStore.importJson(JSON.stringify({profiles:{'favorite-only.wav':{liked:true,playCount:7}}}));return a.ProfileStore._load().get('favorite-only.wav').playCount;}),7);
    // Full UI at several widths and in both languages; no horizontal clipping.
    for(const [width,height,lang] of [[1440,1000,'en'],[760,900,'en'],[390,844,'cs']]){
      await page.setViewportSize({width,height});
      await page.evaluate(lang=>{const el=document.getElementById('auroraLanguage');el.value=lang;el.dispatchEvent(new Event('change',{bubbles:true}));Aurora.setPlaylistOpen(true);},lang);
      await page.waitForTimeout(350);
      assert(await page.locator('#btnLibraryTools').isVisible());
      const overflow=await page.evaluate(()=>({body:document.documentElement.scrollWidth-innerWidth,panel:document.getElementById('playlistPanel').scrollWidth-document.getElementById('playlistPanel').clientWidth}));
      assert(overflow.body<=1&&overflow.panel<=1,JSON.stringify({width,overflow}));
      await page.screenshot({path:`review-screenshots/upgrade-${width}.png`});
      await page.locator('#btnLibraryTools').click();
      const menuBox=await page.locator('.library-menu').boundingBox();assert(menuBox.x>=0&&menuBox.x+menuBox.width<=width);
      await page.keyboard.press('Escape');
    }
    await page.evaluate(()=>Aurora.LibraryStorage.disable());await page.reload();await page.evaluate(()=>Aurora.importQueue);
    assert.equal(await page.evaluate(()=>Aurora.state.tracks.length),0,'Disabling removes stored copies');
    assert.deepEqual(errors,[]);
    console.log('PASS: search, favorites, real WAV playback, rapid pause/resume, idle audio suspension, keyboard seek, media metadata, queue, repeat, remove/undo, M3U export, persistence/reload, volume/position, cancellation, rejected playback, shuffle, profile import and responsive UI.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
