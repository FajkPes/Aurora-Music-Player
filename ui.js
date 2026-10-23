/* ui.js — Vykreslování rozhraní, náhledy a šablony dynamických ovládacích prvků. */

// ── ui/render-lifecycle ──
(function(App){
  App.define("ui/render-lifecycle", function initialize(){
App.VisualRenderState = {
    active: !document.hidden && (typeof document.hasFocus !== 'function' || document.hasFocus()),
    listeners: new Set(),
    setActive(next){
      next = !!next;
      if(next === this.active) return;
      this.active = next;
      document.body.classList.toggle('render-paused', !next);
      this.listeners.forEach(listener => listener(next));
    },
    refresh(){
      const mode=App.settings?.powerSaveMode||'hidden';
      this.setActive(mode==='off'||(!document.hidden&&(mode!=='blur'||typeof document.hasFocus!=='function'||document.hasFocus())));
    },
    subscribe(listener){
      this.listeners.add(listener);
      listener(this.active);
      return ()=> this.listeners.delete(listener);
    }
  };
App.VisualRenderState.refresh();
document.body.classList.toggle('render-paused', !App.VisualRenderState.active);
document.addEventListener('visibilitychange', ()=> App.VisualRenderState.refresh(), { passive:true });
window.addEventListener('focus', ()=> App.VisualRenderState.refresh(), { passive:true });
window.addEventListener('blur', ()=> App.VisualRenderState.refresh(), { passive:true });
window.addEventListener('pageshow', ()=> App.VisualRenderState.refresh(), { passive:true });
window.addEventListener('pagehide', ()=> App.VisualRenderState.setActive(false), { passive:true });
  }, ["VisualRenderState"]);
})(window.Aurora);

// ── ui/layout ──
(function(App){
App.clamp01 = function clamp01(v){ return Math.max(0, Math.min(1, v)); };
App.trackKey = function trackKey(track){ return track.file.name; };
  App.define("ui/layout", function initialize(){
App.audio = App.el('audio');
App.app = App.el('app');
App.stage = App.el('stage');
(function observeControlBarHeight(){
    const bar = App.el('controlBar');
    if(!bar) return;
    let lastHeight=-1;
    const apply = () => {
      const height=bar.offsetHeight;
      if(height===lastHeight)return;
      lastHeight=height;
      document.documentElement.style.setProperty('--control-bar-h', height + 'px');
    };
    apply();
    if(window.ResizeObserver){
      new ResizeObserver(apply).observe(bar);
    } else {
      window.addEventListener('resize', apply);
    }
  })();
(function observeTrackMetaHeight(){
    const chip = App.el('trackMeta');
    if(!chip) return;
    const apply = () => {
      document.documentElement.style.setProperty('--track-meta-h', chip.offsetHeight + 'px');
    };
    apply();
    if(window.ResizeObserver){
      new ResizeObserver(apply).observe(chip);
    } else {
      window.addEventListener('resize', apply);
    }
  })();
App.stageBox = { w: 0, h: 0 };
(function observeStageSize(){
    const apply = () => {
      const rect = (App.el('sceneContent')||App.stage).getBoundingClientRect();
      App.stageBox.w = rect.width;
      App.stageBox.h = rect.height;
    };
    apply();
    if(window.ResizeObserver){
      new ResizeObserver(apply).observe(App.el('sceneContent')||App.stage);
    } else {
      window.addEventListener('resize', apply);
    }
  })();
  }, ["audio","app","stage","stageBox","clamp01","trackKey"]);
})(window.Aurora);

// ── ui/music-readouts ──
(function(App){
App.updateLikedOutlinePulse = function updateLikedOutlinePulse(){
    if(App.isActivelyScrolling?.())return;
    const chipEl = App.el('trackMetaChip');
    const bar=App.el('barTrackInfo');
    if(bar){
      const active=App.settings.stageLikedOutlinePulse && bar.classList.contains('liked');
      const raw=active&&App.state.isPlaying?(App.MusicSense.data[App.settings.stageLikedOutlinePulseSource||'loudnessPct']||0):0;
      const floor=Number(App.settings.stageLikedOutlinePulseFloor)||0;
      const pulse=Math.max(0,Math.min(1,(raw-floor)/Math.max(1,100-floor)*(Number.isFinite(App.settings.stageLikedOutlinePulseSensitivity)?App.settings.stageLikedOutlinePulseSensitivity:1)));
      const value=(.5+pulse*.5).toFixed(2);
      if(bar.style.getPropertyValue('--favorite-pulse')!==value)bar.style.setProperty('--favorite-pulse',value);
    }
    if(!chipEl) return;
    if(!App.settings.stageLikedOutlinePulse || !chipEl.classList.contains('liked')){
      if(App._likedPulseLastKey !== null){
        chipEl.style.boxShadow = '';
        App._likedPulseLastKey = null;
      }
      return;
    }
    const playing = App.state.isPlaying;
    const source = App.settings.stageLikedOutlinePulseSource || 'loudnessPct';
    const raw = playing ? (App.MusicSense.data[source] || 0) : 0;
    const floor = typeof App.settings.stageLikedOutlinePulseFloor === 'number' ? App.settings.stageLikedOutlinePulseFloor : 0;
    const span = Math.max(1, 100 - floor);
    const normalized = Math.max(0, Math.min(1, (raw - floor) / span));
    const sens = typeof App.settings.stageLikedOutlinePulseSensitivity === 'number' ? App.settings.stageLikedOutlinePulseSensitivity : 1;
    const intensity = Math.max(0, Math.min(1, normalized * sens));
    if(intensity <= 0.01){
      const key = 'off';
      if(key === App._likedPulseLastKey) return;
      App._likedPulseLastKey = key;
      chipEl.style.boxShadow = '0 14px 34px -12px rgba(0,0,0,.55), 0 1px 0 rgba(255,255,255,0.04) inset';
      return;
    }
    const ringW = (0.5 + intensity*3.5).toFixed(2);
    const glowBlur = Math.round(intensity*46);
    const glowSpread = Math.round(-4 + intensity*10);
    const glowAlpha = (intensity*0.95).toFixed(2);
    const key = ringW+'|'+glowBlur+'|'+glowSpread+'|'+glowAlpha;
    if(key === App._likedPulseLastKey) return;
    App._likedPulseLastKey = key;
    chipEl.style.boxShadow = `0 0 0 ${ringW}px #ff1f4d, 0 14px 34px -12px rgba(0,0,0,.55), 0 0 ${glowBlur}px ${glowSpread}px rgba(255,31,77,${glowAlpha})`;
  };
  App.define("ui/music-readouts", function initialize(){
App._likedPulseLastKey = null;
App.SenseReadout = {
    fmts: {
      bass: v => Math.round(v) + '%',
      mid: v => Math.round(v) + '%',
      high: v => Math.round(v) + '%',
      loudnessPct: v => v.toFixed(0) + '%',
      bpm: v => Math.round(v) + ' BPM',
    },
    fmtsCompact: {
      bass: v => Math.round(v) + '%',
      mid: v => Math.round(v) + '%',
      high: v => Math.round(v) + '%',
      loudnessPct: v => Math.round(v) + '%',
    },
    update(){
      const now=performance.now();
      if(App.isActivelyScrolling?.())return;
      if(this._lastUpdate&&now-this._lastUpdate<1000/30)return;
      this._lastUpdate=now;
      const panel = App.el('settingsPanel');
      const panelOpen = !!(panel && panel.classList.contains('open'));
      const liveStatsEl = App.el('liveStatsLeft');
      const liveStatsOn = !!(liveStatsEl && liveStatsEl.classList.contains('show')&&!document.body.classList.contains('live-idle'));
      if(!panelOpen && !liveStatsOn) return;
      const d = App.MusicSense.data;
      const analyzerVisible=panelOpen&&App.SettingsUI?.current==='live'&&App.SettingsUI.groups.live.selected==='values';
      if(analyzerVisible){
        Object.keys(this.fmts).forEach(key=>{
          const valEl = App.el('sv-'+key);
          const barEl = App.el('sb-'+key);
          if(!valEl) return;
          const raw = d[key] || 0;
          const text=this.fmts[key](raw);if(valEl.textContent!==text)valEl.textContent=text;
          const pct = Math.min(Math.max(raw,0),100);
          if(barEl) barEl.style.clipPath = `inset(0 ${100-pct}% 0 0 round 2px)`;
        });
        const bpmValEl = App.el('sv-bpm');
        const bpmBarEl = App.el('sb-bpm');
        if(bpmValEl){
          const bpmRaw = d.bpm || 0;
          bpmValEl.textContent = this.fmts.bpm(bpmRaw);
          if(bpmBarEl) bpmBarEl.style.clipPath = `inset(0 ${100-Math.min(100,(bpmRaw/250)*100)}% 0 0 round 2px)`;
        }
        const beatDot = App.el('beatIndicatorDot');
        if(beatDot){
          const pulse = Math.max(0, Math.min(1, d.beatPulse || 0));
          const hasLock = d.bpm > 0;
          const scale = hasLock ? (0.62 + pulse*0.62) : 0.6;
          const opacity = hasLock ? (0.35 + pulse*0.65) : 0.25;
          const glow = hasLock ? pulse*14 : 0;
          beatDot.style.transform = `scale(${scale.toFixed(3)})`;
          beatDot.style.opacity = opacity.toFixed(3);
          beatDot.style.boxShadow = glow > 0.3
            ? `0 0 ${glow.toFixed(1)}px ${(glow*0.6).toFixed(1)}px rgba(255,46,196,${(pulse*0.6).toFixed(2)})`
            : '0 0 0 0 rgba(255,46,196,0)';
        }
        const beatConfEl = App.el('beatConfidenceVal');
        if(beatConfEl){
          const hasLock = d.bpm > 0;
          beatConfEl.textContent = hasLock ? Math.round((d.tempoConfidence||0)*100) + '%' : '—';
        }
        App.el('senseDot').classList.toggle('idle', !App.state.isPlaying);
      }
      if(panelOpen&&['background','appearance'].includes(App.SettingsUI?.current)){
        App.updateBgMapLiveValues();
        App.updateTempoSyncLiveReadouts();
      }
      if(liveStatsOn){
        Object.keys(this.fmtsCompact).forEach(key=>{
          const valEl = App.el('ls-'+key);
          const barEl = App.el('lsb-'+key);
          if(!valEl) return;
          const raw = d[key] || 0;
          const text=this.fmtsCompact[key](raw);if(valEl.textContent!==text)valEl.textContent=text;
          const pct = Math.min(Math.max(raw,0),100);
          if(barEl) barEl.style.clipPath = `inset(0 ${100-pct}% 0 0 round 2px)`;
        });
      }
    }
  };
  }, ["_likedPulseLastKey","updateLikedOutlinePulse","SenseReadout"]);
})(window.Aurora);

