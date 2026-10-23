/* mobile.js — Responzivní rozložení, mobilní styly a navazující úpravy vzhledu. */

// ── ui/scroll-performance ──
(function(App){
App.markScrollActivity = function markScrollActivity(){
    App.ScrollActivity.lastAt = performance.now();
    if(typeof App.updateScrollBlurClass === 'function') App.updateScrollBlurClass();
    App.scheduleScrollIdleCheck();
  };
App.isActivelyScrolling = function isActivelyScrolling(){
    return (performance.now() - App.ScrollActivity.lastAt) < App.ScrollActivity.WINDOW_MS;
  };
App.updateScrollBlurClass = function updateScrollBlurClass(){
    const shouldReduce = App.isActivelyScrolling();
    if(shouldReduce === App._scrollBlurLowActive) return;
    App._scrollBlurLowActive = shouldReduce;
    document.body.classList.toggle('scroll-blur-reduced', shouldReduce);
    App.refreshPointerGlow?.();
  };
App.scheduleScrollIdleCheck = function scheduleScrollIdleCheck(){
    if(App.ScrollActivity.idleTimer) return;
    const check = ()=>{
      const remaining = App.ScrollActivity.WINDOW_MS - (performance.now() - App.ScrollActivity.lastAt);
      if(remaining > 0){
        App.ScrollActivity.idleTimer = setTimeout(check, remaining + 8);
        return;
      }
      App.ScrollActivity.idleTimer = 0;
      App.updateScrollBlurClass();
    };
    App.ScrollActivity.idleTimer = setTimeout(check, App.ScrollActivity.WINDOW_MS + 8);
  };
  App.define("ui/scroll-performance", function initialize(){
App.ScrollActivity = { lastAt: 0, WINDOW_MS: 250, idleTimer: 0 };
['wheel','touchmove'].forEach(evt=>{
    window.addEventListener(evt, App.markScrollActivity, { passive: true, capture: true });
  });
window.addEventListener('scroll', App.markScrollActivity, { passive: true, capture: true });
window.addEventListener('mousedown', (e)=>{
    if(e.target && (e.target.type === 'range' || e.target.closest('#progressWrap'))) App.markScrollActivity();
  }, { passive: true, capture: true });
window.addEventListener('mousemove', ()=>{
    if(typeof App.tlState !== 'undefined' && App.tlState && App.tlState.seeking) App.markScrollActivity();
  }, { passive: true, capture: true });
App._scrollBlurLowActive = false;
App.VisualRenderState.subscribe(active =>{
    if(active) return;
    if(App.ScrollActivity.idleTimer) clearTimeout(App.ScrollActivity.idleTimer);
    App.ScrollActivity.idleTimer = 0;
    App.ScrollActivity.lastAt = 0;
    App.updateScrollBlurClass();
  });
  }, ["ScrollActivity","markScrollActivity","isActivelyScrolling","_scrollBlurLowActive","updateScrollBlurClass","scheduleScrollIdleCheck"]);
})(window.Aurora);

// Scrolling surfaces must not continuously resample the animated scene behind
// them. Keep scene producers running; isolate the UI's paint and scroll work.
window.Aurora.addStyle(100, `
#trackList{contain:layout paint;isolation:isolate;overscroll-behavior:contain;overflow-anchor:none;}
#settingsPanel .settings-tabpanel{overscroll-behavior:contain;}
/* Preserve the configured glass material during scrolling. */
body.scroll-blur-reduced #trackList .track-row{transition:none!important;}
`);

// ── ui/mobile ──
(function(App){
App.refreshResponsiveLayout = function refreshResponsiveLayout(){
    const bar=App.el('controlBar'),rect=bar.getBoundingClientRect();
    // Reserve the waveform's full configured reach in both renderer paths.
    const waveHeight=Math.max(0.1,Math.min(6,App.settings.timelineWaveformHeight ?? 1));
    const waveReach=App.settings.timelineLoudnessWaveform ? 14*waveHeight+Math.max(0,App.settings.timelineWaveformOffset ?? 3) : 0;
    App.app.style.setProperty('--timeline-waveform-clearance',waveReach+'px');
    const playlist=App.el('playlistPanel').getBoundingClientRect();
    const availableRight=innerWidth>1100&&!App.app.classList.contains('playlist-closed')?playlist.left-12:innerWidth-12;
    const inside=rect.left<166||availableRight-rect.right<166;
    if(bar.classList.contains('stats-inside')!==inside)bar.classList.toggle('stats-inside',inside);
    const label=App.el('timelineTimeLabel'),timeline=App.el('timelineIsland').getBoundingClientRect();
    const wasInside=label.classList.contains('label-inside');
    // Never use the smaller inside font to decide whether the outside label fits.
    if(!wasInside)App._timelineOutsideLabelWidth=Math.max(110,label.offsetWidth||0);
    const labelWidth=App._timelineOutsideLabelWidth||110;
    const room=label.classList.contains('side-left')?timeline.left:availableRight-timeline.right;
    const nextInside=room<labelWidth+40+(wasInside?16:0);
    if(wasInside!==nextInside)label.classList.toggle('label-inside',nextInside);
  };
App.scheduleResponsiveLayout = function scheduleResponsiveLayout(){if(App.responsiveFrame)return;App.responsiveFrame=requestAnimationFrame(()=>{App.responsiveFrame=0;App.refreshResponsiveLayout();});};
  App.define("ui/mobile", function initialize(){
App.responsiveFrame = 0;
App.mountCompactPlayer();
const mobileScene=matchMedia('(max-width:600px)');
const syncMobileScene=()=>{
  App.mobileSceneDisabled=mobileScene.matches;
  App.syncMobileSceneSettingsUI=()=>{
  const bgSwitch=document.querySelector('.switch[data-setting="bgEnabled"]');
  if(bgSwitch){
    bgSwitch.inert=App.mobileSceneDisabled;
    bgSwitch.setAttribute('aria-disabled',String(App.mobileSceneDisabled));
    bgSwitch.classList.toggle('on',!App.mobileSceneDisabled&&!!App.settings.bgEnabled);
    bgSwitch.setAttribute('aria-checked',String(!App.mobileSceneDisabled&&!!App.settings.bgEnabled));
  }
  for(const [id,target] of [['mobileBackgroundNotice',bgSwitch],['mobileEffectsNotice',App.el('ctl-postFish')]]){
    if(!target)continue;
    let notice=App.el(id);
    if(!notice){notice=document.createElement('p');notice.id=id;notice.className='range-hint';notice.textContent='Pozadí a efekty scény jsou na mobilu automaticky vypnuté.';target.closest('.setting-block').querySelector('h3').after(notice);}
    notice.hidden=!App.mobileSceneDisabled;
  }
  };App.syncMobileSceneSettingsUI();
  if(App.mobileSceneDisabled){App.el('bgGlow').style.opacity='0';App.FxEngine?.setBaseOpacity(0);}
  App.Threads?.settingsChanged();App.refreshSceneEffects?.();App.refreshDistortionGPU?.();
};
syncMobileScene();mobileScene.addEventListener('change',syncMobileScene);
new ResizeObserver(App.scheduleResponsiveLayout).observe(App.el('controlBar'));
new MutationObserver(App.scheduleResponsiveLayout).observe(App.app,{attributes:true,attributeFilter:['class']});
new MutationObserver(App.scheduleResponsiveLayout).observe(App.el('timelineTimeLabel'),{attributes:true,attributeFilter:['class']});
window.addEventListener('resize',App.scheduleResponsiveLayout,{passive:true});
App.refreshResponsiveLayout();
  }, ["refreshResponsiveLayout","responsiveFrame","scheduleResponsiveLayout"]);
})(window.Aurora);

// ── styles/mobile/08-player-timeline.css ──
window.Aurora.addStyle(7, `

  @media (max-width: 860px){
    /* Not enough horizontal room beside the control bar on narrow
       screens (the bar itself already spans edge-to-edge there) — hide
       the side panels entirely rather than letting them overflow or
       overlap other UI. */
    .live-stats-side{ display:none !important; }
  }`);

// ── styles/ui/14-favorites-normalization.css ──
window.Aurora.addStyle(13, `
  .heart-btn:hover{ opacity:1; background: rgba(255,255,255,0.08); color: var(--text); }
  .heart-btn svg{ width:16px; height:16px; }
  .heart-btn svg path{ transition: fill .15s ease; }
  .heart-btn.liked{
    opacity:1;
    color: var(--player-c1);
  }
  .heart-btn.liked svg path{ fill: currentColor; }
  .heart-btn.liked:hover{ background: rgba(255,46,196,0.1); }
  .heart-btn.pop{ animation: heartPop .35s cubic-bezier(.34,1.56,.64,1); }
  @keyframes heartPop{
    0%{ transform: scale(1); }
    35%{ transform: scale(1.35); }
    100%{ transform: scale(1); }
  }

  /* Small heart riding next to the now-playing track's title on stage
     (in .track-meta), independent of the playlist row's own heart —
     both toggle the SAME underlying liked state for the current track. */
  .track-meta-heart{
    width:30px; height:30px;
    flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    background: rgba(255,255,255,0.05);
    border: 1px solid var(--border);
    border-radius:50%;
    color: var(--text-dim);
    cursor:pointer;
    pointer-events:auto;
    backdrop-filter: blur(10px);
    transition: color .15s ease, background .15s ease, border-color .15s ease, transform .12s ease;
    opacity:.75;
  }
  .track-meta-heart:hover{ opacity:1; }
  .track-meta-heart svg{ width:16px; height:16px; }
  .track-meta-heart svg path{ transition: fill .15s ease; }
  .track-meta-heart.liked{
    color: var(--player-c1);
    border-color: color-mix(in srgb, var(--player-c1) 45%, transparent);
    background: rgba(255,46,196,0.12);
    opacity:1;
  }
  .track-meta-heart.liked svg path{ fill: currentColor; }
  .track-dur{
    font-size:12.5px;
    color: var(--text-dim);
    flex-shrink:0;
    font-variant-numeric: tabular-nums;
    font-family: var(--mono);
  }

  #dropHint{
    text-align:center;
    color: var(--text-dim);
    font-size:13.5px;
    padding: 34px 22px;
    line-height:1.6;
  }

  #fileInput, #folderInput{ display:none; }

  ::-webkit-scrollbar{ width:8px; height:8px; }
  ::-webkit-scrollbar-thumb{ background: rgba(255,255,255,.1); border-radius: 8px; }

  @keyframes fadeIn{ from{ opacity:0; } to{ opacity:1; } }

  /* normalization badge (top center of stage) */
  #normBadge{
    position:absolute;
    top:30px;
    left:50%;
    transform: translateX(-50%) translateY(-10px);
    z-index:7;
    display:flex;
    align-items:center;
    gap:9px;
    padding:9px 16px;
    border-radius:999px;
    background: rgba(18,20,28,0.75);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border:1px solid var(--border);
    font-size:13px;
    color: var(--text-dim);
    opacity:0;
    pointer-events:none;
    transition: all .25s ease;
  }
  #normBadge.show{ opacity:1; transform: translateX(-50%) translateY(0); }
  #normBadge .spinner{
    width:13px; height:13px;
    border-radius:50%;
    border: 2px solid rgba(255,255,255,0.2);
    border-top-color: var(--accent1);
    animation: spin .7s linear infinite;
  }
  @keyframes spin{ to{ transform: rotate(360deg); } }

  /* normalization progress under track meta, stage-side */
  #normDetail{
    position:absolute;
    /* Was a fixed 96px, assuming the track-meta chip above always stayed
       one short line tall. The chip's title can now wrap onto multiple
       lines (never truncated) and its own padding/border changed its
       height, so this instead tracks the chip's REAL current height via
       --track-meta-h (kept in sync by JS, see observeTrackMetaHeight())
       plus a fixed gap below it — same technique used for
       --control-bar-h/#playlistPanel below. */
    top: calc(30px + var(--track-meta-h, 78px) + 24px);
    left: 34px;
    z-index:6;
    width: 280px;
    opacity:0;
    transform: translateY(-6px);
    transition: opacity .3s ease, transform .3s ease, top .2s ease;
    pointer-events:none;
  }
  #normDetail.show{ opacity:1; transform:none; }
  #normDetail .row{
    display:flex;
    justify-content:space-between;
    font-size:12px;
    color: var(--text-dim);
    font-family: var(--mono);
    margin-bottom:6px;
  }
  #normDetail .row strong{ color: var(--text); font-weight:500; }
  #normDetail .bar-bg{
    height:3px;
    border-radius:2px;
    background: rgba(255,255,255,0.1);
    overflow:hidden;
  }
  #normDetail .bar-fill{
    height:100%;
    width:0%;
    border-radius:2px;
    background: linear-gradient(90deg, var(--accent1), var(--accent2));
    transition: width .1s linear;
  }

  #stage.dragover::after{
    content:'Drop MP3 files here';
    position:absolute; inset:14px;
    border: 2px dashed var(--accent2);
    border-radius:20px;
    display:flex; align-items:center; justify-content:center;
    font-family: var(--font-display);
    font-size:20px;
    color: var(--accent2);
    background: rgba(124,58,237,0.06);
    z-index: 50;
  }`);

