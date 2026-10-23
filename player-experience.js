/* Transport state follows the media element; requests have independent cancellation. */
(function(App){
  App.define('player/experience',function(){
    App.playbackIntent=false;App.playbackPending=false;App.playRequestId=0;
    App.suspendIdleAudio=()=>{
      if(!App.playbackPending&&App.audio.paused&&App.audioCtx?.state==='running')App.audioCtx.suspend().catch(()=>{});
    };
    const refresh=()=>{
      App.updatePlayIcon();App.refreshMusicVisualizer?.();App.renderTrackList();
      App.updateMediaSession();App.Session?.schedule();
    };
    App.countTrackPlay=()=>{
      if(App.countedGeneration===App.playbackGeneration)return;
      const track=App.state.tracks[App.state.currentIndex];if(!track)return;
      App.countedGeneration=App.playbackGeneration;App.PlayStatsStore.recordPlay(App.trackKey(track));
    };
    App.handlePlaybackError=error=>{
      App.playbackPending=false;App.playbackIntent=false;App.state.isPlaying=false;App.MusicSense.stop();App.suspendIdleAudio();refresh();
      if(error?.name==='AbortError')return;
      if(App.lastPlaybackErrorGeneration===App.playbackGeneration)return;
      App.lastPlaybackErrorGeneration=App.playbackGeneration;
      App.notify(error?.name==='NotAllowedError'
        ?App.text('Prohlížeč vyžaduje spuštění tlačítkem Přehrát.','Press Play to allow playback in this browser.')
        :App.text('Skladbu nelze přehrát. Soubor může být poškozený nebo má nepodporovaný formát.','This track cannot be played. The file may be damaged or its format unsupported.'),{error:true});
    };
    App.pausePlayback=()=>{
      App.playbackIntent=false;App.playbackPending=false;App.playRequestId++;
      App.audio.pause();App.state.isPlaying=false;App.MusicSense.stop();App.suspendIdleAudio();refresh();
    };
    App.playPlayback=async()=>{
      if(App.state.currentIndex<0){
        if(App.state.tracks.length)App.loadTrack(App.sortPlaylistEntries(App.state.tracks.map((t,i)=>({t,i})))[0].i,true);
        else App.triggerFiles();return;
      }
      const generation=App.playbackGeneration,request=++App.playRequestId;
      App.playbackIntent=true;App.playbackPending=true;App.lastPlaybackErrorGeneration=null;App.updatePlayIcon();
      try{
        App.initAudioGraph();await App.audioCtx.resume();
        if(generation!==App.playbackGeneration||request!==App.playRequestId||!App.playbackIntent)return;
        await App.audio.play();
        if(generation!==App.playbackGeneration||request!==App.playRequestId)return;
        App.playbackPending=false;App.state.isPlaying=!App.audio.paused;App.countTrackPlay();refresh();
      }catch(error){if(generation===App.playbackGeneration&&request===App.playRequestId)App.handlePlaybackError(error);}
    };
    App.togglePlayback=()=>App.state.isPlaying||App.playbackPending?App.pausePlayback():App.playPlayback();
    App.stopPlayback=()=>{
      App.pausePlayback();App.playbackGeneration=(App.playbackGeneration||0)+1;App.cancelTrackScan?.();
      App.audio.removeAttribute('src');App.audio.load();App.state.currentIndex=-1;
      App.TimelineWaveform.setTrack(null);App.Spectrogram.resetForNewTrack();App.hideNormBadge();App.showNormDetail(false);
      App.el('trackMeta').classList.remove('show');App.el('emptyState').style.display='';
      for(const [id,text] of [['barTitle','Nic nehraje'],['barArtist','Vyber skladbu z playlistu']]){App.el(id).textContent=text;App.el(id).setAttribute('data-ui-placeholder','');}
      App.updateTrackMetaHeart();App.updateMediaSession();
    };
    App.audio.addEventListener('playing',()=>{
      if(!App.playbackIntent){App.audio.pause();return;}
      App.playbackPending=false;App.state.isPlaying=true;App.MusicSense.start();App.countTrackPlay();refresh();
    });
    App.audio.addEventListener('pause',()=>{
      // A pause event from replacing src can arrive while the new request waits for analysis.
      if(!App.audio.paused)return;
      App.state.isPlaying=false;if(!App.playbackPending)App.playbackIntent=false;App.MusicSense.stop();App.suspendIdleAudio();refresh();
    });
    App.audio.addEventListener('error',()=>{if(App.audio.error&&App.state.currentIndex>=0)App.handlePlaybackError(App.audio.error);});
    App.audio.addEventListener('ended',()=>App.Session?.schedule());
    App.seekPlayback=seconds=>{
      if(!Number.isFinite(seconds)||!Number.isFinite(App.audio.duration)||App.audio.duration<=0)return;
      App.audio.currentTime=Math.max(0,Math.min(App.audio.duration,seconds));App.updateMediaPosition();App.Session?.schedule();
    };
    App.refreshPlaybackLabels=()=>{
      App.el('btnShuffle').setAttribute('aria-pressed',String(!!App.settings.shuffleEnabled));
      const repeat=App.el('btnRepeat'),mode=App.settings.repeatOne?'one':App.settings.repeatEnabled?'all':'off';
      repeat.classList.toggle('active',mode!=='off');repeat.dataset.repeat=mode;
      repeat.setAttribute('aria-pressed',String(mode!=='off'));
      repeat.title=repeat.ariaLabel=mode==='one'?'Opakovat jednu skladbu':mode==='all'?'Opakovat playlist':'Opakování vypnuto';
    };
    App.cycleRepeat=()=>{
      if(App.settings.repeatOne){App.settings.repeatOne=false;App.settings.repeatEnabled=false;}
      else if(App.settings.repeatEnabled)App.settings.repeatOne=true;
      else App.settings.repeatEnabled=true;
      App.saveSettings();App.updatePlaybackModeButtons();
    };
    App.updateMediaPosition=()=>{
      const session=navigator.mediaSession,duration=App.audio.duration;
      if(!session?.setPositionState||!Number.isFinite(duration)||duration<=0)return;
      try{session.setPositionState({duration,playbackRate:App.audio.playbackRate||1,position:Math.max(0,Math.min(duration,App.audio.currentTime||0))});}catch{}
    };
    let metadataTrack=null;
    App.updateMediaSession=()=>{
      const session=navigator.mediaSession;if(!session)return;
      const track=App.state.tracks[App.state.currentIndex];
      if(track!==metadataTrack){
        metadataTrack=track;
        if(typeof MediaMetadata!=='undefined')session.metadata=track?new MediaMetadata({title:track.name,artist:track.artist,album:'Aurora'}):null;
      }
      session.playbackState=track?(App.state.isPlaying?'playing':'paused'):'none';
      App.updateMediaPosition();
    };
    if(navigator.mediaSession){
      const handlers={play:App.playPlayback,pause:App.pausePlayback,stop:App.pausePlayback,
        nexttrack:()=>App.el('btnNext').click(),previoustrack:()=>App.el('btnPrev').click(),
        seekbackward:details=>App.seekPlayback(App.audio.currentTime-(details.seekOffset||10)),
        seekforward:details=>App.seekPlayback(App.audio.currentTime+(details.seekOffset||10)),seekto:details=>App.seekPlayback(details.seekTime)};
      for(const [key,handler] of Object.entries(handlers))try{navigator.mediaSession.setActionHandler(key,handler);}catch{}
    }
    const progress=App.el('progressWrap');progress.tabIndex=0;progress.setAttribute('role','slider');progress.setAttribute('aria-label','Pozice přehrávání');progress.setAttribute('aria-valuemin','0');
    let lastPosition=-1;
    const updateTimeline=()=>{
      const time=Math.floor(App.audio.currentTime||0);if(time===lastPosition)return;lastPosition=time;
      const duration=Number.isFinite(App.audio.duration)?App.audio.duration:0;
      progress.setAttribute('aria-valuemax',String(Math.floor(duration)));progress.setAttribute('aria-valuenow',String(time));progress.setAttribute('aria-valuetext',App.formatTime(time)+' / '+App.formatTime(duration));App.updateMediaPosition();
    };
    App.audio.addEventListener('timeupdate',updateTimeline);App.audio.addEventListener('loadedmetadata',()=>{lastPosition=-1;updateTimeline();App.updateMediaSession();});
    progress.addEventListener('keydown',e=>{
      const offsets={ArrowLeft:-5,ArrowRight:5,ArrowDown:-5,ArrowUp:5,PageDown:-30,PageUp:30};
      if(e.key in offsets||e.key==='Home'||e.key==='End'){e.preventDefault();e.stopPropagation();App.seekPlayback(e.key==='Home'?0:e.key==='End'?App.audio.duration:App.audio.currentTime+offsets[e.key]);}
    });updateTimeline();
    App.showShortcuts=()=>App.openDialog(App.text('Klávesové zkratky','Keyboard shortcuts'),dialog=>{
      for(const [cs,en,key] of [['Přehrát / pozastavit','Play / pause','Space / K'],['Předchozí / další skladba','Previous / next track','Shift + ← / →'],['Posun o 5 sekund','Seek 5 seconds','← / →'],['Hlasitost','Volume','↑ / ↓'],['Ztlumit','Mute','M'],['Hledat v knihovně','Search library','Ctrl / ⌘ + F'],['Hledat v nastavení','Search settings','Ctrl / ⌘ + K'],['Tato nápověda','This help','?']]){
        const row=document.createElement('div');row.className='shortcut-row';const label=document.createElement('span'),kbd=document.createElement('kbd');label.textContent=App.text(cs,en);kbd.textContent=key;row.append(label,kbd);dialog.append(row);
      }
    });
    const help=document.createElement('button');help.type='button';help.className='icon-btn';help.id='btnShortcuts';help.textContent='?';help.title=help.ariaLabel='Klávesové zkratky';help.onclick=App.showShortcuts;App.el('stage').querySelector('.stage-tools').prepend(help);
    window.addEventListener('keydown',e=>{
      if(e.defaultPrevented||e.isComposing||document.querySelector('dialog[open]'))return;
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='f'){
        e.preventDefault();App.setPlaylistOpen?.(true);App.searchInputEl.focus();App.searchInputEl.select();return;
      }
      if(e.ctrlKey||e.metaKey||e.altKey||e.target.closest('input,select,textarea,button,[role=switch],[role=tab],[contenteditable=true],.track-row,[role=slider]'))return;
      const key=e.key.toLowerCase();
      if(key==='?'&&!e.repeat){e.preventDefault();App.showShortcuts();}
      else if((e.code==='Space'||key==='k')&&!e.repeat){e.preventDefault();App.togglePlayback();}
      else if(key==='m'&&!e.repeat){e.preventDefault();App.el('volumeIconBtn').click();}
      else if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
        e.preventDefault();if(e.shiftKey){if(!e.repeat)App.el(e.key==='ArrowRight'?'btnNext':'btnPrev').click();}else App.seekPlayback(App.audio.currentTime+(e.key==='ArrowRight'?5:-5));
      }else if(e.key==='ArrowUp'||e.key==='ArrowDown'){
        e.preventDefault();App.isExplicitlyMuted=false;App.setVolume(App.pendingVolume+(e.key==='ArrowUp'?.05:-.05));if(App.pendingVolume>0)App.lastNonZeroVolume=App.pendingVolume;
      }
    });
    App.refreshPlaybackLabels();App.updateMediaSession();
  });
})(window.Aurora);
window.Aurora.addStyle(61,`
#btnRepeat{position:relative;}#btnRepeat[data-repeat=one]::after{content:'1';position:absolute;right:3px;top:0;font:700 9px var(--font-mono,monospace);color:var(--text);}
#btnShortcuts{font:600 18px var(--font-body,Arial);background:#ffffff06;color:var(--text);}
`);