// ── ui/track-info ──
(function(App){
App.formatLastPlayed = function formatLastPlayed(ts){
    if(typeof ts !== 'number') return 'Zatím nikdy';
    const d = new Date(ts);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const yesterday = new Date(now); yesterday.setDate(now.getDate()-1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    const locale = document.documentElement.lang === 'cs' ? 'cs-CZ' : 'en-GB';
    const timePart = d.toLocaleTimeString(locale, { hour:'2-digit', minute:'2-digit' });
    if(sameDay) return `Dnes ${timePart}`;
    if(isYesterday) return `Včera ${timePart}`;
    return d.toLocaleDateString(locale, { day:'numeric', month:'numeric', year:'numeric' }) + ' ' + timePart;
  };
App.refreshTrackInfoPopoverContent = function refreshTrackInfoPopoverContent(){
    if(App.state.currentIndex < 0) return;
    const t = App.state.tracks[App.state.currentIndex];
    if(!t) return;
    const key = App.trackKey(t);
    App.el('tipTitle').textContent = t.name;
    App.el('tipArtist').textContent = t.artist;
    const lufsVal = App.ProfileStore.get(key);
    App.el('tipLufs').textContent = Number.isFinite(lufsVal) ? `${lufsVal.toFixed(1)} LUFS` : 'Neanalyzováno';
    const durationSec = (t.duration && isFinite(t.duration)) ? t.duration : App.PlayStatsStore.get(key).duration;
    App.el('tipDuration').textContent = (typeof durationSec === 'number') ? App.formatTime(durationSec) : '—';
    const stats = App.PlayStatsStore.get(key);
    App.el('tipPlayCount').textContent = stats.playCount > 0 ? String(stats.playCount) : 'Zatím nikdy';
    App.el('tipLastPlayed').textContent = App.formatLastPlayed(stats.lastPlayedAt);
    const liked = App.LikeStore.has(key);
    const tipHeart = App.el('tipHeartBtn');
    tipHeart.classList.toggle('liked', liked);
    tipHeart.setAttribute('aria-pressed',String(liked));
    tipHeart.title = liked ? 'Odebrat z oblíbených' : 'Přidat mezi oblíbené';
  };
App.positionTrackInfoPopover = function positionTrackInfoPopover(){
    const pop=App.el('trackInfoPopover'),anchor=App.el('barTrackInfo').getBoundingClientRect();
    const w=pop.offsetWidth||300,h=pop.offsetHeight||220;
    pop.style.left=Math.max(12,Math.min(innerWidth-w-12,anchor.right-w))+'px';
    pop.style.top=Math.max(12,Math.min(innerHeight-h-12,anchor.top-h-12))+'px';
  };
App.toggleTrackInfoPopover = function toggleTrackInfoPopover(force){
    const pop = App.el('trackInfoPopover');
    if(!pop) return;
    const shouldShow = force !== undefined ? force : !pop.classList.contains('show');
    if(shouldShow && App.state.currentIndex < 0) return;
    if(shouldShow) App.refreshTrackInfoPopoverContent();
    pop.classList.toggle('show', shouldShow);
    if(shouldShow)App.positionTrackInfoPopover();
    App.refreshPointerGlow?.(App.SettingsUI?.motionDuration?.()||0);
  };
App.refreshStageTrackInfoPopoverContent = function refreshStageTrackInfoPopoverContent(){
    if(App.state.currentIndex < 0) return;
    const t = App.state.tracks[App.state.currentIndex];
    if(!t) return;
    const key = App.trackKey(t);
    App.el('stageTipTitle').textContent = t.name;
    App.el('stageTipArtist').textContent = t.artist;
    const lufsVal = App.ProfileStore.get(key);
    App.el('stageTipLufs').textContent = Number.isFinite(lufsVal) ? `${lufsVal.toFixed(1)} LUFS` : 'Neanalyzováno';
    const durationSec = (t.duration && isFinite(t.duration)) ? t.duration : App.PlayStatsStore.get(key).duration;
    App.el('stageTipDuration').textContent = (typeof durationSec === 'number') ? App.formatTime(durationSec) : '—';
    const stats = App.PlayStatsStore.get(key);
    App.el('stageTipPlayCount').textContent = stats.playCount > 0 ? String(stats.playCount) : 'Zatím nikdy';
    App.el('stageTipLastPlayed').textContent = App.formatLastPlayed(stats.lastPlayedAt);
  };
App.toggleStageTrackInfoPopover = function toggleStageTrackInfoPopover(force){
    const pop = App.el('stageTrackInfoPopover');
    if(!pop) return;
    const shouldShow = force !== undefined ? force : !pop.classList.contains('show');
    if(shouldShow && App.state.currentIndex < 0) return;
    if(shouldShow) App.refreshStageTrackInfoPopoverContent();
    pop.classList.toggle('show', shouldShow);
    App.refreshPointerGlow?.(App.SettingsUI?.motionDuration?.()||0);
  };
  App.define("ui/track-info", function initialize(){
document.body.appendChild(App.el('trackInfoPopover'));
window.addEventListener('resize',()=>{if(App.el('trackInfoPopover').classList.contains('show'))App.positionTrackInfoPopover();},{passive:true});
App.el('controlsRow').addEventListener('scroll',()=>{if(App.el('trackInfoPopover').classList.contains('show'))App.positionTrackInfoPopover();},{passive:true});
App.el('barTrackInfo').addEventListener('click', (e)=>{
    e.stopPropagation();
    App.toggleTrackInfoPopover();
  });
App.el('trackInfoPopover').addEventListener('click', (e)=> e.stopPropagation());
App.el('tipHeartBtn').addEventListener('click', (e)=>{
    e.stopPropagation();
    if(App.state.currentIndex < 0) return;
    const t = App.state.tracks[App.state.currentIndex];
    if(!t) return;
    const nowLiked = App.LikeStore.toggle(App.trackKey(t));
    App.syncLikedUI(App.state.currentIndex, nowLiked);
    App.popHeart(App.el('tipHeartBtn'));
  });
document.addEventListener('click', ()=> App.toggleTrackInfoPopover(false));
document.addEventListener('keydown', e=>{
    if(e.key === 'Escape') App.toggleTrackInfoPopover(false);
  });
App.el('trackMetaChip').addEventListener('click', (e)=>{
    e.stopPropagation();
    App.toggleStageTrackInfoPopover();
  });
App.el('stageTrackInfoPopover').addEventListener('click', (e)=> e.stopPropagation());
document.addEventListener('click', ()=> App.toggleStageTrackInfoPopover(false));
document.addEventListener('keydown', e=>{
    if(e.key === 'Escape') App.toggleStageTrackInfoPopover(false);
  });
  }, ["formatLastPlayed","refreshTrackInfoPopoverContent","positionTrackInfoPopover","toggleTrackInfoPopover","refreshStageTrackInfoPopoverContent","toggleStageTrackInfoPopover"]);
})(window.Aurora);

// ── ui/interactions ──
(function(App){
App.applyInteractionAppearance = function applyInteractionAppearance(){
    const root=document.documentElement.style;
    const numeric=(key,min,max,unit='')=>root.setProperty('--'+key,Math.max(min,Math.min(max,Number(App.settings[key])||0))+unit);
    numeric('settingsAlpha',0,1);numeric('settingsBlur',0,30,'px');numeric('settingsRadius',0,40,'px');numeric('settingsOutlineOpacity',0,100,'%');numeric('settingsOutlineWidth',0,4,'px');numeric('hoverGlowStrength',0,1);
    document.body.classList.toggle('settings-glass',!!App.settings.settingsGlass);
    document.body.classList.toggle('hover-glow',!!App.settings.hoverGlow);
    if(!['clear','light','glow','none'].includes(App.settings.islandHover))App.settings.islandHover=App.settings.hoverClear?'clear':'none';
    document.body.dataset.islandHover=App.settings.islandHover;
    const trackCard=App.el('barTrackInfo');
    if(trackCard){
      trackCard.dataset.textAlign=App.settings.ctrlTrackAlign==='left'?'left':'right';
      trackCard.dataset.widthMode=App.settings.ctrlTrackWidth==='content'?'content':'fill';
    }
    App.syncPlaylistSort?.();
    document.querySelectorAll('[data-extra-select]').forEach(n=>n.value=App.settings[n.dataset.extraSelect]);
    App.refreshSelectMenus?.();
    App.refreshMusicVisualizer?.();
    const glowPreview=App.el('glowColorPreview');if(glowPreview)glowPreview.style.background=App.settings.hoverGlowColor;
    document.body.classList.toggle('live-auto',App.settings.liveRevealMode!=='always');
    if(App.settings.liveRevealMode==='always')document.body.classList.remove('live-idle');
    App.applyInteractionAppearance.refreshLive?.();
  };
App.mountInteractionEffects = function mountInteractionEffects(){
    const swatches=App.el('glowColorSwatches');
    if(swatches){
      const colors=[...new Set(['#eec4ff','#ffffff',...(App.bgPresets||[]).flat()])];
      for(const color of colors){const button=document.createElement('button');button.type='button';button.className='swatch';button.style.background=color;button.setAttribute('aria-label',color);button.addEventListener('click',()=>{const input=App.el('ctl-hoverGlowColor');input.value=color;input.dispatchEvent(new Event('change',{bubbles:true}));});swatches.append(button);}
    }
    document.querySelectorAll('[data-extra-select]').forEach(n=>{
      n.value=App.settings[n.dataset.extraSelect];
      const label=n.closest('.range-row')?.querySelector('.range-label-row span');
      if(label){label.id||=n.id+'-label';n.setAttribute('aria-labelledby',label.id);}
      n.addEventListener('change',()=>{
        if(['hoverGlowColor','vizStaticColor'].includes(n.dataset.extraSelect)){const valid=/^#[0-9a-f]{6}$/i.test(n.value);n.setAttribute('aria-invalid',String(!valid));if(!valid)return;}
        App.settings[n.dataset.extraSelect]=n.value;App.saveSettings();App.applyInteractionAppearance();
        if(n.dataset.extraSelect.startsWith('playlistSort')){App.trackListEl.scrollTop=0;App.renderTrackList();}
      });
    });
    const sort=App.el('ctl-playlistSort'),direction=App.el('ctl-playlistSortDirection');
    const sortRow=sort.closest('.range-row'),directionRow=direction.closest('.range-row');
    sort.hidden=true;directionRow.hidden=true;
    const trigger=document.createElement('button');trigger.type='button';trigger.className='playlist-sort-button';
    trigger.id='playlistSortTrigger';trigger.setAttribute('aria-haspopup','menu');trigger.setAttribute('aria-expanded','false');
    const menu=document.createElement('div');menu.id='playlistSortMenu';menu.className='playlist-sort-menu';menu.setAttribute('role','menu');menu.setAttribute('aria-labelledby',trigger.id);menu.inert=true;
    trigger.setAttribute('aria-controls',menu.id);sortRow.append(trigger,menu);
    const arrow=document.createElement('button');arrow.type='button';arrow.className='playlist-sort-direction';arrow.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6"/></svg>';
    directionRow.after(arrow);
    const closeMenu=(focus=false)=>{menu.classList.remove('is-open');menu.inert=true;trigger.setAttribute('aria-expanded','false');if(focus)trigger.focus();};
    const openMenu=()=>{menu.classList.add('is-open');menu.inert=false;trigger.setAttribute('aria-expanded','true');menu.querySelector('[aria-checked="true"]')?.focus();};
    App.syncPlaylistSort=()=>{
      sort.value=App.settings.playlistSort;direction.value=App.settings.playlistSortDirection;
      trigger.textContent=(sort.selectedOptions[0]?.textContent||'')+' ▾';
      trigger.setAttribute('aria-label',(sortRow.querySelector('.range-label-row')?.textContent||'Sort by')+': '+(sort.selectedOptions[0]?.textContent||''));
      const desc=direction.value==='desc';arrow.classList.toggle('descending',desc);
      const cs=document.documentElement.lang==='cs';
      arrow.title=cs?(desc?'Sestupně — změnit na vzestupně':'Vzestupně — změnit na sestupně'):(desc?'Descending — change to ascending':'Ascending — change to descending');arrow.setAttribute('aria-label',arrow.title);
      menu.replaceChildren(...[...sort.options].map(option=>{
        const item=document.createElement('button');item.type='button';item.textContent=option.textContent;item.setAttribute('role','menuitemradio');item.setAttribute('aria-checked',String(option.value===sort.value));
        item.addEventListener('click',()=>{sort.value=option.value;sort.dispatchEvent(new Event('change',{bubbles:true}));closeMenu(true);});return item;
      }));
    };
    trigger.addEventListener('click',()=>menu.inert?openMenu():closeMenu());
    trigger.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();openMenu();}});
    menu.addEventListener('keydown',e=>{
      const items=[...menu.children],index=items.indexOf(document.activeElement);
      if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeMenu(true);}
      else if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();items[e.key==='Home'?0:e.key==='End'?items.length-1:(index+(e.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();}
    });
    document.addEventListener('pointerdown',e=>{if(!sortRow.contains(e.target))closeMenu();});
    sortRow.addEventListener('focusout',e=>{if(!sortRow.contains(e.relatedTarget))closeMenu();});
    arrow.addEventListener('click',()=>{direction.value=direction.value==='desc'?'asc':'desc';direction.dispatchEvent(new Event('change',{bubbles:true}));});
    new MutationObserver(()=>App.syncPlaylistSort()).observe(sort,{subtree:true,childList:true,characterData:true});
    new MutationObserver(()=>App.syncPlaylistSort()).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    App.syncPlaylistSort();
    const playlist=App.el('playlistPanel'),button=App.el('btnPlaylistToggle');
    const syncPlaylist=()=>{const closed=App.app.classList.contains('playlist-closed');playlist.inert=closed;button.setAttribute('aria-expanded',String(!closed));button.setAttribute('aria-controls','playlistPanel');if(closed&&playlist.contains(document.activeElement))button.focus();};
    button.setAttribute('role','button');button.tabIndex=0;
    button.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();button.click();}});
    button.addEventListener('click',syncPlaylist);syncPlaylist();
    let frame=0,point=null,timer=0;
    const nearControl=(x,y)=>{
      const r=App.el('controlBar').getBoundingClientRect();
      return x>=r.left-100&&x<=r.right+100&&y>=r.top-90&&y<=r.bottom+90;
    };
    const hide=()=>{if(App.settings.liveRevealMode!=='always')document.body.classList.add('live-idle');};
    const reveal=()=>{document.body.classList.remove('live-idle');clearTimeout(timer);timer=setTimeout(hide,Math.max(1,Number(App.settings.liveIdleSeconds)||5)*1000);};
    App.applyInteractionAppearance.refreshLive=()=>{clearTimeout(timer);if(App.settings.liveRevealMode==='always')document.body.classList.remove('live-idle');else if(point&&(App.settings.liveRevealMode==='movement'||nearControl(point.x,point.y)))reveal();else hide();};
    // A single overlay draws only outlines inside the pointer's radius. No idle loop,
    // no per-element filters or layout writes, and no interference with favorite rings.
    const canvas=document.createElement('canvas');canvas.className='pointer-outline-glow';
    canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
    const ctx=canvas.getContext('2d');
    const selector='button,.icon-btn,.switch,.ctrl-chip,.live-stats-side,.track-row,.track-meta-chip,.track-meta-heart-badge,.bar-track-info-heart-badge,.settings-nav-item,.settings-subnav-item,input:not([type=range]),select,#settingsPanel,#playlistPanel,#controlBar,#timelineIsland,#visualizerDock,#trackInfoPopover,#stageTrackInfoPopover';
    let candidates=[],cacheTime=0,movingUntil=0;
    const visibleCandidates=new WeakMap(),observedCandidates=new Set();
    const candidateObserver=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{
      for(const entry of entries)visibleCandidates.set(entry.target,entry.isIntersecting);
    },{rootMargin:'300px'}):null;
    const resize=()=>{canvas.width=innerWidth;canvas.height=innerHeight;cacheTime=0;schedule();};
    function schedule(){if(!frame)frame=requestAnimationFrame(updatePointer);}
    App.refreshPointerGlow=(duration=0)=>{movingUntil=Math.max(movingUntil,performance.now()+duration);cacheTime=0;schedule();};
    document.addEventListener('transitionrun',e=>{
      if(['transform','translate','opacity','display'].includes(e.propertyName)&&e.target.closest('#app,#trackInfoPopover'))App.refreshPointerGlow(App.SettingsUI?.motionDuration?.()||0);
    });
    function updatePointer(){
      frame=0;ctx.clearRect(0,0,canvas.width,canvas.height);
      // Rebuilt settings panels must be collectable even when the pointer left
      // the window or glow is disabled (both used to return before cleanup).
      if(!cacheTime){
        candidates=candidates.filter(n=>n.isConnected);
        for(const n of observedCandidates)if(!n.isConnected){candidateObserver.unobserve(n);observedCandidates.delete(n);visibleCandidates.delete(n);}
      }
      if(!point||App.isActivelyScrolling?.())return;
      if(App.settings.liveRevealMode==='movement'||App.settings.liveRevealMode==='near'&&nearControl(point.x,point.y))reveal();
      if(!App.settings.hoverGlow||document.hidden)return;
      const radius=Math.max(0,Math.min(300,Number(App.settings.hoverRadius)||0));if(!radius)return;
      if(performance.now()-cacheTime>180){
        candidates=[...document.querySelectorAll(selector)];cacheTime=performance.now();
        if(candidateObserver){
          const next=new Set(candidates);
          for(const n of observedCandidates)if(!next.has(n)){candidateObserver.unobserve(n);observedCandidates.delete(n);visibleCandidates.delete(n);}
          for(const n of candidates)if(!observedCandidates.has(n)){observedCandidates.add(n);candidateObserver.observe(n);}
        }
      }
      const strength=Math.max(0,Math.min(1,Number(App.settings.hoverGlowStrength)||0));
      const hex=/^#[0-9a-f]{6}$/i.test(App.settings.hoverGlowColor)?App.settings.hoverGlowColor:'#eec4ff';
      const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).join(',');
      const localRadius=radius*Math.max(0,Math.min(100,(Number.isFinite(App.settings.hoverIslandRadiusPercent)?App.settings.hoverIslandRadiusPercent:50)))/100;
      const makeGradient=(reach,color,alpha=strength)=>{const g=ctx.createRadialGradient(point.x,point.y,0,point.x,point.y,Math.max(.01,reach));g.addColorStop(0,`rgba(${color},${alpha})`);g.addColorStop(.45,`rgba(${color},${alpha*.5})`);g.addColorStop(1,`rgba(${color},0)`);return g;};
      const gradients=[makeGradient(radius,rgb),makeGradient(localRadius,rgb)];
      const reds=[makeGradient(radius,'255,31,77'),makeGradient(localRadius,'255,31,77')];
      const hovered=document.elementFromPoint(point.x,point.y)?.closest('button,.icon-btn,.switch,.heart-btn,.track-meta-heart-badge,.bar-track-info-heart-badge,.track-row,.aurora-select-button');
      const hoverCoverage=Math.max(0,Math.min(100,Number(App.settings.hoverOutlineCoverage)||0))/100;
      const styles=new Map(),rects=new Map();
      const styleFor=n=>{if(!styles.has(n))styles.set(n,getComputedStyle(n));return styles.get(n);};
      const rectFor=n=>{if(!rects.has(n))rects.set(n,n.getBoundingClientRect());return rects.get(n);};
      for(const n of candidates){
        if(visibleCandidates.get(n)===false)continue;
        if(!n.isConnected||n.closest('[inert]')||!n.getClientRects().length)continue;
        const r=rectFor(n);
        if(r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth)continue;
        const distance=Math.hypot(Math.max(r.left-point.x,0,point.x-r.right),Math.max(r.top-point.y,0,point.y-r.bottom));
        // The detached bottom popover belongs to the control panel's glow range.
        const local=n.id==='trackInfoPopover'||!!n.closest('#trackInfoPopover,#controlBar,#timelineIsland,#timelineIslandExtension,#visualizerDock');
        if(distance>=(local?localRadius:radius))continue;
        const style=styleFor(n);if(style.visibility==='hidden'||Number(style.opacity)===0)continue;
        // Clip scrolling lists/panels so offscreen rows cannot shine through chrome.
        ctx.save();let visible=true;for(let parent=n.parentElement;parent&&parent!==document.body;parent=parent.parentElement){
          const ps=styleFor(parent);if(Number(ps.opacity)===0||ps.visibility==='hidden'){visible=false;break;}if(/auto|scroll|hidden|clip/.test(ps.overflowX+' '+ps.overflowY)){
            const pr=rectFor(parent);ctx.beginPath();ctx.rect(pr.left,pr.top,pr.width,pr.height);ctx.clip();
          }
        }
        if(!visible){ctx.restore();continue;}
        // Covered controls must not draw through floating surfaces.
        for(const cover of [App.el('settingsPanel'),menu,App.el('trackInfoPopover'),App.el('stageTrackInfoPopover'),App.compactPlayer?App.el('playlistPanel'):null]){
          if(!cover||cover===n||cover.contains(n)||!(cover.classList.contains('open')||cover.classList.contains('is-open')||cover.classList.contains('show')||cover.id==='playlistPanel'&&!App.app.classList.contains('playlist-closed')))continue;
          const cr=rectFor(cover);ctx.beginPath();ctx.rect(0,0,canvas.width,canvas.height);ctx.rect(cr.left,cr.top,cr.width,cr.height);ctx.clip('evenodd');
        }
        const hoverAlpha=Math.max(0,Math.min(100,Number(App.settings.hoverFullOutlineStrength)||0))/100;
        const fullOutline=n===hovered&&hoverAlpha>0&&strength>0;
        const color=n.classList.contains('liked')?'255,31,77':rgb;
        ctx.strokeStyle=(n.classList.contains('liked')?reds:gradients)[local?1:0];
        if(fullOutline){
          // Coverage and hover intensity are independent; neighbors retain the global glow.
          const farthest=Math.hypot(Math.max(Math.abs(r.left-point.x),Math.abs(r.right-point.x)),Math.max(Math.abs(r.top-point.y),Math.abs(r.bottom-point.y)));
          const reach=local?localRadius:radius;
          ctx.strokeStyle=hoverCoverage===1?`rgba(${color},${hoverAlpha})`:makeGradient((reach+farthest*hoverCoverage)/(1-hoverCoverage),color,hoverAlpha);
        }
        const radii=['borderTopLeftRadius','borderTopRightRadius','borderBottomRightRadius','borderBottomLeftRadius'].map(key=>{
          const parts=(style[key]||'0').split(' ');
          const size=(v,axis)=>Math.max(0,(v.endsWith('%')?parseFloat(v)*axis/100:parseFloat(v)||0)-.5);
          return {x:size(parts[0],r.width),y:size(parts[1]||parts[0],r.height)};
        });
        if(n.id==='timelineIsland'&&style.borderBottomStyle==='none'){ctx.beginPath();ctx.rect(r.left-8,r.top-8,r.width+16,r.height+6);ctx.clip();}
        ctx.beginPath();ctx.roundRect(r.left+.5,r.top+.5,Math.max(0,r.width-1),Math.max(0,r.height-1),radii);
        // Large information surfaces need a finer halo than small controls.
        // Keep the configured gradient/intensity, with no button-hover boost.
        const infoSurface=n.id==='trackInfoPopover'||n.id==='stageTrackInfoPopover';
        ctx.globalAlpha=infoSurface ? .08 : .18;ctx.lineWidth=infoSurface?4:8;ctx.stroke();
        ctx.globalAlpha=infoSurface ? .2 : .4;ctx.lineWidth=infoSurface?2:4;ctx.stroke();
        ctx.globalAlpha=infoSurface ? .65 : 1;ctx.lineWidth=infoSurface?1:1.4;ctx.stroke();ctx.restore();
      }
      if(performance.now()<movingUntil)schedule();
    }
    window.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;point={x:e.clientX,y:e.clientY};schedule();},{passive:true});
    document.addEventListener('pointerleave',()=>{point=null;schedule();});
    window.addEventListener('blur',()=>{point=null;schedule();});
    window.addEventListener('resize',resize,{passive:true});
    document.addEventListener('scroll',schedule,{passive:true,capture:true});
    document.addEventListener('change',schedule);document.addEventListener('input',schedule);document.addEventListener('click',()=>{cacheTime=0;schedule();});
    resize();
    window.addEventListener('blur',hide);
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>App.SettingsUI.applyPlayerStyle());
    App.applyInteractionAppearance();
  };
  App.define("ui/interactions", function initialize(){
  }, ["applyInteractionAppearance","mountInteractionEffects"]);
})(window.Aurora);