// ── styles/mobile/15-favorites-normalization.css ──
window.Aurora.addStyle(14, `

  @media (max-width: 860px){
    #controlBar{ left:12px; right:12px; bottom:12px; border-radius:18px; }
    #timelineIsland{ left:12px; right:12px; transform:none; width:auto; border-radius:18px; }
    #app:not(.playlist-closed) #timelineIsland{ transform:none; }
    #playlistPanel{ position:fixed; top:8px; right:8px; bottom:calc(var(--control-bar-h, 96px) + 16px); width:88vw; max-width:380px; border-radius:18px; z-index:40; box-shadow: 0 8px 40px rgba(0,0,0,.5); }
    #app.playlist-closed #playlistPanel{ transform: translateX(calc(100% + 16px)); transition: transform .3s ease; }
    #playlistPanel{ transform: translateX(0); transition: transform .3s ease; }
    .volume-wrap{ display:none; }
    .bar-track-info{ max-width:120px; }
    #settingsPanel{ width: calc(100vw - 32px); right:16px; max-height: calc(100% - 90px); }
  }`);

// ── styles/ui/17-ui-shell.css ──
window.Aurora.addStyle(16, `
#stage{overflow:clip;}
@keyframes settings-arrive{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
.settings-header{display:flex;align-items:center;justify-content:space-between;padding:23px 25px 17px;flex:none;}
.settings-brand{display:flex;align-items:center;gap:13px;}
.settings-emblem{display:grid;place-items:center;width:44px;height:44px;border-radius:15px;font-size:28px;color:#f89ad2;background:linear-gradient(145deg,#5b2b4a70,#7c3aed20);border:1px solid #ed85c53b;box-shadow:inset 0 1px 0 #ffffff12;}
.settings-eyebrow{font:600 9px var(--font-mono);letter-spacing:.22em;color:#bfa8cc;}
#settingsTitle{font:600 23px var(--font-display);letter-spacing:-.035em;margin:3px 0 0;color:#f3eff8;}
.settings-close{border:1px solid #ffffff16;border-radius:50%;width:32px;height:32px;display:grid;place-items:center;font-size:22px;background:#ffffff05;color:#c6bfce;cursor:pointer;}
.settings-tools{display:flex;align-items:center;gap:10px;padding:0 24px 18px;border-bottom:1px solid #ffffff0c;flex:none;}
.settings-search-wrap{display:flex;align-items:center;gap:10px;flex:1;min-width:0;border:1px solid #ffffff13;border-radius:13px;background:#08091260;padding:0 12px;height:42px;}
.settings-search-wrap:focus-within{border-color:#d299d175;box-shadow:0 0 0 3px #f097d00b;}
.settings-search-wrap svg{width:16px;height:16px;fill:none;stroke:#afa5ba;stroke-width:1.7;flex:none;}
#settingsSearch{border:0;outline:0;background:transparent;color:var(--text);font:12px var(--font-body);width:100%;min-width:0;height:40px;}
#settingsPanel #settingsSearch:focus-visible{outline:0;}
.settings-search-wrap kbd{white-space:nowrap;font:9px var(--font-mono);color:#82798e;border:1px solid #ffffff13;border-radius:5px;padding:3px 4px;}
#settingsAdvanced{height:38px;border:1px solid #ffffff13;border-radius:12px;padding:0 12px;color:#aaa2b7;background:#ffffff04;cursor:pointer;font:11px var(--font-body);}
#settingsAdvanced[aria-pressed=true]{border-color:#e492cb60;color:#f6b5df;background:#a8559620;}
.settings-body{display:flex;flex:1;min-height:0;overflow:hidden;}
.settings-nav{display:flex;flex-direction:column;gap:5px;width:176px;flex:none;padding:18px 10px;border-right:1px solid #ffffff0b;background:#0c0d141f;}
.settings-nav-item{display:flex;align-items:center;gap:10px;border:1px solid transparent;border-radius:12px;padding:12px 10px;background:transparent;color:#aaa4b7;cursor:pointer;text-align:left;font:500 11px var(--font-body);}
.settings-nav-item:hover{background:#ffffff05;color:#eae1f4;}
.settings-nav-item.active{background:linear-gradient(100deg,#a9559929,#7653b615);border-color:#cf8ec526;color:#f6d3ed;box-shadow:inset 0 1px 0 #ffffff06;}
.settings-nav-icon{font-size:19px;width:21px;text-align:center;flex:none;opacity:.8;}
.settings-content{flex:1;min-width:0;padding:21px;overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:#68557455 transparent;}
#settingsPanel .settings-category{padding:0;overflow:visible;gap:16px;display:none;font-size:12px;}
#settingsPanel .settings-category.active{display:flex;}
#settingsPanel .settings-category-heading h3{text-transform:none;letter-spacing:-.025em;font:600 20px var(--font-display);}
.settings-category-heading p{font-size:11px;color:#a39aad;line-height:1.7;margin:6px 0 0;max-width:370px;}
.settings-basic-content{background:linear-gradient(120deg,#ffffff05,#ffffff01);border:1px solid #cfacce19;border-radius:18px;padding:3px 17px;box-shadow:inset 0 1px 0 #ffffff04;}
.settings-basic-content:empty{display:none;}
#settingsPanel .settings-basic-content>.toggle-row,#settingsPanel .settings-basic-content>.range-row{padding:16px 0;margin:0!important;border-bottom:1px solid #ffffff0a;gap:15px;}
#settingsPanel .settings-basic-content>:last-child{border-bottom:0;}
#settingsPanel .range-label-row{font-size:12px;line-height:1.5;}
#settingsPanel .range-label-row strong{font:10px var(--font-mono);color:#e7b3da;background:#b16aac15;border-radius:5px;padding:3px 5px;white-space:nowrap;}
#settingsPanel .range-hint{font-size:10px;line-height:1.6;color:#8c8498;margin-top:8px;}
#settingsPanel .toggle-row>span{font-size:12px;line-height:1.6;}
#settingsPanel .switch{flex-shrink:0;box-shadow:inset 0 1px 2px #0003;}
#settingsPanel .switch.on{background:linear-gradient(100deg,#cd70ad,#9463cd);box-shadow:0 0 12px #c86eaf13;}
.settings-advanced-content{display:none;flex-direction:column;gap:14px;}
.show-advanced .settings-advanced-content{display:flex;}
#settingsPanel .setting-block{padding:17px;border:1px solid #ffffff0c;border-radius:16px;background:#ffffff02;margin:0!important;content-visibility:auto;contain-intrinsic-size:auto 180px;}
#settingsPanel .setting-block h3{font:600 13px var(--font-display);letter-spacing:0;text-transform:none;}
#settingsPanel .setting-block>div[style*="font-size:11px"]{font-size:10px!important;line-height:1.65!important;}
#settingsPanel .settings-basic-content>.setting-block{background:transparent;border:0;border-bottom:1px solid #ffffff0c;border-radius:0;padding:16px 0;content-visibility:visible;}
.settings-more{align-self:flex-start;color:#a996b5;border:0;background:transparent;cursor:pointer;font:11px var(--font-body);padding:4px 2px;}
.settings-more:hover{color:#f4c6e3;}
.settings-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 23px;border-top:1px solid #ffffff0c;flex:none;background:#0b0c142e;}
#settingsSaveStatus{font-size:9px;color:#9991a5;}
.settings-footer button{border:1px solid #d291c526;background:#ac6ea00d;border-radius:9px;color:#d3b8d0;padding:8px 10px;cursor:pointer;font:10px var(--font-body);}
.settings-footer>div{display:flex;gap:6px;}
.settings-results[hidden]{display:none;}
.settings-search-summary{font-size:11px;color:#a69bb3;margin:0 0 14px;}
.settings-result{display:flex;flex-direction:column;gap:7px;width:100%;text-align:left;padding:14px;margin-bottom:8px;border:1px solid #d599cf1c;border-radius:13px;background:#ffffff03;color:#e4dceb;cursor:pointer;}
.settings-result strong{font:500 12px var(--font-body);}.settings-result span{font:10px var(--font-body);color:#a398ae;}
.settings-result:hover{border-color:#d599cf5c;background:#bc72b00c;}
.setting-found{outline:2px solid #e79ed188;outline-offset:5px;border-radius:8px;}
#settingsPanel :is(button,[role=switch],input,select):focus-visible{outline:2px solid #e4a1da;outline-offset:3px;}
/* The existing reactive music card is the visual anchor. Carry its outline,
   spacing and rounded surface through the supporting library UI. */
#playlistPanel{border-radius:22px;border-color:#d1a8d922;background:linear-gradient(155deg,#191822f5,#11121bf5);backdrop-filter:none;-webkit-backdrop-filter:none;}
.track-row{border-radius:13px;transition:background .15s ease,border-color .15s ease;}
.track-row:hover{background:linear-gradient(100deg,#c773b610,#8e68c80a);}
.track-row.active{background:linear-gradient(100deg,#d777bc1b,#8f64c80f);border-color:#dfa0d02b;}`);

// ── styles/mobile/18-ui-shell.css ──
window.Aurora.addStyle(17, `
@media(max-width:780px){
  #settingsPanel,#app:not(.playlist-closed) #settingsPanel{right:12px;top:68px;width:calc(100vw - 24px);height:calc(100% - 82px);max-height:calc(100% - 82px);border-radius:22px;}
  .settings-header{padding:17px 17px 14px;}#settingsTitle{font-size:21px;}.settings-tools{padding:0 16px 14px;}
  .settings-nav{width:54px;padding:15px 5px;}.settings-nav-item{padding:12px 9px;gap:0;}.settings-nav-item>span:last-child{display:none;}
  .settings-content{padding:17px 13px;}.settings-footer{padding:12px 16px;}.settings-search-wrap kbd{display:none;}
}`);

// ── styles/mobile/20-ui-shell.css ──
window.Aurora.addStyle(19, `
@media(max-width:780px){#playlistPanel{border-radius:18px;}}`);

