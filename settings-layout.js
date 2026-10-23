/* settings-layout.js — Shared disclosures and settings page hierarchy. */
(function(App){
// One delegated tooltip for the whole settings panel. Help stays in the DOM for
// translation, search and aria-describedby; detached editors are held weakly.
App.SettingsHelp = {
  sources:new WeakMap(),sequence:0,
  attach(label,hint,row){
    if(!label||!hint||hint.dataset.settingsHint)return;
    const sources=this.sources.get(label)||[];
    if(!hint.id)hint.id='settings-hint-'+(++this.sequence);
    hint.dataset.settingsHint='true';hint.hidden=true;sources.push(hint);this.sources.set(label,sources);
    label.dataset.settingsHelp='true';label.removeAttribute('title');
    if(!label.matches('summary,button,a,input,select'))label.tabIndex=0;
    const describe=node=>{const ids=new Set((node.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean));ids.add(hint.id);node.setAttribute('aria-describedby',[...ids].join(' '));};
    describe(label);
    row?.querySelectorAll('input,select,.switch').forEach(describe);
  },
  hide(){clearTimeout(this.timer);clearTimeout(this.hideTimer);if(this.tip)this.tip.hidden=true;this.anchor=null;},
  show(label){
    this.hide();
    if(!label?.isConnected||!label.getClientRects().length)return;
    const sources=this.sources.get(label);if(!sources?.length)return;
    this.anchor=label;
    this.tip.replaceChildren(...sources.map(source=>{const p=document.createElement('p');p.textContent=source.textContent.trim();return p;}));
    this.tip.hidden=false;
    const rect=label.getBoundingClientRect(),box=this.tip.getBoundingClientRect(),margin=12;
    const width=document.documentElement.clientWidth,height=window.innerHeight;
    this.tip.style.left=Math.max(margin,Math.min(rect.left,width-box.width-margin))+'px';
    this.tip.style.top=Math.max(margin,Math.min(rect.bottom+8+box.height<=height-margin?rect.bottom+8:rect.top-box.height-8,height-box.height-margin))+'px';
  },
  init(panel){
    if(this.tip)return;
    const tip=this.tip=document.createElement('div');tip.id='settingsHelpTooltip';tip.className='settings-help-tooltip';tip.setAttribute('role','tooltip');tip.hidden=true;document.body.append(tip);
    const target=e=>e.target.closest?.('[data-settings-help]');
    const leave=()=>{clearTimeout(this.timer);this.hideTimer=setTimeout(()=>this.hide(),140);};
    panel.addEventListener('pointerover',e=>{const label=target(e);if(!label||label.contains(e.relatedTarget))return;clearTimeout(this.hideTimer);clearTimeout(this.timer);this.timer=setTimeout(()=>this.show(label),260);});
    panel.addEventListener('pointerout',e=>{const label=target(e);if(label&&!label.contains(e.relatedTarget)&&!tip.contains(e.relatedTarget))leave();});
    panel.addEventListener('focusin',e=>{const label=target(e);if(label)this.show(label);});
    panel.addEventListener('focusout',e=>{if(target(e)&&!tip.contains(e.relatedTarget))leave();});
    panel.addEventListener('click',e=>{const label=target(e);if(label)this.show(label);});
    tip.addEventListener('pointerenter',()=>{clearTimeout(this.hideTimer);clearTimeout(this.timer);});
    tip.addEventListener('pointerleave',leave);
    document.addEventListener('pointerdown',e=>{if(!target(e)&&!tip.contains(e.target))this.hide();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')this.hide();});
    panel.addEventListener('scroll',()=>this.hide(),{capture:true,passive:true});
    window.addEventListener('resize',()=>this.hide(),{passive:true});
  }
};
// Shared native disclosure: DOM remains mounted, preserving values and focus.
App.createSettingsSection = function(title,nodes,key,open=false){
    const section=document.createElement('details'),summary=document.createElement('summary'),content=document.createElement('div');
    section.className='settings-section';section.dataset.settingsSection=key;content.className='settings-section-content';
    summary.textContent=title;section.append(summary,content);content.append(...nodes);
    const states=App._settingsSectionStates||(App._settingsSectionStates=new Map());
    section.open=states.has(key)?states.get(key):open;
    section.addEventListener('toggle',()=>{
      if(!section.isConnected)return;
      states.set(key,section.open);
      if(section.open)for(const svg of section.querySelectorAll('[data-curve-svg]'))App.redrawCurveEditor(svg.dataset.curveSvg,section);
    });
    return section;
  };
App.rememberSettingsSections = function(root){
    const states=App._settingsSectionStates||(App._settingsSectionStates=new Map());
    for(const section of root.querySelectorAll('[data-settings-section]'))states.set(section.dataset.settingsSection,section.open);
  };

  App.addParts("SettingsUI", {
preparePages(){
      const movePage=(id,category)=>App.el('tab-'+category).append(App.el(id));
      const newPage=(id,category)=>{const page=document.createElement('div');page.id=id;page.className='settings-page';App.el('tab-'+category).append(page);return page;};
      movePage('page-appearance-settings','playback');
      movePage('page-appearance-filters','visualizers');
      const rendering=newPage('page-playback-rendering','playback');
      rendering.append(App.el('ctl-renderFps').closest('.setting-block'),App.el('sec-data-performance'));
      for(const key of ['renderFps','vizFps','postDistortFps']){
        const hint=document.createElement('p');hint.className='range-hint';
        hint.textContent='Horní limit snímků za sekundu (až 240). Vyšší hodnota umožní plynulejší pohyb na rychlém displeji a zvýší zátěž. Skutečná frekvence závisí na displeji, prohlížeči a zapnutých efektech; rozlišení ani kvalita se tím nemění.';
        App.el('ctl-'+key).closest('.range-row').append(hint);
      }
      App.el('page-data-performance').remove();
      App.el('page-playback-interface').append(...App.el('page-appearance-animations').children);
      App.el('page-appearance-animations').remove();
      const backgroundColors=newPage('page-background-colors','background');
      backgroundColors.append(App.el('sec-appearance-5'));
      App.el('sec-appearance-3').append(...[...App.el('sec-reactivity-4').children].filter(n=>!n.matches('h3')));
      App.el('page-background-comfort').remove();
      // Text alignment belongs to its track card, beside its visibility toggle.
      const cardText=App.el('ctl-ctrlTrackAlign').closest('.setting-block');
      cardText.querySelector('h3').remove();App.el('sec-cards-2').append(...cardText.children);cardText.remove();
      // On-screen readings are player controls; the full analyzer stays under Audio.
      const values=document.createElement('div');values.className='setting-block';values.id='sec-player-values';
      const heading=document.createElement('h3');heading.textContent='MusicSense · živé hodnoty na obrazovce';values.append(heading);
      const hint=document.createElement('p');hint.className='hint';hint.textContent='Živé hodnoty basů, středů, výšek a hlasitosti nad ovládacím panelem. Ovlivňuje pouze jejich zobrazení; analýza hudby pro vizuální efekty pokračuje.';values.append(hint);
      let row=App.el('sw-liveStatsIslandEnabled').closest('.toggle-row');
      while(row){const next=row.nextElementSibling;values.append(row);row=next;}
      App.el('page-appearance-player').append(values);
      // Scanlines affect the scene, not just its background.
      App.el('ctl-scanlineTarget').closest('.setting-block').querySelector('h3').after(App.el('ctl-fxScanlines').closest('.range-row'));
    },
updatePageHeading(){
      if(!this.pageHeading)return;
      const group=this.groups[this.current],page=group.pages.find(p=>p.key===group.selected);
      this.pageHeading.replaceChildren();
      const title=document.createElement('h2');title.textContent=this.text(group.cs,group.en);
      const description=document.createElement('p');description.textContent=this.text(...group.description);
      this.pageHeading.append(title,description);
      App.SettingsHelp.attach(title,description);
      this.pageHeading.hidden=!!App.el('settingsSearch')?.value;
      if(page?.advanced){const badge=document.createElement('span');badge.className='settings-mode-badge';badge.textContent=this.text('Pokročilé nastavení','Advanced settings');this.pageHeading.append(badge);}
      for(const g of Object.values(this.groups))if(g.subnav)g.subnav.hidden=g!==group||g.pages.filter(p=>this.advanced||!p.advanced).length<2;
    },
applySettingsPolicy(){
      if(!this.content)return;
      // A small explicit basic surface; every stored fine control remains accessible.
      const basic=new Set([
        'auroraLanguage','autoplayOnImport','randomFirstTrack','renderFps','powerSaveMode','fontBody',
        'uiMotionEnabled','ui-respectSystemMotion','hoverGlow','playerColorSync','playerCustomColor1','playerCustomColor2',
        'ctrlBarTrackInfoEnabled','stageTrackInfoEnabled','ctrlBarTimeLabelEnabled','ctrlChipsEnabled','ctrlChipAlpha','playlistAlpha',
        'liveStatsIslandEnabled','normalize','globalSens','vizMode','vizFps','vizOpacity','vizColorMode','vizStaticColor',
        'vizEqCount','vizEqHeight','vizEqGain','vizWaveGain','vizWaveWidth','vizWaveLine','vizWaveMirror',
        'vizRingStyle','vizRingRadius','vizRingCount','vizRingGain','bgEnabled','fxOverallOpacity','reduceFlashIntensity',
        'bgCustomColor1','bgCustomColor2','bgBaseDrift','timelineIslandMerged','timelineIslandHeight','timelineTimeLabelEnabled',
        'timelineLoudnessWaveform','timelineWaveformAlwaysVisible','timelineWaveformHeight',
        'specEnabled','specInsideIsland','specPalette','specIslandVisibility','specHeight','specPxPerSec'
      ]);
      const mark=node=>{
        if(!node)return;node.dataset.advanced='true';
        let hint=node.nextElementSibling;
        while(hint?.matches('.hint,.range-hint,div[style*="font-size:11px"]')){hint.dataset.advanced='true';hint=hint.nextElementSibling;}
      };
      for(const control of this.content.querySelectorAll('[data-setting],[data-extra-select],input[id],select[id]')){
        if(control.type==='file'||control.closest('[data-layer-panel],.map-row'))continue;
        const key=control.dataset.setting||control.dataset.extraSelect||control.id.replace(/^ctl-/,'');
        if(!basic.has(key))mark(control.closest('.range-row')||control.closest('.toggle-row'));
      }
      for(const id of ['sec-playback-2','sec-global-colors','sec-data-performance','sec-reactivity-1'])mark(App.el(id));
      for(const section of this.content.querySelectorAll('.settings-detail-content,.settings-secondary-block,[data-layer-section$=":motion"],[data-layer-section$=":response"]'))mark(section);
      for(const control of this.content.querySelectorAll('[data-layer-field],[data-layer-toggle]')){
        const field=control.dataset.layerField||control.dataset.layerToggle;
        if(!['count','size','opacity','blurEnabled','blur'].includes(field))mark(control.closest('.range-row')||control.closest('.toggle-row'));
      }
      for(const control of this.content.querySelectorAll('.map-row [data-field="smoothAmount"],.map-row [data-setting="bgFlashAttack"],.map-row [data-setting="bgFlashRelease"]'))mark(control.closest('.map-subrow'));
      for(const section of this.content.querySelectorAll('[data-settings-section]')){
        const key=section.dataset.settingsSection;
        if(/:(curve|limits|tempo)$/.test(key)||['ui:motion','ui:hover','timeline:analysis','colors:destinations'].includes(key))mark(section);
      }
      // Do not leave empty headings/disclosures behind in basic mode.
      for(const node of [...this.content.querySelectorAll('.settings-section,.setting-block,[data-layer-trail-detail],[data-layer-beatcut-detail]')].reverse()){
        if(node.dataset.advanced)continue;
        const controls=[...node.querySelectorAll('input:not([type=hidden]),select,.switch,button')];
        if(controls.length&&controls.every(c=>c.closest('[data-advanced]')))mark(node);
      }
      for(const heading of this.content.querySelectorAll('[data-layer-panel] .setting-subhead'))if(heading.nextElementSibling?.dataset.advanced)mark(heading);
      this.simplifyHints(this.content);
    },
simplifyHints(root){
      App.SettingsHelp.init(this.panel);
      if(App.SettingsHelp.anchor&&!App.SettingsHelp.anchor.isConnected)App.SettingsHelp.hide();
      for(const hint of root.querySelectorAll('.range-hint,.hint,div[style*="font-size:11px"]')){
        // Status/progress messages and help containing actions must stay visible.
        if(hint.dataset.settingsHint||hint.querySelector('input,select,button,a')||hint.id||!hint.textContent.trim())continue;
        const own=hint.closest('.range-row,.toggle-row,.map-subrow');
        const linked=hint.dataset.helpFor&&this.content.querySelector('[data-setting="'+hint.dataset.helpFor+'"]');
        let row=linked?.closest('.range-row,.toggle-row')||own||hint.previousElementSibling;
        while(row?.matches('[data-settings-hint]'))row=row.previousElementSibling;
        let label=row?.matches('h2,h3,h4,summary')?row:row?.querySelector(':scope > h3,:scope > h4,:scope > .range-label-row > span,:scope > .map-subrow-label > span,:scope > .toggle-row > span');
        if(!label&&row?.matches('.toggle-row'))label=row.querySelector(':scope > span');
        if(!label){const block=hint.closest('.setting-block,.settings-section-content,.layer-section-content,.map-row,.curve-block');label=block?.querySelector(':scope > h3,:scope > h4,:scope > .map-header .map-title')||block?.previousElementSibling?.closest('summary');row=null;}
        App.SettingsHelp.attach(label,hint,row);
      }
    },
syncConditions(){
      if(!this.content)return;
      const s=App.settings;
      const conditional=(keys,show,required)=>{for(const key of keys){
        const control=this.content.querySelector('[data-setting="'+key+'"],[data-extra-select="'+key+'"],#ctl-'+key);
        const row=control?.closest('.range-row')||control?.closest('.toggle-row')||control?.closest('.custom-color-wrap');
        if(row){row.classList.toggle('settings-condition-hidden',!show);row.dataset.requiresSetting=required;}
      }};
      conditional(['targetLufs'],s.normalize,'normalize');
      conditional(['ctrlChipAlpha','ctrlChipBlur','ctrlChipRadius'],s.ctrlChipsEnabled,'ctrlChipsEnabled');
      conditional(['liveRevealMode'],s.liveStatsIslandEnabled,'liveStatsIslandEnabled');
      conditional(['liveIdleSeconds'],s.liveStatsIslandEnabled&&s.liveRevealMode!=='always','liveStatsIslandEnabled');
      conditional(['vizStaticColor'],s.vizColorMode==='static','vizColorMode');
      const swatches=App.el('vizColorSwatches');if(swatches)swatches.hidden=s.vizColorMode!=='static';
      conditional(['vizSurface'],s.vizMode==='equalizer'||s.vizMode==='wave','vizMode');
      conditional(['vizResponseThreshold','vizResponseBoost','vizBoostAttack','vizBoostRelease'],s.vizResponseEnabled,'vizResponseEnabled');
      conditional(['timelineWaveformAlwaysVisible','timelineWaveformHeight','timelineWaveformScale','timelineWaveformSmooth','timelineWaveformSamplesPerSec','timelineWaveformOffset'],s.timelineLoudnessWaveform,'timelineLoudnessWaveform');
      conditional(['specInsideIslandBothPanels','specIslandVisibility','specGlassMode','specGlassAlpha','specGlassBlur'],s.specInsideIsland,'specInsideIsland');
      conditional(['specAnchor','specPlaylistOffset'],!s.specInsideIsland,'specInsideIsland');
    },
organizeSections(){
      const groupRows=(keys,title,key)=>{
        const rows=keys.map(k=>this.content.querySelector('[data-setting="'+k+'"], [data-extra-select="'+k+'"]')?.closest('.range-row,.toggle-row')).filter(Boolean);
        if(!rows.length)return;
        const marker=document.createElement('span');rows[0].before(marker);
        marker.replaceWith(App.createSettingsSection(title,rows,key));
      };
      // Upgrade existing fine-tuning groups without rebuilding their controls.
      for(const [key,g] of Object.entries(this.groups))for(const p of g.pages){
        const page=p.panel;
        for(const content of [...page.querySelectorAll('.settings-detail-content')]){
          const heading=content.querySelector(':scope > .setting-subhead');
          const title=heading?.textContent||'Jemné doladění';heading?.remove();
          const section=App.createSettingsSection(title,[],key+':'+p.key+':'+(content.parentElement.id||page.querySelectorAll('details').length));
          content.replaceWith(section);section.querySelector('.settings-section-content').append(...content.childNodes);
        }
        // Timeline subgroups use the same hierarchy as the layer editor.
        for(const block of page.querySelectorAll('.setting-block')){
          const headings=[...block.querySelectorAll(':scope > h4.setting-subhead')];
          for(const heading of headings.slice(1)){
            const nodes=[];let node=heading.nextElementSibling;
            while(node&&!node.matches('h3,h4')){nodes.push(node);node=node.nextElementSibling;}
            const section=App.createSettingsSection(heading.textContent,nodes,key+':'+p.key+':'+heading.textContent);
            heading.replaceWith(section);
          }
        }
      }
      const motion=App.el('uiMotionEnabled').closest('.setting-block');
      const duration=App.el('uiMotionDuration').closest('.range-row');
      motion.querySelector('.toggle-row').after(duration,App.el('ui-respectSystemMotion').closest('.toggle-row'));
      const individual=['playlistMotion','liveMotion','settingsMotion','navigationMotion','menuMotion'].map(k=>App.el('ui-'+k).closest('.toggle-row'));
      motion.append(App.createSettingsSection('Animace jednotlivých částí',individual,'ui:motion'));
      // Fine hover geometry comes after the main glow toggle, color and strength.
      const hover=App.el('sw-hoverGlow').closest('.setting-block');
      const hoverRows=['hoverFullOutlineStrength','hoverOutlineCoverage','hoverRadius','hoverIslandRadiusPercent','islandHover'].map(k=>App.el('ctl-'+k)?.closest('.range-row')).filter(Boolean);
      hover.append(App.createSettingsSection('Dosah a zvýraznění',hoverRows,'ui:hover'));
      groupRows(['timelineWaveformScale','timelineWaveformSmooth','timelineWaveformSamplesPerSec'],'Vyhlazení a analýza','timeline:analysis');
      // Distortion type and strength come before geometry and rendering knobs.
      const distortion=App.el('ctl-postFish').closest('.setting-block');
      const first=distortion.querySelector('h3');
      first.after(...['postDistortTarget','postWarpType','postFish'].map(k=>App.el('ctl-'+k).closest('.range-row')));
      groupRows(['postPanoramaVertical','postMaskShape','postMaskSoftness','postInvertMask','postCenterX','postCenterY','postRadius','postZoom'],'Oblast a geometrie','filters:geometry');
      groupRows(['postEdgeMode','postDistortFps'],'Vykreslování','filters:rendering');
      for(const id of ['page-visualizers-equalizer','page-visualizers-wave','page-visualizers-ring']){
        const page=App.el(id);
        for(const block of [...page.querySelectorAll(':scope > .setting-block')].slice(1)){
          const heading=block.querySelector('h3');
          if(!heading)continue;
          const title=heading.textContent;heading.remove();
          block.append(App.createSettingsSection(title,[...block.childNodes],id+':'+title));
          block.classList.add('settings-secondary-block');
        }
      }
      // Keep effect toggles in the overview; collapse only their parameters.
      for(const id of ['sparklesDetail','fxMirrorDetail','fxMirror2Detail','fxGlitchDetail']){
        const detail=App.el(id),section=App.createSettingsSection('Nastavení efektu',[],id);
        detail.before(section);section.querySelector('.settings-section-content').append(detail);
        const toggle=this.content.querySelector('[data-setting="'+({sparklesDetail:'sparklesEnabled',fxMirrorDetail:'fxMirrorEnabled',fxMirror2Detail:'fxMirror2Enabled',fxGlitchDetail:'fxGlitchEnabled'}[id])+'"]');
        section.querySelector('summary').textContent=toggle.closest('.toggle-row').querySelector('span').textContent;
        // Hide the disclosure with the effect's parameters when the effect is off.
        const sync=()=>{section.hidden=detail.style.display==='none';};sync();
        new MutationObserver(sync).observe(detail,{attributes:true,attributeFilter:['style']});
      }
      // Synchronization destinations have their own compact group.
      const destinations=App.el('playerSyncExceptionsWrap');
      const destSection=App.createSettingsSection('Synchronizované prvky',[], 'colors:destinations');
      destinations.before(destSection);destSection.querySelector('.settings-section-content').append(destinations);
      const syncDest=()=>{destSection.hidden=destinations.style.display==='none';};syncDest();
      new MutationObserver(syncDest).observe(destinations,{attributes:true,attributeFilter:['style']});
      const colorBlock=App.el('colorMappingRows').closest('.setting-block');
      const gentler=App.el('sw-reduceColorSpeedIntensity').closest('.toggle-row'),hint=gentler.nextElementSibling;
      colorBlock.append(gentler,hint);
      App.el('playerColorPickerWrap').classList.add('settings-palette');
      App.el('bgColorRow').parentElement.classList.add('settings-palette');
      // Consistent conditional groups replace inline spacing in older templates.
      for(const node of this.content.querySelectorAll('[id$="Detail"],#playerSyncExceptionsWrap'))node.classList.add('settings-conditional');
      for(const button of this.content.querySelectorAll('button[id]'))if(!button.closest('.bg-layer-card'))button.classList.add('settings-action');
    }
  });
})(window.Aurora);

window.Aurora.addStyle(52, `
/* Settings shell: topic navigation, one spacing scale, no clipped tab labels. */
#settingsPanel.settings-organized{--settings-gap:16px;--settings-label-size:13px;}
#settingsPanel.settings-organized .settings-header{min-height:64px;padding:14px 20px;gap:12px;}
#settingsPanel.settings-organized .settings-tools{align-items:center;}
#settingsPanel.settings-organized .settings-advanced{min-height:36px;font:600 12px var(--font-body);white-space:normal;line-height:1.4;max-width:155px;}
#settingsPanel.settings-organized .settings-body{display:grid;grid-template-columns:168px minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);flex:1;min-height:0;}
#settingsPanel.settings-organized .settings-nav{grid-column:1;grid-row:1/3;display:flex;flex-direction:column;align-self:stretch;width:auto;padding:16px 12px;gap:6px;overflow:auto;border:0;border-right:1px solid var(--editor-border);background:#10111944;}
#settingsPanel.settings-organized .settings-nav-item{flex:none;justify-content:flex-start;min-height:40px;height:auto;padding:10px 12px;font-size:13px;line-height:1.4;white-space:normal;overflow:visible;text-overflow:clip;overflow-wrap:anywhere;text-align:left;border:1px solid transparent;}
#settingsPanel.settings-organized .settings-nav-item.active{background:#bf30b421;border-color:#cc4bbe4d;box-shadow:inset 3px 0 #e62bce;}
#settingsPanel.settings-organized .settings-subnavs{grid-column:2;grid-row:1;padding:14px 24px;border-bottom:1px solid var(--editor-border);background:#10111955;}
#settingsPanel.settings-organized .settings-subnavs:not(:has(.settings-subnav:not([hidden]))){display:none;}
#settingsPanel.settings-organized .settings-subnav{gap:8px;}
#settingsPanel.settings-organized .settings-subnav-item{flex:0 1 auto;min-width:0;min-height:34px;max-width:100%;height:auto;white-space:normal;overflow-wrap:anywhere;padding:7px 12px;line-height:1.45;text-align:center;}
#settingsPanel.settings-organized .settings-content{grid-column:2;grid-row:2;padding:0 24px 24px;min-height:0;overflow-x:hidden;background:#10111955;}
#settingsPanel.settings-organized .settings-page-heading{position:relative;padding:24px 0 4px;display:flex;flex-direction:column;gap:6px;}
#settingsPanel.settings-organized .settings-page-heading h2{margin:0;color:var(--text);font:650 22px/1.3 var(--font-body);}
#settingsPanel.settings-organized .settings-page-heading p{margin:0;color:#aeb0c0;font:400 12px/1.6 var(--font-body);}
#settingsPanel.settings-organized .settings-mode-badge{align-self:flex-start;margin-top:4px;padding:3px 8px;border:1px solid #ffffff24;border-radius:6px;color:#bec1ce;font-size:11px;}
#settingsPanel.settings-organized .setting-block{display:flex;flex-direction:column;gap:16px;padding:24px 0!important;min-width:0;}
#settingsPanel.settings-organized .setting-block h3{margin:0;color:#ececf4;font:650 14px/1.5 var(--font-body);text-transform:none;letter-spacing:0;}
#settingsPanel.settings-organized .setting-block>:is(.range-row,.toggle-row,.range-hint,.hint,.setting-subhead,.custom-color-wrap,.settings-help){margin:0!important;}
#settingsPanel.settings-organized :is(.range-row,.map-subrow){display:flex;flex-direction:column;gap:8px;min-width:0;margin:0!important;}
#settingsPanel.settings-organized :is(.range-label-row,.map-subrow-label){display:flex;justify-content:space-between;align-items:baseline;gap:16px;margin:0;min-width:0;}
#settingsPanel.settings-organized :is(.range-label-row>span,.map-subrow-label>span,.toggle-row>span){min-width:0;line-height:1.5;color:#c0c2cf;font-size:13px!important;overflow-wrap:anywhere;}
#settingsPanel.settings-organized :is(.range-label-row>strong,.map-subrow-label>strong){flex:none;white-space:nowrap;font-size:12px;}
#settingsPanel.settings-organized :is(.range-hint,.hint){margin:0!important;font:400 12px/1.6 var(--font-body)!important;color:#a4a7b8;}
#settingsPanel [data-settings-hint],.settings-help-tooltip[hidden]{display:none!important;}
#settingsPanel [data-settings-help]{cursor:help;text-decoration:underline dotted #8b8d9e66;text-underline-offset:4px;text-decoration-thickness:1px;}
#settingsPanel [data-settings-help]:focus-visible{outline:2px solid #e287db;outline-offset:4px;border-radius:3px;}
.settings-help-tooltip{position:fixed;z-index:10000;box-sizing:border-box;width:max-content;max-width:min(380px,calc(100vw - 24px));max-height:min(340px,45vh);overflow:auto;padding:13px 16px;border:1px solid #66687766;border-radius:12px;background:#1b1c25;color:#bfc1cf;box-shadow:0 8px 30px #0006;font:400 12px/1.65 var(--font-body);overflow-wrap:anywhere;}
.settings-help-tooltip p{margin:0;}.settings-help-tooltip p+p{margin-top:8px;}
#settingsPanel.settings-organized .settings-condition-hidden{display:none!important;}
#settingsPanel.settings-organized .settings-section-content{gap:16px;}
#settingsPanel.settings-organized :is(.aurora-select-button,.settings-action,.curve-action-btn){min-width:0;max-width:100%;height:auto;min-height:36px;white-space:normal;overflow-wrap:anywhere;line-height:1.45;}
#settingsPanel.settings-organized .aurora-select-button>span{white-space:normal;text-overflow:clip;overflow:visible;}
#settingsPanel.settings-organized .settings-secondary-block{padding:0!important;}
#settingsPanel.settings-organized .settings-footer{flex-direction:row;align-items:center;justify-content:space-between;padding:12px 20px;gap:16px;}
#settingsPanel.settings-organized .settings-footer>div{width:auto;flex:none;}
#settingsPanel.settings-organized #settingsSaveStatus{font:400 11px/1.5 var(--font-body);text-align:left;color:#a4a7b8;}
#settingsPanel.settings-organized .settings-footer button{padding:8px 12px;min-height:34px;white-space:normal;}
#settingsPanel.settings-organized .settings-result{min-width:0;white-space:normal;overflow-wrap:anywhere;}
#settingsPanel.settings-organized .settings-result .settings-result-advanced{display:inline-block;margin-left:8px;color:#db95cf;font-size:10px;}
@media(max-width:800px){
 #settingsPanel.settings-organized .settings-body{grid-template-columns:minmax(0,1fr);grid-template-rows:auto auto minmax(0,1fr);}
 #settingsPanel.settings-organized .settings-nav{grid-column:1;grid-row:1;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));padding:10px 14px;gap:6px;border-right:0;border-bottom:1px solid var(--editor-border);overflow:visible;}
 #settingsPanel.settings-organized .settings-nav-item{justify-content:center;text-align:center;min-height:36px;padding:7px 6px;font-size:12px;}
 #settingsPanel.settings-organized .settings-nav-item.active{box-shadow:inset 0 -2px #e62bce;}
 #settingsPanel.settings-organized .settings-subnavs{grid-column:1;grid-row:2;padding:10px 16px;}
 #settingsPanel.settings-organized .settings-content{grid-column:1;grid-row:3;padding:0 18px 18px;}
 #settingsPanel.settings-organized .settings-page-heading{padding-top:20px;}
 #settingsPanel.settings-organized .settings-header{padding:12px 14px;gap:8px;}
 #settingsPanel.settings-organized .settings-search-wrap kbd{display:none;}
}
@media(max-width:480px){
 #settingsPanel.settings-organized .settings-nav{grid-template-columns:repeat(3,minmax(0,1fr));padding:8px 12px;}
 #settingsPanel.settings-organized .settings-nav-item{font-size:11px;padding:6px;min-height:32px;}
 #settingsPanel.settings-organized .settings-subnav-item{font-size:11px;padding:6px 9px;}
 #settingsPanel.settings-organized .settings-advanced{font-size:10px;padding:6px 8px;max-width:100px;}
 #settingsPanel.settings-organized .settings-footer{flex-direction:column;align-items:stretch;padding:10px 14px;gap:8px;}
 #settingsPanel.settings-organized .settings-footer>div{width:100%;}
 #settingsPanel.settings-organized #settingsSaveStatus{text-align:center;font-size:10px;}
 #settingsPanel.settings-organized .settings-page-heading h2{font-size:20px;}
 #settingsPanel.settings-organized .settings-header{min-height:56px;}
 #settingsPanel.settings-organized .settings-drag-grip{display:none;}
}
`);