// ── ui/tooltips ──
(function(App){
App.labelTooltips = function labelTooltips(root){
    [...(root.matches?.('.toggle-row>span,.range-label-row>span,.track-info strong,.track-meta h2,#barTitle,#barArtist')?[root]:[]),...root.querySelectorAll('.toggle-row>span,.range-label-row>span,.track-info strong,.track-meta h2,#barTitle,#barArtist,.setting-block h3,.setting-subhead')].forEach(n=>{if(n.dataset.settingsHelp){n.removeAttribute('title');return;}const t=n.textContent.trim();if(t&&n.title!==t)n.title=t;});
  };
  App.define("ui/tooltips", function initialize(){
App.labelTooltips(document);
new MutationObserver(records=>{
  const roots=new Set();
  for(const record of records){
    if(record.type==='characterData'){if(record.target.parentElement)roots.add(record.target.parentElement);}
    else{
      // Text replacement needs its label updated; new subtrees need indexing.
      if([...record.addedNodes].some(n=>n.nodeType===3))roots.add(record.target);
      for(const node of record.addedNodes)if(node.nodeType===1)roots.add(node);
    }
  }
  for(const root of roots)if(root.isConnected&&!roots.has(root.parentElement))App.labelTooltips(root);
}).observe(document.body,{subtree:true,childList:true,characterData:true});
  }, ["labelTooltips"]);
})(window.Aurora);

// ── UI view: js/ui/color-swatches ──
(function(App){
App.renderPlayerColorSwatches = function renderPlayerColorSwatches(){
    const row = App.el('playerColorRow');
    row.innerHTML = '';
    App.bgPresets.forEach(p=>{
      const isActive = App.settings.playerColor1 === p[0] && App.settings.playerColor2 === p[1];
      const sw = document.createElement('button');
      sw.type='button';sw.setAttribute('aria-label',p.join(' / '));sw.setAttribute('aria-pressed',String(isActive));
      sw.className = 'swatch' + (isActive ? ' active' : '');
      sw.style.background = `linear-gradient(135deg, ${p[0]}, ${p[1]})`;
      sw.addEventListener('click', ()=>{
        App.settings.playerColor1 = p[0]; App.settings.playerColor2 = p[1];
        App.el('playerCustomColor1').value = p[0];
        App.el('playerCustomColor2').value = p[1];
        App.saveSettings();
        App.renderPlayerColorSwatches();
      });
      row.appendChild(sw);
    });
    App.el('playerCustomColor1').value = App.settings.playerColor1;
    App.el('playerCustomColor2').value = App.settings.playerColor2;
    const exceptionsWrap = App.el('playerSyncExceptionsWrap');
    exceptionsWrap.style.display = App.settings.playerColorSync ? '' : 'none';
    const anyExceptionActive = App.settings.playerColorSync && (!App.settings.playerSyncThumbs || !App.settings.playerSyncPlayBtn || !App.settings.playerSyncGear);
    const wrap = App.el('playerColorPickerWrap');
    const dimAndLock = App.settings.playerColorSync && !anyExceptionActive;
    wrap.style.opacity = dimAndLock ? '0.4' : '1';
    wrap.style.pointerEvents = dimAndLock ? 'none' : '';
  };
})(window.Aurora);

// ── UI view: js/ui/color-swatches ──
(function(App){
App.renderBgColorSwatches = function renderBgColorSwatches(){
    const row = App.el('bgColorRow');
    row.innerHTML = '';
    App.bgPresets.forEach(p=>{
      const isActive = App.settings.bgColor1 === p[0] && App.settings.bgColor2 === p[1];
      const sw = document.createElement('button');
      sw.type='button';sw.setAttribute('aria-label',p.join(' / '));sw.setAttribute('aria-pressed',String(isActive));
      sw.className = 'swatch' + (isActive ? ' active' : '');
      sw.style.background = `linear-gradient(135deg, ${p[0]}, ${p[1]})`;
      sw.addEventListener('click', ()=>{
        App.settings.bgColor1 = p[0]; App.settings.bgColor2 = p[1];
        App.el('bgCustomColor1').value = p[0];
        App.el('bgCustomColor2').value = p[1];
        App.saveSettings();
        App.renderBgColorSwatches();
      });
      row.appendChild(sw);
    });
    App.el('bgCustomColor1').value = App.settings.bgColor1;
    App.el('bgCustomColor2').value = App.settings.bgColor2;
  };
})(window.Aurora);