// ── styles/ui/21-ui-shell.css ──
window.Aurora.addStyle(20, `

/* Flat settings: sections stay together in Basic and Advanced modes. */
.settings-sections{display:flex;flex-direction:column;gap:14px;min-width:0;}
#settingsPanel:not(.show-advanced) .advanced-only{display:none!important;}
.settings-jump{display:flex;flex-wrap:wrap;gap:6px;}
.settings-jump a{padding:6px 10px;border:1px solid #cfacce26;border-radius:999px;color:#d9bdd9;font-size:10px;text-decoration:none;}
.settings-jump a:hover{background:#cfacce16;}
.settings-content{scroll-behavior:smooth;}
#settingsPanel .setting-block{border-radius:14px;scroll-margin-top:16px;content-visibility:visible;}
.mapping-advanced summary{cursor:pointer;color:var(--text-dim);font-size:11px;padding:8px 0;}
.mapping-advanced[open] summary{margin-bottom:10px;}
#settingsPanel summary:focus-visible,#settingsPanel a:focus-visible{outline:2px solid #e4a1da;outline-offset:3px;}


/* v2.0 responsive geometry: reserve the actual playlist width, never a fixed shift. */
#app{--playlist-width:clamp(320px,30vw,460px);--player-reserve:0px;--player-center:calc((100% - var(--player-reserve)) / 2);--player-bottom:22px;--player-width:min(920px,calc(100% - var(--player-reserve) - 48px));}
#app:not(.playlist-closed){--player-reserve:calc(var(--playlist-width) + 24px);}
#playlistPanel{width:var(--playlist-width);}
#controlBar,#timelineIsland,#timelineIslandExtension,
#app:not(.playlist-closed) #controlBar,#app:not(.playlist-closed) #timelineIsland,#app:not(.playlist-closed) #timelineIslandExtension{
 left:var(--player-center);right:auto;transform:translateX(-50%);width:var(--player-width);max-width:calc(100% - 24px);
}
#emptyState{position:absolute;left:var(--player-center);top:50%;transform:translate(-50%,-50%);width:min(480px,calc(100% - var(--player-reserve) - 32px));max-width:calc(100% - 32px);box-sizing:border-box;}
#controlBar{bottom:var(--player-bottom);}
#timelineIsland{bottom:calc(var(--player-bottom) + var(--control-bar-h,96px) + var(--timeline-island-gap,14px));}
#timelineIsland.merged,#timelineIslandExtension{width:min(calc(920px - var(--timeline-island-inset,20px) * 2),calc(100% - var(--player-reserve) - 48px - var(--timeline-island-inset,20px) * 2));}
#timelineIslandExtension{bottom:calc(var(--player-bottom) + var(--control-bar-h,96px) + var(--timeline-island-gap,14px) - var(--timeline-island-overlap,10px));}
#controlBar{container-type:inline-size;}
#controlsRow{flex-wrap:nowrap;gap:8px;padding:12px;min-width:0;}
#controlsRow>.transport,#controlsRow>.volume-group,#controlsRow>.playback-mode-group,#controlsRow>#timeLabel{flex-shrink:0;}
#controlsRow>.bar-track-info{flex:1 1 180px;min-width:90px;max-width:none;}
#controlsRow>.spacer{display:none;}
#timeLabel{white-space:nowrap;margin-left:0;min-width:0;font-size:12px;}
#timeLabel.ctrl-chip{padding:8px;}
.volume-wrap{width:clamp(54px,7vw,90px);}
.track-info strong,.track-meta h2{display:block;white-space:nowrap;word-break:normal;overflow:hidden;text-overflow:ellipsis;-webkit-line-clamp:unset;max-height:none;}
.track-meta-titles{flex:1;min-width:0;}
.track-meta span,.track-meta-titles span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.track-meta-chip{max-width:min(620px,calc(100vw - var(--player-reserve) - 48px));}
.playlist-header-top{gap:12px;min-width:0;}
.playlist-header-top h3,.playlist-count,.import-btn,#bulkAnalyzeBtn{white-space:nowrap;}
.import-drop-row{min-width:0;}.import-btn{min-width:0;flex:1;font-size:12px;padding:10px 8px;gap:6px;}
.track-info small{min-width:0;}.track-dur,.track-num,.norm-badge{flex-shrink:0;}
#liveStatsDock{display:contents;}
#controlBar.stats-inside #liveStatsDock{display:flex;justify-content:center;gap:8px;padding:10px 12px 0;}
#controlBar.stats-inside #liveStatsDock:not(:has(.show)){display:none;}
#controlBar.stats-inside .live-stats-side{position:static;padding:6px;border-radius:12px;box-shadow:none;backdrop-filter:none;-webkit-backdrop-filter:none;flex:1;max-width:220px;}
#controlBar.stats-inside .live-stats-side.show{display:flex!important;}
#controlBar.stats-inside .live-stats-cell{width:auto;min-width:0;flex:1;padding:2px 5px;}
#controlBar.stats-inside .lsc-val{font-size:12px;}
#timelineTimeLabel{max-width:calc(100vw - 24px);}
#timelineTimeLabel.side-left{right:calc(100% + 20px);}
#timelineTimeLabel.side-right{left:calc(100% + 20px);}
#timelineTimeLabel.label-inside{top:calc(-1 * var(--timeline-waveform-clearance,0px) - 16px);left:50%;right:auto;transform:translate(-50%,-100%);padding:4px 8px;font-size:11px;}
#settingsPanel,#app:not(.playlist-closed) #settingsPanel{width:min(900px,calc(100vw - 48px));}
.settings-nav{width:210px;}.settings-nav-item{min-width:0;}.settings-nav-item>span:last-child{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
#settingsPanel .toggle-row,#settingsPanel .range-label-row{min-width:0;gap:12px;}
#settingsPanel .toggle-row>span,#settingsPanel .range-label-row>span{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
#settingsPanel .range-label-row strong{flex-shrink:0;}
#settingsPanel select{max-width:100%;min-width:0;text-overflow:ellipsis;}
.settings-jump{flex-wrap:nowrap;overflow-x:auto;padding-bottom:5px;scrollbar-width:thin;}
.settings-jump a{flex:none;white-space:nowrap;}
.settings-footer button,.settings-more,#settingsAdvanced{white-space:nowrap;}
.settings-footer{gap:8px;}#settingsSaveStatus{min-width:0;}.settings-footer>div{flex-shrink:0;}
#trackInfoPopover{position:fixed;right:auto;bottom:auto;max-width:calc(100vw - 24px);z-index:150;}
#stageTrackInfoPopover{max-width:calc(100vw - 24px);}
@container(max-width:760px){
 #controlsRow{gap:6px;padding:10px;}
 .transport.ctrl-chip{padding:6px 3px;}.ctrl-btn{width:36px;height:36px;}.ctrl-btn.big{width:46px;height:46px;}
 .volume-group.ctrl-chip{padding:4px;}.volume-wrap{width:60px;}.volume-icon-btn{width:34px;height:36px;}
 .playback-mode-group{padding:4px;}.playback-mode-btn{width:32px;height:34px;}
 .bar-track-info.ctrl-chip{padding:8px 12px;}.bar-track-info strong{font-size:13px;}.bar-track-info span{font-size:11px;}
}
@container(max-width:620px){
 #controlsRow{overflow-x:auto;overflow-y:hidden;scrollbar-width:thin;scrollbar-color:#a87ca855 transparent;overscroll-behavior-x:contain;}
 #controlsRow>.bar-track-info{flex:0 0 140px;}
 #controlsRow>*{scroll-snap-align:start;}
 .volume-wrap{display:flex;width:60px;}
}`);

// ── styles/mobile/22-ui-shell.css ──
window.Aurora.addStyle(21, `
@media(max-width:1100px){
 #app,#app:not(.playlist-closed){--player-reserve:0px;--player-bottom:12px;}
 #playlistPanel{position:fixed;top:12px;right:12px;bottom:calc(var(--control-bar-h,96px) + var(--timeline-island-h,56px) + var(--timeline-island-gap,14px) + 32px);width:min(420px,calc(100vw - 24px));max-width:none;z-index:40;}
 #controlBar,#timelineIsland{border-radius:22px;}
 #timelineIsland.merged{border-radius:22px 22px 0 0;}
}
@media(max-width:780px){
 #settingsPanel,#app:not(.playlist-closed) #settingsPanel{left:12px;right:12px;top:64px;width:auto;height:calc(100% - 76px);max-height:calc(100% - 76px);}
 .settings-body{flex-direction:column;}
 .settings-nav{width:100%;padding:8px;flex-direction:row;overflow-x:auto;border-right:0;border-bottom:1px solid #ffffff0c;gap:5px;scrollbar-width:thin;}
 .settings-nav-item{flex:none;padding:9px 12px;gap:7px;}.settings-nav-item>span:last-child{display:inline;}
 .settings-nav-icon{font-size:15px;width:16px;}
 .settings-content{padding:14px;}
 .settings-header{padding:12px 16px;}.settings-emblem{width:34px;height:34px;font-size:22px;}#settingsTitle{font-size:18px;}
 .settings-tools{padding:0 12px 12px;gap:6px;}#settingsAdvanced{padding:0 9px;font-size:10px;}
 .settings-footer{padding:10px 12px;}#settingsSaveStatus{font-size:8px;}.settings-footer button{font-size:9px;padding:8px;}
 .track-meta-chip{max-width:calc(100vw - 32px);padding:10px 12px;}.track-meta h2{font-size:15px;}
 #playlistPanel{border-radius:18px;}.playlist-header{padding:16px 14px 12px;gap:10px;}
}`);

// ── styles/mobile/24-ui-shell.css ──
window.Aurora.addStyle(23, `
@media(max-width:780px){.track-meta{left:16px;top:16px;max-width:calc(100% - 32px);}#normDetail{left:16px;max-width:calc(100% - 32px);}}`);

// ── styles/mobile/26-settings-skin.css ──
window.Aurora.addStyle(25, `
@media(min-width:1101px){
  #app:not(.playlist-closed) #settingsPanel{right:calc(var(--playlist-width) + 36px);width:min(560px,calc(100vw - var(--playlist-width) - 60px));}
}
@media(min-width:901px) and (max-width:1100px){
  #app:not(.playlist-closed) #settingsPanel{right:444px;width:calc(100vw - 468px);}
}`);

// ── styles/ui/27-settings-skin.css ──
window.Aurora.addStyle(26, `
#settingsPanel .settings-header{position:absolute;top:0;right:0;left:0;height:0;padding:0;border:0;z-index:3;}
#settingsPanel .settings-brand{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);}
#settingsPanel .settings-close{position:absolute;right:5px;top:4px;width:24px;height:24px;font-size:19px;background:none;border:0;color:#8e909e;}
#settingsPanel .settings-body{display:flex;flex-direction:column;min-height:0;overflow:hidden;}
#settingsPanel .settings-nav{
  display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:repeat(2,42px);
  width:100%;padding:18px 22px 12px;gap:2px 5px;flex:none;
  overflow:visible;border-right:0;border-bottom:1px solid #282932;background:transparent;
}
#settingsPanel .settings-nav-item{
  display:flex;justify-content:center;align-items:center;min-width:0;padding:0 5px;
  border:0;border-bottom:2px solid transparent;border-radius:10px 10px 0 0;
  background:none;box-shadow:none;color:#9294a2;font:600 12px var(--font-body);
}
#settingsPanel .settings-nav-item:hover{background:#ffffff04;color:#e8e8ef;}
#settingsPanel .settings-nav-item.active{background:#ffffff04;color:#f2f2f7;border-bottom-color:#ed27c7;}
#settingsPanel .settings-nav-icon{display:none;}
#settingsPanel .settings-nav-item>span:last-child{display:block;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;}
#settingsPanel .settings-tools{display:flex;flex:none;padding:12px 22px;gap:8px;border-bottom:1px solid #ffffff05;}
#settingsPanel .settings-search-wrap{height:34px;padding:0 10px;border:1px solid #292b35;background:#ffffff03;border-radius:9px;}
#settingsPanel .settings-search-wrap svg{width:14px;height:14px;stroke:#8b8d9a;}
#settingsPanel #settingsSearch{height:32px;font-size:11px;}
#settingsPanel .settings-search-wrap kbd{font-size:8px;border:0;padding:0;color:#70727f;}
#settingsPanel #settingsAdvanced{height:34px;padding:0 12px;border:1px solid #30313a;border-radius:999px;background:#ffffff04;color:#a5a6b3;font:600 11px var(--font-body);}
#settingsPanel #settingsAdvanced[aria-pressed=true]{background:linear-gradient(110deg,#ed29c7,#902be9);border-color:transparent;color:white;}
#settingsPanel .settings-content{padding:0 24px 18px;scrollbar-width:thin;scrollbar-color:#393b48 transparent;}
#settingsPanel .settings-category{gap:0;}
#settingsPanel .settings-category-heading{display:none;}
#settingsPanel .settings-jump{gap:7px;margin:0 -2px 8px;padding:13px 0 12px;border-bottom:1px solid #ffffff04;}
#settingsPanel .settings-jump a{padding:6px 12px;border:1px solid #31323c;border-radius:999px;background:#ffffff04;color:#9395a3;font:500 11px var(--font-body);}
#settingsPanel .settings-jump a:hover,#settingsPanel .settings-jump a:focus-visible{background:linear-gradient(110deg,#ed29c7,#902be9);color:#fff;border-color:transparent;}
#settingsPanel .settings-sections{gap:0;}
#settingsPanel .setting-block{
  padding:22px 0!important;margin:0!important;border:0;border-bottom:1px solid #292a32;
  border-radius:0;background:none;box-shadow:none;content-visibility:visible;
}
#settingsPanel .setting-block:last-child{border-bottom:0;}
#settingsPanel .setting-block h3{margin:0 0 15px;font:750 14px var(--font-display);text-transform:uppercase;letter-spacing:.025em;color:#e3e4eb;line-height:1.45;}
#settingsPanel .setting-subhead{color:#dcdde5;font:650 12px var(--font-display);}
#settingsPanel .toggle-row{gap:12px;min-height:26px;}
#settingsPanel .toggle-row>span,#settingsPanel .range-label-row{font-size:13px;line-height:1.4;}
#settingsPanel .range-label-row>span{color:#9193a1;}
#settingsPanel .range-label-row strong{padding:0;border-radius:0;background:none;color:#e4e5ea;font:700 12px var(--font-mono);}
#settingsPanel .range-hint,#settingsPanel .setting-block>div[style*="font-size:11px"]{font-size:11px!important;line-height:1.45!important;color:#888a99;}
#settingsPanel .switch{width:42px;height:24px;min-width:42px;background:#32333d;border-radius:999px;box-shadow:none;}
#settingsPanel .switch::after{width:20px;height:20px;top:2px;left:2px;background:#fff;box-shadow:0 1px 3px #0003;}
#settingsPanel .switch.on{background:linear-gradient(110deg,#ed29c7,#982ce8);box-shadow:none;}
#settingsPanel .switch.on::after{transform:translateX(18px);}
#settingsPanel input[type=range]{accent-color:white;}
#settingsPanel input[type=range]::-webkit-slider-runnable-track{height:5px;background:#35363f;border-radius:999px;border:0;}
#settingsPanel input[type=range]::-webkit-slider-thumb{width:16px;height:16px;margin-top:-5.5px;background:white;border:0;border-radius:50%;box-shadow:none;}
#settingsPanel input[type=range]::-moz-range-track{height:5px;background:#35363f;border-radius:999px;border:0;}
#settingsPanel input[type=range]::-moz-range-progress{height:5px;background:#535461;border-radius:999px;}
#settingsPanel input[type=range]::-moz-range-thumb{width:16px;height:16px;background:white;border:0;border-radius:50%;box-shadow:none;}
#settingsPanel .map-select{border-color:#30313c;background:#181920;color:#dddde7;border-radius:9px;font-size:12px;}
#settingsPanel .map-row,#settingsPanel .bg-layer-card{background:#ffffff02;border:1px solid #2b2c35;border-radius:12px;}
#settingsPanel .settings-more{margin:15px 0 0;padding:8px 0;color:#aaaabb;font-size:11px;}
#settingsPanel .settings-footer{flex-direction:column-reverse;align-items:stretch;gap:8px;padding:12px 24px 15px;border-top:1px solid #25262f;background:transparent;}
#settingsPanel .settings-footer>div{display:flex;width:100%;gap:8px;}
#settingsPanel .settings-footer button{min-height:38px;background:#ffffff04;border:1px solid #30313d;border-radius:11px;font:600 12px var(--font-body);color:#9294a4;}
#settingsPanel #settingsRecommended{flex:1;}
#settingsPanel .settings-footer button:hover{color:#e8e8ee;background:#ffffff08;}
#settingsPanel #settingsSaveStatus{text-align:center;font:9px var(--font-mono);color:#77798a;}
#settingsPanel .settings-result{border-color:#2d2e38;background:#ffffff03;border-radius:10px;}
#settingsPanel .settings-result span{color:#9698a9;}`);