// ── UI view: js/ui/background-layers ──
(function(App){
App.renderBgLayers = function renderBgLayers(){
    App._liveValNodeCache?.clear();
    const container = App.el('bgLayerList');
    const focused=document.activeElement;
    const focusAttributes=focused && container.contains(focused) ? [...focused.attributes].filter(a=>a.name.startsWith('data-layer-')).map(a=>[a.name,a.value]) : [];
    App.layerSectionState ||= new Map();
    container.querySelectorAll('details[data-layer-section]').forEach(section=>App.layerSectionState.set(section.dataset.layerSection,section.open));
    container.innerHTML = '';
    const percents = App.computeLayerPercents();
    App.settings.bgLayers.forEach((layer, idx)=>{
      if(!layer.overrides) layer.overrides = {};
      const shapeDef = App.BlobShapes[layer.shape] || App.BlobShapes.circle;
      const card = document.createElement('div');
      card.className = 'bg-layer-card' + (layer.enabled ? '' : ' disabled');
      const gradId = `bgLayerIconGrad_${idx}`;
      const pct = percents[idx];
      const barColor = App.LAYER_BAR_COLORS[idx % App.LAYER_BAR_COLORS.length];
      card.innerHTML = `
        <div class="bg-layer-head">
          <div class="switch ${layer.enabled ? 'on' : ''}" data-layer-enable="${idx}"></div>
          <div class="bg-layer-shape-icon">
            <svg viewBox="0 0 100 100">
              <defs><linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="var(--accent1)"/><stop offset="100%" stop-color="var(--accent2)"/>
              </linearGradient></defs>
              <path d="${shapeDef.path(layer.cornerRadius||0)}" fill-rule="${shapeDef.fillRule||'nonzero'}" fill="url(#${gradId})"/>
            </svg>
          </div>
          <div class="bg-layer-title">
            <strong>Vrstva ${idx+1} — ${shapeDef.label}</strong>
            <span>${layer.count}× tečka, velikost ${layer.size.toFixed(2)}×${layer.pathEnabled ? ' · ' + (App.MotionPaths[layer.path||'random']||App.MotionPaths.random).label : ''}</span>
          </div>
          <div class="bg-layer-head-actions">
            <button type="button" class="bg-layer-gear-btn ${App.openLayerGear===idx?'active':''}" data-layer-gear="${idx}" aria-expanded="${App.openLayerGear===idx}" title="Nastavení vrstvy">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>

          </div>
        </div>
        <div class="bg-layer-pct-bar-wrap" title="Podíl počtu teček v aktivních vrstvách">
          <div class="bg-layer-pct-bar-bg"><div class="bg-layer-pct-bar-fill" style="width:${pct}%; background:${barColor};"></div></div>
          <div class="bg-layer-pct-label">${Math.round(pct)}%</div>
        </div>

        <div class="bg-layer-gear-panel ${App.openLayerGear===idx ? 'open':''}" data-layer-panel="${idx}">
          ${App.openLayerGear===idx ? `<div class="layer-section-content"><h4 class="setting-subhead">Tvar a rozměry</h4><div>
            <div class="range-label-row" style="margin-bottom:6px;"><span>Tvar</span></div>
            <div class="bg-layer-shape-grid" data-layer-shape-grid="${idx}"></div>
          </div><div class="layer-control-grid"><div class="range-row" style="margin-top:0;">
            <div class="range-label-row"><span>Počet teček</span><strong data-layer-val="count">${layer.count}</strong></div>
            <input type="range" data-layer-field="count" data-layer-idx="${idx}" min="1" max="24" step="1" value="${layer.count}">
          </div>
          <div class="range-row">
            <div class="range-label-row"><span>Velikost</span><strong data-layer-val="size">${layer.size.toFixed(2)}×</strong></div>
            <input type="range" data-layer-field="size" data-layer-idx="${idx}" min="0.2" max="2.5" step="0.05" value="${layer.size}">
          </div><div class="range-row" data-layer-corner-row="${idx}" style="${(shapeDef.supportsRounding || layer.shape==='square') ? '' : 'display:none;'}">
            <div class="range-label-row"><span>Zaoblení rohů</span><strong data-layer-val="cornerRadius">${Math.round((layer.cornerRadius||0)*100)}%</strong></div>
            <input type="range" data-layer-field="cornerRadius" data-layer-idx="${idx}" min="0" max="1" step="0.01" value="${layer.cornerRadius||0}">
            <div class="range-hint">Zaoblí ostré hrany a rohy tvaru (funguje i na vnitřní zářezy u crosshairu). 0 % = původní ostré hrany, 100 % = maximální zaoblení.</div>
          </div><div class="range-row">
            <div class="range-label-row"><span>Celková viditelnost vrstvy</span><strong data-layer-val="opacity">${Math.round((typeof layer.opacity==='number'?layer.opacity:1)*100)}%</strong></div>
            <input type="range" data-layer-field="opacity" data-layer-idx="${idx}" min="0" max="1" step="0.01" value="${typeof layer.opacity==='number'?layer.opacity:1}">
            <div class="range-hint">Finální násobič viditelnosti celé vrstvy, navrch Základního jasu i flashování. Na 0 % je vrstva neviditelná, ale zůstává nakonfigurovaná — vhodné na dočasné schování vrstvy.</div>
          </div></div></div><details class="layer-settings-section" data-layer-section="${idx}:motion"><summary>Pohyb a rotace</summary><div class="layer-section-content"><div class="toggle-row">
            <span style="font-size:11.5px; color:var(--text-dim);">Vlastní dráha pohybu</span>
            <div class="switch ${layer.pathEnabled?'on':''}" data-layer-toggle="pathEnabled" data-layer-idx="${idx}"></div>
          </div>
          <div style="${layer.pathEnabled?'':'display:none;'}" data-layer-path-row="${idx}">
            <select class="map-select" data-layer-path-select="${idx}">
              ${Object.keys(App.MotionPaths).map(k=>`<option value="${k}" ${((layer.path||'random')===k)?'selected':''}>${App.MotionPaths[k].label}</option>`).join('')}
            </select>
            <div class="range-hint">Určuje TVAR pohybu teček — náhodný drift, plynulý tok jedním směrem, nebo pohyb do/ze středu. Rychlost pohybu pořád řídí Rychlost driftu + mapování Rychlost pohybu níže. Vypnuto = původní volný náhodný pohyb (výchozí).</div>
          </div>
          <div class="range-row" style="${(layer.pathEnabled && ['fall','rise','left','right'].includes(layer.path||'random')) ? '' : 'display:none;'}" data-layer-sway-row="${idx}">
            <div class="range-label-row"><span>Boční kývání</span><strong data-layer-val="swayAmount">${Math.round((typeof layer.swayAmount==='number'?layer.swayAmount:0.02)*500)}%</strong></div>
            <input type="range" data-layer-field="swayAmount" data-layer-idx="${idx}" min="0" max="0.12" step="0.002" value="${typeof layer.swayAmount==='number'?layer.swayAmount:0.02}">
            <div class="range-hint">Jak moc se tečky kolébají do stran napříč směrem pohybu (kolmo na dráhu "Padání shora"/"Zdola nahoru"/"Zprava doleva"/"Zleva doprava"). 0 % = dokonale rovná dráha bez kolébání. Nesouvisí s "Automatické houpání rotace" výše, které otáčí tvarem, ne jeho pozicí.</div>
          </div><div class="range-row">
            <div class="range-label-row"><span>Rotace</span><strong data-layer-val="rotation">${Math.round(layer.rotation)}°</strong></div>
            <input type="range" data-layer-field="rotation" data-layer-idx="${idx}" min="0" max="360" step="1" value="${layer.rotation}">
          </div>
          <div class="toggle-row">
            <span style="font-size:11.5px; color:var(--text-dim);">Automatické houpání rotace</span>
            <div class="switch ${layer.rotationWobble?'on':''}" data-layer-toggle="rotationWobble" data-layer-idx="${idx}"></div>
          </div>
          <div class="range-hint">Vypnuto (výchozí) = rotace je pevně na hodnotě ze slideru výše. Zapnuto = tečky se navíc jemně houpou ±8° kolem této hodnoty, rychlostí odvozenou z aktuálního driftu/rychlosti vrstvy.</div></div></details><details class="layer-settings-section" data-layer-section="${idx}:effects"><summary>Jas a efekty</summary><div class="layer-section-content"><div class="range-row">
            <div class="range-label-row"><span>Základní jas</span><strong data-layer-val="baseAlpha">${Math.round(layer.baseAlpha*100)}%</strong></div>
            <input type="range" data-layer-field="baseAlpha" data-layer-idx="${idx}" min="0" max="1" step="0.01" value="${layer.baseAlpha}">
          </div>

          <div class="toggle-row">
            <span style="font-size:11.5px; color:var(--text-dim);">Rozostření</span>
            <div class="switch ${layer.blurEnabled?'on':''}" data-layer-toggle="blurEnabled" data-layer-idx="${idx}"></div>
          </div>
          <div class="range-row" style="${layer.blurEnabled?'':'display:none;'}" data-layer-blur-row="${idx}">
            <div class="range-label-row"><span>Míra rozostření</span><strong data-layer-val="blur">${Math.round(layer.blur)}px</strong></div>
            <input type="range" data-layer-field="blur" data-layer-idx="${idx}" min="0" max="140" step="5" value="${layer.blur}">
          </div><div data-advanced="true" class="toggle-row" style="margin-top:2px;">
            <span style="font-size:11.5px; color:var(--text-dim);">Zrcadlit tuto vrstvu (Mirror post-processing)</span>
            <div class="switch ${layer.mirrorEnabled!==false?'on':''}" data-layer-toggle="mirrorEnabled" data-layer-idx="${idx}"></div>
          </div>
          <div data-advanced="true" class="range-hint">Vypnuto = tato vrstva se nikdy nezrcadlí, i když je globální efekt "Zrcadlení (Mirror)" v Efektech pozadí zapnutý pro zbytek pozadí.</div>

          <div class="setting-subhead" style="margin-top:16px;">Trail (stopa)</div>
          <div class="toggle-row">
            <span style="font-size:11.5px; color:var(--text-dim);">Zapnuto</span>
            <div class="switch ${layer.trailEnabled?'on':''}" data-layer-toggle="trailEnabled" data-layer-idx="${idx}"></div>
          </div>
          <div style="${layer.trailEnabled?'':'display:none;'}" data-layer-trail-detail="${idx}">
            <div class="range-row" style="margin-top:10px;">
              <div class="range-label-row"><span>Délka stopy</span><strong data-layer-val="trailLength">${Math.round((typeof layer.trailLength==='number'?layer.trailLength:0.4)*100)}%</strong></div>
              <input type="range" data-layer-field="trailLength" data-layer-idx="${idx}" min="0.05" max="1" step="0.01" value="${typeof layer.trailLength==='number'?layer.trailLength:0.4}">
            </div>
            <div class="range-row">
              <div class="range-label-row"><span>Velikost stop (násobič)</span><strong data-layer-val="trailWidth">${Math.round((typeof layer.trailWidth==='number'?Math.min(3,layer.trailWidth):1.05)*100)}%</strong></div>
              <input type="range" data-layer-field="trailWidth" data-layer-idx="${idx}" min="0.1" max="3" step="0.05" value="${typeof layer.trailWidth==='number'?Math.min(3,layer.trailWidth):1.05}">
            </div>
            <div class="range-hint">100 % = ghost kopie mají stejnou velikost jako samotný blob. Méně = menší ghosts, více = větší. Tvar ghosts odpovídá vybranému tvaru vrstvy. Rychlost blednutí celé stopy se nastavuje globálně níže v "Efekty pozadí".</div>
          </div>

          <div class="setting-subhead" style="margin-top:16px;">Sparkles (třpytky)</div>
          <div class="toggle-row">
            <span style="font-size:11.5px; color:var(--text-dim);">Zapnuto pro tuto vrstvu</span>
            <div class="switch ${layer.sparklesEnabled?'on':''}" data-layer-toggle="sparklesEnabled" data-layer-idx="${idx}"></div>
          </div>
          <div class="range-hint">Tečky této vrstvy náhodně vyzařují drobné třpytivé jiskřičky, které odletí kousek stranou a zhasnou. Hustotu, velikost a délku života třpytek nastavíš globálně níže v "Efekty pozadí" (globální hlavní vypínač musí být taky zapnutý).</div>

          <div class="setting-subhead" style="margin-top:16px;">Beat cut (ztmavení na beat)</div>
          <div class="toggle-row">
            <span style="font-size:11.5px; color:var(--text-dim);">Zapnuto pro tuto vrstvu</span>
            <div class="switch ${layer.beatCutEnabled?'on':''}" data-layer-toggle="beatCutEnabled" data-layer-idx="${idx}"></div>
          </div>
          <div class="range-hint">Tečky této vrstvy krátce ztmavnou v rytmu beatu — ale jen když hlasitost zůstane delší dobu skoro na 100 % (typicky "zeď zvuku" na dropu/vrcholu). Jednorázový hlasitý úder to nespustí, potřeba je souvislé držení hlasitosti nahoře. Každá vrstva má vlastní nezávislé nastavení níže.</div>
          <div style="${layer.beatCutEnabled?'':'display:none;'}" data-layer-beatcut-detail="${idx}">
            <div class="range-row" style="margin-top:10px;">
              <div class="range-label-row"><span>Práh hlasitosti</span><strong data-layer-val="beatCutThreshold">${Math.round(typeof layer.beatCutThreshold==='number'?layer.beatCutThreshold:97)}%</strong></div>
              <input type="range" data-layer-field="beatCutThreshold" data-layer-idx="${idx}" min="80" max="100" step="1" value="${typeof layer.beatCutThreshold==='number'?layer.beatCutThreshold:97}">
              <div class="range-hint">Hlasitost musí být na/nad touto hodnotou, aby se počítala jako "skoro na maximu".</div>
            </div>
            <div data-advanced="true" class="range-row">
              <div class="range-label-row"><span>Doba držení před spuštěním</span><strong data-layer-val="beatCutSustainSec">${(typeof layer.beatCutSustainSec==='number'?layer.beatCutSustainSec:1.2).toFixed(2)}s</strong></div>
              <input type="range" data-layer-field="beatCutSustainSec" data-layer-idx="${idx}" min="0.1" max="5" step="0.1" value="${typeof layer.beatCutSustainSec==='number'?layer.beatCutSustainSec:1.2}">
              <div class="range-hint">Jak dlouho musí hlasitost nepřetržitě zůstat nad prahem, než střihy vůbec začnou. Krátký pokles pod práh počítadlo vynuluje.</div>
            </div>
            <div class="range-row">
              <div class="range-label-row"><span>Tmavost střihu</span><strong data-layer-val="beatCutDarkness">${Math.round((typeof layer.beatCutDarkness==='number'?layer.beatCutDarkness:0.7)*100)}%</strong></div>
              <input type="range" data-layer-field="beatCutDarkness" data-layer-idx="${idx}" min="0.1" max="1" step="0.01" value="${typeof layer.beatCutDarkness==='number'?layer.beatCutDarkness:0.7}">
              <div class="range-hint">Jak moc tato vrstva ztmavne v nejtmavším bodě jednoho střihu. 100 % = úplně neviditelná, méně = jen ztlumená.</div>
            </div>
            <div class="range-row">
              <div class="range-label-row"><span>Délka jednoho střihu</span><strong data-layer-val="beatCutDuration">${Math.round(typeof layer.beatCutDuration==='number'?layer.beatCutDuration:90)}ms</strong></div>
              <input type="range" data-layer-field="beatCutDuration" data-layer-idx="${idx}" min="20" max="400" step="5" value="${typeof layer.beatCutDuration==='number'?layer.beatCutDuration:90}">
              <div class="range-hint">Jak dlouho trvá jeden střih od začátku ztmavení až po návrat zpátky do normálu.</div>
            </div>
            <div data-advanced="true" class="range-row">
              <div class="range-label-row"><span>Min. jistota tempa pro sync na beat</span><strong data-layer-val="beatCutMinConfidence">${Math.round((typeof layer.beatCutMinConfidence==='number'?layer.beatCutMinConfidence:0.35)*100)}%</strong></div>
              <input type="range" data-layer-field="beatCutMinConfidence" data-layer-idx="${idx}" min="0" max="1" step="0.01" value="${typeof layer.beatCutMinConfidence==='number'?layer.beatCutMinConfidence:0.35}">
              <div class="range-hint">Pod touto jistotou detekce tempa se střihy nesynchronizují přesně na beat — místo toho poběží na pevný interval níže.</div>
            </div>
            <div data-advanced="true" class="range-row">
              <div class="range-label-row"><span>Záložní tempo (bez jistoty beatu)</span><strong data-layer-val="beatCutFallbackBpm">${Math.round(typeof layer.beatCutFallbackBpm==='number'?layer.beatCutFallbackBpm:120)} BPM</strong></div>
              <input type="range" data-layer-field="beatCutFallbackBpm" data-layer-idx="${idx}" min="60" max="200" step="1" value="${typeof layer.beatCutFallbackBpm==='number'?layer.beatCutFallbackBpm:120}">
            </div>
          </div></div></details><details class="layer-settings-section" data-layer-section="${idx}:response"><summary>Reakce na hudbu</summary><div class="layer-section-content"><div class="range-row">
            <div class="range-label-row"><span>Citlivost na MusicSense</span><strong data-layer-val="sensMult">${Math.round(layer.sensMult*100)}%</strong></div>
            <input type="range" data-layer-field="sensMult" data-layer-idx="${idx}" min="0" max="2" step="0.05" value="${layer.sensMult}">
            <div class="range-hint">Násobí, jak silně tuto vrstvu ovlivňují sdílená mapování Velikost/Rychlost/Flash/Blur níže. Na 0 % vrstva na hudbu vůbec nereaguje, jen sedí na místě dle Základního jasu. Nemá vliv na cíle, které mají níže zapnutý vlastní Override — ty mají vlastní citlivost.</div>
          </div><div class="settings-detail-content" data-advanced="true"><div class="setting-subhead" style="margin-top:16px;">Vlastní mapování (override)</div>
          <div style="font-size:11px; color:var(--text-dim); margin-top:-2px; margin-bottom:2px; line-height:1.4;">Vypnuto = společné mapování z Pozadí → Reakce na hudbu. Vlastní mapování nahradí zdroj a citlivost pouze pro tuto vrstvu.</div>
          <div data-layer-override-list="${idx}"></div></div></div></details>` : ''}
        </div>
      `;
      container.appendChild(card);
      const overrideList = card.querySelector(`[data-layer-override-list="${idx}"]`);
      if(overrideList) App.BG_MAP_TARGETS.forEach(target=>{
        const key = `layer:${idx}:${target.overrideKey}`;
        const hasOverride = !!(layer.overrides && layer.overrides[target.overrideKey]);
        const block = document.createElement('div');
        block.className = 'bg-layer-override-block';
        block.style.cssText = 'margin-top:10px; padding:10px 12px; border-radius:10px; background:rgba(255,255,255,0.025); border:1px solid var(--border);';
        block.innerHTML = `
          <div class="toggle-row">
            <span style="font-size:12.5px; display:flex; align-items:center; gap:7px;"><span class="map-swatch-dot" style="background:${target.dotColor}; width:8px; height:8px; border-radius:50%; display:inline-block;"></span>${target.label}</span>
            <div class="switch ${hasOverride?'on':''}" data-layer-override-toggle="${target.overrideKey}" data-layer-idx="${idx}"></div>
          </div>
          <div data-layer-override-row-wrap="${key}" style="${hasOverride?'margin-top:10px;':'display:none;'}"></div>
        `;
        overrideList.appendChild(block);
        if(hasOverride){
          const wrap = block.querySelector(`[data-layer-override-row-wrap="${key}"]`);
          wrap.appendChild(App.buildMapRowElement(key, target));
        }
        block.querySelector('[data-layer-override-toggle]').addEventListener('click', ()=>{
          if(!layer.overrides) layer.overrides = {};
          if(layer.overrides[target.overrideKey]){
            delete layer.overrides[target.overrideKey];
          } else {
            layer.overrides[target.overrideKey] = App.createLayerOverride(target);
          }
          App.saveSettings();
          App.renderBgLayers();
        });
      });
      const shapeGrid = card.querySelector(`[data-layer-shape-grid="${idx}"]`);
      if(shapeGrid) Object.keys(App.BlobShapes).forEach(key=>{
        const def = App.BlobShapes[key];
        const tile = document.createElement('button');
        tile.type='button';tile.dataset.layerShape=key;tile.dataset.layerIdx=String(idx);tile.setAttribute('aria-pressed',String(layer.shape===key));
        tile.className = 'bg-layer-shape-tile' + (layer.shape === key ? ' active' : '');
        tile.title = def.label;tile.setAttribute("aria-label",def.label);
        const tileGradId = `bgLayerTileGrad_${idx}_${key}`;
        tile.innerHTML = `<svg viewBox="0 0 100 100"><defs><linearGradient id="${tileGradId}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="var(--accent1)"/><stop offset="100%" stop-color="var(--accent2)"/></linearGradient></defs><path d="${def.path()}" fill-rule="${def.fillRule||'nonzero'}" fill="url(#${tileGradId})"/></svg>`;
        tile.addEventListener('click', ()=>{
          layer.shape = key;
          App.saveSettings();
          App.renderBgLayers();
        });
        const name=document.createElement("span");name.textContent=def.label;tile.appendChild(name);
        shapeGrid.appendChild(tile);
      });
      const pathSelect = card.querySelector(`[data-layer-path-select="${idx}"]`);
      if(pathSelect){
        pathSelect.addEventListener('change', ()=>{
          layer.path = pathSelect.value;
          App.saveSettings();
          App.renderBgLayers();
        });
      }
    });
    container.querySelectorAll('[data-layer-enable]').forEach(sw=>{
      sw.addEventListener('click', ()=>{
        const idx = parseInt(sw.dataset.layerEnable);
        const layer = App.settings.bgLayers[idx];
        const enabledElsewhere = App.settings.bgLayers.some((l,i)=> i!==idx && l.enabled);
        if(layer.enabled && !enabledElsewhere) return;
        layer.enabled = !layer.enabled;
        App.saveSettings();
        App.renderBgLayers();
      });
    });
    container.querySelectorAll('[data-layer-gear]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const idx = parseInt(btn.dataset.layerGear);
        App.openLayerGear = (App.openLayerGear === idx) ? -1 : idx;
        App.renderBgLayers();
        container.querySelector(`[data-layer-gear="${idx}"]`)?.focus({preventScroll:true});
      });
    });
    container.querySelectorAll('[data-layer-toggle]').forEach(sw=>{
      sw.addEventListener('click', ()=>{
        const idx = parseInt(sw.dataset.layerIdx);
        const field = sw.dataset.layerToggle;
        const layer = App.settings.bgLayers[idx];
        layer[field] = !layer[field];
        App.saveSettings();
        App.renderBgLayers();
      });
    });
    container.querySelectorAll('[data-layer-field]').forEach(input=>{
      input.addEventListener('input', ()=>{
        const idx = parseInt(input.dataset.layerIdx);
        const field = input.dataset.layerField;
        const v = parseFloat(input.value);
        App.settings.bgLayers[idx][field] = v;
        App.saveSettings();
        const card = input.closest('.bg-layer-card');
        const valEl = card.querySelector(`[data-layer-val="${field}"]`);
        if(valEl){
          if(field === 'count') valEl.textContent = Math.round(v);
          else if(field === 'size') valEl.textContent = v.toFixed(2) + '×';
          else if(field === 'rotation') valEl.textContent = Math.round(v) + '°';
          else if(field === 'baseAlpha') valEl.textContent = Math.round(v*100) + '%';
          else if(field === 'blur') valEl.textContent = Math.round(v) + 'px';
          else if(field === 'sensMult') valEl.textContent = Math.round(v*100) + '%';
          else if(field === 'opacity') valEl.textContent = Math.round(v*100) + '%';
          else if(field === 'trailLength') valEl.textContent = Math.round(v*100) + '%';
          else if(field === 'trailWidth') valEl.textContent = Math.round(v*100) + '%';
          else if(field === 'cornerRadius') valEl.textContent = Math.round(v*100) + '%';
          else if(field === 'beatCutThreshold') valEl.textContent = Math.round(v) + '%';
          else if(field === 'beatCutSustainSec') valEl.textContent = v.toFixed(2) + 's';
          else if(field === 'beatCutDarkness') valEl.textContent = Math.round(v*100) + '%';
          else if(field === 'beatCutDuration') valEl.textContent = Math.round(v) + 'ms';
          else if(field === 'beatCutMinConfidence') valEl.textContent = Math.round(v*100) + '%';
          else if(field === 'beatCutFallbackBpm') valEl.textContent = Math.round(v) + ' BPM';
          else if(field === 'swayAmount') valEl.textContent = Math.round(v*500) + '%';
        }
        if(field==='count' || field==='size'){
          card.querySelector('.bg-layer-title span').textContent=`${App.settings.bgLayers[idx].count}× tečka, velikost ${App.settings.bgLayers[idx].size.toFixed(2)}×${App.settings.bgLayers[idx].pathEnabled ? ' · '+(App.MotionPaths[App.settings.bgLayers[idx].path||'random']||App.MotionPaths.random).label : ''}`;
        }
        if(field === 'count'){
          const percents=App.computeLayerPercents();
          container.querySelectorAll('.bg-layer-card').forEach((layerCard,i)=>{
            layerCard.querySelector('.bg-layer-pct-bar-fill').style.width=percents[i]+'%';
            layerCard.querySelector('.bg-layer-pct-label').textContent=Math.round(percents[i])+'%';
          });
          container.querySelector('.bg-layer-overall-total strong').textContent=App.settings.bgLayers.reduce((sum,l)=>sum+(l.enabled?Math.max(0,l.count):0),0);
        }
      });
    });
    const totalDots = App.settings.bgLayers.reduce((s,l)=> s + (l.enabled?Math.max(0,l.count):0), 0);
    const summary = document.createElement('div');
    summary.className = 'bg-layer-overall-total';
    summary.innerHTML = `<span>Celkem teček na obrazovce</span><strong>${totalDots}</strong>`;
    container.appendChild(summary);
    const disabledLayers = App.settings.bgLayers.map((l,i)=>({l,i})).filter(x=>!x.l.enabled);
    if(disabledLayers.length){
      const addRow = document.createElement('div');
      addRow.className = 'bg-layer-add-row';
      addRow.innerHTML = `<button class="bg-layer-add-btn settings-action"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>Přidat vrstvu (${disabledLayers.length} volných z ${App.MAX_BG_LAYERS})</button>`;
      addRow.querySelector('button').addEventListener('click', ()=>{
        const target = disabledLayers[0];
        target.l.enabled = true;
        App.openLayerGear = target.i;
        App.saveSettings();
        App.renderBgLayers();
      });
      container.appendChild(addRow);
    }
    container.querySelectorAll('details[data-layer-section]').forEach(section=>{section.open=App.layerSectionState.get(section.dataset.layerSection)===true;});
    App.SettingsUI?.accessibility?.();
    if(App.SettingsUI)App.SettingsUI.results=[];
    App.refreshPointerGlow?.();
    if(focusAttributes.length){
      const selector=focusAttributes.map(([name,value])=>'['+name+'="'+value+'"]');
      container.querySelector(selector.join(''))?.focus({preventScroll:true});
    }
  };
})(window.Aurora);

// ── UI view: js/ui/mapping-editor ──
(function(App){
App.buildMapRowElement = function buildMapRowElement(key, target){
    const map = App.getMapByKey(key);
    if(!map) return document.createElement('div');
    const mapKeyParsed = App.parseMapKey(key);
    const isSpeed = (key === 'bgMapSpeed') || (mapKeyParsed.isOverride && mapKeyParsed.overrideKey === 'speed');
    const isColorSpeed = (key === 'bgMapColorSpeed') || (mapKeyParsed.isOverride && mapKeyParsed.overrideKey === 'colorSpeed');
    const supportsTempoSync = isSpeed || isColorSpeed;
    if(supportsTempoSync) App.ensureTempoSyncDefaults(map);
    const row = document.createElement('div');
    row.className = 'map-row' + (map.enabled ? '' : ' map-row-disabled');
    const opts = App.MusicSenseRegistry.outputs.map(o=>
      `<option value="${o.key}" ${o.key===map.source?'selected':''}>${o.label}</option>`
    ).join('');
    const isFlash = (key === 'bgMapFlash');
    const isColorSpeedOverride = isColorSpeed && mapKeyParsed.isOverride;
    if(isColorSpeedOverride) App.ensureColorModeDefaults(map);
    const colorMode = isColorSpeedOverride ? (map.colorMode || 'cycle') : 'cycle';
    const showRotationControls = !isColorSpeedOverride || colorMode === 'cycle';
    row.innerHTML = `
      <div class="map-row-head">
        <div class="map-title"><span class="map-swatch-dot" style="background:${target.dotColor}"></span>${target.label}</div>
        <div class="map-row-head-right">
          <span class="map-live-val" data-live-for="${key}">— <strong>0.0000</strong></span>
          <div class="switch map-enable-switch ${map.enabled ? 'on' : ''}" data-map-enable="${key}"></div>
        </div>
      </div>
      <div class="map-body ${map.enabled ? '' : 'map-disabled'}">
        ${isColorSpeedOverride ? `
        <div class="map-subrow">
          <div class="map-subrow-label"><span>Zdroj barvy</span></div>
          <select class="map-select map-colormode-select" data-map="${key}" data-field="colorMode">
            <option value="cycle" ${colorMode==='cycle'?'selected':''}>Rotace odstínu (duha, dle hudby)</option>
            <option value="player" ${colorMode==='player'?'selected':''}>Barva přehrávače</option>
            <option value="custom" ${colorMode==='custom'?'selected':''}>Vlastní barva</option>
          </select>
          <div class="range-hint">"Barva přehrávače" = tato vrstva vždy odpovídá barvě přehrávače nastavené v Přehrávač → Barvy (pevné nebo synchronizované). "Vlastní barva" = pevná barva zvolená níže. Obojí ignoruje rotaci odstínu a vše pod tímto výběrem.</div>
        </div>
        ${colorMode === 'custom' ? `
        <div class="custom-color-wrap" style="margin-top:2px;">
          <input type="color" class="map-customcolor-input" data-map="${key}" value="${map.customColor || '#ff2ec4'}">
          <label>vlastní barva vrstvy</label>
        </div>
        ` : ''}
        ` : ''}
        <div style="${showRotationControls ? '' : 'display:none;'}">
        <div class="map-subrow"><div class="map-subrow-label"><span>Zdroj</span></div><select class="map-select" data-map="${key}" data-field="source" aria-label="Zdroj">${opts}</select></div>
        <div class="map-subrow">
          <div class="map-subrow-label"><span>Citlivost</span><strong class="map-sens-val">${Math.round(map.sensitivity*100)}%</strong></div>
          <input type="range" class="map-sens-range" data-map="${key}" data-field="sensitivity" min="0" max="3" step="0.01" value="${map.sensitivity}">
        </div>

        ${isFlash ? `
        <div class="map-subrow">
          <div class="map-subrow-label"><span>Fade in (attack)</span><strong id="val-bgFlashAttack">${App.settings.bgFlashAttack.toFixed(2)}s</strong></div>
          <input type="range" id="ctl-bgFlashAttack" data-setting="bgFlashAttack" data-default="0.05" min="0.01" max="1.5" step="0.01" value="${App.settings.bgFlashAttack}">
          <div class="range-hint">Jak rychle flash najede na plný jas, když namapovaná hodnota vzroste.</div>
        </div>
        <div class="map-subrow">
          <div class="map-subrow-label"><span>Fade out (release)</span><strong id="val-bgFlashRelease">${App.settings.bgFlashRelease.toFixed(2)}s</strong></div>
          <input type="range" id="ctl-bgFlashRelease" data-setting="bgFlashRelease" data-default="0.35" min="0.02" max="3" step="0.01" value="${App.settings.bgFlashRelease}">
          <div class="range-hint">Jak dlouho flash doznívá, když hodnota zase klesne.</div>
        </div>
        ` : ''}

        <div class="curve-block mapping-details">
          <h4 class="setting-subhead">Křivka odezvy</h4>
          <div class="curve-editor-head">
            <div class="map-subrow-label" style="width:auto;"><span>Křivka odezvy</span></div>
            <div class="curve-editor-actions">
              <button type="button" class="curve-action-btn" data-curve-copy="${key}" title="Kopírovat křivku">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Kopírovat
              </button>
              <button type="button" class="curve-action-btn" data-curve-paste="${key}" title="Vložit křivku">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>
                Vložit
              </button>
              <button type="button" class="curve-action-btn" data-curve-reset="${key}" title="Reset na lineární">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>
                Reset
              </button>
            </div>
          </div>
          <div class="curve-editor-svg-wrap" data-curve-wrap="${key}">
            <div class="curve-clamp-zone" data-clamp-zone-lo="${key}"></div>
            <div class="curve-clamp-zone" data-clamp-zone-hi="${key}"></div>
            <div class="curve-boost-marker" data-boost-marker="${key}"></div>
            <div class="curve-live-readout" data-curve-readout="${key}" style="color:${target.dotColor}">— <strong>0.0000</strong></div>
            <svg data-curve-svg="${key}" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line class="curve-diagonal" x1="0" y1="100" x2="100" y2="0"/>
              <path class="curve-fill" d="" fill="${target.dotColor}" stroke="none"/>
              <path class="curve-path" d="" style="color:${target.dotColor}; stroke:${target.dotColor};"/>
            </svg>
            <div class="curve-anchor-dot" style="left:0%; top:100%;"></div>
            <div class="curve-anchor-dot" style="left:100%; top:0%;"></div>
            <div class="curve-live-dot" data-curve-live="${key}" style="color:${target.dotColor}"></div>
          </div>
          <div class="curve-hint-row">
            <span>Klikni = přidej bod (max 3)</span>
            <span>Tažení = posun</span>
            <span>Dvojklik na bod = smazat</span>
          </div>
        </div>

        <div data-advanced="true" class="toggle-row map-clamp-row">
          <span style="font-size:11.5px; color:var(--text-dim);">Clamp na vlastní rozsah</span>
          <div class="switch map-clamp-switch ${map.clamp ? 'on' : ''}" data-map-clamp="${key}"></div>
        </div>
        <div data-advanced="true" class="map-norm-row map-clamp-range-row" style="${(map.clamp) ? '' : 'display:none;'}">
          <span>Min</span>
          <input type="number" class="map-clamp-input" data-map="${key}" data-field="clampMin" value="${Math.round(map.clampMin*100)}" step="1" min="-50" max="150">
          <span>%</span>
          <span>Max</span>
          <input type="number" class="map-clamp-input" data-map="${key}" data-field="clampMax" value="${Math.round(map.clampMax*100)}" step="1" min="-50" max="150">
          <span>%</span>
        </div>

        <div class="toggle-row map-boost-row">
          <span style="font-size:11.5px; color:var(--text-dim);">Ultra boost nad prahem</span>
          <div class="switch map-boost-switch ${map.boost ? 'on' : ''}" data-map-boost="${key}"></div>
        </div>
        <div class="map-boost-detail" style="${(map.boost) ? '' : 'display:none;'}">
          <div class="map-subrow">
            <div class="map-subrow-label"><span>Práh spuštění</span><strong class="map-boost-th-val">${Math.round(map.boostThreshold*100)}%</strong></div>
            <input type="range" class="map-boost-th-range" data-map="${key}" data-field="boostThreshold" min="0" max="0.98" step="0.01" value="${map.boostThreshold}">
          </div>
          <div class="map-subrow">
            <div class="map-subrow-label"><span>Síla boostu</span><strong class="map-boost-amt-val">+${Math.round(map.boostAmount*100)}%</strong></div>
            <input type="range" class="map-boost-amt-range" data-map="${key}" data-field="boostAmount" min="0" max="2" step="0.05" value="${map.boostAmount}">
          </div>
          <div class="range-hint">Nad prahem hodnota plynule (s vyhlazením) naroste až o zadané % navíc — zdroj na 100 % pak efektivně "vybouchne" nad rámec normálu.</div>
        </div>

        <div class="map-subrow">
          <div class="map-subrow-label"><span>Vyhlazení</span><strong class="map-smooth-val">${Math.round((map.smoothAmount||0)*100)}%</strong></div>
          <input type="range" class="map-smooth-range" data-map="${key}" data-field="smoothAmount" min="0" max="1" step="0.01" value="${map.smoothAmount||0}">
          <div class="range-hint">Dodatečné časové vyhlazení výsledné hodnoty tohoto mapování — aplikuje se úplně naposled, po křivce odezvy i po Ultra boostu, takže vyhlazuje celý výsledek dohromady. 0 % (výchozí) = beze změny, vyšší = pomalejší/plynulejší reakce na náhlé skoky.</div>
        </div>

        ${supportsTempoSync ? `
        <div class="toggle-row map-tempo-sync-row">
          <span style="font-size:11.5px; color:var(--text-dim);">Sync ${isColorSpeed ? 'rychlosti změny barvy' : 'rychlosti pohybu'} s tempem (BPM)</span>
          <div class="switch map-tempo-sync-switch ${map.tempoSync ? 'on' : ''}" data-map-tempo-sync="${key}"></div>
        </div>
        <div class="map-tempo-sync-detail" style="${map.tempoSync ? '' : 'display:none;'}">
          <div class="map-subrow">
            <div class="map-subrow-label"><span>Citlivost tempa</span><strong class="map-tempo-sens-val">${Math.round(map.tempoSens*100)}%</strong></div>
            <input type="range" class="map-tempo-sens-range" data-map="${key}" data-field="tempoSens" min="0" max="2" step="0.01" value="${map.tempoSens}">
            <div class="range-hint">0 % = tempo neovlivňuje ${isColorSpeed ? 'rychlost změny barvy' : 'rychlost'} (násobitel 1×). 100 % = plný efekt mapování BPM → násobitel níže.</div>
          </div>
          <div class="settings-field-grid">
            <label class="settings-number-field"><span>Min BPM</span>
              <input type="number" class="map-tempo-input" data-map="${key}" data-field="tempoBpmMin" value="${map.tempoBpmMin}" step="1" min="0" max="400">
            </label>
            <label class="settings-number-field"><span>Max BPM</span>
              <input type="number" class="map-tempo-input" data-map="${key}" data-field="tempoBpmMax" value="${map.tempoBpmMax}" step="1" min="0" max="400">
            </label>
            <label class="settings-number-field"><span>Násobitel při min BPM</span>
              <input type="number" class="map-tempo-input" data-map="${key}" data-field="tempoMultMin" value="${map.tempoMultMin}" step="0.01" min="0" max="2">
            </label>
            <label class="settings-number-field"><span>Násobitel při max BPM</span>
              <input type="number" class="map-tempo-input" data-map="${key}" data-field="tempoMultMax" value="${map.tempoMultMax}" step="0.01" min="0" max="2">
            </label>
          </div>
          <div class="range-hint">Pomalá písnička (BPM blíže min) násobí ${isColorSpeed ? 'rychlost změny barvy' : 'rychlost'} hodnotou „při min BPM" (např. 0 nebo 0,1). Rychlá (BPM blíže max) násobí „při max BPM" (typicky 1 = beze změny). Mezi tím plynule interpoluje.</div>
          <div class="map-subrow settings-live-readout">
            <div class="map-subrow-label"><span>Živě</span><strong class="map-tempo-live-val" data-tempo-live="${key}">—</strong></div>
          </div>
        </div>
        ` : ''}
        </div>
      </div>
    `;
    // Use the same disclosure sections as the layer editor. Keep the source,
    // sensitivity and smoothing visible; curve/tempo/boost are independent tools.
    const body=row.querySelector('.map-body'), controls=body.lastElementChild;
    const curve=row.querySelector('.mapping-details');
    if(curve){
      curve.querySelector('h4')?.remove();
      curve.querySelector('.curve-editor-head .map-subrow-label')?.remove();
      controls.append(App.createSettingsSection('Křivka odezvy',[curve],key+':curve'));
    }
    const boost=row.querySelector('.map-boost-row');
    if(boost){const detail=boost.nextElementSibling;controls.append(App.createSettingsSection('Zesílení a omezení',[boost,detail,...controls.querySelectorAll(':scope > [data-advanced]')],key+':limits'));}
    const tempo=row.querySelector('.map-tempo-sync-row');
    if(tempo)controls.append(App.createSettingsSection('Synchronizace s tempem',[tempo,tempo.nextElementSibling],key+':tempo'));
    // One disclosure per mapping keeps the overview compact, with the live value
    // and enabled switch still reachable while its editor is collapsed.
    const head=row.querySelector('.map-row-head');
    const disclosure=App.createSettingsSection('',[body],key+':mapping');
    const summary=disclosure.querySelector('summary');summary.replaceChildren(...head.childNodes);summary.className='map-row-head';
    summary.querySelector('.switch').addEventListener('click',event=>event.preventDefault());
    head.replaceWith(disclosure);row.dataset.mappingKey=key;
    if(showRotationControls) App.initCurveEditor(key, row);
    if(isFlash){
      const attackInput = row.querySelector('#ctl-bgFlashAttack');
      const releaseInput = row.querySelector('#ctl-bgFlashRelease');
      if(attackInput) App.wireRangeControl(attackInput);
      if(releaseInput) App.wireRangeControl(releaseInput);
    }
    return row;
  };
})(window.Aurora);