// ── styles/mobile/28-settings-skin.css ──
window.Aurora.addStyle(27, `
@media(max-width:900px){
  #settingsPanel,#app:not(.playlist-closed) #settingsPanel{left:auto;right:12px;top:64px;width:min(560px,calc(100vw - 24px));height:calc(100% - 76px);max-height:calc(100% - 76px);}
}
@media(max-width:480px){
  #settingsPanel .settings-nav{padding:18px 12px 10px;column-gap:2px;}
  #settingsPanel .settings-nav-item{font-size:10px;padding:0 2px;}
  #settingsPanel .settings-tools{padding:10px 16px;}
  #settingsPanel .settings-content{padding:0 18px 14px;}
  #settingsPanel .settings-footer{padding:10px 18px 12px;}
  #settingsPanel .settings-search-wrap kbd{display:none;}
  #settingsPanel .setting-block h3{font-size:13px;}
}`);

// ── styles/ui/29-settings-skin.css ──
window.Aurora.addStyle(28, `

/* Hybrid refinement: classic surfaces, larger and more distinct categories. */
#settingsPanel,#app:not(.playlist-closed) #settingsPanel{width:min(660px,calc(100vw - 48px));}
#settingsPanel .settings-header{position:relative;height:auto;min-height:60px;padding:15px 24px 12px;flex:none;}
#settingsPanel .settings-brand{position:static;width:auto;height:auto;overflow:visible;clip-path:none;}
#settingsPanel .settings-emblem{display:none;}
#settingsPanel .settings-eyebrow{font-size:9px;color:#9692ac;letter-spacing:.18em;}
#settingsPanel #settingsTitle{font:650 21px var(--font-display);color:#eeeeF5;margin:3px 0 0;}
#settingsPanel .settings-close{top:21px;right:20px;width:30px;height:30px;border:1px solid #30313c;background:#ffffff03;border-radius:10px;color:#b6b5c5;}
#settingsPanel .settings-nav{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:repeat(3,48px);padding:4px 18px 16px;gap:7px;}
#settingsPanel .settings-nav-item{justify-content:flex-start;gap:10px;padding:0 13px;border:1px solid #2b2c37;border-radius:11px;background:#ffffff02;font:600 15px var(--font-body);color:#bfc0cf;}
#settingsPanel .settings-nav-icon{display:inline-block;width:20px;flex:none;font-size:20px;color:#9693ad;opacity:1;}
#settingsPanel .settings-nav-item.active{color:#fff;background:linear-gradient(110deg,#c126ac26,#853ae81a);border-color:#c752b66b;box-shadow:inset 3px 0 #e62bce;}
#settingsPanel .settings-nav-item.active .settings-nav-icon{color:#f17de0;}
#settingsPanel .settings-nav-item:hover{color:#fff;background:#ffffff07;border-color:#686177;}
#settingsPanel .settings-tools{padding:13px 22px;}
#settingsPanel .settings-search-wrap{height:38px;}
#settingsPanel #settingsSearch{height:36px;font-size:12px;}
#settingsPanel #settingsAdvanced{height:38px;font-size:12px;}
#settingsPanel .settings-content{padding-left:26px;padding-right:26px;}
#settingsPanel .setting-block{padding:24px 0!important;}
#settingsPanel .setting-block h3{font-size:15px;letter-spacing:.015em;}
#settingsPanel .toggle-row>span,#settingsPanel .range-label-row{font-size:14px;}
#settingsPanel .range-hint,#settingsPanel .setting-block>div[style*="font-size:11px"]{font-size:12px!important;line-height:1.55!important;color:#9697a8;}
#settingsPanel .settings-jump a{font-size:12px;padding:7px 12px;color:#aaaabb;}`);

// ── styles/mobile/30-settings-skin.css ──
window.Aurora.addStyle(29, `
@media(min-width:1101px){#app:not(.playlist-closed) #settingsPanel{width:min(660px,calc(100vw - var(--playlist-width) - 60px));}}
@media(min-width:901px) and (max-width:1100px){#app:not(.playlist-closed) #settingsPanel{width:calc(100vw - 468px);}}
@media(max-width:900px){#settingsPanel,#app:not(.playlist-closed) #settingsPanel{width:min(660px,calc(100vw - 24px));}}
@media(max-width:480px){
  #settingsPanel .settings-header{padding:12px 18px;min-height:58px;}
  #settingsPanel .settings-close{top:18px;right:16px;}
  #settingsPanel .settings-nav{padding:2px 10px 12px;gap:6px;grid-template-rows:repeat(3,46px);}
  #settingsPanel .settings-nav-item{font-size:13px;padding:0 8px;gap:6px;}
  #settingsPanel .settings-nav-icon{width:16px;font-size:17px;}
  #settingsPanel .settings-content{padding-left:18px;padding-right:18px;}
}
@media(max-height:620px){
  #settingsPanel .settings-header{min-height:42px;padding-top:8px;padding-bottom:6px;}
  #settingsPanel .settings-eyebrow{display:none;}
  #settingsPanel .settings-close{top:9px;}
  #settingsPanel .settings-nav{grid-template-rows:repeat(3,36px);padding-bottom:8px;gap:4px;}
  #settingsPanel .settings-tools{padding-top:7px;padding-bottom:7px;}
}
@media(max-width:380px){#settingsPanel .settings-nav-icon{display:none;}#settingsPanel .settings-nav-item{justify-content:center;}}`);

// ── styles/ui/31-settings-skin.css ──
window.Aurora.addStyle(30, `

/* 2.2: fixed compact navigation, all topic details visible in their own section. */
#settingsPanel.settings-v22,#app:not(.playlist-closed) #settingsPanel.settings-v22{
 top:58px;bottom:12px;height:calc(100% - 70px);max-height:calc(100% - 70px);
}
#settingsPanel.settings-v22 .settings-header{position:relative;display:flex;align-items:center;justify-content:space-between;min-height:36px;height:36px;padding:6px 18px;}
#settingsPanel.settings-v22 #settingsTitle{font-size:15px;margin:0;letter-spacing:.01em;}
#settingsPanel.settings-v22 .settings-close{position:static;width:25px;height:25px;border-radius:8px;font-size:18px;}
#settingsPanel.settings-v22 .settings-nav{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:repeat(2,34px);padding:4px 14px 9px;gap:4px;border-bottom:1px solid #292a34;}
#settingsPanel.settings-v22 .settings-nav-item{display:flex;align-items:center;justify-content:center;padding:0 7px;font:600 14px var(--font-body);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;border-radius:8px;min-height:34px;}
#settingsPanel.settings-v22 .settings-nav-item.active{background:linear-gradient(110deg,#b725ae26,#853ae81c);border-color:#c752b66b;box-shadow:inset 0 -2px #e62bce;color:white;}
#settingsPanel.settings-v22 .settings-tools{flex:none;padding:8px 14px;}
#settingsPanel.settings-v22 .settings-search-wrap{height:30px;width:100%;}
#settingsPanel.settings-v22 #settingsSearch{height:28px;font-size:12px;}
#settingsPanel.settings-v22 .settings-subnavs{flex:none;padding:0 14px 9px;border-bottom:1px solid #292a34;background:#101116;}
#settingsPanel.settings-v22 .settings-subnav{display:flex;gap:4px;flex-wrap:wrap;}
#settingsPanel.settings-v22 .settings-subnav[hidden],#settingsPanel.settings-v22 .settings-page[hidden]{display:none!important;}
#settingsPanel.settings-v22 .settings-subnav-item{flex:1 1 auto;min-height:29px;display:flex;align-items:center;justify-content:center;white-space:nowrap;padding:5px 9px;border:1px solid #2b2c37;border-radius:7px;background:#ffffff02;color:#b2b2c2;cursor:pointer;font:600 12px var(--font-body);}
#settingsPanel.settings-v22 .settings-subnav-item:hover{border-color:#686177;background:#ffffff07;color:white;}
#settingsPanel.settings-v22 .settings-subnav-item.active{background:linear-gradient(110deg,#b725ae26,#853ae81c);border-color:#c752b66b;box-shadow:inset 0 -2px #e62bce;color:white;}
#settingsPanel.settings-v22 .settings-content{flex:1;min-height:0;padding:0 22px 10px;scroll-behavior:auto;}
#settingsPanel.settings-v22 .settings-page{display:flex;flex-direction:column;min-width:0;}
#settingsPanel.settings-v22 .setting-block{padding:20px 0!important;}
#settingsPanel.settings-v22 .setting-block h3{margin-bottom:12px;font-size:14px;}
#settingsPanel.settings-v22 .settings-detail-content{margin-top:18px;padding-top:12px;border-top:1px solid #ffffff09;}
#settingsPanel.settings-v22 .settings-detail-content>.setting-subhead:first-child{margin:0 0 10px;color:#a6a4bb;font-size:11px;text-transform:uppercase;letter-spacing:.05em;}
#settingsPanel.settings-v22 .settings-footer{padding:9px 16px 10px;gap:5px;}
#settingsPanel.settings-v22 .settings-footer button{min-height:31px;font-size:11px;}
#settingsPanel.settings-v22 #settingsSaveStatus{font-size:8px;}
#settingsPanel.settings-v22 .mapping-details{display:flex;flex-direction:column;margin-top:8px;padding-top:12px;border-top:1px solid #ffffff0c;}`);

// ── styles/mobile/32-settings-skin.css ──
window.Aurora.addStyle(31, `
@media(max-width:480px){
 #settingsPanel.settings-v22 .settings-nav{padding-left:9px;padding-right:9px;gap:3px;}
 #settingsPanel.settings-v22 .settings-nav-item{font-size:12px;padding:0 3px;}
 #settingsPanel.settings-v22 .settings-tools{padding:7px 10px;}
 #settingsPanel.settings-v22 .settings-subnavs{padding:0 10px 8px;}
 #settingsPanel.settings-v22 .settings-subnav-item{font-size:11px;padding:5px 7px;}
 #settingsPanel.settings-v22 .settings-content{padding-left:17px;padding-right:17px;}
}
@media(max-height:550px){
 #settingsPanel.settings-v22,#app:not(.playlist-closed) #settingsPanel.settings-v22{top:12px;height:calc(100% - 24px);max-height:calc(100% - 24px);}
 #settingsPanel.settings-v22 .settings-header{min-height:30px;height:30px;padding-top:3px;padding-bottom:3px;}
 #settingsPanel.settings-v22 .settings-nav{grid-template-rows:repeat(2,30px);padding-bottom:6px;}
 #settingsPanel.settings-v22 .settings-nav-item{min-height:30px;font-size:12px;}
}`);

// ── styles/ui/34-player-chrome.css ──
window.Aurora.addStyle(33, `
#timelineIslandExtension{
  border-left-color: rgba(255,255,255,.28);
  border-right-color: rgba(255,255,255,.28);
}
#controlBar .ctrl-btn, #controlBar .volume-icon-btn{
  color: #ffffff;
  opacity: 1;
  transition: background .15s ease, transform .15s ease, box-shadow .15s ease;
}
#controlBar .bar-track-info strong, .live-stats-cell .lsc-val{
  color: #ffffff;
}
#controlBar #timeLabel, #timelineTimeLabel{ color: #eef0f6; }
#controlBar .bar-track-info span, .live-stats-cell .lsc-lbl{
  color: #dce0ea;
}
#controlBar .bar-track-info-heart-badge{ color: #ffffff; }
#controlBar .ctrl-btn:focus-visible,
#controlBar .volume-icon-btn:focus-visible,
#controlBar .bar-track-info-heart-badge:focus-visible{
  outline: 2px solid #ffffff;
  outline-offset: 3px;
}

#settingsPanel:not(.advanced-enabled) [data-advanced]{display:none!important;}
#settingsPanel [data-advanced]{--text:#bfc3d0;--text-dim:#9ba1b3;color:#bfc3d0;}
#settingsPanel [data-advanced] .range-label-row span,
#settingsPanel [data-advanced] .toggle-row>span,
#settingsPanel [data-advanced] h3{color:#bfc3d0;}
.settings-advanced{flex:none;border:1px solid #ffffff38;border-radius:10px;padding:8px 12px;background:#ffffff08;color:#dce0ea;cursor:pointer;}
.settings-advanced[aria-pressed="true"]{background:#ffffff20;border-color:#ffffff80;color:#fff;}
.settings-advanced:focus-visible{outline:2px solid white;outline-offset:2px;}

/* Centered settings layout. Search/navigation stay fixed; only content scrolls. */
#settingsPanel.settings-v22,
#app:not(.playlist-closed) #settingsPanel.settings-v22{
 position:fixed;left:50%;top:50%;right:auto;bottom:auto;
 width:min(960px,calc(100vw - 64px));height:min(800px,calc(100dvh - 80px));
 max-height:calc(100dvh - 80px);transform:translate(-50%,-50%);
 animation:none;
}
#settingsPanel.settings-v22 .settings-header{
 position:relative;height:auto;min-height:72px;padding:16px 22px;gap:12px;
 border-bottom:1px solid #292a34;
}
#settingsPanel.settings-v22 #settingsTitle{
 position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;
 clip-path:inset(50%);white-space:nowrap;
}
#settingsPanel.settings-v22 .settings-header .settings-tools{
 flex:1;min-width:0;padding:0;border:0;gap:10px;
}
#settingsPanel.settings-v22 .settings-search-wrap{flex:1;min-width:0;width:auto;height:40px;}
#settingsPanel.settings-v22 #settingsSearch{height:38px;font-size:14px;}
#settingsPanel.settings-v22 .settings-close{flex:none;width:32px;height:32px;}
#settingsPanel.settings-v22 .settings-nav{
 width:100%;grid-template-columns:repeat(6,minmax(0,1fr));grid-template-rows:auto;
 padding:16px 22px;gap:8px;border-right:0;
}
#settingsPanel.settings-v22 .settings-nav-item{min-height:40px;font-size:14px;}
#settingsPanel.settings-v22 .settings-subnavs{padding:12px 22px;}
#settingsPanel.settings-v22 .settings-subnav{gap:8px;}
#settingsPanel.settings-v22 .settings-subnav-item{flex:0 1 auto;min-height:34px;padding:7px 16px;}
#settingsPanel.settings-v22 .settings-content{padding:0 28px 16px;overflow-y:auto;overscroll-behavior:contain;}
#settingsPanel.settings-v22 .settings-footer{padding:12px 22px;}`);

// ── styles/mobile/35-player-chrome.css ──
window.Aurora.addStyle(34, `
@media(max-width:760px){
 #settingsPanel.settings-v22,#app:not(.playlist-closed) #settingsPanel.settings-v22{
  width:calc(100vw - 32px);height:calc(100dvh - 48px);max-height:calc(100dvh - 48px);
 }
 #settingsPanel.settings-v22 .settings-nav{grid-template-columns:repeat(3,minmax(0,1fr));padding:12px 16px;gap:6px;}
 #settingsPanel.settings-v22 .settings-header{padding:12px 16px;gap:8px;min-height:64px;}
 #settingsPanel.settings-v22 .settings-subnavs{padding:10px 16px;}
 #settingsPanel.settings-v22 .settings-subnav-item{flex:1 1 auto;padding:6px 10px;}
 #settingsPanel.settings-v22 .settings-content{padding:0 18px 12px;}
 #settingsPanel.settings-v22 .settings-search-wrap kbd{display:none;}
}
@media(max-height:600px){
 #settingsPanel.settings-v22,#app:not(.playlist-closed) #settingsPanel.settings-v22{
  height:calc(100dvh - 24px);max-height:calc(100dvh - 24px);
 }
 #settingsPanel.settings-v22 .settings-header{min-height:54px;padding-top:8px;padding-bottom:8px;}
 #settingsPanel.settings-v22 .settings-nav{padding-top:8px;padding-bottom:8px;}
 #settingsPanel.settings-v22 .settings-nav-item{min-height:32px;}
 #settingsPanel.settings-v22 .settings-subnavs{padding-top:8px;padding-bottom:8px;}
}`);

// ── styles/ui/36-player-chrome.css ──
window.Aurora.addStyle(35, `

#settingsPanel.settings-v22 .settings-drag-grip{flex:none;width:24px;padding:0;border:0;background:transparent;color:#9697a8;font-size:24px;cursor:grab;touch-action:none;}
#settingsPanel.settings-v22 .settings-drag-grip:active{cursor:grabbing;}
#settingsPanel.settings-v22 .settings-resize-edge{position:absolute;left:22px;right:22px;height:9px;z-index:5;cursor:ns-resize;touch-action:none;}
#settingsPanel.settings-v22 .settings-resize-edge.top{top:0;}
#settingsPanel.settings-v22 .settings-resize-edge.bottom{bottom:0;}
#settingsPanel.settings-v22 .settings-resize-edge::after{content:'';position:absolute;left:calc(50% - 24px);width:48px;height:2px;top:3px;border-radius:2px;background:#ffffff20;}
#settingsPanel.settings-v22 .settings-resize-edge:hover::after{background:#ffffff80;}
#settingsPanel.settings-v22 .settings-resize-edge:focus-visible,#settingsPanel.settings-v22 .settings-drag-grip:focus-visible{outline:2px solid #d86dcf;outline-offset:-2px;}
#settingsPanel.settings-v22.window-adjusting{user-select:none;}

#controlBar,#timelineIsland,.live-stats-side{border-color:color-mix(in srgb,var(--ui-outline-color,#fff) var(--ui-outline-opacity,100%),transparent);border-width:var(--ui-outline-width,1px);}
#timelineIslandExtension{border-left-color:color-mix(in srgb,var(--ui-outline-color,#fff) var(--ui-outline-opacity,100%),transparent);border-right-color:color-mix(in srgb,var(--ui-outline-color,#fff) var(--ui-outline-opacity,100%),transparent);border-left-width:var(--ui-outline-width,1px);border-right-width:var(--ui-outline-width,1px);}

#settingsPanel .outline-picker{display:grid;grid-template-columns:40px minmax(100px,160px);gap:12px;align-items:center;margin-top:10px;}
#uiOutlineSwatch{width:40px;height:36px;border:1px solid #ffffff40;border-radius:9px;}
#settingsPanel #uiOutlineColor{width:100%;box-sizing:border-box;border:1px solid #ffffff25;border-radius:9px;background:#ffffff08;color:#fff;padding:9px 12px;font:13px var(--mono);}
#settingsPanel #uiOutlineColor[aria-invalid="true"]{border-color:#ed7488;}
#settingsPanel .outline-picker-sliders{grid-column:1/-1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px 24px;}
#settingsPanel .outline-picker-sliders label{color:#bfc3d0;font-size:12px;display:flex;flex-direction:column;gap:8px;}
#settingsPanel .outline-picker{grid-template-columns:40px minmax(100px,1fr);}
#settingsPanel #uiMotionEnabled{appearance:none;width:34px;height:20px;border-radius:20px;background:#ffffff25;position:relative;cursor:pointer;flex:none;}
#settingsPanel #uiMotionEnabled::after{content:'';position:absolute;top:3px;left:3px;width:14px;height:14px;background:white;border-radius:50%;transition:transform .15s;}
#settingsPanel #uiMotionEnabled:checked{background:#d12dd3;}
#settingsPanel #uiMotionEnabled:checked::after{transform:translateX(14px);}
#stage.dragover::after{pointer-events:none;}

/* Compact native color picker, styled to match the settings controls. */
#settingsPanel #uiOutlineColor{appearance:none;-webkit-appearance:none;display:block;width:56px;height:34px;padding:5px;border:1px solid #ffffff30;border-radius:9px;background:#ffffff08;cursor:pointer;}
#settingsPanel #uiOutlineColor::-webkit-color-swatch-wrapper{padding:0;}
#settingsPanel #uiOutlineColor::-webkit-color-swatch{border:0;border-radius:5px;}
#settingsPanel #uiOutlineColor::-moz-color-swatch{border:0;border-radius:5px;}
#settingsPanel #uiOutlineColor:hover{border-color:#ffffff70;}
#settingsPanel #uiOutlineColor:focus-visible{outline:2px solid #d86dcf;outline-offset:3px;}

/* Playlist uses the Control Island glass material with independent appearance controls. */
#app #playlistPanel{
 background:rgba(20,21,30,var(--playlistAlpha,.32));
 backdrop-filter:blur(var(--playlistBlur,1px)) saturate(190%);
 -webkit-backdrop-filter:blur(var(--playlistBlur,1px)) saturate(190%);
 border-radius:var(--playlistRadius,22px);
 border:var(--playlistOutlineWidth,1px) solid color-mix(in srgb,var(--ui-outline-color,#fff) var(--playlistOutlineOpacity,28%),transparent);
 box-shadow:0 20px 50px -14px rgba(0,0,0,.6),0 1px 0 rgba(255,255,255,.04) inset;
}

/* Compositor-friendly panel motion and interaction feedback. */
:root{--motion-duration:220ms;--hoverGlowStrength:.35;}
#app #playlistPanel{transition:transform var(--motion-duration) cubic-bezier(.2,.75,.2,1),opacity var(--motion-duration) ease;}
#app.playlist-closed #playlistPanel{opacity:0;pointer-events:none;}
#app #controlBar,#app #timelineIsland,#app #timelineIslandExtension{transition:transform var(--motion-duration) cubic-bezier(.2,.75,.2,1);}
.playlist-sort{display:flex;gap:10px;padding:0 20px 12px;flex-shrink:0;}
.playlist-sort .range-row{flex:1;min-width:0;margin:0;}
.playlist-sort .range-label-row{font-size:11px;margin-bottom:5px;}
.playlist-sort select{width:100%;min-width:0;border:1px solid #ffffff24;border-radius:12px;padding:8px;background:#171820;color:#e9e9ef;font:inherit;font-size:11px;}
body.settings-glass #app #settingsPanel.settings-v22{background:rgba(20,21,30,var(--settingsAlpha,.72));backdrop-filter:blur(var(--settingsBlur,12px)) saturate(190%);-webkit-backdrop-filter:blur(var(--settingsBlur,12px)) saturate(190%);border-radius:var(--settingsRadius,22px);border:var(--settingsOutlineWidth,1px) solid color-mix(in srgb,var(--ui-outline-color,#fff) var(--settingsOutlineOpacity,28%),transparent);box-shadow:0 20px 50px -14px #0009,0 1px 0 #ffffff0a inset;}
body.settings-glass #settingsPanel :is(.settings-header,.settings-body,.settings-content,.settings-footer,.settings-nav,.settings-subnav,.settings-subnavs){background:transparent;}
body :is(button,.icon-btn,.switch,.ctrl-chip,.live-stats-side){transition:background-color var(--motion-duration) ease,box-shadow var(--motion-duration) ease,border-color var(--motion-duration) ease,opacity var(--motion-duration) ease;}
body.hover-glow :is(button:focus-visible,.switch:focus-visible){box-shadow:0 0 22px rgba(205,105,240,var(--hoverGlowStrength)),inset 0 0 0 1px #efd6ff88;}
@media(hover:hover){
 body[data-island-hover="clear"] #app :is(.ctrl-chip,.live-stats-side):hover{background:transparent!important;}
 body button:active,body .icon-btn:active{scale:.95;}
 body button,.icon-btn{transition:scale var(--motion-duration),background-color var(--motion-duration),box-shadow var(--motion-duration),border-color var(--motion-duration);}
}
#app .live-stats-side{transition:transform var(--motion-duration) ease,opacity var(--motion-duration) ease,background-color var(--motion-duration) ease,box-shadow var(--motion-duration) ease;}
body.live-auto.live-idle #app .live-stats-side{transform:translateY(35px);opacity:0;pointer-events:none;}
body.motion-off #app :is(#playlistPanel,#controlBar,#timelineIsland,#timelineIslandExtension,.live-stats-side,button,.icon-btn,.switch,.ctrl-chip){transition:none!important;}


`);