// ── UI view: js/ui/curve-editor ──
(function(App){
App.redrawCurveEditor = function redrawCurveEditor(settingKey, root){
    const scope = root || document;
    const svg = scope.querySelector(`[data-curve-svg="${settingKey}"]`);
    const wrap = scope.querySelector(`.curve-editor-svg-wrap[data-curve-wrap="${settingKey}"]`);
    if(!svg || !wrap) return;
    const map = App.getMapByKey(settingKey);
    if(!map) return;
    const list = map.curvePoints;
    const steps = 48;
    const samples = [];
    for(let i=0;i<=steps;i++){
      const x = i/steps;
      const y = App.CurveMath.evaluate(list, x);
      samples.push({ x, y });
    }
    const path = svg.querySelector('.curve-path');
    let d = '';
    samples.forEach((s,i)=>{
      const px = s.x*100;
      const py = (1 - s.y) * 100;
      d += (i===0 ? 'M' : 'L') + px.toFixed(2) + ',' + py.toFixed(2) + ' ';
    });
    path.setAttribute('d', d.trim());
    const zoneLo = wrap.querySelector(`[data-clamp-zone-lo="${settingKey}"]`);
    const zoneHi = wrap.querySelector(`[data-clamp-zone-hi="${settingKey}"]`);
    if(zoneLo && zoneHi){
      if(map.clamp){
        const lo = Math.max(0, Math.min(1, Math.min(map.clampMin, map.clampMax)));
        const hi = Math.max(0, Math.min(1, Math.max(map.clampMin, map.clampMax)));
        zoneLo.classList.toggle('show', lo > 0.001);
        zoneLo.style.left = '0%';
        zoneLo.style.width = (lo*100) + '%';
        zoneHi.classList.toggle('show', hi < 0.999);
        zoneHi.style.left = (hi*100) + '%';
        zoneHi.style.width = ((1-hi)*100) + '%';
      } else {
        zoneLo.classList.remove('show');
        zoneHi.classList.remove('show');
      }
    }
    const boostMarker = wrap.querySelector(`[data-boost-marker="${settingKey}"]`);
    if(boostMarker){
      if(map.boost){
        boostMarker.classList.add('show');
        boostMarker.style.left = (Math.max(0, Math.min(1, map.boostThreshold))*100) + '%';
      } else {
        boostMarker.classList.remove('show');
      }
    }
    const fill = svg.querySelector('.curve-fill');
    let fd = 'M0,100 ';
    samples.forEach(s=>{ fd += `L${(s.x*100).toFixed(2)},${((1-s.y)*100).toFixed(2)} `; });
    fd += 'L100,100 Z';
    fill.setAttribute('d', fd);
    const dots=[...wrap.querySelectorAll('.curve-point-dot')];
    for(let i=list.length;i<dots.length;i++)dots[i].remove();
    const target = App.BG_MAP_TARGETS.find(t=>t.settingKey===settingKey);
    const color = target ? target.dotColor : '#fff';
    const liveDot = wrap.querySelector('.curve-live-dot');
    list.forEach((p,i)=>{
      const dot = dots[i] || document.createElement('div');
      if(!dots[i]){dot.className = 'curve-point-dot';wrap.insertBefore(dot, liveDot);}
      dot.style.left = (p.x*100) + '%';
      dot.style.top = ((1-p.y)*100) + '%';
      dot.style.background = color;
    });
  };
})(window.Aurora);

// ── ui/settings-navigation-select ──
(function(App){
  App.addParts("SettingsUI", {
finishMotion(animation,duration){
      if(!animation)return Promise.resolve();
      return new Promise(resolve=>{
        let settled=false;
        const finish=()=>{if(settled)return;settled=true;clearTimeout(timer);resolve();};
        const timer=setTimeout(()=>{animation.cancel();finish();},Math.max(0,duration)+100);
        animation.finished.then(finish,finish);
      });
    },
async navigate(key,pageKey){
      const token=this.navigationToken=(this.navigationToken||0)+1;
      this.navigationAnimation?.cancel();this.pageAnimation?.cancel();
      const current=this.groups[this.current];
      if(key===this.current&&(!pageKey||pageKey===current?.selected))return;
      const panel=current?.pages.find(p=>p.key===current.selected)?.panel;
      const duration=this.motionDuration('navigationMotion');
      if(panel&&duration){
        try{
          this.navigationAnimation=panel.animate([{opacity:1,transform:'translateX(0)'},{opacity:0,transform:'translateX(-12px)'}],{duration:duration*.45,easing:'ease-in',fill:'forwards'});
          await this.finishMotion(this.navigationAnimation,duration*.45);
        }catch{/* Navigation still works if animation is unsupported. */}
      }
      if(token===this.navigationToken)this.select(key,true,pageKey);
    },
select(key,clear=true,pageKey){
      App.SettingsHelp?.hide();
      this.navigationToken=(this.navigationToken||0)+1;this.navigationAnimation?.cancel();
      const previousKey=this.current,previousPage=this.groups[this.current]?.selected;
      this.current=key;const current=this.groups[key];if(pageKey)current.selected=pageKey;
      if(!this.advanced && current.pages.find(p=>p.key===current.selected)?.advanced)current.selected=current.pages.find(p=>!p.advanced).key;
      if(clear){clearTimeout(this.searchTimer);App.el('settingsSearch').value='';this.searchResults.hidden=true;}
      for(const [id,g] of Object.entries(this.groups)){
        const active=key===id;g.panel.classList.toggle('active',active);g.subnav.hidden=!active||g.pages.filter(p=>this.advanced||!p.advanced).length<2;
        g.button.classList.toggle('active',active);g.button.setAttribute('aria-selected',String(active));g.button.tabIndex=active?0:-1;
        for(const p of g.pages){const selected=p.key===g.selected;p.panel.hidden=!selected;p.button.classList.toggle('active',selected);p.button.setAttribute('aria-selected',String(selected));p.button.tabIndex=selected?0:-1;}
      }
      this.content.scrollTop=0;this.updatePageHeading?.();
      if(previousKey!==key||previousPage!==current.selected){
        this.pageAnimation?.cancel();
        const panel=current.pages.find(p=>p.key===current.selected)?.panel,duration=this.uiPrefs?this.motionDuration('navigationMotion'):0;
        if(panel&&duration){try{this.pageAnimation=panel.animate([{opacity:0,transform:'translateX(12px)'},{opacity:1,transform:'translateX(0)'}],{duration,easing:'ease-out'});}catch{}}
      }
    },
accessibility(){
      this.applySettingsPolicy?.();
      this.syncConditions?.();
      this.panel.querySelectorAll('.switch').forEach((sw,i)=>{
        sw.setAttribute('role','switch');sw.tabIndex=0;sw.setAttribute('aria-checked',String(sw.classList.contains('on')));
        const label=sw.closest('.toggle-row')?.querySelector('span')||sw.closest('.bg-layer-head')?.querySelector('strong')||sw.closest('.map-row')?.querySelector('.map-title');if(label){if(!label.id)label.id='settings-label-'+(this.labelSequence=(this.labelSequence||0)+1);sw.setAttribute('aria-labelledby',label.id);}
      });
      this.panel.querySelectorAll('input,select').forEach((input,i)=>{
        const label=input.closest('.range-row,.map-subrow,.toggle-row')?.querySelector('.range-label-row span,.map-subrow-label span,:scope > span')||input.closest('.custom-color-wrap')?.querySelector('label');if(label){if(!label.id)label.id='settings-label-'+(this.labelSequence=(this.labelSequence||0)+1);input.setAttribute('aria-labelledby',label.id);}
        if(input.type==='checkbox')input.setAttribute('role','switch');
      });
    },
normalize(text){return String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();},
index(){
      this.results=[];
      for(const [key,g] of Object.entries(this.groups))for(const p of g.pages){
        for(const row of p.panel.querySelectorAll('.toggle-row,.range-row,.map-subrow,.setting-subhead,h3,h4,summary,button[id]')){
          if(row.closest('.settings-help')||row.classList.contains('aurora-select-button'))continue;
          const label=row.querySelector('.range-label-row span')?.textContent||row.querySelector(':scope > span')?.textContent||row.textContent;
          const title=label.trim().replace(/\s+/g,' ');if(!title||title.length>170)continue;
          const setting=row.querySelector('[data-setting]')?.dataset.setting||'';
          const helpLabel=row.matches('[data-settings-help]')?row:row.querySelector('[data-settings-help]');
          const help=(App.SettingsHelp?.sources.get(helpLabel)||[]).map(n=>n.textContent).join(' ');
          this.results.push({row,key,page:p.key,title,advanced:!!row.closest('[data-advanced]'),haystack:this.normalize(title+' '+help+' '+setting+' '+g.cs+' '+g.en+' '+p.cs+' '+p.en)});
        }
      }
      const sections=[
        ['','Tvar a rozměry','Shape & size','tvar počet velikost viditelnost shape count size opacity corner'],
        ['motion','Pohyb a rotace','Motion & rotation','dráha rotace kývání path rotation sway'],
        ['effects','Jas a efekty','Brightness & effects','jas rozostření stopa třpytky beat brightness blur trail sparkles mirror'],
        ['response','Reakce na hudbu','Music reactivity','citlivost mapování křivka override sensitivity mapping curve']
      ];
      for(let i=0;i<(App.settings.bgLayers?.length||0);i++)for(const [section,cs,en,terms] of sections){
        const title=this.text('Vrstva ','Layer ')+(i+1)+' — '+this.text(cs,en);
        this.results.push({key:'background',page:'background',title,advanced:section==='motion'||section==='response',layerIndex:i,layerSection:section,haystack:this.normalize(title+' '+terms+' background pozadí layers vrstvy')});
      }
    },
search(){
      this.index();const query=this.normalize(App.el('settingsSearch').value.trim());
      if(!query){this.select(this.current,false);this.searchResults.hidden=true;return;}
      for(const g of Object.values(this.groups))g.panel.classList.remove('active');
      this.searchResults.hidden=false;this.searchResults.replaceChildren();if(this.pageHeading)this.pageHeading.hidden=true;
      const matches=this.results.filter(r=>query.split(/\s+/).every(q=>r.haystack.includes(q))).slice(0,50);
      const summary=document.createElement('p');summary.className='settings-search-summary';summary.textContent=matches.length?this.text('Nalezená nastavení','Matching settings'):this.text('Nic nenalezeno. Zkus kratší výraz.','No matches. Try a shorter search.');this.searchResults.append(summary);
      for(const result of matches){
        const button=document.createElement('button');button.type='button';button.className='settings-result';
        const title=document.createElement('strong');title.textContent=result.title;
        const path=document.createElement('span'),g=this.groups[result.key],p=g.pages.find(p=>p.key===result.page);path.textContent=this.text(g.cs,g.en)+' / '+this.text(p.cs,p.en);
        if(result.advanced){const badge=document.createElement('span');badge.className='settings-result-advanced';badge.textContent=this.text('Pokročilé','Advanced');path.append(badge);}
        button.append(title,path);button.addEventListener('click',()=>{
          if(result.advanced&&!this.advanced){this.advanced=true;this.applyAdvanced();try{localStorage.setItem('aurora-settings-advanced','true');}catch{}}
          this.select(result.key,true,result.page);
          if(result.layerIndex!==undefined){
            App.openLayerGear=result.layerIndex;App.renderBgLayers();
            const panel=this.content.querySelector(`[data-layer-panel="${result.layerIndex}"]`);
            const section=result.layerSection ? panel.querySelector(`[data-layer-section="${result.layerIndex}:${result.layerSection}"]`) : null;
            if(section)section.open=true;
            result.row=section?.querySelector('summary') || panel.querySelector('.setting-subhead');
          }
          const blocked=result.row.closest('.settings-condition-hidden');
          if(blocked){
            const key=blocked.dataset.requiresSetting,control=this.content.querySelector('[data-setting="'+key+'"],[data-extra-select="'+key+'"]');
            result.row=control?.closest('.range-row,.toggle-row')||result.row;
          }
          for(let parent=result.row.parentElement;parent;parent=parent.parentElement){if(parent.tagName==='DETAILS')parent.open=true;}
          requestAnimationFrame(()=>{
            const rowRect=result.row.getBoundingClientRect(),contentRect=this.content.getBoundingClientRect();
            this.content.scrollTop+=rowRect.top-contentRect.top-20;result.row.classList.add('setting-found');
            const control=result.row.matches('button')?result.row:result.row.querySelector('input,select,button,.switch');(control?._auroraSelectButton||control)?.focus({preventScroll:true});
            setTimeout(()=>result.row.classList.remove('setting-found'),1600);
          });
        });this.searchResults.append(button);
      }
    }
  });
})(window.Aurora);