// Unified glass controls and motion. Kept after legacy skins to prevent overrides.
window.Aurora.addStyle(36, `
.pointer-outline-glow{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:10000;}
.playlist-sort{align-items:flex-end;padding:14px 20px 16px;gap:10px;}
.playlist-sort .range-row{position:relative;}
.playlist-sort .range-row[hidden],.playlist-sort select[hidden]{display:none;}
.playlist-sort .range-label-row{padding-left:3px;margin-bottom:8px;}
.playlist-sort-button,.playlist-sort-direction{min-height:38px;border:1px solid #ffffff20;border-radius:12px;background:#ffffff06;color:var(--text);font:500 12px var(--font-body);cursor:pointer;}
.playlist-sort-button{width:100%;padding:9px 13px;text-align:left;}
.playlist-sort-direction{display:grid;place-items:center;flex:0 0 38px;padding:0;}
.playlist-sort-direction svg{transition:transform var(--motion-duration) ease;}
.playlist-sort-direction.descending svg{transform:rotate(180deg);}
.playlist-sort :is(button:hover,button:focus-visible){background:#ffffff10;border-color:#ffffff45;}
.playlist-sort-menu{position:absolute;top:calc(100% + 7px);left:0;right:0;z-index:30;padding:6px;display:flex;flex-direction:column;gap:3px;border:1px solid #ffffff26;border-radius:14px;background:rgba(24,24,34,.92);backdrop-filter:blur(16px);box-shadow:0 12px 32px #0005;opacity:0;visibility:hidden;translate:0 -8px;transition:opacity var(--motion-duration),translate var(--motion-duration),visibility var(--motion-duration);}
.playlist-sort-menu.is-open{opacity:1;visibility:visible;translate:0 0;}
.playlist-sort-menu button{border:1px solid transparent;border-radius:9px;padding:10px 11px;text-align:left;background:transparent;color:var(--text);font:inherit;font-size:12px;cursor:pointer;}
.playlist-sort-menu button[aria-checked="true"]{background:#bb60cc25;border-color:#cb7adb45;}
body[data-island-hover="light"] #app :is(.ctrl-chip,.live-stats-side):hover{background:rgba(255,255,255,.16)!important;}
body[data-island-hover="glow"] #app :is(.ctrl-chip,.live-stats-side):hover{background:rgba(190,130,230,.10)!important;box-shadow:inset 0 0 16px #d694f522;}
body[data-island-hover="none"]:not(.ctrl-chips-off) #app .ctrl-chip:hover{background:rgba(8,9,14,var(--ctrl-chip-alpha,.38));}
#app #barTrackInfo{min-width:0;}
#app #barTrackInfo[data-text-align="right"]>:is(#barTitle,#barArtist){text-align:right;}
#app #barTrackInfo[data-text-align="left"]>:is(#barTitle,#barArtist){text-align:left;}
#app #controlsRow>#barTrackInfo[data-width-mode="content"]{flex:0 1 auto;width:max-content;min-width:0;max-width:100%;margin-left:auto;}
#app #controlsRow>#barTrackInfo[data-width-mode="fill"]{flex:1 1 180px;width:auto;min-width:0;margin-left:0;}
#app #barTrackInfo.liked{border-color:#ff1f4d;box-shadow:0 0 0 1.5px #ff1f4d,0 0 calc(12px + 20px * var(--favorite-pulse,.5)) rgba(255,31,77,var(--favorite-pulse,.5));}
#app #barTrackInfo.liked-outline-hover-only.liked:not(:hover):not(:focus-within){box-shadow:none;border-color:transparent;}
#app #barTrackInfo.liked:hover,#app #barTrackInfo.liked:focus-within{box-shadow:0 0 0 1.5px #ff1f4d,0 0 calc(12px + 20px * var(--favorite-pulse,.5)) rgba(255,31,77,var(--favorite-pulse,.5));}
/* Page navigation owns its animation in JS. Nested rows must not also fade,
   delay display changes or carry translated positions into the next page. */
#app :is(.settings-page,.settings-tabpanel,.settings-subnav,.settings-results,.setting-block,.settings-content .range-row,.settings-content .toggle-row){transition:none;}
#app :is(.track-meta,#trackInfoPopover,#stageTrackInfoPopover){transition:opacity var(--motion-duration) ease,transform var(--motion-duration) ease;}
#app .live-stats-side{transition:opacity var(--motion-duration) ease,transform var(--motion-duration) ease,visibility var(--motion-duration),background-color var(--motion-duration) ease;}
#app #controlBar:not(.stats-inside) .live-stats-side{display:flex;}
#app #controlBar:not(.stats-inside) .live-stats-side:not(.show){opacity:0;visibility:hidden;transform:translateY(24px);pointer-events:none;}
body.live-auto.live-idle #app .live-stats-side{opacity:0;visibility:hidden;transform:translateY(24px);pointer-events:none;}
#app #barTrackInfo{transition:background-color var(--motion-duration) ease;}
body.motion-off #app *,body.motion-off .playlist-sort-menu{transition-duration:0s!important;animation-duration:0s!important;}

`);

window.Aurora.addStyle(37, `
/* Explicit panel paths: retain the surface throughout its exit transition. */
#app #playlistPanel{transform:translateX(0);opacity:1;visibility:visible;transition:transform var(--playlistMotion,320ms) cubic-bezier(.22,.8,.22,1),visibility var(--playlistMotion,320ms);}
#app.playlist-closed #playlistPanel{transform:translateX(calc(100% + 48px));opacity:1;visibility:hidden;pointer-events:none;}
#app #controlBar .live-stats-side{display:flex!important;opacity:1;visibility:visible;transform:translateY(0);transition:transform var(--liveMotion,320ms) cubic-bezier(.22,.8,.22,1),visibility var(--liveMotion,320ms),background-color var(--motion-duration);}
#app #controlBar .live-stats-side:not(.show),body.live-auto.live-idle #app #controlBar .live-stats-side{opacity:1;transform:translateY(calc(var(--control-bar-h,96px) + var(--player-bottom,22px) + 100%));visibility:hidden;pointer-events:none;}
#app #controlBar.stats-inside #liveStatsDock{max-height:120px;overflow:clip;transition:max-height var(--liveMotion,320ms),padding var(--liveMotion,320ms);}
#app #controlBar.stats-inside #liveStatsDock:not(:has(.show)){display:flex;max-height:0;padding-top:0;padding-bottom:0;}
#app #settingsPanel.settings-v22{transform-origin:center center;animation:none;transition:none;}
.playlist-sort-menu{transition-duration:var(--menuMotion,320ms);}
#app select.aurora-select-source{display:none!important;}
.aurora-select-button{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;min-width:0;min-height:36px;padding:9px 12px;border:1px solid #ffffff26;border-radius:11px;background:#ffffff08;color:var(--text,#eee);font:inherit;font-size:12px;text-align:left;cursor:pointer;}
.aurora-select-button>span{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}
.aurora-select-button::after{content:'⌄';flex:none;color:var(--text-dim,#bbb);}
.aurora-select-button:hover,.aurora-select-button[aria-expanded="true"]{background:#ffffff12;border-color:#ffffff48;}
.aurora-select-button:focus-visible{outline:2px solid var(--player-c1,#d67fe8);outline-offset:2px;}
.aurora-select-button:disabled{opacity:.45;cursor:default;}
.aurora-select-menu{position:fixed;z-index:20000;box-sizing:border-box;margin:0;padding:6px;overflow:auto;border:1px solid #ffffff30;border-radius:14px;background:rgba(24,24,34,.94);backdrop-filter:blur(18px);color:var(--text,#eee);box-shadow:0 14px 40px #0006;visibility:hidden;opacity:0;transform:translateY(-7px);transition:opacity var(--menuMotion,320ms),transform var(--menuMotion,320ms),visibility var(--menuMotion,320ms);}
.aurora-select-menu.is-open{visibility:visible;opacity:1;transform:translateY(0);}
.aurora-select-menu button{display:block;width:100%;padding:10px 12px;border:1px solid transparent;border-radius:9px;background:transparent;color:inherit;font:inherit;font-size:12px;text-align:left;cursor:pointer;}
.aurora-select-menu button:hover,.aurora-select-menu button:focus-visible{background:#ffffff12;outline:none;border-color:#ffffff30;}
.aurora-select-menu button[aria-selected="true"]{background:color-mix(in srgb,var(--player-c1,#d67fe8) 18%,transparent);border-color:color-mix(in srgb,var(--player-c1,#d67fe8) 40%,transparent);}
.aurora-select-menu button:disabled{opacity:.4;cursor:default;}
#settingsPanel input[type="checkbox"]{accent-color:var(--player-c1,#d67fe8);}
body.motion-off .aurora-select-menu{transition:none;}
`);

window.Aurora.addStyle(45, `
/* Shared controls retain the Aurora palette in static and dynamic editors. */
#settingsPanel{--editor-border:#ffffff26;--editor-fill:#ffffff08;--editor-hover:#ffffff12;--editor-radius:11px;}
#settingsPanel.settings-v22 .setting-block{display:flex;flex-direction:column;gap:16px;padding:24px 0!important;}
#settingsPanel.settings-v22 .setting-block h3{margin:0;white-space:normal;overflow:visible;}
#settingsPanel :is(.range-row,.toggle-row){margin:0!important;}
#settingsPanel .range-row{display:flex;flex-direction:column;gap:8px;min-width:0;}
#settingsPanel .range-row>input[type=range]{margin:0;flex:none;}
#settingsPanel :is(.range-hint,.hint){margin:0!important;font-size:12px!important;line-height:1.55!important;color:var(--text-dim);}
#settingsPanel :is(.toggle-row,.range-row,h3)+:is(.range-hint,.hint){margin-top:-8px!important;}
#settingsPanel :is(.toggle-row>span,.range-label-row>span){white-space:normal;overflow:visible;line-height:1.5;}
#settingsPanel .range-label-row{align-items:baseline;gap:12px;}
#settingsPanel .range-label-row strong{flex:none;}
#settingsPanel .setting-subhead{margin:8px 0 0!important;white-space:normal;}
#settingsPanel.settings-v22 .settings-detail-content{display:flex;flex-direction:column;gap:16px;margin:8px 0 0;padding-top:20px;}
#settingsPanel .profile-stat-row,#settingsPanel .export-import-row{margin:0;}
#settingsPanel .bg-layer-card{padding:16px;}
#settingsPanel .bg-layer-gear-panel{gap:20px;padding-top:20px;}
#settingsPanel .layer-section-content{display:flex;flex-direction:column;gap:16px;min-width:0;}
#settingsPanel .layer-section-content>.setting-subhead:first-child{margin:0!important;}
#settingsPanel .layer-control-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px 24px;align-items:start;}
#settingsPanel .layer-settings-section{border-top:1px solid var(--editor-border);padding-top:16px;}
#settingsPanel .layer-settings-section>summary{cursor:pointer;font:600 13px var(--font-body);color:var(--text);line-height:1.5;}
#settingsPanel .layer-settings-section[open]>.layer-section-content{padding-top:16px;}
#settingsPanel .bg-layer-shape-grid{grid-template-columns:repeat(auto-fit,minmax(105px,1fr));gap:8px;}
#settingsPanel .bg-layer-shape-tile{aspect-ratio:auto;min-height:42px;padding:8px;gap:8px;color:var(--text-dim);font:500 11px var(--font-body);transition:background-color 160ms,border-color 160ms;}
#settingsPanel .bg-layer-shape-tile svg{flex:none;}
#settingsPanel .bg-layer-shape-tile.active{color:var(--text);}
#settingsPanel :is([data-layer-path-row],[data-layer-trail-detail],[data-layer-beatcut-detail]){display:flex;flex-direction:column;gap:16px;}
#settingsPanel .bg-layer-override-block{margin:0!important;padding:14px!important;}
#settingsPanel [data-layer-override-list]{display:flex;flex-direction:column;gap:12px;}
@media(max-width:600px){#settingsPanel .layer-control-grid{grid-template-columns:1fr;}#settingsPanel .bg-layer-card{padding:12px;}#settingsPanel .bg-layer-head{flex-wrap:wrap;}#settingsPanel .bg-layer-title{flex:1;min-width:90px;}#settingsPanel .bg-layer-head-actions{margin-left:auto;}#settingsPanel .bg-layer-shape-grid{grid-template-columns:repeat(3,minmax(0,1fr));}#settingsPanel .bg-layer-shape-tile{flex-direction:column;min-height:58px;font-size:10px;}}
#settingsPanel .settings-action{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:38px;max-width:100%;padding:9px 14px;border:1px solid var(--editor-border);border-radius:var(--editor-radius);background:var(--editor-fill);color:var(--text);font:600 12px var(--font-body);line-height:1.4;text-align:center;white-space:normal;cursor:pointer;box-shadow:none;filter:none;transition:background-color 160ms,border-color 160ms,color 160ms;}
#settingsPanel .settings-action:hover{background:var(--editor-hover);border-color:#ffffff48;transform:none;box-shadow:none;filter:none;}
#settingsPanel .settings-action:disabled{opacity:.45;cursor:default;}
#settingsPanel .settings-action:disabled:hover{background:var(--editor-fill);border-color:var(--editor-border);}
#settingsPanel .settings-action[hidden]{display:none!important;}
#settingsPanel .settings-action svg{width:16px;height:16px;flex:none;}
#settingsPanel .settings-action-wide{width:100%;}
#settingsPanel .settings-action-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px;}
#settingsPanel .settings-action-status{margin-top:12px;}
#settingsPanel .settings-action-status:empty{display:none;}
#settingsPanel .export-import-row{flex-wrap:wrap;}
#settingsPanel .export-import-row .settings-action{flex:1 1 140px;}
#settingsPanel :is(.curve-action-btn,.bg-layer-gear-btn,.aurora-select-button){border-color:var(--editor-border);border-radius:var(--editor-radius);background:var(--editor-fill);color:var(--text);}
#settingsPanel .bg-layer-gear-btn{padding:0;}
#settingsPanel .bg-layer-gear-btn:disabled{opacity:.4;cursor:default;}
#settingsSaveStatus[data-save-error]{color:#ff6b84;}
#settingsPanel :is(.curve-action-btn,.bg-layer-gear-btn,.aurora-select-button):hover{border-color:color-mix(in srgb,var(--player-c1) 45%,transparent);background:var(--editor-hover);}
#settingsPanel :is(.curve-action-btn,.bg-layer-gear-btn).active{background:color-mix(in srgb,var(--player-c1) 18%,transparent);border-color:color-mix(in srgb,var(--player-c1) 45%,transparent);}
#settingsPanel :is(input[type=text],input[type=number]){color:var(--text);background:var(--editor-fill);border:1px solid var(--editor-border);border-radius:var(--editor-radius);}
#settingsPanel :is(button,input,.switch,[tabindex]):focus-visible,.playlist-sort button:focus-visible{outline:2px solid var(--player-c1,#d67fe8);outline-offset:3px;}
.aurora-select-button[hidden]{display:none!important;}
.aurora-select-menu button[aria-selected=true],.playlist-sort-menu button[aria-checked=true]{background:color-mix(in srgb,var(--player-c1,#d67fe8) 18%,transparent);border-color:color-mix(in srgb,var(--player-c1,#d67fe8) 40%,transparent);}
.curve-editor-svg-wrap{touch-action:none;}
`);

window.Aurora.addStyle(47, `
/* A right drawer replaces the sidebar only when width is limited. */
#playlistBackdrop{position:fixed;inset:0;z-index:39;border:0;background:#0005;backdrop-filter:none;cursor:default;}
#playlistBackdrop[hidden]{display:none;}
#playlistEdgeHandle,.playlist-drawer-close{display:none;}
#app.compact-player{--player-reserve:0px;--player-bottom:12px;}
#app.compact-player:not(.playlist-closed){--player-reserve:0px;}
#app .stage-tools{right:30px;}
#app:not(.playlist-closed) .stage-tools{right:calc(var(--player-reserve) + 30px);}
#app.compact-player .stage-tools,#app.compact-player:not(.playlist-closed) .stage-tools{position:fixed;top:max(12px,env(safe-area-inset-top));right:max(12px,env(safe-area-inset-right));transition:none;}
#app.compact-player #playlistPanel{position:fixed;right:max(8px,env(safe-area-inset-right));left:auto;top:max(8px,env(safe-area-inset-top));bottom:max(8px,env(safe-area-inset-bottom));width:min(380px,calc(100vw - 48px));max-width:none;z-index:40;transform:translateX(0);touch-action:pan-y;}
#app.compact-player.playlist-closed #playlistPanel{transform:translateX(calc(100% + 24px));opacity:0;pointer-events:none;}
#app.compact-player #playlistEdgeHandle{display:grid;place-items:center;position:fixed;right:0;left:auto;top:45%;width:24px;height:72px;z-index:38;padding:0;border:1px solid var(--editor-border,#ffffff26);border-right:0;border-radius:12px 0 0 12px;background:#17182088;color:var(--text);font-size:26px;touch-action:none;cursor:pointer;}
#app.compact-player:not(.playlist-closed) #playlistEdgeHandle{visibility:hidden;}
#app.compact-player .playlist-drawer-close{display:grid;place-items:center;width:32px;height:32px;flex:none;padding:0;border:1px solid #ffffff26;border-radius:10px;background:#ffffff08;color:var(--text);font-size:22px;cursor:pointer;}
#app.compact-player .playlist-header-top{gap:10px;}
#app.compact-player .playlist-header-top .playlist-count{margin-left:auto;}
/* Four readings share one compact row, instead of two bulky cards. */
#app #controlBar.stats-inside #liveStatsDock{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0;max-height:52px;padding:8px 12px 0;}
#app #controlBar.stats-inside #liveStatsDock .live-stats-side{display:contents!important;}
#app #controlBar.stats-inside #liveStatsDock .live-stats-side:not(.show){display:none!important;}
#app #controlBar.stats-inside #liveStatsDock .live-stats-cell{display:grid;grid-template-columns:auto 1fr;gap:3px 6px;width:auto;max-width:none;padding:3px 8px;min-width:0;border-right:1px solid #ffffff14;}
#app #controlBar.stats-inside .live-stats-cell::before{display:none;}
#app #controlBar.stats-inside .live-stats-cell[data-key=bass]{order:1;}
#app #controlBar.stats-inside .live-stats-cell[data-key=mid]{order:2;}
#app #controlBar.stats-inside .live-stats-cell[data-key=high]{order:3;}
#app #controlBar.stats-inside #liveStatsDock .live-stats-cell[data-key=loudnessPct]{order:4;border:0;}
#app #controlBar.stats-inside .live-stats-cell .lsc-lbl{font-size:9px;letter-spacing:0;text-align:left;}
#app #controlBar.stats-inside .live-stats-cell .lsc-val{font-size:11px;text-align:right;min-width:0;}
#app #controlBar.stats-inside .live-stats-cell .lsc-bar-bg{grid-column:1/-1;height:2px;}
body.live-auto.live-idle #app #controlBar.stats-inside #liveStatsDock,#app #controlBar.stats-inside #liveStatsDock:not(:has(.show)){max-height:0;padding-top:0;padding-bottom:0;visibility:hidden;}
@media(max-width:480px){#app #controlBar.stats-inside #liveStatsDock{padding:6px 6px 0;}#app #controlBar.stats-inside #liveStatsDock .live-stats-cell{padding:3px 5px;grid-template-columns:1fr;gap:2px;}#app #controlBar.stats-inside .live-stats-cell .lsc-lbl,#app #controlBar.stats-inside .live-stats-cell .lsc-val{text-align:center;}}
@media(max-width:600px){#visualizerDock{position:fixed;top:74px;bottom:auto;left:50%;transform:translateX(-50%);max-width:calc(100vw - 24px);box-sizing:border-box;}#app .track-meta{top:152px;left:16px;max-width:calc(100vw - 32px);}#stageTrackInfoPopover{max-height:calc(100dvh - 190px);overflow:auto;}#emptyState{max-width:calc(100vw - 32px);}#emptyState .import-row{flex-wrap:wrap;justify-content:center;}}
`);

window.Aurora.addStyle(48, `
@media(max-width:600px){
 #app{--player-width:calc(100% - 24px);--player-bottom:max(12px,env(safe-area-inset-bottom));}
 #app #controlBar{width:var(--player-width);border-radius:18px;}
 #app #controlsRow{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:6px 8px;padding:8px;overflow:visible;align-items:center;}
 #app #controlsRow>.transport{grid-column:1;grid-row:1;padding:3px;gap:2px;}
 #app #controlsRow>.volume-group{grid-column:2;grid-row:1;justify-self:center;padding:3px;gap:2px;min-width:0;}
 #app #controlsRow>.playback-mode-group{grid-column:3;grid-row:1;padding:3px;gap:2px;}
 #app #controlsRow>.bar-track-info{grid-column:2/4;grid-row:2;width:100%;min-width:0;max-width:100%;min-height:36px;padding:5px 8px;}
 #app #controlsRow>.bar-track-info strong{font-size:11px;line-height:1.4;}
 #app #controlsRow>.bar-track-info span{font-size:10px;line-height:1.4;}
 #app #controlsRow>#timeLabel{grid-column:1;grid-row:2;font-size:10px;padding:5px;justify-self:center;}
 #app #controlsRow .ctrl-btn{width:28px;height:32px;}
 #app #controlsRow .ctrl-btn.big{width:40px;height:40px;}
 #app #controlsRow .ctrl-btn svg{width:16px;height:16px;}
 #app #controlsRow .ctrl-btn.big svg{width:20px;height:20px;}
 #app #controlsRow .volume-icon-btn{width:26px;height:32px;}
 #app #controlsRow .volume-wrap{display:flex;width:48px;min-width:0;}
 #app #controlsRow .playback-mode-btn{width:26px;height:32px;}
 #app #controlsRow .playback-mode-btn svg{width:16px;height:16px;}
 #app .stage-tools{gap:8px;}
 #app .stage-tools .icon-btn{width:36px;height:36px;border-radius:12px;}
 #app .stage-tools .icon-btn svg{width:18px;height:18px;}
 #app #visualizerDock{top:62px;padding:5px;}
 #app #visualizerDock .viz-dock-label{display:none;}
 #app #visualizerDock .viz-dock-buttons button{width:38px;height:36px;}
 #app #visualizerDock .viz-dock-buttons button svg{width:17px;height:17px;}
 #app #visualizerDock .viz-dock-buttons button span{font-size:8px;}
 #app .track-meta{top:116px;}
 #settingsPanel.settings-v22 .settings-header{min-height:50px;padding:8px 12px;}
 #settingsPanel.settings-v22 .settings-search-wrap{height:34px;}
 #settingsPanel.settings-v22 #settingsSearch{height:32px;font-size:12px;}
 #settingsPanel.settings-v22 .settings-nav{padding:8px 12px;gap:5px;}
 #settingsPanel.settings-v22 .settings-nav-item{min-height:30px;padding:5px;font-size:11px;}
 #settingsPanel.settings-v22 .settings-subnavs{padding:8px 12px;}
 #settingsPanel.settings-v22 .settings-subnav-item{min-height:28px;font-size:11px;padding:5px 8px;}
 #settingsPanel.settings-v22 .settings-content{padding:0 14px 12px;}
 #settingsPanel.settings-v22 .setting-block{padding:18px 0!important;gap:14px;}
 #settingsPanel.settings-v22 .settings-secondary-block{padding:0!important;}
 #settingsPanel{--settings-gap:14px;--settings-label-size:12px;}
 #settingsPanel .settings-action{min-height:34px;padding:7px 10px;}
 #settingsPanel.settings-v22 .settings-footer{padding:8px 12px;}
 #app.compact-player .playlist-header{padding:12px;gap:10px;}
 #app.compact-player .playlist-sort{padding:0 12px 10px;}
 #app.compact-player .track-row{padding:8px 10px;gap:8px;}
 #app.compact-player .track-thumb{width:34px;height:34px;flex:0 0 34px;}
 #app.compact-player .track-info strong{font-size:12px;}
 #app.compact-player .track-info small{font-size:10px;}
}
@media(max-width:360px){#app #controlsRow{gap:6px 4px;}#app #controlsRow .volume-wrap{width:36px;}#app #controlsRow>.transport{gap:0;}#app #controlsRow>.playback-mode-group{gap:0;}}
`);