// ── ui/settings-navigation-motion-duration ──
(function(App){
  App.addParts("SettingsUI", {
motionDuration(kind){return this.uiPrefs?.motion&&(!kind||this.uiPrefs[kind]!==false)&&(!this.uiPrefs.respectSystemMotion||!matchMedia('(prefers-reduced-motion: reduce)').matches)?Math.max(0,Math.min(800,Number(this.uiPrefs.duration)||0))*(kind==='navigationMotion'?.55:1):0;},
mountPlayerStyle(){
      let saved;try{saved=JSON.parse(localStorage.getItem('aurora-ui-style'));}catch{}
      this.uiPrefs={motion:saved?.motion!==false,duration:Math.max(100,Math.min(800,Number(saved?.duration)||320)),color:/^#[0-9a-f]{6}$/i.test(saved?.color)?saved.color:'#ffffff',opacity:Number.isFinite(saved?.opacity)?Math.max(0,Math.min(100,saved.opacity)):100,width:Number.isFinite(saved?.width)?Math.max(0,Math.min(4,saved.width)):1};
      for(const key of ['playlistMotion','liveMotion','settingsMotion','navigationMotion','menuMotion'])this.uiPrefs[key]=saved?.[key]!==false;
      this.uiPrefs.respectSystemMotion=saved?.respectSystemMotion===true;
      if(saved?.pickerVersion!==2){this.uiPrefs.color='#ffffff';}
      this.uiPrefs.opacity=Number.isFinite(saved?.opacity)?Math.max(0,Math.min(100,saved.opacity)):28;this.uiPrefs.pickerVersion=2;
      try{localStorage.setItem('aurora-ui-style',JSON.stringify(this.uiPrefs));}catch{}
      const bind=(id,key,event,read)=>{const input=App.el(id);if(input.type==='checkbox')input.checked=this.uiPrefs[key];else input.value=this.uiPrefs[key];input.addEventListener(event,()=>{this.uiPrefs[key]=read(input);this.applyPlayerStyle();try{localStorage.setItem('aurora-ui-style',JSON.stringify(this.uiPrefs));}catch{}});};
      for(const key of ['playlistMotion','liveMotion','settingsMotion','navigationMotion','menuMotion','respectSystemMotion'])bind('ui-'+key,key,'change',i=>i.checked);
      bind('uiMotionEnabled','motion','change',i=>i.checked);bind('uiMotionDuration','duration','input',i=>Number(i.value));bind('uiOutlineColor','color','input',i=>i.value);bind('uiOutlineWidth','width','input',i=>Number(i.value));bind('uiOutlineOpacity','opacity','input',i=>Number(i.value));this.applyPlayerStyle();
    },
applyPlayerStyle(){
      document.documentElement.style.setProperty('--motion-duration',this.motionDuration()+'ms');
      for(const key of ['playlistMotion','liveMotion','settingsMotion','navigationMotion','menuMotion'])document.documentElement.style.setProperty('--'+key,this.motionDuration(key)+'ms');
      document.body.classList.toggle('motion-off',!this.motionDuration());
      if(!this.motionDuration()){
        for(const animation of [this.windowAnimation,this.navigationAnimation,this.pageAnimation]){try{animation?.finish();}catch{animation?.cancel();}}
      }
      document.documentElement.style.setProperty('--ui-outline-color',this.uiPrefs.color);
      document.documentElement.style.setProperty('--ui-outline-opacity',this.uiPrefs.opacity+'%');
      document.documentElement.style.setProperty('--ui-outline-width',this.uiPrefs.width+'px');
      App.el('uiMotionValue').textContent=this.uiPrefs.duration+' ms';App.el('uiOutlineValue').textContent=this.uiPrefs.width+' px';App.el('uiOutlineOpacityValue').textContent=this.uiPrefs.opacity+'%';
    },
fitWindow(height, x, y){
      const margin=12, vh=window.innerHeight, vw=window.innerWidth;
      const maxHeight=Math.max(1,vh-margin*2), minHeight=Math.min(360,maxHeight);
      const h=Math.max(minHeight,Math.min(maxHeight,height));
      const w=this.panel.getBoundingClientRect().width;
      return {height:h,x:Math.max(margin+w/2,Math.min(vw-margin-w/2,x)),
        y:Math.max(margin+h/2,Math.min(vh-margin-h/2,y))};
    },
applyWindowGeometry(geometry){
      this.windowGeometry=this.fitWindow(geometry.height,geometry.x,geometry.y);
      const g=this.windowGeometry;
      this.panel.style.height=g.height+'px';this.panel.style.maxHeight='calc(100dvh - 24px)';
      this.panel.style.left=g.x+'px';this.panel.style.top=g.y+'px';
    },
saveWindowGeometry(){
      const g=this.windowGeometry;if(!g)return;
      try{localStorage.setItem('aurora-settings-window',JSON.stringify({height:g.height,x:g.x/window.innerWidth,y:g.y/window.innerHeight}));}catch{}
    },
restoreWindowGeometry(){
      let saved;try{saved=JSON.parse(localStorage.getItem('aurora-settings-window'));}catch{}
      const valid=saved && ['height','x','y'].every(k=>Number.isFinite(saved[k]));
      const rect=this.panel.getBoundingClientRect();
      this.applyWindowGeometry(valid?{height:saved.height,x:saved.x*window.innerWidth,y:saved.y*window.innerHeight}:
        {height:rect.height,x:window.innerWidth/2,y:window.innerHeight/2});
    },
mountWindowControls(){
      const grip=document.createElement('button');grip.type='button';grip.className='settings-drag-grip';
      grip.textContent='⠿';this.header.prepend(grip);
      const top=document.createElement('div'),bottom=document.createElement('div');
      for(const [handle,edge] of [[top,'top'],[bottom,'bottom']]){
        handle.className='settings-resize-edge '+edge;handle.tabIndex=0;
        handle.setAttribute('role','separator');handle.setAttribute('aria-orientation','horizontal');
        this.panel.append(handle);
      }
      this.windowHandles={grip,top,bottom};this.translateWindowControls();
      const bind=(target,mode)=>{
        let gesture=null,frame=0,pending=null;
        const update=()=>{
          frame=0;if(!gesture||!pending)return;
          const dx=pending.x-gesture.px,dy=pending.y-gesture.py,g=gesture.geometry;
          if(mode==='move')this.applyWindowGeometry({height:g.height,x:g.x+dx,y:g.y+dy});
          else{
            const maxHeight=Math.max(1,2*Math.min(g.y-12,window.innerHeight-12-g.y));
            const minHeight=Math.min(360,maxHeight);
            this.applyWindowGeometry({height:Math.max(minHeight,Math.min(maxHeight,g.height+dy*(mode==='top'?-2:2))),x:g.x,y:g.y});
          }
        };
        target.addEventListener('pointerdown',e=>{
          if(e.button!==0)return;e.preventDefault();
          const r=this.panel.getBoundingClientRect();
          gesture={id:e.pointerId,px:e.clientX,py:e.clientY,geometry:{height:r.height,x:r.left+r.width/2,y:r.top+r.height/2}};
          target.setPointerCapture(e.pointerId);this.panel.classList.add('window-adjusting');
        });
        target.addEventListener('pointermove',e=>{
          if(!gesture||e.pointerId!==gesture.id)return;
          pending={x:e.clientX,y:e.clientY};if(!frame)frame=requestAnimationFrame(update);
        });
        const finish=()=>{if(!gesture)return;if(frame)cancelAnimationFrame(frame);update();gesture=null;pending=null;this.panel.classList.remove('window-adjusting');this.saveWindowGeometry();};
        target.addEventListener('pointerup',finish);target.addEventListener('pointercancel',finish);target.addEventListener('lostpointercapture',finish);
        target.addEventListener('keydown',e=>{
          if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;
          e.preventDefault();const g=this.windowGeometry,step=e.shiftKey?40:10;
          if(mode==='move')this.applyWindowGeometry({...g,x:g.x+(e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0),y:g.y+(e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0)});
          else if(e.key==='ArrowUp'||e.key==='ArrowDown'){
            const max=2*Math.min(g.y-12,window.innerHeight-12-g.y);
            this.applyWindowGeometry({...g,height:Math.min(max,g.height+(e.key==='ArrowUp'?-step:step)*(mode==='top'?-2:2))});
          }
          this.saveWindowGeometry();
        });
      };
      bind(grip,'move');bind(top,'top');bind(bottom,'bottom');
      grip.addEventListener('dblclick',()=>{this.applyWindowGeometry({height:Math.min(800,window.innerHeight-80),x:window.innerWidth/2,y:window.innerHeight/2});this.saveWindowGeometry();});
      window.addEventListener('resize',()=>{if(this.panel.classList.contains('open'))this.restoreWindowGeometry();});
    },
translateWindowControls(){
      if(!this.windowHandles)return;
      const {grip,top,bottom}=this.windowHandles;
      grip.title=this.text('Přesunout nastavení · dvojklik obnoví polohu a velikost','Move settings · double-click resets position and size');grip.setAttribute('aria-label',grip.title);
      for(const handle of [top,bottom])handle.setAttribute('aria-label',this.text('Změnit výšku nastavení','Resize settings height'));
    },
mountAdvanced(){
      for(const key of (this.advancedPolicy?.settings||[])){
        const control=this.content.querySelector('[data-setting="'+key+'"]');
        const row=control?.closest('.range-row') || control?.closest('.toggle-row');
        if(row) row.dataset.advanced='true';
      }
      for(const id of (this.advancedPolicy?.sections||[])){const section=this.content.querySelector('#'+id);if(section)section.dataset.advanced='true';}
      this.advancedButton=document.createElement('button');
      this.advancedButton.type='button';this.advancedButton.className='settings-advanced';
      this.tools.append(this.advancedButton);
      try{this.advanced=localStorage.getItem('aurora-settings-advanced')==='true';}catch{}
      this.advancedButton.addEventListener('click',()=>{
        this.advanced=!this.advanced;this.applyAdvanced();
        try{localStorage.setItem('aurora-settings-advanced',String(this.advanced));}catch{}
        if(App.el('settingsSearch').value)this.search();
      });
      this.applyAdvanced();
    },
applyAdvanced(){
      this.panel.classList.toggle('advanced-enabled',this.advanced);
      this.advancedButton.textContent=this.advanced?this.text('Pokročilé: zapnuto','Advanced: on'):this.text('Pokročilé: vypnuto','Advanced: off');
      this.advancedButton.title=this.text('Zobrazit jemné ladění. Skrytí nemění uložené hodnoty.','Show fine controls. Hiding them keeps your saved values.');
      this.advancedButton.setAttribute('aria-pressed',String(this.advanced));
      this.updatePageHeading?.();
      const group=this.groups[this.current];
      if(!this.advanced && group?.pages.find(p=>p.key===group.selected)?.advanced){
        this.select(this.current,false,group.pages.find(p=>!p.advanced).key);
      }
    },
text(cs,en){return document.documentElement.lang==='cs'?cs:en;},
mount(){
      this.preparePages();
      this.panel=App.el('settingsPanel');this.panel.classList.add('settings-v22','settings-organized');
      this.panel.setAttribute('role','dialog');this.panel.setAttribute('aria-labelledby','settingsTitle');
      this.panel.querySelector('.settings-tabs')?.remove();
      const oldReset=App.el('btnResetAll');oldReset?.nextElementSibling?.remove();oldReset?.remove();
      this.header=document.createElement('div');this.header.className='settings-header';
      this.header.innerHTML='<h2 id="settingsTitle"></h2><button type="button" class="settings-close" id="settingsClose">×</button>';
      this.tools=document.createElement('div');this.tools.className='settings-tools';
      this.tools.innerHTML='<div class="settings-search-wrap"><input type="search" id="settingsSearch" autocomplete="off" spellcheck="false"><kbd>Ctrl K</kbd></div>';
      const body=document.createElement('div');body.className='settings-body';
      this.nav=document.createElement('nav');this.nav.className='settings-nav';this.nav.setAttribute('role','tablist');
      this.nav.setAttribute('aria-orientation','horizontal');
      this.subnav=document.createElement('div');this.subnav.className='settings-subnavs';
      this.content=document.createElement('div');this.content.className='settings-content';
      this.searchResults=document.createElement('div');this.searchResults.className='settings-results';this.searchResults.hidden=true;
      this.searchResults.setAttribute('aria-live','polite');this.content.append(this.searchResults);
      this.header.prepend(this.tools);
      body.append(this.nav,this.subnav,this.content);
      this.pageHeading=document.createElement('div');this.pageHeading.className='settings-page-heading';this.content.prepend(this.pageHeading);
      for(const [key,g] of Object.entries(this.groups)){
        g.panel=App.el('tab-'+key);g.panel.classList.add('settings-category');g.panel.dataset.category=key;
        g.panel.setAttribute('role','tabpanel');g.panel.setAttribute('aria-labelledby','settings-nav-'+key);this.content.append(g.panel);
        const button=document.createElement('button');button.type='button';button.id='settings-nav-'+key;button.className='settings-nav-item';
        button.setAttribute('role','tab');button.setAttribute('aria-controls',g.panel.id);g.button=button;this.nav.append(button);
        button.addEventListener('click',()=>this.navigate(key));
        g.subnav=document.createElement('nav');g.subnav.className='settings-subnav';g.subnav.setAttribute('role','tablist');g.subnav.setAttribute('aria-orientation','horizontal');
        this.subnav.append(g.subnav);
        for(const p of g.pages){
          p.panel=g.panel.querySelector('#'+(p.id||'page-'+key+'-'+p.key));
          if(!p.panel)throw new Error('Missing settings page: '+key+'/'+p.key+'; children: '+[...g.panel.children].map(n=>n.id).join(','));
          p.panel.setAttribute('role','tabpanel');p.panel.setAttribute('aria-labelledby','settings-sub-'+key+'-'+p.key);
          p.button=document.createElement('button');p.button.type='button';p.button.className='settings-subnav-item';p.button.id='settings-sub-'+key+'-'+p.key;
          if(p.advanced){p.panel.dataset.advanced='true';p.button.dataset.advanced='true';}
          p.button.setAttribute('role','tab');p.button.setAttribute('aria-controls',p.panel.id);g.subnav.append(p.button);
          p.button.addEventListener('click',()=>this.navigate(key,p.key));
        }
        g.selected=g.pages[0].key;
        for(const setting of g.keys){const row=g.panel.querySelector(`[data-setting="${setting}"]`)?.closest('.toggle-row,.range-row');if(row)row.dataset.basicSetting=setting;}
      }
      this.footer=document.createElement('div');this.footer.className='settings-footer';
      this.footer.innerHTML='<span id="settingsSaveStatus" role="status"></span><div><button type="button" id="settingsUndo" hidden></button><button type="button" id="settingsRecommended"></button></div>';
      this.panel.prepend(this.header);this.panel.append(body,this.footer);
      this.organizeSections();
      this.applySettingsPolicy();
      this.mountAdvanced();
      this.mountWindowControls();
      this.mountPlayerStyle();
      document.addEventListener('aurora-language-ready',()=>{
        const language=App.el('auroraLanguage');
        if(language){
          const row=language.closest('.range-row'),block=document.createElement('div');block.className='setting-block';
          const heading=document.createElement('h3');heading.textContent='Jazyk';row.querySelector('.range-label-row').hidden=true;block.append(heading,row);this.groups.playback.pages[0].panel.prepend(block);
          language.addEventListener('change',()=>{this.translate();queueMicrotask(()=>{this.index();if(App.el('settingsSearch').value)this.search();});});
        }
        this.translate();this.index();this.accessibility();
      },{once:true});
      App.el('btnSettings').setAttribute('aria-haspopup','dialog');App.el('btnSettings').setAttribute('aria-expanded','false');
      App.el('btnSettings').addEventListener('click',()=>this.open(!this.isOpen));
      App.el('settingsClose').addEventListener('click',()=>this.open(false));
      App.el('settingsSearch').addEventListener('input',()=>{clearTimeout(this.searchTimer);this.searchTimer=setTimeout(()=>this.search(),100);});
      App.el('settingsRecommended').addEventListener('click',()=>{
        this.undo=structuredClone(App.settings);App.applyImportedSettings(structuredClone(App.defaultSettings));this.accessibility();this.index();
        App.el('settingsUndo').hidden=false;App.el('settingsSaveStatus').textContent=this.text('Doporučený vzhled obnoven','Recommended preset restored');
      });
      App.el('settingsUndo').addEventListener('click',()=>{if(this.undo)App.applyImportedSettings(this.undo);this.undo=null;App.el('settingsUndo').hidden=true;this.accessibility();this.index();});
      this.panel.addEventListener('click',e=>{const sw=e.target.closest('.switch');if(sw)sw.setAttribute('aria-checked',String(sw.classList.contains('on')));});
      this.panel.addEventListener('keydown',e=>{
        const sw=e.target.closest('.switch');if(sw&&(e.key===' '||e.key==='Enter')){e.preventDefault();sw.click();}
        if(e.key==='Escape'){e.preventDefault();if(App.el('settingsSearch').value){App.el('settingsSearch').value='';this.search();}else this.open(false);}
        const tab=e.target.closest('.settings-nav-item,.settings-subnav-item');
        if(tab&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key)){
          e.preventDefault();const buttons=[...tab.parentElement.children].filter(button=>this.advanced || !button.hasAttribute('data-advanced')),i=buttons.indexOf(tab),columns=tab.classList.contains('settings-nav-item')?buttons.filter(button=>button.offsetTop===buttons[0].offsetTop).length:1;
          const delta=e.key==='ArrowDown'?columns:e.key==='ArrowUp'?-columns:e.key==='ArrowRight'?1:-1;
          const next=e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+delta+buttons.length)%buttons.length;buttons[next].click();buttons[next].focus();
        }
      });
      document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();this.open(true);App.el('settingsSearch').focus();}});
      for(const event of ['input','change','click'])this.panel.addEventListener(event,()=>queueMicrotask(()=>this.syncConditions()));
      this.translate();this.select('playback');this.accessibility();
    },
open(open){
      if(!open)App.SettingsHelp?.hide();
      this.isOpen=!!open;
      const token=this.openToken=(this.openToken||0)+1;
      this.windowAnimation?.cancel();const duration=this.motionDuration('settingsMotion');
      App.refreshPointerGlow?.(duration+30);
      this.navigationToken=(this.navigationToken||0)+1;this.navigationAnimation?.cancel();
      App.el('btnSettings').classList.toggle('active',open);App.el('btnSettings').setAttribute('aria-expanded',String(open));
      if(open){
        this.panel.classList.add('open');this.restoreWindowGeometry();this.translate();this.index();this.accessibility();App.el('settingsSearch').focus();
        if(duration)this.windowAnimation=this.panel.animate([{opacity:0,transform:'translate(-50%,-50%) scale(.72)'},{opacity:1,transform:'translate(-50%,-50%) scale(1)'}],{duration,easing:'cubic-bezier(.16,1,.3,1)',fill:'both'});
      }else{
        App.el('btnSettings').focus();
        if(duration){this.windowAnimation=this.panel.animate([{opacity:1,transform:'translate(-50%,-50%) scale(1)'},{opacity:0,transform:'translate(-50%,-50%) scale(.72)'}],{duration:duration*.8,easing:'ease-in',fill:'both'});this.finishMotion(this.windowAnimation,duration*.8).then(()=>{if(this.openToken===token){this.panel.classList.remove('open');this.windowAnimation?.cancel();}});}
        else this.panel.classList.remove('open');
      }
    },
translate(){
      this.translateWindowControls();
      this.applyAdvanced();
      this.nav.setAttribute('aria-label',this.text('Kategorie nastavení','Settings categories'));
      App.el('settingsTitle').textContent=this.text('Nastavení','Settings');App.el('settingsClose').setAttribute('aria-label',this.text('Zavřít nastavení','Close settings'));
      App.el('settingsSearch').placeholder=this.text('Najít nastavení…','Find a setting…');App.el('settingsSearch').setAttribute('aria-label',this.text('Hledat v nastavení','Search settings'));
      App.el('settingsRecommended').textContent=this.text('Obnovit doporučené','Restore recommended');App.el('settingsUndo').textContent=this.text('Vrátit změnu','Undo');
      const saveStatus=App.el('settingsSaveStatus');
      saveStatus.textContent=saveStatus.dataset.saveError?this.text('Uložení selhalo — exportujte nastavení','Save failed — export your settings'):this.text('Změny se ukládají automaticky','Changes save automatically');
      for(const g of Object.values(this.groups)){
        g.button.textContent=this.text(g.cs,g.en);g.button.title=this.text(g.cs,g.en);g.subnav.setAttribute('aria-label',this.text(g.cs,g.en));
        for(const p of g.pages){p.button.textContent=this.text(p.cs,p.en);p.button.title=this.text(p.cs,p.en);}
        g.subnav.hidden=this.current!==Object.keys(this.groups).find(k=>this.groups[k]===g)||g.pages.filter(p=>this.advanced||!p.advanced).length<2;
      }
      const labels={
        autoplayOnImport:['Spustit hudbu po importu','Play music after import'],randomFirstTrack:['Začít náhodnou skladbou','Start with a random track'],smartTitleParsing:['Zpřehlednit názvy skladeb','Clean up track titles'],
        stageTrackInfoEnabled:['Zobrazit horní kartičku','Show the top card'],stageLikedOutlinePulse:['Srdíčko a obrys reagují na hudbu','Let the favorite outline follow the music'],
        timelineLoudnessWaveform:['Zobrazit křivku hlasitosti','Show the loudness waveform'],timelineWaveformAlwaysVisible:['Křivka zůstává viditelná','Keep the waveform visible'],liveStatsIslandEnabled:['Zobrazit i přímo na obrazovce','Also show on screen'],
        normalize:['Vyrovnat hlasitost skladeb','Match the volume of each track'],targetLufs:['Cílová hlasitost (LUFS)','Target volume (LUFS)'],globalSens:['Citlivost efektů na hudbu','Music sensitivity'],
        bgEnabled:['Animované pozadí','Animated background'],fxOverallOpacity:['Viditelnost pozadí','Background opacity'],reduceFlashIntensity:['Jemnější záblesky','Gentler flashes'],reduceColorSpeedIntensity:['Klidnější změny barev','Gentler color changes'],
        specEnabled:['Zobrazit hudební spektrum','Show the music spectrum'],specInsideIsland:['Spektrum uvnitř ovládacího panelu','Spectrum inside Controlpanel'],specIslandVisibility:['Viditelnost spektra','Spectrum opacity']
      };
      for(const [key,label] of Object.entries(labels)){
        const row=this.panel.querySelector(`[data-basic-setting="${key}"]`),node=row?.querySelector('.range-label-row span,:scope > span');if(node)node.textContent=this.text(...label);
      }
    }
  });
})(window.Aurora);


// One shared styled popup for every native select, including dynamically built editors.
(function(App){
App.mountSelectMenus=function mountSelectMenus(){
  const mounted=new Map();
  const menu=document.createElement('div');menu.id='auroraSelectMenu';menu.className='aurora-select-menu';
  menu.setAttribute('role','listbox');menu.inert=true;document.body.append(menu);
  let active=null,nextId=0;
  const close=(focus=false)=>{const previous=active;active=null;menu.inert=true;menu.classList.remove('is-open');previous?._auroraSelectButton.setAttribute('aria-expanded','false');if(focus&&previous?.isConnected)previous._auroraSelectButton.focus();menu.replaceChildren();};
  const sync=select=>{
    const button=mounted.get(select);if(!button)return;
    const value=select.selectedOptions[0]?.textContent||'';
    if(button.querySelector('span').textContent!==value)button.querySelector('span').textContent=value;
    button.disabled=select.disabled;
    button.hidden=select.hidden;
    const label=select.getAttribute('aria-labelledby');
    const attr=label?'aria-labelledby':'aria-label';
    const text=label?label+' '+button.id+'-value':(select.getAttribute('aria-label')||select.closest('.range-row')?.querySelector('.range-label-row')?.textContent||select.title||'')+': '+value;
    if(button.getAttribute(attr)!==text)button.setAttribute(attr,text);
  };
  const open=select=>{
    close();if(select.disabled||!select.isConnected)return;sync(select);active=select;
    const button=mounted.get(select);button.setAttribute('aria-expanded','true');
    menu.setAttribute('aria-labelledby',button.id);menu.replaceChildren();
    for(const option of select.options){
      if(option.hidden)continue;
      const item=document.createElement('button');item.type='button';item.textContent=option.textContent;item.setAttribute('role','option');item.setAttribute('aria-selected',String(option.selected));
      item.disabled=option.disabled||option.parentElement?.disabled===true;
      item.addEventListener('click',()=>{select.value=option.value;select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));sync(select);close(true);});
      menu.append(item);
    }
    const r=button.getBoundingClientRect(),margin=10;
    const below=innerHeight-r.bottom-margin,above=r.top-margin;
    const up=below<180&&above>below;
    menu.style.width=Math.min(Math.max(r.width,180),innerWidth-margin*2)+'px';
    menu.style.left=Math.max(margin,Math.min(r.left,innerWidth-parseFloat(menu.style.width)-margin))+'px';
    menu.style.maxHeight=Math.max(40,Math.min(320,up?above-6:below-6))+'px';
    menu.style.top=up?'auto':r.bottom+6+'px';menu.style.bottom=up?innerHeight-r.top+6+'px':'auto';
    menu.inert=false;menu.classList.add('is-open');
    (menu.querySelector('[aria-selected="true"]:not(:disabled)')||menu.querySelector('button:not(:disabled)'))?.focus();
  };
  const enhance=root=>{
    const selects=[...(root.matches?.('select')?[root]:[]),...root.querySelectorAll('select')];
    for(const select of selects){
      if(mounted.has(select)||select.id==='ctl-playlistSort'||select.id==='ctl-playlistSortDirection')continue;
      const button=document.createElement('button');button.type='button';button.className='aurora-select-button';
      // Preserve compact layout hooks used by the original select.
      for(const name of (select.className||'').split(/\s+/))if(name&&name!=='aurora-select-source')button.classList.add(name);
      button.id='aurora-select-'+(++nextId);button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-controls',menu.id);button.setAttribute('aria-expanded','false');
      const value=document.createElement('span');value.id=button.id+'-value';button.append(value);
      select.classList.add('aurora-select-source');select.tabIndex=-1;select.setAttribute('aria-hidden','true');select.after(button);select._auroraSelectButton=button;mounted.set(select,button);
      button.addEventListener('click',()=>active===select?close():open(select));
      button.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','Enter',' '].includes(e.key)){e.preventDefault();open(select);}});
      select.addEventListener('change',()=>sync(select));sync(select);
    }
  };
  App.refreshSelectMenus=()=>{for(const select of mounted.keys()){if(!select.isConnected){if(active===select)close();mounted.delete(select);}else sync(select);}};
  menu.addEventListener('keydown',e=>{
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close(true);return;}
    if(e.key==='Tab'){close(true);return;}
    const items=[...menu.querySelectorAll('button:not(:disabled)')],index=items.indexOf(document.activeElement);
    if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();items[e.key==='Home'?0:e.key==='End'?items.length-1:(index+(e.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();}
    else if(e.key.length===1&&!e.ctrlKey&&!e.metaKey){const match=[...items.slice(index+1),...items.slice(0,index+1)].find(n=>n.textContent.trim().toLocaleLowerCase().startsWith(e.key.toLocaleLowerCase()));match?.focus();}
  });
  document.addEventListener('pointerdown',e=>{if(active&&!menu.contains(e.target)&&!mounted.get(active)?.contains(e.target))close();});
  document.addEventListener('focusin',e=>{if(active&&!menu.contains(e.target)&&e.target!==mounted.get(active))close();});
  document.addEventListener('scroll',e=>{if(active&&!menu.contains(e.target))close();},{capture:true,passive:true});
  window.addEventListener('resize',()=>close(),{passive:true});
  enhance(document);
  new MutationObserver(records=>{
    let removedControls=false;
    for(const record of records){
      if(record.type==='childList'&&[...record.removedNodes].some(n=>n.nodeType===1))removedControls=true;
      if(record.type==='childList')for(const node of record.addedNodes)if(node.nodeType===1)enhance(node);
      const select=record.target.closest?.('select')||record.target.parentElement?.closest('select');if(select)sync(select);
    }
    // Remove detached editor controls so rebuilding mapping panels does not retain them.
    if(removedControls)for(const select of mounted.keys())if(!select.isConnected){if(active===select)close();mounted.delete(select);}
    if(active&&!mounted.get(active)?.getClientRects().length)close();
  }).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['disabled','hidden','label','selected','aria-label','aria-labelledby']});
};
})(window.Aurora);