window.Aurora.addStyle(46, `
/* One settings rhythm for static pages, mappings and layer editors. */
#settingsPanel{--settings-gap:16px;--settings-label-size:13px;}
#settingsPanel [hidden]{display:none!important;}
#settingsPanel :is(.settings-section,.layer-settings-section){margin:0;border:0;border-top:1px solid var(--editor-border);padding:0;min-width:0;}
#settingsPanel :is(.settings-section,.layer-settings-section)>summary{display:flex;align-items:center;gap:10px;list-style:none;padding:14px 0;cursor:pointer;color:var(--text);font:600 var(--settings-label-size) var(--font-body);line-height:1.5;}
#settingsPanel summary::-webkit-details-marker{display:none;}
#settingsPanel :is(.settings-section,.layer-settings-section)>summary::before{content:'›';display:inline-block;font-size:20px;line-height:16px;flex:none;transform:rotate(0);transition:transform var(--navigationMotion,180ms);}
#settingsPanel :is(.settings-section,.layer-settings-section)[open]>summary::before{transform:rotate(90deg);}
#settingsPanel :is(.settings-section,.layer-settings-section)>summary:focus-visible{outline:2px solid var(--player-c1);outline-offset:3px;border-radius:6px;}
#settingsPanel :is(.settings-section-content,.layer-section-content,.settings-conditional,.map-body,.map-body>div:not(.map-subrow)){display:flex;flex-direction:column;gap:var(--settings-gap);min-width:0;}
#settingsPanel .settings-section[open]>.settings-section-content{padding:0 0 16px;}
#settingsPanel .layer-settings-section[open]>.layer-section-content{padding:0 0 16px;}
#settingsPanel .settings-conditional{margin:0!important;}
#settingsPanel #playerSyncExceptionsWrap{padding:0!important;border:0!important;background:transparent!important;}
#settingsPanel :is(.toggle-row,.range-row,.map-subrow){gap:8px;}
#settingsPanel .toggle-row{min-height:32px;gap:16px;}
#settingsPanel :is(.toggle-row>span,.range-label-row,.map-subrow-label){font-size:var(--settings-label-size)!important;line-height:1.5;color:var(--text-dim);}
#settingsPanel :is(.toggle-row>span,.map-subrow-label>span){white-space:normal;overflow:visible;text-overflow:clip;font-size:inherit!important;}
#settingsPanel .map-subrow{display:flex;flex-direction:column;margin:0;padding:0;}
#settingsPanel .map-subrow-label{align-items:baseline;margin:0;gap:12px;}
#settingsPanel .map-subrow-label strong{color:var(--text);font:600 12px var(--mono);}
#settingsPanel .map-tempo-sync-detail{display:flex;flex-direction:column;gap:var(--settings-gap);}
#settingsPanel .settings-field-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;}
#settingsPanel .settings-number-field{display:flex;flex-direction:column;justify-content:flex-end;gap:8px;min-width:0;color:var(--text-dim);font-size:var(--settings-label-size);line-height:1.5;}
#settingsPanel .settings-number-field input[type=number]{width:100%;min-width:0;min-height:36px;box-sizing:border-box;}
#settingsPanel .settings-live-readout{padding:12px;border:1px solid var(--editor-border);border-radius:var(--editor-radius);background:var(--editor-fill);}
#settingsPanel .settings-live-readout .map-subrow-label{flex-wrap:wrap;}
#settingsPanel .map-row{padding:0 16px;gap:0;}
#settingsPanel :is(#bgMappingRows,#colorMappingRows){display:flex;flex-direction:column;gap:12px;}
#settingsPanel .map-row+.map-row{margin:0;}
#settingsPanel .map-row>.settings-section{border:0;}
#settingsPanel .map-row-head{gap:10px;}
#settingsPanel .map-row-head .map-title{flex:1;min-width:0;font-size:13px;line-height:1.5;}
#settingsPanel .map-row-head-right{margin-left:auto;gap:12px;}
#settingsPanel .map-row-disabled{opacity:1;}
#settingsPanel .map-row-disabled .map-title,#settingsPanel .map-row-disabled .map-live-val{color:var(--text-dim);}
#settingsPanel.settings-v22 .settings-secondary-block{padding:0!important;border:0;}
#settingsPanel .map-body.map-disabled{opacity:.65;}
#settingsPanel .curve-block{margin:0;padding:0;border:0;}
#settingsPanel .curve-editor-head{justify-content:flex-end;margin:0 0 12px;}
#settingsPanel .curve-editor-actions{flex-wrap:wrap;gap:8px;}
#settingsPanel .map-norm-row{display:grid;grid-template-columns:minmax(0,1fr) 80px minmax(0,1fr) 80px;gap:8px 12px;align-items:center;overflow:visible;padding:0;}
#settingsPanel .map-norm-row>span{white-space:normal;}
#settingsPanel .map-norm-row input[type=number]{width:100%;min-width:0;box-sizing:border-box;min-height:36px;}
#settingsPanel .map-clamp-range-row{display:flex;flex-wrap:wrap;}
#settingsPanel .map-clamp-range-row input[type=number]{width:76px;flex:0 0 76px;}
#settingsPanel :is(.switch,input[type=checkbox],#uiMotionEnabled){appearance:none;-webkit-appearance:none;position:relative;box-sizing:border-box;width:42px;min-width:42px;height:24px;flex:none;margin:0;border:0;border-radius:999px;background:#32333d;box-shadow:none;cursor:pointer;}
#settingsPanel :is(.switch,input[type=checkbox],#uiMotionEnabled)::after{content:'';position:absolute;width:20px;height:20px;top:2px;left:2px;border-radius:50%;background:#fff;box-shadow:0 1px 3px #0003;transform:none;transition:transform var(--navigationMotion,180ms);}
#settingsPanel :is(.switch.on,input[type=checkbox]:checked,#uiMotionEnabled:checked){background:linear-gradient(110deg,#ed29c7,#982ce8);}
#settingsPanel :is(.switch.on,input[type=checkbox]:checked,#uiMotionEnabled:checked)::after{transform:translateX(18px);}
#settingsPanel .custom-color-wrap{gap:12px;margin:0;flex-wrap:wrap;}
#settingsPanel .custom-color-wrap label{font-size:13px;}
#settingsPanel .settings-palette{display:flex;flex-direction:column;gap:12px;margin:0!important;}
#settingsPanel .color-row{margin:0!important;padding:0;gap:10px;flex-wrap:wrap;}
#settingsPanel input[type=color]{box-sizing:border-box;width:56px;height:34px;padding:5px;border:1px solid var(--editor-border);border-radius:var(--editor-radius);background:var(--editor-fill);cursor:pointer;}
#settingsPanel .settings-nav{grid-template-columns:repeat(7,minmax(0,1fr));}
#settingsPanel .settings-nav-item{font-size:13px;min-width:0;}
@media(max-width:760px){#settingsPanel.settings-v22 .settings-nav{grid-template-columns:repeat(4,minmax(0,1fr));}#settingsPanel .map-row{padding:0 12px;}#settingsPanel .map-live-val{font-size:10px;}#settingsPanel .map-row-head-right{gap:8px;}#settingsPanel .map-norm-row{grid-template-columns:minmax(0,1fr) 80px;}}
@media(max-width:420px){#settingsPanel.settings-v22 .settings-nav{grid-template-columns:repeat(3,minmax(0,1fr));}#settingsPanel .map-row-head{flex-wrap:wrap;}#settingsPanel .map-row-head-right{margin-left:26px;width:calc(100% - 26px);justify-content:space-between;}}
`);

window.Aurora.addStyle(38, `
#glowColorSwatches{flex-wrap:wrap;}
#glowColorSwatches .swatch{flex:none;cursor:pointer;}
#ctl-hoverGlowColor{width:112px;min-height:34px;border:1px solid #ffffff30;border-radius:10px;background:#ffffff08;color:var(--text);padding:6px 10px;font:12px var(--mono);}
#ctl-hoverGlowColor[aria-invalid="true"]{border-color:#ff3355;}
`);

window.Aurora.addStyle(39, `
#musicVisualizerCanvas{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;opacity:0;transition:opacity var(--motion-duration);}
#visualizerDock{position:absolute;left:22px;bottom:22px;z-index:8;padding:9px 10px;border:1px solid #ffffff24;border-radius:18px;background:rgba(20,21,30,var(--playlistAlpha,.2));backdrop-filter:blur(14px) saturate(150%);box-shadow:0 8px 28px #0003;}
.viz-dock-label{display:block;margin:0 5px 6px;font:600 9px var(--font-body);letter-spacing:.1em;text-transform:uppercase;color:var(--text-dim);}
.viz-dock-buttons{display:flex;gap:4px;}
.viz-dock-buttons button{display:grid;place-items:center;width:36px;height:32px;border:1px solid transparent;border-radius:10px;background:transparent;color:var(--text-dim);cursor:pointer;font-size:23px;}
.viz-dock-buttons button svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;}
.viz-dock-buttons button:hover{background:#ffffff10;color:var(--text);}
.viz-dock-buttons button.active{background:color-mix(in srgb,var(--player-c1) 18%,transparent);border-color:color-mix(in srgb,var(--player-c1) 45%,transparent);color:var(--text);}
.viz-dock-buttons button:focus-visible{outline:2px solid var(--player-c1);outline-offset:2px;}
@media(max-width:1600px){#visualizerDock{bottom:calc(var(--control-bar-h,96px) + var(--player-bottom,22px) + 20px);left:16px;}}
@media(max-width:600px){#visualizerDock{padding:7px;left:10px;} .viz-dock-buttons button{width:30px;height:28px;} .viz-dock-label{font-size:8px;}}
`);

window.Aurora.addStyle(40, `
#settingsPanel.settings-v22 .settings-nav{grid-template-columns:repeat(7,minmax(0,1fr));grid-template-rows:none;grid-auto-rows:minmax(36px,auto);}
@media(max-width:900px){#settingsPanel.settings-v22 .settings-nav{grid-template-columns:repeat(4,minmax(0,1fr));}}
`);

window.Aurora.addStyle(41, `
#visualizerDock{padding:10px;border-radius:20px;background:linear-gradient(135deg,#ffffff08,#ffffff00),rgba(16,17,25,.6);}
.viz-dock-buttons{gap:5px;}
.viz-dock-buttons button{width:64px;height:54px;display:flex;flex-direction:column;justify-content:center;gap:5px;border-radius:13px;transition:background .18s,border-color .18s,color .18s;}
.viz-dock-buttons button span{font:500 10px var(--font-body);}
.viz-dock-buttons button.active{box-shadow:inset 0 1px 0 #ffffff12,0 3px 14px color-mix(in srgb,var(--player-c1) 12%,transparent);}
@media(max-width:600px){.viz-dock-buttons button{width:42px;height:42px;}.viz-dock-buttons button span{font-size:8px;}#visualizerDock{padding:6px;}}
`);

window.Aurora.addStyle(43, `
#visualizerDock{padding:10px;background:rgba(20,21,30,.55);backdrop-filter:blur(26px) saturate(180%);-webkit-backdrop-filter:blur(26px) saturate(180%);border-style:solid;border-width:var(--ui-outline-width,1px);border-color:color-mix(in srgb,var(--ui-outline-color,#fff) var(--ui-outline-opacity,28%),transparent);border-radius:clamp(0px,var(--ctrl-chip-radius,14px),18px);box-shadow:0 20px 50px -14px #0009,0 1px 0 #ffffff0a inset;}
#visualizerDock .viz-dock-label{margin:0 10px 7px;font-size:9px;letter-spacing:.08em;color:var(--text-dim);}
#visualizerDock .viz-dock-buttons{padding:5px;gap:3px;border-radius:clamp(0px,var(--ctrl-chip-radius,14px),12px);background:rgba(8,9,14,var(--ctrl-chip-alpha,.38));backdrop-filter:blur(var(--ctrl-chip-blur,10px));-webkit-backdrop-filter:blur(var(--ctrl-chip-blur,10px));}
#visualizerDock .viz-dock-buttons button{position:relative;width:58px;height:48px;gap:4px;border:var(--ui-outline-width,1px) solid transparent;border-radius:clamp(0px,calc(var(--ctrl-chip-radius,14px) - 4px),9px);background:transparent;box-shadow:none;color:var(--text-dim);transition:color var(--motion-duration),background var(--motion-duration),border-color var(--motion-duration);}
#visualizerDock .viz-dock-buttons button.active{background:linear-gradient(135deg,color-mix(in srgb,var(--player-c1) 26%,transparent),color-mix(in srgb,var(--player-c2) 18%,transparent));border-color:color-mix(in srgb,var(--ui-outline-color,#fff) var(--ui-outline-opacity,28%),transparent);color:var(--text);}
#visualizerDock .viz-dock-buttons button:hover{color:var(--text);background:rgba(255,255,255,.08);}
#visualizerDock .viz-dock-buttons button span{font:600 10px var(--font-body);}
body.ctrl-chips-off #visualizerDock .viz-dock-buttons{background:transparent;backdrop-filter:none;-webkit-backdrop-filter:none;box-shadow:none;}
@media(max-width:600px){#visualizerDock{padding:6px;}#visualizerDock .viz-dock-buttons{padding:3px;}#visualizerDock .viz-dock-buttons button{width:43px;height:43px;}#visualizerDock .viz-dock-buttons button span{font-size:8px;}}
`);

// Compact desktop: keep sidebar space and wrap controls instead of horizontal scrolling.
window.Aurora.addStyle(44, `
@media(min-width:901px) and (max-width:1100px){
 #app:not(.playlist-closed){--player-reserve:calc(var(--playlist-width) + 24px);}
 #playlistPanel{width:var(--playlist-width);top:12px;right:12px;bottom:12px;}
}
@media(max-width:1600px){
 #visualizerDock{bottom:calc(var(--player-bottom,22px) + var(--control-bar-h,96px) + var(--timeline-island-gap,14px) + var(--timeline-island-h,56px) + 48px);}
}
@container(max-width:620px){
 #controlsRow{flex-wrap:wrap;overflow:visible;justify-content:center;gap:6px;}
 #controlsRow>.bar-track-info{flex:1 1 100%;min-width:0;max-width:100%;box-sizing:border-box;}
 #controlsRow>.bar-track-info strong,#controlsRow>.bar-track-info span{max-width:100%;}
}
body.live-auto.live-idle #app #controlBar.stats-inside #liveStatsDock{max-height:0;padding-top:0;padding-bottom:0;}
`);

// Both desktop and touch use the same left-hand visualizer drawer.
window.Aurora.addStyle(49, `
#app{--visualizer-dock-bottom:calc(var(--player-bottom,22px) + var(--control-bar-h,96px) + var(--timeline-island-gap,14px) + var(--timeline-island-h,56px) + max(52px,calc(var(--timeline-waveform-clearance,0px) + 24px)));}
#app.visualizer-drawer #visualizerDock{left:8px;transform:translateX(calc(-100% - 24px));visibility:hidden;transition:transform var(--menuMotion,320ms) cubic-bezier(.2,.75,.2,1),visibility var(--menuMotion,320ms);touch-action:pan-y;}
#app.visualizer-drawer #visualizerDock.drawer-open{transform:translateX(0);visibility:visible;}
#app.visualizer-drawer #visualizerEdgeHandle{position:fixed;left:0;display:grid;place-items:center;width:24px;height:56px;padding:4px;border:1px solid #ffffff26;border-left:0;border-radius:0 12px 12px 0;background:#17182088;color:var(--text);z-index:8;touch-action:none;cursor:pointer;}
#visualizerEdgeHandle svg{width:16px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;}
#app.visualizer-drawer:has(#visualizerDock.drawer-open) #visualizerEdgeHandle{visibility:hidden;}
@media(min-width:601px){#app.visualizer-drawer #visualizerDock{bottom:var(--visualizer-dock-bottom);}#app.visualizer-drawer #visualizerEdgeHandle{top:auto;bottom:calc(var(--visualizer-dock-bottom) + 20px);}}
@media(max-width:600px){#app.visualizer-drawer #visualizerDock{top:30%;bottom:auto;}#app #timelineTimeLabel{display:none!important;}#app.visualizer-drawer #visualizerEdgeHandle{top:30%;bottom:auto;}}
`);
