/* templates.js — HTML všech panelů a stránek. Každá pojmenovaná šablona je zde. */

// ── ui/templates/stage ──
window.Aurora.registerTemplate("stage", `<div id="stage"><div id="sceneContent"><div id="sceneBackground">
    <div id="bgGlow"><canvas id="bgTrailCanvas"></canvas></div>
    <div id="bgFxOverlay"></div>

    </div><div id="sceneVisualizers"><div id="spectrogramLayer">
      <canvas id="spectrogramCanvas"></canvas>
      <div id="spectrogramFade"></div>
      <div id="spectroIslandGlow"></div>
      <div id="spectroPlayhead"></div>
    </div>

    <canvas id="musicVisualizerCanvas" aria-hidden="true"></canvas>
    </div></div><div id="sceneFinalOverlay" aria-hidden="true"></div>
    <nav id="visualizerDock" aria-label="Vizualizéry"><span class="viz-dock-label">Vizualizéry</span><div class="viz-dock-buttons ctrl-chip"><button type="button" data-viz-mode="none" title="Vypnout vizualizér" aria-label="Vypnout vizualizér">○<span>Vypnuto</span></button><button type="button" data-viz-mode="equalizer" title="Equalizér" aria-label="Equalizér"><svg viewBox="0 0 24 24"><path d="M4 18V9M9 18V4M15 18V7M20 18V12"/></svg><span>Equalizér</span></button><button type="button" data-viz-mode="wave" title="Vlna" aria-label="Vlna"><svg viewBox="0 0 24 24"><path d="M2 12c4-16 6 16 10 0s6 16 10 0"/></svg><span>Vlna</span></button><button type="button" data-viz-mode="ring" title="Kruh" aria-label="Kruh"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg><span>Kruh</span></button></div></nav>
    @@AURORA:track-info@@

    <div id="normDetail">
      <div class="row"><span>Normalizace (EBU R128)</span><strong id="normDetailPct">0%</strong></div>
      <div class="bar-bg"><div class="bar-fill" id="normDetailFill"></div></div>
    </div>

    <div class="stage-tools">
      <div class="icon-btn" id="btnPlaylistToggle" title="Playlist">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h10M4 18h7"/></svg>
      </div>
      <div class="icon-btn" id="btnSettings" title="Nastavení">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      </div>
    </div>

    @@AURORA:settings@@

    <div id="emptyState">
      <h1>Aurora</h1>
      <p>Vaše hudba, vlastní atmosféra. Vyberte soubory nebo celou složku a poslouchejte s vyrovnanou hlasitostí a živými vizualizacemi.</p>
      <div class="import-row">
        <button class="import-btn plain" id="btnImportFiles">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
          Vybrat hudbu
        </button>
        <button class="import-btn ghost" id="btnImportFolder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          Vybrat složku
        </button>
      </div>
      <p class="local-note">MP3 · FLAC · WAV · OGG · M4A a další</p>
    </div>

    <div id="normBadge"><div class="spinner"></div><span id="normBadgeText">Analyzuji hlasitost…</span></div>
  </div>`);

// ── ui/templates/settings ──
window.Aurora.registerTemplate("settings", `<div id="settingsPanel">
      <div class="settings-tabs">
        <div class="settings-tab active" data-tab="player">Přehrávač</div>
        <div class="settings-tab" data-tab="controlisland">Control Island</div>
        <div class="settings-tab" data-tab="audio">Audio</div>
        <div class="settings-tab" data-tab="background">Pozadí</div>
        <div class="settings-tab" data-tab="spectrogram">Spektrogram</div>
        <div class="settings-tab" data-tab="data">Data</div>
      </div>

<div id="tab-playback" class="settings-tabpanel">@@AURORA:page-playback-general@@@@AURORA:page-playback-interface@@</div>
<div id="tab-live" class="settings-tabpanel">@@AURORA:page-live-volume@@@@AURORA:page-live-values@@@@AURORA:page-live-analysis@@@@AURORA:page-live-sensitivity@@</div>
<div id="tab-appearance" class="settings-tabpanel">@@AURORA:page-appearance-colors@@@@AURORA:page-appearance-cards@@@@AURORA:page-appearance-player@@@@AURORA:page-appearance-playlist@@@@AURORA:page-appearance-animations@@@@AURORA:page-appearance-settings@@@@AURORA:page-appearance-filters@@</div>
<div id="tab-visualizers" class="settings-tabpanel">@@AURORA:page-visualizers-general@@@@AURORA:page-visualizers-equalizer@@@@AURORA:page-visualizers-wave@@@@AURORA:page-visualizers-ring@@</div>
<div id="tab-background" class="settings-tabpanel">@@AURORA:page-background-background@@@@AURORA:page-background-mapping@@@@AURORA:page-background-effects@@@@AURORA:page-background-comfort@@</div>
<div id="tab-island" class="settings-tabpanel">@@AURORA:page-island-timeline@@@@AURORA:page-island-waveform@@@@AURORA:page-island-spectrum@@</div>
<div id="tab-data" class="settings-tabpanel">@@AURORA:page-data-profiles@@@@AURORA:page-data-performance@@</div>















      
      <button class="reset-panel-btn" id="btnResetAll">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>
        Obnovit výchozí nastavení
      </button>
      <div style="text-align:center; font-size:10.5px; color:var(--text-dim); margin:-10px 24px 16px; font-family:var(--mono);">Ctrl+Shift+D = perf debug panel</div>
    </div>`);

// ── ui/templates/player-controls ──
window.Aurora.registerTemplate("player-controls", `<div id="controlBar">
    <canvas id="spectrogramCanvasInner"></canvas>

    <div id="liveStatsDock">
    <div class="live-stats-side" id="liveStatsLeft">
      <div class="live-stats-cell" data-key="bass">
        <div class="lsc-lbl">Bass</div>
        <div class="lsc-val" id="ls-bass">—</div>
        <div class="lsc-bar-bg"><div class="lsc-bar-fill" id="lsb-bass"></div></div>
      </div>
      <div class="live-stats-cell" data-key="high">
        <div class="lsc-lbl">High</div>
        <div class="lsc-val" id="ls-high">—</div>
        <div class="lsc-bar-bg"><div class="lsc-bar-fill" id="lsb-high"></div></div>
      </div>
    </div>

    <div class="live-stats-side" id="liveStatsRight">
      <div class="live-stats-cell" data-key="mid">
        <div class="lsc-lbl">Mid</div>
        <div class="lsc-val" id="ls-mid">—</div>
        <div class="lsc-bar-bg"><div class="lsc-bar-fill" id="lsb-mid"></div></div>
      </div>
      <div class="live-stats-cell" data-key="loudnessPct">
        <div class="lsc-lbl">Loudness</div>
        <div class="lsc-val" id="ls-loudnessPct">—</div>
        <div class="lsc-bar-bg"><div class="lsc-bar-fill" id="lsb-loudnessPct"></div></div>
      </div>
    </div>

    </div>
    <div id="controlsRow">
      <div class="transport ctrl-chip">
        <button class="ctrl-btn" id="btnPrev" title="Předchozí">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
        </button>
        <button class="ctrl-btn big" id="btnPlay" title="Přehrát">
          <svg id="playIcon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
        <button class="ctrl-btn" id="btnNext" title="Další">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM6 6l8.5 6L6 18z"/></svg>
        </button>
      </div>

      <div class="volume-group ctrl-chip">
        <button type="button" class="volume-icon-btn" id="volumeIconBtn" title="Ztlumit">
          <svg id="volumeIcon" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>
        </button>
        <div class="volume-wrap" id="volumeWrap">
          <input type="range" id="volumeRange" class="volume-range" min="0" max="100" value="20" aria-label="Hlasitost">
        </div>
      </div>

      <div id="timeLabel" class="ctrl-chip">0:00 / 0:00</div>

      <div class="spacer"></div>

      <div class="playback-mode-group ctrl-chip">
        <button type="button" class="ctrl-btn playback-mode-btn" id="btnShuffle" title="Náhodné přehrávání">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg>
        </button>
        <button type="button" class="ctrl-btn playback-mode-btn" id="btnRepeat" title="Opakovat playlist">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
        </button>
      </div>

      <div class="bar-track-info ctrl-chip" id="barTrackInfo">
        <div class="bar-track-info-heart-badge" id="barTrackInfoHeartBadge" title="Přidat mezi oblíbené">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
        </div>
        <strong id="barTitle" data-ui-placeholder>Nic nehraje</strong>
        <span id="barArtist" data-ui-placeholder>Vyber skladbu z playlistu</span>

        <div id="trackInfoPopover">
          <div class="tip-head">
            <div class="tip-head-titles">
              <strong id="tipTitle">—</strong>
              <span id="tipArtist">—</span>
            </div>
            <button type="button" class="tip-heart-btn" id="tipHeartBtn" title="Přidat mezi oblíbené">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
            </button>
          </div>
          <div id="tipStatsWrap">
            <div class="tip-stat-row"><span>Hlasitost (LUFS)</span><strong id="tipLufs">—</strong></div>
            <div class="tip-stat-row"><span>Délka</span><strong id="tipDuration">—</strong></div>
            <div class="tip-stat-row"><span>Počet přehrání</span><strong id="tipPlayCount">—</strong></div>
            <div class="tip-stat-row"><span>Naposledy přehráno</span><strong id="tipLastPlayed">—</strong></div>
          </div>
        </div>
      </div>
    </div>
  </div>`);

// ── ui/templates/playlist ──
window.Aurora.registerTemplate("playlist", `<div id="playlistPanel">
    <div class="playlist-header">
      <div class="playlist-header-top">
        <h3>Playlist</h3>
        <span class="playlist-count" id="playlistCount">0 skladeb</span>
      </div>
      <div class="import-drop-zone" id="importDropZone">
        <div class="import-drop-row">
          <button class="import-btn plain" id="btnImportFiles2" style="flex:1; justify-content:center;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
            soubory
          </button>
          <button class="import-btn ghost" id="btnImportFolder2" style="flex:1; justify-content:center;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            složka
          </button>
        </div>
        <div class="import-drop-hint">nebo sem přetáhněte hudbu / složku</div>
      </div>
      <div class="search-wrap">
        <input type="text" id="searchInput" placeholder="Hledat ve skladbách...">
        <button type="button" class="search-clear-btn" id="btnSearchClear" title="Vymazat hledání">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
        </button>
      </div>
    </div>
    <div class="playlist-sort"><div class="range-row"><div class="range-label-row"><span>Řadit podle</span></div><select id="ctl-playlistSort" data-extra-select="playlistSort"><option value="original">Pořadí importu</option><option value="title">Název skladby</option><option value="artist">Interpret</option><option value="duration">Délka skladby</option><option value="favorites">Oblíbené nejdříve</option></select></div><div class="range-row"><div class="range-label-row"><span>Směr řazení</span></div><select id="ctl-playlistSortDirection" data-extra-select="playlistSortDirection"><option value="asc">Normálně</option><option value="desc">Obráceně</option></select></div></div>
    <div id="trackList">
      <div id="dropHint">Zatím žádné skladby.<br>Nahraj MP3 soubory nebo přetáhni je sem.</div>
    </div>
    <div id="bulkAnalyzeBar">
      <button id="bulkAnalyzeBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
        <span id="bulkAnalyzeBtnLabel">Analyzovat vše</span>
      </button>
      <div id="bulkAnalyzeProgress">
        <div class="row"><span id="bulkAnalyzeStatus">Analyzuji…</span><strong id="bulkAnalyzeCount">0 / 0</strong></div>
        <div class="bar-bg"><div class="bar-fill" id="bulkAnalyzeFill"></div></div>
      </div>
    </div>
  </div>`);

// ── ui/templates/timeline ──
window.Aurora.registerTemplate("timeline", `<div id="timelineIsland">
    <canvas id="waveformOverlayCanvas"></canvas>
    <div id="timelineIslandClip">
      <canvas id="spectrogramCanvasTimeline"></canvas>
      <div id="progressWrap">
        <div id="progressTooltip">0:00</div>
        <div id="progressTrack">
          <canvas id="progressCanvas"></canvas>
          <div id="progressHandle"></div>
        </div>
      </div>
    </div>
    <div id="timelineTimeLabel" class="ctrl-chip">0:00 / 0:00</div>
  </div>`);

// ── ui/templates/track-info ──
window.Aurora.registerTemplate("track-info", `<div class="track-meta" id="trackMeta">
      <div class="track-meta-chip" id="trackMetaChip">
        <div class="track-art" id="trackArt"></div>
        <div class="track-meta-titles">
          <h2 id="metaTitle">—</h2>
          <span id="metaArtist">—</span>
        </div>
        <div class="track-meta-heart-divider"></div>
        <div class="track-meta-heart-badge" id="trackMetaHeart" title="Přidat mezi oblíbené">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
        </div>

        <div id="stageTrackInfoPopover">
          <div class="tip-head">
            <div class="tip-head-titles">
              <strong id="stageTipTitle">—</strong>
              <span id="stageTipArtist">—</span>
            </div>
          </div>
          <div id="stageTipStatsWrap">
            <div class="tip-stat-row"><span>Hlasitost (LUFS)</span><strong id="stageTipLufs">—</strong></div>
            <div class="tip-stat-row"><span>Délka</span><strong id="stageTipDuration">—</strong></div>
            <div class="tip-stat-row"><span>Počet přehrání</span><strong id="stageTipPlayCount">—</strong></div>
            <div class="tip-stat-row"><span>Naposledy přehráno</span><strong id="stageTipLastPlayed">—</strong></div>
          </div>
        </div>
      </div>
    </div>`);

// ── ui/templates/settings/page-playback-general ──
window.Aurora.registerTemplate("page-playback-general", `<div id="page-playback-general" class="settings-page"><div class="setting-block" id="sec-playback-1"><h3>Import a přehrávání</h3>
<div class="toggle-row" style="margin-top:10px;">
            <span>Automaticky spustit hudbu po přidání souborů</span>
            <div class="switch on" data-setting="autoplayOnImport" data-default="true" id="sw-autoplayOnImport"></div>
          </div>
<div class="range-hint">Zapnuto (výchozí) = jakmile do prázdného playlistu přidáš první soubory/složku, hned se spustí přehrávání. Vypnuto = soubory se jen přidají a vyberou, přehrávání spustíš ručně tlačítkem Play.</div>
<div class="toggle-row" style="margin-top:12px;">
            <span>Náhodná první skladba</span>
            <div class="switch" data-setting="randomFirstTrack" data-default="false" id="sw-randomFirstTrack"></div>
          </div>
<div class="range-hint">Zapnuto = při prvním naplnění prázdného playlistu se místo skladby č. 1 vybere náhodná skladba. Netýká se dalšího přidávání souborů do už rozehraného playlistu.</div></div><div class="setting-block" id="sec-playback-2">
          <h3>Rozpoznávání názvu a interpreta</h3>
          <div class="range-hint">Jak se z názvu souboru odhaduje interpret a název skladby (ID3 tagy se nečtou).</div>
          <div class="toggle-row" style="margin-top:10px;">
            <span>Chytrý režim</span>
            <div class="switch on" data-setting="smartTitleParsing" data-default="true" id="sw-smartTitleParsing"></div>
          </div>
          <div class="range-hint">
            <strong style="color:var(--text);">Zapnuto (výchozí)</strong> = před rozdělením na " - " se automaticky odstraní čísla skladeb (01., 02 -…) a šumové přívěsky (Official MV, Lyrics Video, HD…). Pro YouTube-style názvy s názvy v uvozovkách jako <em>Interpret 'Písnička'</em> funguje samostatné pravidlo. Záložní heuristiky zvládají i podtržítka a závorky na konci.<br>
            <strong style="color:var(--text);">Vypnuto</strong> = původní chování — čistý split na první " - ", nic víc.
          </div>
          <div style="margin-top:14px;">
            <button type="button" class="settings-action settings-action-wide" id="btnReparseTrackNames">
              <svg viewbox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;flex-shrink:0;"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"></path><path d="M3 3v5h5"></path></svg>
              Znovu rozpoznat názvy v playlistu
            </button>
            <div id="reparseStatus" style="display:none; font-size:11px; color:var(--positive); margin-top:6px; text-align:center;"></div>
          </div>
          <div class="range-hint">Přeparsuje všechny již načtené soubory v playlistu (= aplikuje aktuální nastavení na stávající seznam). Soubory to nepřenačte, jen aktualizuje zobrazené jméno/interpreta.</div>
        </div><div class="setting-block"><h3>Vykreslování a úspora energie</h3><div class="range-row"><div class="range-label-row"><span>Limit vykreslování pozadí a spektra</span><strong id="val-renderFps"></strong></div><input type="range" id="ctl-renderFps" data-setting="renderFps" min="30" max="240" step="1" value="120"></div><div class="range-row"><div class="range-label-row"><span>Úspora energie vykreslování</span></div><select id="ctl-powerSaveMode" data-extra-select="powerSaveMode"><option value="hidden">Pauza při skrytí karty / minimalizaci</option><option value="blur">Pauza i při ztrátě zaměření okna</option><option value="off">Bez automatické pauzy</option></select><p class="range-hint">Pozastavuje pouze vizuály, hudba pokračuje. Prohlížeč může omezit snímky skrytých karet i bez automatické pauzy.</p></div></div></div>`);

// ── ui/templates/settings/page-playback-interface ──
window.Aurora.registerTemplate("page-playback-interface", `<div id="page-playback-interface" class="settings-page"><div class="setting-block" id="sec-appearance-1">
          <h3>Vzhled UI</h3>
          <div class="range-row" style="margin-top:12px;">
            <div class="range-label-row"><span>Font rozhraní (běžný text)</span></div>
            <select class="map-select" id="ctl-fontBody">
              <option value="Inter">Inter</option>
              <option value="Manrope">Manrope</option>
              <option value="Sora">Sora</option>
              <option value="Poppins">Poppins</option>
              <option value="Outfit">Outfit</option>
              <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
              <option value="Urbanist">Urbanist</option>
              <option value="DM Sans">DM Sans</option>
            </select>
          </div>
          <div class="range-row">
            <div class="range-label-row"><span>Font nadpisů</span></div>
            <select class="map-select" id="ctl-fontDisplay">
              <option value="Space Grotesk">Space Grotesk</option>
              <option value="Sora">Sora</option>
              <option value="Outfit">Outfit</option>
              <option value="Manrope">Manrope</option>
              <option value="Poppins">Poppins</option>
              <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
              <option value="Fraunces">Fraunces</option>
              <option value="Urbanist">Urbanist</option>
            </select>
          </div>
          <div class="range-row">
            <div class="range-label-row"><span>Font čísel/monospace</span></div>
            <select class="map-select" id="ctl-fontMono">
              <option value="JetBrains Mono">JetBrains Mono</option>
              <option value="IBM Plex Mono">IBM Plex Mono</option>
              <option value="Source Code Pro">Source Code Pro</option>
            </select>
          </div>
          
        </div>

        </div>`);

// ── ui/templates/settings/page-live-volume ──
window.Aurora.registerTemplate("page-live-volume", `<div id="page-live-volume" class="settings-page"><div class="setting-block" id="sec-playback-3">
          <h3>Normalizace hlasitosti</h3>
          <div class="toggle-row" style="margin-top:10px;">
            <span>EBU R128 normalizace</span>
            <div class="switch on" data-setting="normalize" data-default="true"></div>
          </div>
          <div class="range-hint">Každá skladba se před přehráním analyzuje a doladí na cílovou hlasitost.</div>
        <div class="range-row">
            <div class="range-label-row"><span>Cílové LUFS</span><strong id="val-targetLufs">-14</strong></div>
            <input type="range" id="ctl-targetLufs" data-setting="targetLufs" data-default="-14" min="-30" max="-8" step="1" value="-14">
            <div class="range-hint">Standard streamovacích služeb je -14 LUFS.</div>
          </div>
        </div>

        </div>`);

// ── ui/templates/settings/page-live-values ──
window.Aurora.registerTemplate("page-live-values", `<div id="page-live-values" class="settings-page"><div class="setting-block" id="sec-live-1">
          <div class="ms-live-header">
            <div class="live-dot idle" id="senseDot"></div>
            <h3 style="margin:0;">Živé hodnoty MusicSense</h3>
            <span class="ms-fps" id="senseFps">— FPS</span>
          </div>
          <p class="range-hint">Aktuální hlasitost, pásma a tempo, jak je aplikace právě měří.</p><div class="ms-live-grid" style="margin-top:12px;">
            <div class="ms-live-cell" data-key="bass"><div class="lbl">Bass</div><div class="val" id="sv-bass">—</div><div class="bar-bg"><div class="bar-fill" id="sb-bass"></div></div></div>
            <div class="ms-live-cell" data-key="mid"><div class="lbl">Mid</div><div class="val" id="sv-mid">—</div><div class="bar-bg"><div class="bar-fill" id="sb-mid"></div></div></div>
            <div class="ms-live-cell" data-key="high"><div class="lbl">High</div><div class="val" id="sv-high">—</div><div class="bar-bg"><div class="bar-fill" id="sb-high"></div></div></div>
            <div class="ms-live-cell" data-key="loudnessPct"><div class="lbl">Loudness</div><div class="val" id="sv-loudnessPct">—</div><div class="bar-bg"><div class="bar-fill" id="sb-loudnessPct"></div></div></div>
            <div class="ms-live-cell" data-key="bpm"><div class="lbl">Tempo (BPM)</div><div class="val" id="sv-bpm">—</div><div class="bar-bg"><div class="bar-fill" id="sb-bpm"></div></div></div>
            <div class="ms-live-cell beat-indicator-cell" data-key="beat">
              <div class="beat-indicator-dot-wrap">
                <div class="beat-indicator-ring"></div>
                <div class="beat-indicator-dot" id="beatIndicatorDot"></div>
              </div>
              <div class="beat-indicator-meta">
                <div class="lbl">Beat</div>
                <div class="conf">Jistota <strong id="beatConfidenceVal">—</strong></div>
              </div>
            </div>
          </div>
        <div class="toggle-row" style="margin-top:10px;">
            <span>Zobrazit i přímo na obrazovce</span>
            <div class="switch" data-setting="liveStatsIslandEnabled" data-default="false" id="sw-liveStatsIslandEnabled"></div>
          </div><div class="range-row"><div class="range-label-row"><span>Zobrazení hodnot na obrazovce</span></div><select id="ctl-liveRevealMode" data-extra-select="liveRevealMode"><option value="always">Vždy</option><option value="near">Poblíž ovládacího panelu</option><option value="movement">Při pohybu myši</option></select></div><div class="range-row"><div class="range-label-row"><span>Skrýt po nečinnosti</span><strong id="val-liveIdleSeconds"></strong></div><input type="range" id="ctl-liveIdleSeconds" data-setting="liveIdleSeconds" min="1" max="15" step="1" value="5"></div>
          <p class="range-hint" data-help-for="liveStatsIslandEnabled">Zobrazuje Bass, Mid, High a Loudness vedle ovládací lišty. V užším okně se hodnoty přesunou do kompaktního řádku uvnitř panelu. Tempo a Beat zůstávají pouze zde.</p></div>

        </div>`);

// ── ui/templates/settings/page-live-analysis ──
window.Aurora.registerTemplate("page-live-analysis", `<div id="page-live-analysis" class="settings-page"><div class="setting-block" id="sec-reactivity-3">
          <h3>Analýza</h3>
          <div class="range-row">
            <div class="range-label-row"><span>FFT velikost</span><strong id="val-fftIdx">2048</strong></div>
            <input type="range" id="ctl-fftIdx" data-setting="fftIdx" data-default="2" min="0" max="4" step="1" value="2">
          </div>
          <div class="range-row">
            <div class="range-label-row"><span>Smoothing (Analyser)</span><strong id="val-smoothing">0.75</strong></div>
            <input type="range" id="ctl-smoothing" data-setting="smoothing" data-default="0.75" min="0" max="0.98" step="0.01" value="0.75">
          </div>
          <div class="range-row">
            <div class="range-label-row"><span>Vyhlazení hodnot</span><strong id="val-senseSmooth">Střední</strong></div>
            <input type="range" id="ctl-senseSmooth" data-setting="senseSmooth" data-default="0.35" min="0.02" max="1" step="0.01" value="0.35">
            <div class="range-hint">Vyhlazuje Loudness, Bass, Mid a High. Nižší = pomalejší, plynulejší reakce. 100 % = bez vyhlazení, syrová hodnota.</div>
          </div>
        </div>
      </div>`);

// ── ui/templates/settings/page-live-sensitivity ──
window.Aurora.registerTemplate("page-live-sensitivity", `<div id="page-live-sensitivity" class="settings-page"><div class="setting-block" id="sec-reactivity-2">
          <h3>Citlivost pásem</h3>
          <div class="range-row">
            <div class="range-label-row"><span>Global boost</span><strong id="val-globalSens">1.0×</strong></div>
            <input type="range" id="ctl-globalSens" data-setting="globalSens" data-default="1" min="0.1" max="4" step="0.05" value="1">
            <div class="range-hint">Hlavní páka nad vším ostatním — násobí všechna pásma najednou.</div>
          </div>
        <div class="settings-detail-content"><h4 class="setting-subhead">Jemné doladění</h4><div class="range-row">
            <div class="range-label-row"><span>Citlivost Bass</span><strong id="val-sensBass">1.0×</strong></div>
            <input type="range" id="ctl-sensBass" data-setting="sensBass" data-default="1" min="0.1" max="5" step="0.05" value="1">
          </div>
          <div class="range-row">
            <div class="range-label-row"><span>Citlivost Mid</span><strong id="val-sensMid">1.0×</strong></div>
            <input type="range" id="ctl-sensMid" data-setting="sensMid" data-default="1" min="0.1" max="5" step="0.05" value="1">
          </div>
          <div class="range-row">
            <div class="range-label-row"><span>Citlivost High</span><strong id="val-sensHigh">1.0×</strong></div>
            <input type="range" id="ctl-sensHigh" data-setting="sensHigh" data-default="1" min="0.1" max="5" step="0.05" value="1">
          </div>
          </div></div>

        <div class="setting-block" id="sec-reactivity-1">
          <h3>Rozsah Loudness %</h3>
          <div class="range-row">
            <div class="range-label-row"><span>Floor (0%)</span><strong id="val-loudFloorDb">-45 dBFS</strong></div>
            <input type="range" id="ctl-loudFloorDb" data-setting="loudFloorDb" data-default="-45" min="-70" max="-20" step="1" value="-45">
          </div>
          <div class="range-row">
            <div class="range-label-row"><span>Ceiling (100%)</span><strong id="val-loudCeilDb">-20 dBFS</strong></div>
            <input type="range" id="ctl-loudCeilDb" data-setting="loudCeilDb" data-default="-20" min="-30" max="0" step="1" value="-20">
          </div>
          <div class="range-hint">Definuje, jaký rozsah dBFS se mapuje na 0–100 % ukazatele Loudness.</div>
        </div>

        </div>`);

// ── ui/templates/settings/page-appearance-colors ──
window.Aurora.registerTemplate("page-appearance-colors", `<div id="page-appearance-colors" class="settings-page"><div class="setting-block" id="sec-appearance-2">
          <h3>Barvy přehrávače</h3>
          <div class="range-hint">Barva alba/tečky skladby, timeline a ikony ozubeného kolečka. Pevné barvy nebo globální synchronizace s hudbou.</div>
          <div class="toggle-row" style="margin-top:10px;">
            <span>Synchronizovat s "Rychlost změny spektra"</span>
            <div class="switch" data-setting="playerColorSync" data-default="false" id="sw-playerColorSync"></div>
          </div>
          <div class="range-hint">Zapnuto = barvy přehrávače řídí globální Rychlost změny spektra níže, i při vypnutém pozadí. Vypnuto = pevné barvy níže.</div>
          <div id="playerSyncExceptionsWrap" style="display:none; margin-top:2px; margin-bottom:10px; padding:10px; border-radius:8px; background: rgba(255,255,255,0.03); border:1px solid var(--border);">
            <div class="range-hint">Zapnuté prvky používají synchronizované barvy. Vypnuté používají pevné barvy:</div>
            <div class="toggle-row">
              <span style="font-size:12.5px;">Náhledy skladeb v playlistu</span>
              <div class="switch" data-setting="playerSyncThumbs" data-default="true" id="sw-playerSyncThumbs"></div>
            </div>
            <div class="toggle-row" style="margin-top:8px;">
              <span style="font-size:12.5px;">Play/Pause tlačítko</span>
              <div class="switch" data-setting="playerSyncPlayBtn" data-default="true" id="sw-playerSyncPlayBtn"></div>
            </div>
            <div class="toggle-row" style="margin-top:8px;">
              <span style="font-size:12.5px;">Ikona ozubeného kolečka</span>
              <div class="switch" data-setting="playerSyncGear" data-default="true" id="sw-playerSyncGear"></div>
            </div>
            <div class="toggle-row" style="margin-top:8px;">
              <span style="font-size:12.5px;">Scanlina normalizace (playlist)</span>
              <div class="switch" data-setting="playerSyncScanline" data-default="true" id="sw-playerSyncScanline"></div>
            </div>
          </div>
          <div id="playerColorPickerWrap">
            <div class="color-row" id="playerColorRow"></div>
            <div class="custom-color-wrap">
              <input type="color" id="playerCustomColor1" value="#ff2ec4">
              <label>vlastní barva 1</label>
            </div>
            <div class="custom-color-wrap">
              <input type="color" id="playerCustomColor2" value="#7c3aed">
              <label>vlastní barva 2</label>
            </div>
          </div>
        </div>
      <div class="setting-block" id="sec-global-colors"><h3>Globální změny barev</h3><p class="range-hint">Sdílená rychlost barev přehrávače a pozadí. Funguje i při vypnutém pozadí; vlastní mapování vrstev má přednost.</p><div id="colorMappingRows"></div></div><div class="setting-block" id="sec-appearance-5">
          <h3 class="setting-subhead">Barvy pozadí</h3>
          <div class="range-hint">Sdílené všemi vrstvami.</div>
          <div style="margin-top:10px;">
            <div style="font-size:12.5px; color:var(--text-dim);">Barvy (použity, když je "Rychlost změny spektra" vypnutá)</div>
            <div class="color-row" id="bgColorRow"></div>
            <div class="custom-color-wrap">
              <input type="color" id="bgCustomColor1" value="#ff2ec4">
              <label>vlastní barva 1</label>
            </div>
            <div class="custom-color-wrap">
              <input type="color" id="bgCustomColor2" value="#7c3aed">
              <label>vlastní barva 2</label>
            </div>
          </div>
        </div>

        </div>`);

// ── ui/templates/settings/page-appearance-cards ──
window.Aurora.registerTemplate("page-appearance-cards", `<div id="page-appearance-cards" class="settings-page"><div class="setting-block" id="sec-cards-2">
          <h3>Kartička skladby — dole (ovládací lišta)</h3>
          <div class="toggle-row" style="margin-top:10px;">
            <span>Zobrazit název skladby</span>
            <div class="switch on" data-setting="ctrlBarTrackInfoEnabled" data-default="true" id="sw-ctrlBarTrackInfoEnabled"></div>
          </div>
          <div class="range-hint">Vypnutím schováš celou kartičku s názvem/interpretem (i srdíčko a rozklikávací info) z hlavní ovládací lišty.</div>
          <div class="settings-detail-content"><h4 class="setting-subhead">Jemné doladění</h4><div class="toggle-row" style="margin-top:12px;">
            <span>Červený obrys jen při hoveru</span>
            <div class="switch" data-setting="ctrlBarLikedOutlineHoverOnly" data-default="false" id="sw-ctrlBarLikedOutlineHoverOnly"></div>
          </div>
          <div style="font-size:11px; color:var(--text-dim); margin-top:4px; line-height:1.4;" class="">Zapnuto = červený obrys oblíbené skladby kolem kartičky se objeví jen když na ni najedeš myší. Vypnuto (výchozí) = obrys je vidět trvale, dokud je skladba oblíbená.</div>
        </div></div>
        <div class="setting-block" id="sec-cards-1">
          <h3>Kartička skladby — nahoře (na obrazovce)</h3>
          <div class="toggle-row" style="margin-top:10px;">
            <span>Zobrazit název skladby</span>
            <div class="switch on" data-setting="stageTrackInfoEnabled" data-default="true" id="sw-stageTrackInfoEnabled"></div>
          </div>
          <div class="range-hint">Vypnutím schováš celou kartičku s názvem/interpretem (i srdíčko a rozklikávací info) vlevo nahoře nad pozadím.</div>
          <div class="settings-detail-content"><h4 class="setting-subhead">Jemné doladění</h4><div class="toggle-row" style="margin-top:12px;">
            <span>Červený obrys jen při hoveru</span>
            <div class="switch" data-setting="stageLikedOutlineHoverOnly" data-default="false" id="sw-stageLikedOutlineHoverOnly"></div>
          </div>
          <div style="font-size:11px; color:var(--text-dim); margin-top:4px; line-height:1.4;" class="">Zapnuto = červený obrys oblíbené skladby kolem této kartičky se objeví jen když na ni najedeš myší. Vypnuto (výchozí) = obrys je vidět trvale, dokud je skladba oblíbená.</div>
          <div class="toggle-row" style="margin-top:12px;">
            <span>Pulzování obrysu podle hudby</span>
            <div class="switch" data-setting="stageLikedOutlinePulse" data-default="false" id="sw-stageLikedOutlinePulse"></div>
          </div>
          <div style="font-size:11px; color:var(--text-dim); margin-top:4px; margin-bottom:2px; line-height:1.4;" class="">Zapnuto = síla záře červeného obrysu (u oblíbené skladby) živě pulzuje podle vybrané hodnoty z MusicSense místo pevné statické záře.</div>
          <div id="stageLikedOutlinePulseDetail" style="display:none; margin-top:10px;" class="">
            <div class="range-row" style="margin-top:0;">
              <div class="range-label-row"><span>Zdroj</span></div>
              <select class="map-select" id="ctl-stageLikedOutlinePulseSource">
                <option value="loudnessPct">Loudness</option>
                <option value="bass">Bass</option>
                <option value="mid">Mid</option>
                <option value="high">High</option>
              </select>
            </div>
            <div class="range-row">
              <div class="range-label-row"><span>Práh (floor)</span><strong id="val-stageLikedOutlinePulseFloor">40%</strong></div>
              <input type="range" id="ctl-stageLikedOutlinePulseFloor" data-setting="stageLikedOutlinePulseFloor" data-default="40" min="0" max="90" step="1" value="40">
              <div class="range-hint">Hodnota zdroje pod tímto prahem = obrys úplně nesvítí (0 %), 100 % zdroje = plná záře. Hlasitost/pásma se u normální hudby drží dost vysoko, takže bez posunutí prahu nahoru efekt vypadá skoro pořád "zapnutý na max" — zvyš práh, pokud chceš, aby obrys reagoval jen na výraznější momenty.</div>
            </div>
            <div class="range-row">
              <div class="range-label-row"><span>Citlivost</span><strong id="val-stageLikedOutlinePulseSensitivity">1.00×</strong></div>
              <input type="range" id="ctl-stageLikedOutlinePulseSensitivity" data-setting="stageLikedOutlinePulseSensitivity" data-default="1" min="0.1" max="3" step="0.05" value="1">
            </div>
          </div>
        </div></div>
        </div>`);

// ── ui/templates/settings/page-appearance-player ──
window.Aurora.registerTemplate("page-appearance-player", `<div id="page-appearance-player" class="settings-page"><div class="setting-block"><h3>Text kartičky v ovládacím panelu</h3><div class="range-row"><div class="range-label-row"><span>Zarovnání textu kartičky</span></div><select id="ctl-ctrlTrackAlign" data-extra-select="ctrlTrackAlign"><option value="left">Vlevo</option><option value="right">Vpravo</option></select></div><div class="range-row"><div class="range-label-row"><span>Šířka kartičky skladby</span></div><select id="ctl-ctrlTrackWidth" data-extra-select="ctrlTrackWidth"><option value="fill">Vyplnit volné místo</option><option value="content">Podle názvu a interpreta</option></select><p class="hint">Šířka podle textu použije delší z názvu skladby a interpreta. Příliš dlouhý text se zkrátí podle dostupného místa.</p></div></div><div class="setting-block"><h3>Obrys ovládacího panelu</h3><div class="range-row"><div class="range-label-row"><span>Barva obrysu</span></div><input type="color" id="uiOutlineColor" value="#ffffff" aria-label="Outline color"></div><div class="range-row"><div class="range-label-row"><span>Neprůhlednost obrysu</span><strong id="uiOutlineOpacityValue"></strong></div><input type="range" id="uiOutlineOpacity" min="0" max="100" step="1" value="28" aria-label="Outline opacity"></div><div class="range-row"><div class="range-label-row"><span>Tloušťka obrysu</span><strong id="uiOutlineValue"></strong></div><input type="range" id="uiOutlineWidth" min="0" max="4" step="0.5" value="1"></div></div><div class="setting-block" id="sec-cards-5">
          <h3>Čas v ovládací liště</h3>
          <div class="toggle-row" style="margin-top:10px;">
            <span>Ukazatel času</span>
            <div class="switch on" data-setting="ctrlBarTimeLabelEnabled" data-default="true" id="sw-ctrlBarTimeLabelEnabled"></div>
          </div>
          <div class="range-hint">Zapíná/vypíná ukazatel času v hlavní ovládací liště — nezávisle na ukazateli u timeline v sekci Časová osa.</div>
        </div>

        <div class="setting-block" id="sec-cards-4">
          <h3>Pozadí prvků ovládací lišty</h3>
          <div class="toggle-row" style="margin-top:10px;">
            <span>Zapnuto</span>
            <div class="switch on" data-setting="ctrlChipsEnabled" data-default="true" id="sw-ctrlChipsEnabled"></div>
          </div>
          <div class="range-hint">Tmavá "podložka" za tlačítky, časem, hlasitostí, progress barem a názvem skladby v ovládací liště — drží text a ovládání čitelné i když skrz sklo prosvítá spektrogram.</div>
          <div class="range-row">
            <div class="range-label-row"><span>Tmavost pozadí</span><strong id="val-ctrlChipAlpha">38%</strong></div>
            <input type="range" id="ctl-ctrlChipAlpha" data-setting="ctrlChipAlpha" data-default="0.38" min="0" max="0.9" step="0.01" value="0.38">
          </div>
          <div class="range-row">
            <div class="range-label-row"><span>Blur pozadí</span><strong id="val-ctrlChipBlur">10px</strong></div>
            <input type="range" id="ctl-ctrlChipBlur" data-setting="ctrlChipBlur" data-default="10" min="0" max="24" step="1" value="10">
          </div>
          <div class="range-row">
            <div class="range-label-row"><span>Zaoblení rohů</span><strong id="val-ctrlChipRadius">14px</strong></div>
            <input type="range" id="ctl-ctrlChipRadius" data-setting="ctrlChipRadius" data-default="14" min="0" max="30" step="1" value="14">
          </div>
        </div>

        </div>`);

// ── ui/templates/settings/page-appearance-playlist ──
window.Aurora.registerTemplate("page-appearance-playlist", `<div id="page-appearance-playlist" class="settings-page"><div class="setting-block"><h3>Vzhled playlistu</h3><div class="range-row"><div class="range-label-row"><span>Neprůhlednost pozadí</span><strong id="val-playlistAlpha"></strong></div><input type="range" id="ctl-playlistAlpha" data-setting="playlistAlpha" data-default="0.2" min="0" max="1" step="0.01" value="0.2"></div><div class="range-row"><div class="range-label-row"><span>Rozmazání pozadí</span><strong id="val-playlistBlur"></strong></div><input type="range" id="ctl-playlistBlur" data-setting="playlistBlur" data-default="1" min="0" max="30" step="1" value="1"></div><div class="range-row"><div class="range-label-row"><span>Zaoblení rohů</span><strong id="val-playlistRadius"></strong></div><input type="range" id="ctl-playlistRadius" data-setting="playlistRadius" data-default="22" min="0" max="40" step="1" value="22"></div><div class="range-row"><div class="range-label-row"><span>Neprůhlednost obrysu</span><strong id="val-playlistOutlineOpacity"></strong></div><input type="range" id="ctl-playlistOutlineOpacity" data-setting="playlistOutlineOpacity" data-default="28" min="0" max="100" step="1" value="28"></div><div class="range-row"><div class="range-label-row"><span>Tloušťka obrysu</span><strong id="val-playlistOutlineWidth"></strong></div><input type="range" id="ctl-playlistOutlineWidth" data-setting="playlistOutlineWidth" data-default="1" min="0" max="4" step="0.5" value="1"></div></div></div>`);

// ── ui/templates/settings/page-appearance-animations ──
window.Aurora.registerTemplate("page-appearance-animations", `<div id="page-appearance-animations" class="settings-page"><div class="setting-block"><h3>Animace rozhraní</h3><div class="toggle-row"><span>Animace rozhraní</span><input type="checkbox" id="uiMotionEnabled" checked></div><div class="toggle-row"><span>Zajíždění playlistu</span><input type="checkbox" id="ui-playlistMotion" checked></div><div class="toggle-row"><span>Zajíždění živých hodnot</span><input type="checkbox" id="ui-liveMotion" checked></div><div class="toggle-row"><span>Zvětšení a zmenšení nastavení</span><input type="checkbox" id="ui-settingsMotion" checked></div><div class="toggle-row"><span>Přechody mezi taby</span><input type="checkbox" id="ui-navigationMotion" checked></div><div class="toggle-row"><span>Animace rozbalovacích nabídek</span><input type="checkbox" id="ui-menuMotion" checked></div><div class="toggle-row"><span>Respektovat omezení pohybu systému</span><input type="checkbox" id="ui-respectSystemMotion"></div><div class="range-row"><div class="range-label-row"><span>Délka animace</span><strong id="uiMotionValue"></strong></div><input type="range" id="uiMotionDuration" min="100" max="800" step="20" value="320"></div></div><div class="setting-block"><h3>Hover efekty</h3><div class="toggle-row"><span>Záře poblíž kurzoru</span><div class="switch" id="sw-hoverGlow" data-setting="hoverGlow"></div></div><div class="range-row"><div class="range-label-row"><span>Barva záře kurzoru</span></div><div class="color-row" id="glowColorSwatches"></div><div class="custom-color-wrap"><span id="glowColorPreview" class="swatch" aria-hidden="true"></span><input type="text" id="ctl-hoverGlowColor" data-extra-select="hoverGlowColor" value="#eec4ff" maxlength="7" spellcheck="false" aria-label="Barva záře kurzoru" placeholder="#RRGGBB"></div></div><div class="range-row"><div class="range-label-row"><span>Intenzita záře</span><strong id="val-hoverGlowStrength"></strong></div><input type="range" id="ctl-hoverGlowStrength" data-setting="hoverGlowStrength" min="0" max="1" step="0.01" value="0.35"></div><div class="range-row"><div class="range-label-row"><span>Intenzita zvýraznění obrysu pod myší</span><strong id="val-hoverFullOutlineStrength"></strong></div><input type="range" id="ctl-hoverFullOutlineStrength" data-setting="hoverFullOutlineStrength" min="0" max="100" step="5" value="85"><p class="hint">Viditelnost záře prvku pod myší. 0 % ponechá pouze původní glow.</p></div><div class="range-row"><div class="range-label-row"><span>Pokrytí obrysu září pod myší</span><strong id="val-hoverOutlineCoverage"></strong></div><input type="range" id="ctl-hoverOutlineCoverage" data-setting="hoverOutlineCoverage" min="0" max="100" step="5" value="80"><p class="hint">0 % zachová původní dosah, vyšší hodnoty rozšíří záři od kurzoru po obrysu. 100 % rozsvítí celý obrys rovnoměrně. Platí jen pro prvek pod myší; jas určuje Intenzita zvýraznění obrysu pod myší.</p></div><div class="range-row"><div class="range-label-row"><span>Vzdálenost zvýraznění</span><strong id="val-hoverRadius"></strong></div><input type="range" id="ctl-hoverRadius" data-setting="hoverRadius" min="0" max="300" step="10" value="200"></div><div class="range-row"><div class="range-label-row"><span>Dosah záře v ovládacím panelu</span><strong id="val-hoverIslandRadiusPercent"></strong></div><input type="range" id="ctl-hoverIslandRadiusPercent" data-setting="hoverIslandRadiusPercent" min="0" max="100" step="5" value="50"><p class="hint">Procento globálního dosahu. 50 % znamená poloviční vzdálenost.</p></div><div class="range-row"><div class="range-label-row"><span>Vzhled prvků panelu při najetí</span></div><select id="ctl-islandHover" data-extra-select="islandHover"><option value="clear">Průhledné</option><option value="light">Světlejší</option><option value="glow">Jemná záře</option><option value="none">Beze změny</option></select></div></div></div>`);

// ── ui/templates/settings/page-appearance-settings ──
window.Aurora.registerTemplate("page-appearance-settings", `<div id="page-appearance-settings" class="settings-page"><div class="setting-block"><h3>Vzhled nastavení</h3><div class="toggle-row"><span>Sklo ve stylu Control Island</span><div class="switch" id="sw-settingsGlass" data-setting="settingsGlass"></div></div><div class="range-row"><div class="range-label-row"><span>Neprůhlednost pozadí</span><strong id="val-settingsAlpha"></strong></div><input type="range" id="ctl-settingsAlpha" data-setting="settingsAlpha" min="0" max="1" step="0.01" value="0.72"></div><div class="range-row"><div class="range-label-row"><span>Rozmazání pozadí</span><strong id="val-settingsBlur"></strong></div><input type="range" id="ctl-settingsBlur" data-setting="settingsBlur" min="0" max="30" step="1" value="12"></div><div class="range-row"><div class="range-label-row"><span>Zaoblení rohů</span><strong id="val-settingsRadius"></strong></div><input type="range" id="ctl-settingsRadius" data-setting="settingsRadius" min="0" max="40" step="1" value="22"></div><div class="range-row"><div class="range-label-row"><span>Neprůhlednost obrysu</span><strong id="val-settingsOutlineOpacity"></strong></div><input type="range" id="ctl-settingsOutlineOpacity" data-setting="settingsOutlineOpacity" min="0" max="100" step="1" value="28"></div><div class="range-row"><div class="range-label-row"><span>Tloušťka obrysu</span><strong id="val-settingsOutlineWidth"></strong></div><input type="range" id="ctl-settingsOutlineWidth" data-setting="settingsOutlineWidth" min="0" max="4" step="0.5" value="1"></div></div></div>`);

// ── ui/templates/settings/page-background-background ──
window.Aurora.registerTemplate("page-background-background", `<div id="page-background-background" class="settings-page"><div class="setting-block" id="sec-appearance-3">
          <h3>Reaktivní pozadí</h3>
          <div class="toggle-row" style="margin-top:10px;">
            <span>Zapnuto</span>
            <div class="switch on" data-setting="bgEnabled" data-default="true"></div>
          </div>
          <div class="range-hint">Měkké tvary na pozadí, poskládané z až 4 nezávislých vrstev. Na startu stojí na místě — hýbat, zvětšovat a probleskovat se začnou podle namapovaných MusicSense hodnot níže.</div>

          <div class="range-row">
            <div class="range-label-row"><span>Celková viditelnost pozadí</span><strong id="val-fxOverallOpacity">100%</strong></div>
            <input type="range" id="ctl-fxOverallOpacity" data-setting="fxOverallOpacity" data-default="1" min="0" max="1" step="0.01" value="1">
            <div class="range-hint">Finální násobič viditelnosti úplně všeho na pozadí — vrstev, zrcadla i efektů.</div>
          </div>
        </div>
        <div class="setting-block" id="sec-appearance-4">
          <h3>Vrstvy</h3>
          <div class="range-hint">Každá vrstva je samostatná sada teček s vlastním tvarem, počtem, velikostí a rozostřením — jako průsvitné fólie nad sebou. Všechny vrstvy sdílí stejné MusicSense mapování níže, ale ozubené kolečko u vrstvy nastaví, jak moc na něj ta vrstva reaguje.</div>
          <div id="bgLayerList"></div>
        </div>
        </div>`);

// ── ui/templates/settings/page-background-mapping ──
window.Aurora.registerTemplate("page-background-mapping", `<div id="page-background-mapping" class="settings-page"><div class="setting-block" id="sec-reactivity-6">
          <h3>Základní pohyb</h3><div class="range-row" style="margin-top:0;">
            <div class="range-label-row"><span>Rychlost driftu (základ)</span><strong id="val-bgBaseDrift">0.60×</strong></div>
            <input type="range" id="ctl-bgBaseDrift" data-setting="bgBaseDrift" data-default="0.6" min="0" max="2" step="0.05" value="0.6">
            <div class="range-hint">Klidová rychlost pohybu, na kterou se přičítá mapovaná hodnota níže. Na 0 tvary stojí, dokud je hudba nerozhýbe.</div>
          </div>
        </div>
        <div class="setting-block" id="sec-reactivity-5">
          <h3>Mapování MusicSense → pozadí</h3>
          <div class="range-hint">Vyber zdroj MusicSense a citlivost pro každou vlastnost pozadí. Živá hodnota je vidět u mapování. V křivce odezvy dole u každého mapování lze přidat až 3 body a upravit průběh reakce. Vodorovná osa je vstup, svislá výsledná odezva; rohy (0, 0) a (1, 1) jsou pevné.</div>
          <div id="bgMappingRows"></div>
        </div>

        <div class="setting-block" id="sec-reactivity-7"><h3>Vývojářské / jemné doladění</h3><div class="range-row" style="margin-top:0; margin-bottom:14px;">
            <div class="range-label-row"><span>Dělitel citlivosti (globální)</span><strong id="val-bgSensDivisor">10</strong></div>
            <input type="range" id="ctl-bgSensDivisor" data-setting="bgSensDivisor" data-default="10" min="1" max="100" step="1" value="10">
            <div class="range-hint">Všechny citlivosti níže se dělí touto hodnotou, než ovlivní pozadí. Vyšší dělitel = jemnější (méně citlivá) reakce na hudbu.</div>
          </div>
          </div></div>`);

// ── ui/templates/settings/page-background-effects ──
window.Aurora.registerTemplate("page-background-effects", `<div id="page-background-effects" class="settings-page"><div class="setting-block" id="sec-appearance-6">
          <h3 class="setting-subhead">Efekty pozadí (post-processing)</h3>
          <div class="range-hint">Aplikuje se na CELÉ pozadí (všechny vrstvy najednou) jako poslední krok, nad rámec vrstev a mapování výše.</div>

          <!-- TRAIL (per-layer toggle lives in each layer's gear panel;
               this is just the shared fade-rate knob, since all layers'
               trails render onto ONE shared canvas). -->
          <div class="range-row" style="margin-top:12px;">
            <div class="range-label-row"><span>Rychlost blednutí stopy (Trail)</span><strong id="val-trailFadeRate">12%</strong></div>
            <input type="range" id="ctl-trailFadeRate" data-setting="trailFadeRate" data-default="0.12" min="0.02" max="0.6" step="0.01" value="0.12">
            <div class="range-hint">Jak rychle stopa (trail) mizí mezi snímky — sdíleno všemi vrstvami, které mají Trail zapnutý (přepínač je v gear panelu dané vrstvy). Nižší = dlouho doznívající ocásky, vyšší = krátké čárky.</div>
          </div>

          <!-- SPARKLES -->
          <div class="toggle-row" style="margin-top:14px;">
            <span>Sparkles (třpytky)</span>
            <div class="switch" data-setting="sparklesEnabled" data-default="false" id="sw-sparklesEnabled"></div>
          </div>
          <div class="range-hint">Hlavní vypínač pro celý efekt třpytek. Které konkrétní vrstvy je skutečně vyzařují se nastavuje zvlášť v gear panelu dané vrstvy.</div>
          <div id="sparklesDetail" style="display:none; margin-top:8px;">
            <div class="range-row" style="margin-top:0;">
              <div class="range-label-row"><span>Hustota</span><strong id="val-sparklesRate">50%</strong></div>
              <input type="range" id="ctl-sparklesRate" data-setting="sparklesRate" data-default="0.5" min="0" max="2" step="0.01" value="0.5">
              <div class="range-hint">Kolik třpytek za sekundu se přibližně vytváří. Automaticky se dočasně zvýší při hlasitějších/energičtějších momentech (Flash).</div>
            </div>
            <div class="range-row">
              <div class="range-label-row"><span>Velikost</span><strong id="val-sparklesSize">100%</strong></div>
              <input type="range" id="ctl-sparklesSize" data-setting="sparklesSize" data-default="1" min="0.3" max="3" step="0.05" value="1">
            </div>
            <div class="range-row">
              <div class="range-label-row"><span>Délka života</span><strong id="val-sparklesLife">0.90s</strong></div>
              <input type="range" id="ctl-sparklesLife" data-setting="sparklesLife" data-default="0.9" min="0.2" max="3" step="0.05" value="0.9">
              <div class="range-hint">Jak dlouho jedna třpytka žije, než úplně zhasne.</div>
            </div>
          </div>

          <!-- MIRROR -->
          <div class="toggle-row" style="margin-top:14px;">
            <span>Zrcadlení (Mirror)</span>
            <div class="switch" data-setting="fxMirrorEnabled" data-default="false" id="sw-fxMirrorEnabled"></div>
          </div>
          <div id="fxMirrorDetail" style="display:none; margin-top:8px;">
            <div class="range-row" style="margin-top:0;">
              <div class="range-label-row"><span>Osa</span></div>
              <select class="map-select" id="ctl-fxMirrorAxis">
                <option value="x">Horizontální (zrcadlo vlevo/vpravo)</option>
                <option value="y">Vertikální (zrcadlo nahoře/dole)</option>
                <option value="both">Obě (4 kvadranty)</option>
              </select>
            </div>
            <div class="range-row">
              <div class="range-label-row"><span>Síla zrcadla</span><strong id="val-fxMirrorAmount">100%</strong></div>
              <input type="range" id="ctl-fxMirrorAmount" data-setting="fxMirrorAmount" data-default="1" min="0" max="1" step="0.01" value="1">
              <div class="range-hint">Průhlednost odraženého obrazu — 100 % = plné zrcadlo, méně = jemný duch navíc.</div>
            </div>
          </div>

          <!-- MIRROR 2 (druhý nezávislý mirror post-processing, stejná nastavení jako Mirror výše) -->
          <div class="toggle-row" style="margin-top:14px;">
            <span>Zrcadlení 2 (Mirror 2)</span>
            <div class="switch" data-setting="fxMirror2Enabled" data-default="false" id="sw-fxMirror2Enabled"></div>
          </div>
          <div id="fxMirror2Detail" style="display:none; margin-top:8px;">
            <div class="range-row" style="margin-top:0;">
              <div class="range-label-row"><span>Osa</span></div>
              <select class="map-select" id="ctl-fxMirror2Axis">
                <option value="x">Horizontální (zrcadlo vlevo/vpravo)</option>
                <option value="y">Vertikální (zrcadlo nahoře/dole)</option>
                <option value="both">Obě (4 kvadranty)</option>
              </select>
            </div>
            <div class="range-row">
              <div class="range-label-row"><span>Síla zrcadla</span><strong id="val-fxMirror2Amount">100%</strong></div>
              <input type="range" id="ctl-fxMirror2Amount" data-setting="fxMirror2Amount" data-default="1" min="0" max="1" step="0.01" value="1">
              <div class="range-hint">Nezávislý druhý mirror efekt — funguje stejně jako Mirror výše, jen s vlastní osou a silou. Lze kombinovat s prvním mirrorem najednou (např. Mirror 1 = X, Mirror 2 = Y pro efekt 4 kvadrantů se dvěma různými sílami).</div>
            </div>
          </div>

          <!-- GLITCH -->
          <div class="toggle-row" style="margin-top:14px;">
            <span>Glitch</span>
            <div class="switch" data-setting="fxGlitchEnabled" data-default="false" id="sw-fxGlitchEnabled"></div>
          </div>
          <div id="fxGlitchDetail" style="display:none; margin-top:8px;">
            <div class="range-row" style="margin-top:0;">
              <div class="range-label-row"><span>Frekvence záseků</span><strong id="val-fxGlitchFreq">Střední</strong></div>
              <input type="range" id="ctl-fxGlitchFreq" data-setting="fxGlitchFreq" data-default="0.4" min="0.02" max="1" step="0.01" value="0.4">
            </div>
            <div class="range-row">
              <div class="range-label-row"><span>Síla posunu pruhů</span><strong id="val-fxGlitchAmount">28px</strong></div>
              <input type="range" id="ctl-fxGlitchAmount" data-setting="fxGlitchAmount" data-default="28" min="4" max="90" step="1" value="28">
            </div>
            <div class="range-row">
              <div class="range-label-row"><span>Doba trvání záseku</span><strong id="val-fxGlitchDuration">180ms</strong></div>
              <input type="range" id="ctl-fxGlitchDuration" data-setting="fxGlitchDuration" data-default="180" min="60" max="500" step="10" value="180">
            </div>
            <div class="toggle-row" style="margin-top:8px;">
              <span style="font-size:11.5px; color:var(--text-dim);">Spouštěj na Flash (beat)</span>
              <div class="switch" data-setting="fxGlitchOnBeat" data-default="true" id="sw-fxGlitchOnBeat"></div>
            </div>
            <div class="range-hint">Zapnuto = glitch se soustředí kolem hudebních flashů/beatů místo čistě náhodného časování. Každý zásek posune několik vodorovných pruhů obrazu do strany a rozdělí barevné kanály — jako výpadek signálu, ne jen barevné vločky.</div>
          </div>

          <!-- SCREEN FLASH -->
          <!-- VIGNETTE / SCANLINES / OVERALL VISIBILITY -->
          <div class="range-row" style="margin-top:14px;">
            <div class="range-label-row"><span>Viněta (ztmavení okrajů)</span><strong id="val-fxVignette">0%</strong></div>
            <input type="range" id="ctl-fxVignette" data-setting="fxVignette" data-default="0" min="0" max="1" step="0.01" value="0">
          </div>
          <div class="range-row">
            <div class="range-label-row"><span>Scanlines</span><strong id="val-fxScanlines">0%</strong></div>
            <input type="range" id="ctl-fxScanlines" data-setting="fxScanlines" data-default="0" min="0" max="1" step="0.01" value="0">
            <div class="range-hint">Jemné vodorovné linky přes celé pozadí, jako starý CRT monitor.</div>
          </div>
          </div>

        <div class="setting-block" id="sec-appearance-7">
          <h3 class="setting-subhead">Barevné korekce</h3>
          <div class="range-hint">Aplikuje se jako poslední, nad rámec všeho výše (vrstvy, zrcadlo, glitch, viněta, scanlines).</div>
          <div class="range-row" style="margin-top:10px;">
            <div class="range-label-row"><span>Jas</span><strong id="val-fxBrightness">100%</strong></div>
            <input type="range" id="ctl-fxBrightness" data-setting="fxBrightness" data-default="1" min="0" max="3" step="0.01" value="1">
          </div>

          <div class="range-row">
            <div class="range-label-row"><span>Kontrast</span><strong id="val-fxContrast">100%</strong></div>
            <input type="range" id="ctl-fxContrast" data-setting="fxContrast" data-default="1" min="0" max="3" step="0.01" value="1">
          </div>
          <div class="range-row">
            <div class="range-label-row"><span>Sytost barev</span><strong id="val-fxSaturation">100%</strong></div>
            <input type="range" id="ctl-fxSaturation" data-setting="fxSaturation" data-default="1" min="0" max="3" step="0.01" value="1">
          </div>
          <div class="range-row">
            <div class="range-label-row"><span>Otočení odstínu (hue)</span><strong id="val-fxHue">0°</strong></div>
            <input type="range" id="ctl-fxHue" data-setting="fxHue" data-default="0" min="0" max="360" step="1" value="0">
          </div>
        </div>
        </div>`);

// ── ui/templates/settings/page-background-comfort ──
window.Aurora.registerTemplate("page-background-comfort", `<div id="page-background-comfort" class="settings-page"><div class="setting-block" id="sec-reactivity-4"><h3>Redukce bolesti hlavy</h3><div class="toggle-row">
            <span>Flashování (jas)</span>
            <div class="switch" data-setting="reduceFlashIntensity" data-default="false" id="sw-reduceFlashIntensity"></div>
          </div>
          <div class="range-hint">Zapnuto = vydělí dvěma výsledek mapování "Flashování (jas)" — sdíleného i jakéhokoliv per-vrstva override — takže probleskování je citelně mírnější.</div>
          <div class="toggle-row">
            <span>Klidnější změny barev</span>
            <div class="switch" data-setting="reduceColorSpeedIntensity" data-default="false" id="sw-reduceColorSpeedIntensity"></div>
          </div>
          <div class="range-hint">Zapnuto = vydělí dvěma výsledek mapování "Rychlost změny spektra" — sdíleného i jakéhokoliv per-vrstva override v režimu "Rotace odstínu" — takže míhání barev je citelně mírnější. Nemá vliv na vrstvy s override v režimu "Barva přehrávače"/"Vlastní barva", ty se stejně nerotují.</div>
        </div></div>`);

// ── ui/templates/settings/page-island-timeline ──
window.Aurora.registerTemplate("page-island-timeline", `<div id="page-island-timeline" class="settings-page"><div class="setting-block" id="sec-cards-3"><h3>Časová osa (timeline)</h3><h4 class="setting-subhead">Tvar a rozměry</h4>
          <div style="font-size:11px; color:var(--text-dim); margin-top:4px; margin-bottom:2px; line-height:1.4;" class="">Timeline (progress bar) je samostatný plovoucí panel nad hlavní ovládací lištou — stejné sklo/materiál, včetně efektu spektrogramu prosvítajícího skrz, když je zapnutý.</div>
          <div class="toggle-row" style="margin-top:10px;">
            <span>Spojený vzhled s ovládací lištou</span>
            <div class="switch on" data-setting="timelineIslandMerged" data-default="true" id="sw-timelineIslandMerged"></div>
          </div>
          <div style="font-size:11px; color:var(--text-dim); margin-top:4px; margin-bottom:2px; line-height:1.4;" class="">Zapnuto = timeline panel je mírně užší, bez mezery a se čtvercovými spodními rohy, takže vizuálně splývá s hlavní lištou pod ním. Vypnuto = původní vzhled — timeline stejně široká jako lišta, plně zaoblená, s mezerou nastavitelnou níže.</div>
          <div class="range-row">
            <div class="range-label-row"><span>Výška panelu</span><strong id="val-timelineIslandHeight">56px</strong></div>
            <input type="range" id="ctl-timelineIslandHeight" data-setting="timelineIslandHeight" data-default="56" min="24" max="120" step="1" value="56">
          </div>
          <div class="range-row" id="timelineIslandGapRow" style="display:none;">
            <div class="range-label-row"><span>Mezera od hlavní lišty</span><strong id="val-timelineIslandGap">14px</strong></div>
            <input type="range" id="ctl-timelineIslandGap" data-setting="timelineIslandGap" data-default="14" min="0" max="80" step="1" value="14">
          </div>
          <div class="range-row" id="timelineIslandInsetRow">
            <div class="range-label-row"><span>Zúžení oproti hlavní liště</span><strong id="val-timelineIslandInset">20px</strong></div>
            <input type="range" id="ctl-timelineIslandInset" data-setting="timelineIslandInset" data-default="20" min="0" max="120" step="1" value="20">
            <div class="range-hint">O kolik pixelů (na každou stranu) je timeline užší než hlavní ovládací lišta pod ní. 0 = stejně široká.</div>
          </div>
          <div class="range-row" id="timelineIslandOverlapRow">
            <div class="range-label-row"><span>Zapuštění pod hlavní lištu</span><strong id="val-timelineIslandOverlap">10px</strong></div>
            <input type="range" id="ctl-timelineIslandOverlap" data-setting="timelineIslandOverlap" data-default="10" min="0" max="40" step="1" value="10">
            <div class="range-hint">O kolik pixelů timeline zajíždí POD horní okraj hlavní lišty, aby mezi nimi nezůstala žádná mezera/díra ani při zaoblených rozích. Vyšší hodnota = víc se schová, jistější spojení.</div>
          </div>
        <h4 class="setting-subhead">Ukazatel času u timeline</h4>
          <div class="range-row" style="margin-top:0;">
            <div class="toggle-row">
              <span>Ukazatel času u timeline</span>
              <div class="switch" data-setting="timelineTimeLabelEnabled" data-default="false" id="sw-timelineTimeLabelEnabled"></div>
            </div>
            <div class="range-hint">Zobrazí čas přímo vedle timeline panelu (mimo panel, ne přes něj), nezávisle na ukazateli času v hlavní ovládací liště.</div>
          </div>
          <div class="range-row" id="timelineTimeLabelSideRow" style="display:none;">
            <div class="range-label-row"><span>Strana</span></div>
            <select class="map-select" id="ctl-timelineTimeLabelSide">
              <option value="left">Vlevo od timeline</option>
              <option value="right">Vpravo od timeline</option>
            </select>
          </div>
        <h4 class="setting-subhead">Wave animace timeline</h4>
          <div class="range-row" style="margin-top:0;">
            <div class="toggle-row">
              <span>Wave animace timeline</span>
              <div class="switch on" data-setting="timelineWave" data-default="true"></div>
            </div>
            <div class="range-hint">Čára pod kurzorem se vlní nahoru jako gaussova křivka. Vypnutí vrátí klasickou plochou lištu.</div>
          </div>
          <div class="range-row">
            <div class="range-label-row"><span>Síla wave efektu</span><strong id="val-timelineWavePeak">35%</strong></div>
            <input type="range" id="ctl-timelineWavePeak" data-setting="timelineWavePeak" data-default="0.35" min="0.05" max="10" step="0.01" value="0.35">
          </div>
          <div class="range-row">
            <div class="range-label-row"><span>Šířka wave efektu (sigma)</span><strong id="val-timelineSigma">0.055</strong></div>
            <input type="range" id="ctl-timelineSigma" data-setting="timelineSigma" data-default="0.055" min="0.004" max="0.25" step="0.001" value="0.055">
            <div class="range-hint">Nižší = úzký ostrý hrb pod kurzorem, vyšší = široká plynulá vlna přes velkou část lišty.</div>
          </div>
          <div class="range-row">
            <div class="toggle-row" style="margin-top:12px;">
              <span>Symetrická vlna</span>
              <div class="switch" data-setting="timelineWaveSymmetry" data-default="false"></div>
            </div>
            <div class="range-hint">Zapnuto = vlna se zvedá stejně na obě strany od kurzoru. Vypnuto (výchozí) = vlna reaguje jen směrem doprava od kurzoru.</div>
          </div>
        </div></div>`);

// ── ui/templates/settings/page-island-waveform ──
window.Aurora.registerTemplate("page-island-waveform", `<div id="page-island-waveform" class="settings-page"><div class="setting-block" id="sec-timeline-waveform"><h4 class="setting-subhead">Křivka hlasitosti nad ní</h4>
          <div class="range-row" style="margin-top:0;">
            <div class="toggle-row">
              <span>Křivka hlasitosti (jako YouTube)</span>
              <div class="switch on" data-setting="timelineLoudnessWaveform" data-default="true"></div>
            </div>
            <div class="range-hint">Bílá křivka nad timeline podle normalizované hlasitosti skladby — podobně jako "most replayed" na YouTube. Zobrazí se při najetí myší na timeline. Spočítá se automaticky při přehrání nebo analýze.</div>
          </div>
          <div class="range-row">
            <div class="toggle-row">
              <span>Zobrazovat trvale</span>
              <div class="switch" data-setting="timelineWaveformAlwaysVisible" data-default="false" id="sw-timelineWaveformAlwaysVisible"></div>
            </div>
            <div class="range-hint">Zapnuto = křivka je vidět pořád, i bez najetí myší na timeline. Vypnuto (výchozí) = křivka se objeví jen při hoveru a jinak zůstává skrytá.</div>
          </div>
          <div class="range-row">
            <div class="range-label-row"><span>Výška křivky</span><strong id="val-timelineWaveformHeight">1.0×</strong></div>
            <input type="range" id="ctl-timelineWaveformHeight" data-setting="timelineWaveformHeight" data-default="1" min="0.2" max="6" step="0.05" value="1">
            <div class="range-hint">Jak vysoko křivka sahá nad progress bar. 1× = výchozí, vyšší = výraznější.</div>
          </div>
          <div class="range-row">
            <div class="range-label-row"><span>Síla (měřítko na ose Y)</span><strong id="val-timelineWaveformScale">1.00×</strong></div>
            <input type="range" id="ctl-timelineWaveformScale" data-setting="timelineWaveformScale" data-default="1" min="0.1" max="4" step="0.05" value="1">
            <div class="range-hint">Nezávisle na Výšce křivky škáluje tvar samotné křivky — nižší hodnoty = plošší, decentnější tvar, vyšší = tišší pasáže vypadají výrazněji hlasitě.</div>
          </div>
          <div class="range-row">
            <div class="range-label-row"><span>Odstup křivky od lišty</span><strong id="val-timelineWaveformOffset">3px</strong></div>
            <input type="range" id="ctl-timelineWaveformOffset" data-setting="timelineWaveformOffset" data-default="3" min="-40" max="40" step="1" value="3">
            <div class="range-hint">Mezera mezi spodním okrajem křivky a samotnou timeline lištou pod ní. Záporná hodnota posune křivku dolů, klidně až přes/pod lištu.</div>
          </div>
          <div class="range-row">
            <div class="range-label-row"><span>Vyhlazení křivky (živě)</span><strong id="val-timelineWaveformSmooth">1.00×</strong></div>
            <input type="range" id="ctl-timelineWaveformSmooth" data-setting="timelineWaveformSmooth" data-default="1" min="0" max="3" step="0.05" value="1">
            <div class="range-hint">Vyhlazuje tvar křivky při vykreslování — funguje okamžitě na už uložených datech, žádná skladba se nemusí přeanalyzovat. 0 = syrový, hranatější tvar; vyšší = plynulejší, zaoblenější.</div>
          </div>
          <div class="range-row">
            <div class="range-label-row"><span>Hustota vzorků (analýza)</span><strong id="val-timelineWaveformSamplesPerSec">1.0/s</strong></div>
            <input type="range" id="ctl-timelineWaveformSamplesPerSec" data-setting="timelineWaveformSamplesPerSec" data-default="1" min="0.2" max="8" step="0.1" value="1">
            <div class="range-hint">Kolik hodnot hlasitosti za vteřinu se zaznamená při analýze skladby — víc vzorků = detailnější/členitější křivka, míň = hrubší. Projeví se jen na NOVĚ analyzovaných skladbách; už uložené profily si drží svou starou křivku, dokud se skladba znovu neanalyzuje (např. po vymazání uložených dat prohlížeče pro tuto stránku).</div>
          </div>
        </div></div>`);

// ── ui/templates/settings/page-island-spectrum ──
window.Aurora.registerTemplate("page-island-spectrum", `<div id="page-island-spectrum" class="settings-page"><div class="setting-block" id="sec-live-2">
          <h3>Spektrogram (waterfall)</h3>
          <div class="toggle-row" style="margin-top:10px;">
            <span>Zobrazit</span>
            <div class="switch" data-setting="specEnabled" data-default="false" id="sw-specEnabled"></div>
          </div>
          <div class="range-hint">Realtime waterfall — jen historie skladby, doleva od "teď". Žádná predikce budoucnosti, playhead je vždy úplně vpravo (na "teď").</div>
        </div>

        <div class="setting-block" id="sec-live-3">
          <h3>Umístění</h3>
          <div class="toggle-row" style="margin-top:10px;">
            <span>Jen uvnitř ovládacího panelu</span>
            <div class="switch" data-setting="specInsideIsland" data-default="false" id="sw-specInsideIsland"></div>
          </div>
          <div class="range-hint">Zapnuto = waterfall se vykresluje POUZE uvnitř skleněného ovládacího panelu (nesahá přes celou obrazovku) — panel funguje jako okno do spektrogramu. Vypnuto = pruh přes celou šířku obrazovky (výchozí chování).</div>

          <div class="settings-detail-content"><h4 class="setting-subhead">Jemné doladění</h4><div class="range-row" id="specBothPanelsRow" style="display:none;">
            <div class="toggle-row">
              <span style="font-size:12.5px;">Vykreslovat i v timeline panelu</span>
              <div class="switch on" data-setting="specInsideIslandBothPanels" data-default="true" id="sw-specInsideIslandBothPanels"></div>
            </div>
            <div class="range-hint">Vypnuto = waterfall se kreslí jen v hlavní ovládací liště, ne znovu i v samostatném timeline panelu nad ní — ušetří to vykreslování stejných dat podruhé, když ho tam beztak nepotřebuješ.</div>
          </div>

          <div class="range-row" style="margin-top:0;">
            <div class="range-label-row"><span>Pozice "teď" (playhead)</span></div>
            <select class="map-select" id="ctl-specAnchor">
              <option value="right">Vpravo (okraj obrazovky/panelu)</option>
              <option value="center">Uprostřed obrazovky/panelu</option>
            </select>
            <div class="range-hint">Kde na pruhu sedí aktuální okamžik ("teď"). Vpravo = klasický waterfall, historie jede zprava doleva přes celou šířku. Uprostřed = "teď" je vždy na středu pruhu.</div>
          </div>
          <div class="toggle-row" style="margin-top:12px;">
            <span>Symetrické vykreslování</span>
            <div class="switch" data-setting="specSymmetric" data-default="false" id="sw-specSymmetric"></div>
          </div>
          <div style="font-size:11px; color:var(--text-dim); margin-top:4px; line-height:1.4;" class="">Zapnuto = historie se navíc zrcadlově vykresluje i na druhou stranu od "teď" (hezké při pozici uprostřed). Vypnuto = historie jede jen jedním směrem (doleva od "teď"), jako klasický waterfall.</div>
        </div></div>

        <div class="setting-block" id="sec-live-4">
          <h3>Rozměry &amp; rychlost</h3>
          <div class="range-row">
            <div class="range-label-row"><span>Výška pruhu</span><strong id="val-specHeight">300px</strong></div>
            <input type="range" id="ctl-specHeight" data-setting="specHeight" data-default="300" min="80" max="700" step="10" value="300">
            <div class="range-hint">Celková výška waterfall pruhu (max velikost na ose Y), centrovaná na střed ovládacího panelu. Ignorováno, když je zapnuté "Jen uvnitř ovládacího panelu" — tam výška odpovídá panelu.</div>
          </div>
          <div class="range-row">
            <div class="range-label-row"><span>Roztažení (px/s)</span><strong id="val-specPxPerSec">70</strong></div>
            <input type="range" id="ctl-specPxPerSec" data-setting="specPxPerSec" data-default="70" min="10" max="260" step="2" value="70">
            <div class="range-hint">Jak rychle waterfall ujíždí = kolik pixelů odpovídá jedné sekundě hudby. Vyšší = rychlejší posun a vidíš méně sekund najednou, ale detailněji.</div>
          </div>
          <div class="range-row">
            <div class="toggle-row">
              <span>Vyplnit celou šířku</span>
              <div class="switch on" data-setting="specFillWidth" data-default="true" id="sw-specFillWidth"></div>
            </div>
            <div class="range-hint">Zapnuto = historie automaticky pokryje celou dostupnou šířku pruhu/panelu (spočítáno ze skutečné šířky a Roztažení px/s), takže waterfall vyplní obrazovku od kraje ke kraji místo aby zůstal prázdný pruh vlevo. Vypnuto = použije se pevná délka historie nastavená níže.</div>
          </div>
          <div class="range-row" id="specHistorySecRow" style="display:none;">
            <div class="range-label-row"><span>Historie vzadu (s)</span><strong id="val-specHistorySec">14</strong></div>
            <input type="range" id="ctl-specHistorySec" data-setting="specHistorySec" data-default="14" min="2" max="60" step="1" value="14">
            <div class="range-hint">Kolik sekund minulosti zůstává na obrazovce vlevo od "teď" (playhead), než zmizí za okrajem.</div>
          </div>
          <div class="range-row">
            <div class="toggle-row">
              <span>Playhead zarovnaná ke konci playlistu</span>
              <div class="switch" data-setting="specPlaylistOffset" data-default="false" id="sw-specPlaylistOffset"></div>
            </div>
            <div class="range-hint">Zapnuto = "teď" (playhead) se zarovná přesně tam, kde končí panel playlistu (když je otevřený) — waterfall pak jede vlevo od playlistu, ne pod ním schovaný. Když je playlist zavřený, playhead se automaticky posune k pravému okraji celé obrazovky. Ignorováno, když je "Pozice teď" nastavena na Uprostřed.</div>
          </div>
        </div>

        <div class="setting-block" id="sec-live-7">
          <h3>Barvy</h3>
          <div class="range-row" style="margin-top:0;">
            <div class="range-label-row"><span>Paleta</span></div>
            <select class="map-select" id="ctl-specPalette">
              <option value="player">Barvy přehrávače (gradient)</option>
              <option value="heatmap">Heatmapa (modrá → fialová → růžová → žlutá)</option>
            </select>
          </div><div class="range-row"><div class="range-label-row"><span>Posun odstínu spektrogramu</span><strong id="val-specHueOffset"></strong></div><input type="range" id="ctl-specHueOffset" data-setting="specHueOffset" min="-180" max="180" step="1" value="0"></div>
          <div class="range-hint" data-help-for="specPalette">Heatmapa dává nejlepší kontrast a čitelnost pro rychlé pasáže. Gradient přehrávače ladí barevně s UI, ale je hůř čitelný u hustšího spektra.</div>
        </div>

        <div class="setting-block" id="sec-live-8">
          <h3 class="setting-subhead">Ovládací panel nad spektrogramem</h3>
          <div class="range-row">
            <div class="range-label-row"><span>Viditelnost spektrogramu ve skle</span><strong id="val-specIslandVisibility">100%</strong></div>
            <input type="range" id="ctl-specIslandVisibility" data-setting="specIslandVisibility" data-default="1" min="0" max="1" step="0.01" value="1">
            <div class="range-hint">Průhlednost samotného waterfallu, jak prosvítá skrz sklo panelu (nezávisle na Průhlednosti/Blur panelu výše). Nižší = waterfall skrz sklo jen náznakem, vyšší = plně viditelný.</div>
          </div>
        <div class="settings-detail-content"><h4 class="setting-subhead">Jemné doladění</h4><div class="toggle-row" style="margin-top:10px;">
            <span>Sklo efekt (warp pod panelem)</span>
            <div class="switch on" data-setting="specGlassMode" data-default="true" id="sw-specGlassMode"></div>
          </div>
          <div style="font-size:11px; color:var(--text-dim); margin-top:4px; margin-bottom:10px; line-height:1.4;" class="">Zapnuto = ovládací panel zprůhlední a ztlumí svůj blur, takže waterfall skrz něj viditelně prosvítá jako přes matné sklo, navíc s jemnou zářící "kompresní" linkou přesně za panelem — jako by ho tam hudba protlačovala.</div>
          <div class="range-row" style="\${''}">
            <div class="range-label-row"><span>Průhlednost panelu (sklo)</span><strong id="val-specGlassAlpha">32%</strong></div>
            <input type="range" id="ctl-specGlassAlpha" data-setting="specGlassAlpha" data-default="0.32" min="0.05" max="0.7" step="0.01" value="0.32">
          </div>
          <div class="range-row">
            <div class="range-label-row"><span>Blur panelu (sklo)</span><strong id="val-specGlassBlur">9px</strong></div>
            <input type="range" id="ctl-specGlassBlur" data-setting="specGlassBlur" data-default="9" min="0" max="26" step="1" value="9">
          </div>
          <div class="range-row">
            <div class="range-label-row"><span>Síla záře za panelem</span><strong id="val-specGlowStrength">100%</strong></div>
            <input type="range" id="ctl-specGlowStrength" data-setting="specGlowStrength" data-default="1" min="0" max="2" step="0.05" value="1">
          </div>
          </div></div>
      <div class="setting-block" id="sec-live-5">
          <h3>Frekvenční rozsah</h3>
          <div class="range-row">
            <div class="range-label-row"><span>Min. frekvence</span><strong id="val-specFreqMin">20 Hz</strong></div>
            <input type="range" id="ctl-specFreqMin" data-setting="specFreqMin" data-default="20" min="0" max="2000" step="10" value="20">
          </div>
          <div class="range-row">
            <div class="range-label-row"><span>Max. frekvence</span><strong id="val-specFreqMax">16000 Hz</strong></div>
            <input type="range" id="ctl-specFreqMax" data-setting="specFreqMax" data-default="16000" min="1000" max="22000" step="100" value="16000">
          </div>
          <div class="range-row">
            <div class="toggle-row">
              <span>Logaritmická osa Y</span>
              <div class="switch on" data-setting="specLogScale" data-default="true"></div>
            </div>
            <div class="range-hint">Zapnuto = basy zabírají větší část výšky pruhu (jako u skutečných spektrogramů/sluchu), vypnuto = lineární rozestup frekvencí.</div>
          </div>
        </div>

        <div class="setting-block" id="sec-live-6">
          <h3>Citlivost &amp; vyhlazení</h3>
          <div class="range-row">
            <div class="range-label-row"><span>Zesílení intenzity</span><strong id="val-specGain">1.10×</strong></div>
            <input type="range" id="ctl-specGain" data-setting="specGain" data-default="1.1" min="0.2" max="5" step="0.05" value="1.1">
          </div>
          <div class="range-row">
            <div class="range-label-row"><span>Gamma (kontrast)</span><strong id="val-specGamma">1.60</strong></div>
            <input type="range" id="ctl-specGamma" data-setting="specGamma" data-default="1.6" min="0.3" max="4" step="0.05" value="1.6">
            <div class="range-hint">Vyšší = potlačí slabý šum a jen skutečně silná místa svítí (čitelnější). Nižší = i slabá pásma jasně vidět, ale obraz je vycpanější a méně čitelný.</div>
          </div>
          <div class="range-row">
            <div class="range-label-row"><span>Celkové rozostření</span><strong id="val-specSmoothBlur">0px</strong></div>
            <input type="range" id="ctl-specSmoothBlur" data-setting="specSmoothBlur" data-default="0" min="0" max="10" step="0.5" value="0">
            <div class="range-hint">Jemný blur přes celý waterfall, aby vodorovné pruhy a hrany mezi sloupci nebyly tak ostré/pixelové a obraz působil hladčeji.</div>
          </div>
</div><div class="setting-block" id="sec-spectrum-fades"><h3>Zjemnění okrajů</h3>
          <div class="range-row">
            <div class="range-label-row" data-advanced="true"><span>Rozostření okraje historie</span><strong id="val-specEdgeFade">0%</strong></div>
            <input data-advanced="true" type="range" id="ctl-specEdgeFade" data-setting="specEdgeFade" data-default="0" min="0" max="1" step="0.01" value="0">
            <div class="range-hint" data-advanced="true">Zjemní ostrý přechod na okraji dat waterfallu — místo tvrdého konce dat plynule dozní do průhledna. Které straně(ám) se to aplikuje, vyber přepínači níže.</div>
            <div class="toggle-row" style="margin-top:10px;">
              <span style="font-size:12.5px;">Zleva (nejstarší data)</span>
              <div class="switch on" data-setting="specEdgeFadeLeft" data-default="true" id="sw-specEdgeFadeLeft"></div>
            </div>
            <div class="toggle-row" style="margin-top:8px;">
              <span style="font-size:12.5px;">Zprava</span>
              <div class="switch" data-setting="specEdgeFadeRight" data-default="false" id="sw-specEdgeFadeRight"></div>
            </div>
          </div>
          <div class="range-row">
            <div class="range-label-row"><span>Síla horního/spodního rozostření</span><strong id="val-specEdgeFadeVAmount">20%</strong></div>
            <input type="range" id="ctl-specEdgeFadeVAmount" data-setting="specEdgeFadeVAmount" data-default="0.2" min="0" max="1" step="0.01" value="0.2">
            <div class="range-hint">Nezávislé na rozostření okraje historie výše — jen zjemní horní a/nebo spodní hranu pruhu, ať už zapneš cokoliv z toho níže.</div>
            <div class="toggle-row" style="margin-top:10px;">
              <span style="font-size:12.5px;">Nahoře</span>
              <div class="switch" data-setting="specEdgeFadeTop" data-default="false" id="sw-specEdgeFadeTop"></div>
            </div>
            <div class="toggle-row" style="margin-top:8px;">
              <span style="font-size:12.5px;">Dole</span>
              <div class="switch" data-setting="specEdgeFadeBottom" data-default="false" id="sw-specEdgeFadeBottom"></div>
            </div>
          </div>
        </div>

        </div>`);

// ── ui/templates/settings/page-data-profiles ──
window.Aurora.registerTemplate("page-data-profiles", `<div id="page-data-profiles" class="settings-page"><div class="setting-block" id="sec-data-2">
          <h3>Celé nastavení (vše)</h3>
          <div class="range-hint">Exportuje/importuje úplně všechno: vrstvy pozadí, tvary, MusicSense mapování, křivky, citlivosti, barvy — celý stav aplikace v jednom JSON souboru. Profily hlasitosti (LUFS) se exportují zvlášť v sekci Uložené profily.</div>
          <div class="export-import-row">
            <button type="button" class="settings-action" id="btnExportAllSettings">
              <svg viewbox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="M7 10l5 5 5-5"></path><path d="M12 15V3"></path></svg>
              Export JSON
            </button>
            <button type="button" class="settings-action" id="btnImportAllSettings">
              <svg viewbox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="M17 8l-5-5-5 5"></path><path d="M12 3v12"></path></svg>
              Import JSON
            </button>
          </div>
          <input type="file" id="allSettingsImportInput" accept="application/json,.json" style="display:none">
        </div><div class="setting-block" id="sec-data-1">
          <h3>Uložené profily</h3>
          <div class="profile-stat-row"><span>Analyzováno skladeb</span><strong id="profileCount">0</strong></div>
          <div class="range-hint">Profily hlasitosti (LUFS) se ukládají v prohlížeči (localStorage) podle přesného názvu souboru. Přetrvávají mezi relacemi.</div>
          <div class="toggle-row" style="margin-top:12px;">
            <span>Cachovat křivku hlasitosti (waveform)</span>
            <div class="switch on" data-setting="cacheWaveform" data-default="true" id="sw-cacheWaveform"></div>
          </div>
          <div class="range-hint">Zapnuto (výchozí) = per-second data křivky hlasitosti se ukládají do localStorage spolu s LUFS profilem — méně dat na přepočet, ale větší localStorage. Vypnuto = křivka se počítá real-time při každém přehrání a nikam se neukládá (LUFS profil se ukládá stále).</div>
          <div class="export-import-row">
            <button type="button" class="settings-action" id="btnExportProfiles">
              <svg viewbox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="M7 10l5 5 5-5"></path><path d="M12 15V3"></path></svg>
              Export JSON
            </button>
            <button type="button" class="settings-action" id="btnImportProfiles">
              <svg viewbox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="M17 8l-5-5-5 5"></path><path d="M12 3v12"></path></svg>
              Import JSON
            </button>
          </div>
          <input type="file" id="profileImportInput" accept="application/json,.json" style="display:none">
        </div></div>`);

// Performance diagnostics belong with data export, not playback preferences.
window.Aurora.registerTemplate("page-data-performance", `<div id="page-data-performance" class="settings-page">
  <div class="setting-block" id="sec-data-performance">
    <h3>Měření výkonu</h3>
    <p class="range-hint">Změří plynulost přehrávače během 60 sekund. Po spuštění máte 10 sekund na zavření nastavení.</p>
    <p class="range-hint">Před měřením načtěte alespoň 100 skladeb, pusťte hudbu a zapněte pozadí i vizualizér. Během testu nechte okno viditelné a neměňte nastavení.</p>
    <div class="settings-action-row">
      <button type="button" class="settings-action" id="runPerformanceTest"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4v16h16M8 14l4-5 4 3 4-7"/></svg>Změřit výkon (60 s)</button>
      <button type="button" class="settings-action" id="savePerformanceTest" hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>Exportovat měření JSON</button>
    </div>
    <p class="range-hint settings-action-status" id="performanceTestStatus" role="status" aria-live="polite"></p>
  </div>
</div>`);

// ── ui/templates/shell ──
window.Aurora.registerTemplate("shell", `

<div id="app">
  @@AURORA:stage@@

  @@AURORA:timeline@@
  <div id="timelineIslandExtension"></div>

  @@AURORA:player-controls@@

  @@AURORA:playlist@@
</div>

<input type="file" id="fileInput" accept="audio/*,.mp3" multiple>
<input type="file" id="folderInput" webkitdirectory directory multiple>

<audio id="audio" crossorigin="anonymous"></audio>

`);

window.Aurora.registerTemplate("page-visualizers-general", `<div id="page-visualizers-general" class="settings-page"><div class="setting-block"><h3>Vizualizéry</h3><div class="range-row"><div class="range-label-row"><span>Aktivní vizualizér</span></div><select id="ctl-vizMode" data-extra-select="vizMode"><option value="none">Vypnuto</option><option value="equalizer">Equalizér</option><option value="wave">Vlna</option><option value="ring">Kruh</option></select></div>
<div class="range-row"><div class="range-label-row"><span>Viditelnost</span><strong id="val-vizOpacity"></strong></div><input type="range" id="ctl-vizOpacity" data-setting="vizOpacity" min="0" max="1" step="0.05" value="1"></div>
<div class="range-row"><div class="range-label-row"><span>Snímky za sekundu</span><strong id="val-vizFps"></strong></div><input type="range" id="ctl-vizFps" data-setting="vizFps" min="15" max="240" step="1" value="60"></div></div>
<div class="setting-block"><h3>Barvy a povrch</h3><div class="range-row"><div class="range-label-row"><span>Color source</span></div><select id="ctl-vizColorMode" data-extra-select="vizColorMode"><option value="theme">Follow player colors</option><option value="static">Static color</option></select></div>
<div class="color-row" id="vizColorSwatches"></div>
<div class="custom-color-wrap"><span id="vizColorPreview" class="swatch"></span><input type="text" id="ctl-vizStaticColor" data-extra-select="vizStaticColor" value="#55eaff" maxlength="7" spellcheck="false" aria-label="Visualizer color" placeholder="#RRGGBB"></div>
<div class="range-row"><div class="range-label-row"><span>Surface style</span></div><select id="ctl-vizSurface" data-extra-select="vizSurface"><option value="solid">Solid</option><option value="outline">Outline / transparent</option><option value="glass">Tinted glass</option></select></div></div>
<div class="setting-block"><h3>Reakce na hudbu</h3><p class="hint">Threshold boost is evaluated per band. Quiet bands keep their normal sensitivity; attack and release smooth the boost. For Wave, the threshold follows local waveform amplitude.</p>
<div class="toggle-row"><span>Per-band threshold boost</span><div class="switch" id="sw-vizResponseEnabled" data-setting="vizResponseEnabled"></div></div>
<div class="range-row"><div class="range-label-row"><span>Band level threshold</span><strong id="val-vizResponseThreshold"></strong></div><input type="range" id="ctl-vizResponseThreshold" data-setting="vizResponseThreshold" min="0" max="0.95" step="0.05" value="0.8"></div>
<div class="range-row"><div class="range-label-row"><span>Maximum band boost</span><strong id="val-vizResponseBoost"></strong></div><input type="range" id="ctl-vizResponseBoost" data-setting="vizResponseBoost" min="1" max="8" step="0.1" value="3"></div>
<div class="range-row"><div class="range-label-row"><span>Boost attack</span><strong id="val-vizBoostAttack"></strong></div><input type="range" id="ctl-vizBoostAttack" data-setting="vizBoostAttack" min="5" max="500" step="5" value="50"></div>
<div class="range-row"><div class="range-label-row"><span>Boost release</span><strong id="val-vizBoostRelease"></strong></div><input type="range" id="ctl-vizBoostRelease" data-setting="vizBoostRelease" min="20" max="2000" step="20" value="300"></div></div></div>`);

window.Aurora.registerTemplate("page-visualizers-equalizer", `<div id="page-visualizers-equalizer" class="settings-page"><div class="setting-block"><h3>Equalizér</h3><div class="range-row"><div class="range-label-row"><span>Počet sloupců</span><strong id="val-vizEqCount"></strong></div><input type="range" id="ctl-vizEqCount" data-setting="vizEqCount" min="16" max="128" step="8" value="64"></div>
<div class="range-row"><div class="range-label-row"><span>Výška</span><strong id="val-vizEqHeight"></strong></div><input type="range" id="ctl-vizEqHeight" data-setting="vizEqHeight" min="0.1" max="0.7" step="0.05" value="0.7"></div>
<div class="range-row"><div class="range-label-row"><span>Citlivost</span><strong id="val-vizEqGain"></strong></div><input type="range" id="ctl-vizEqGain" data-setting="vizEqGain" min="0.2" max="3" step="0.1" value="1"></div>
<div class="range-row"><div class="range-label-row"><span>Vyhlazení</span><strong id="val-vizEqSmooth"></strong></div><input type="range" id="ctl-vizEqSmooth" data-setting="vizEqSmooth" min="0" max="0.95" step="0.05" value="0.65"></div></div>
<div class="setting-block"><h3>Vzhled a efekty</h3><div class="range-row"><div class="range-label-row"><span>Tloušťka sloupců</span><strong id="val-vizEqThickness"></strong></div><input type="range" id="ctl-vizEqThickness" data-setting="vizEqThickness" min="0.1" max="1" step="0.05" value="0.58"></div>
<div class="toggle-row"><span>Koncové tečky</span><div class="switch" id="sw-vizEqTips" data-setting="vizEqTips"></div></div>
<div class="range-row"><div class="range-label-row"><span>Vytrácení od středu ke krajům</span><strong id="val-vizEqFade"></strong></div><input type="range" id="ctl-vizEqFade" data-setting="vizEqFade" min="0" max="1" step="0.05" value="0.35"></div>
<div class="range-row"><div class="range-label-row"><span>Síla záře</span><strong id="val-vizEqGlow"></strong></div><input type="range" id="ctl-vizEqGlow" data-setting="vizEqGlow" min="0" max="2" step="0.05" value="1"></div>
<div class="range-row"><div class="range-label-row"><span>Doznívání</span><strong id="val-vizEqTrail"></strong></div><input type="range" id="ctl-vizEqTrail" data-setting="vizEqTrail" min="0" max="0.85" step="0.05" value="0.2"></div>
<div class="range-row"><div class="range-label-row"><span>Rozmazání</span><strong id="val-vizEqBlur"></strong></div><input type="range" id="ctl-vizEqBlur" data-setting="vizEqBlur" min="0" max="12" step="0.5" value="0"></div></div>
<div class="setting-block"><h3>Rozsah hlasitých špiček</h3><div class="range-row"><div class="range-label-row"><span>Rozsah hlasitých špiček</span></div><select id="ctl-vizEqPeakMode" data-extra-select="vizEqPeakMode"><option value="soft">Plynulá komprese špiček</option><option value="fit">Přizpůsobit celý rozsah</option><option value="clip">Původní pevný limit</option></select></div>
<div class="range-row"><div class="range-label-row"><span>Začátek komprese špiček</span><strong id="val-vizEqPeakKnee"></strong></div><input type="range" id="ctl-vizEqPeakKnee" data-setting="vizEqPeakKnee" min="0.1" max="0.9" step="0.05" value="0.65"><p class="range-hint">Platí pro plynulou kompresi. Vyšší hodnota ponechá více neomezeného rozsahu před kompresí.</p></div></div></div>`);

window.Aurora.registerTemplate("page-visualizers-wave", `<div id="page-visualizers-wave" class="settings-page"><div class="setting-block"><h3>Vlna</h3><div class="range-row"><div class="range-label-row"><span>Amplituda</span><strong id="val-vizWaveGain"></strong></div><input type="range" id="ctl-vizWaveGain" data-setting="vizWaveGain" min="0.2" max="3" step="0.1" value="1"></div>
<div class="range-row"><div class="range-label-row"><span>Šířka</span><strong id="val-vizWaveWidth"></strong></div><input type="range" id="ctl-vizWaveWidth" data-setting="vizWaveWidth" min="0.3" max="1" step="0.05" value="1"></div>
<div class="range-row"><div class="range-label-row"><span>Tloušťka čáry</span><strong id="val-vizWaveLine"></strong></div><input type="range" id="ctl-vizWaveLine" data-setting="vizWaveLine" min="1" max="6" step="0.5" value="3"></div>
<div class="toggle-row"><span>Zrcadlená druhá vlna</span><div class="switch" id="sw-vizWaveMirror" data-setting="vizWaveMirror"></div></div>
<div class="range-row"><div class="range-label-row"><span>Vyhlazení</span><strong id="val-vizWaveSmooth"></strong></div><input type="range" id="ctl-vizWaveSmooth" data-setting="vizWaveSmooth" min="0" max="0.9" step="0.05" value="0.35"></div></div>
<div class="setting-block"><h3>Vzhled a efekty</h3><div class="range-row"><div class="range-label-row"><span>Síla záře</span><strong id="val-vizWaveGlow"></strong></div><input type="range" id="ctl-vizWaveGlow" data-setting="vizWaveGlow" min="0" max="2" step="0.05" value="1"></div>
<div class="range-row"><div class="range-label-row"><span>Doznívání</span><strong id="val-vizWaveTrail"></strong></div><input type="range" id="ctl-vizWaveTrail" data-setting="vizWaveTrail" min="0" max="0.85" step="0.05" value="0.25"></div>
<div class="range-row"><div class="range-label-row"><span>Rozmazání</span><strong id="val-vizWaveBlur"></strong></div><input type="range" id="ctl-vizWaveBlur" data-setting="vizWaveBlur" min="0" max="12" step="0.5" value="0"></div></div></div>`);

window.Aurora.registerTemplate("page-visualizers-ring", `<div id="page-visualizers-ring" class="settings-page"><div class="setting-block"><h3>Kruh</h3><div class="range-row"><div class="range-label-row"><span>Styl kruhu</span></div><select id="ctl-vizRingStyle" data-extra-select="vizRingStyle"><option value="pulse">Pulse — světelný prstenec</option><option value="particles">Particles — částicová membrána</option><option value="rays">Spectrum — paprsky</option></select></div>
<div class="range-row"><div class="range-label-row"><span>Poloměr</span><strong id="val-vizRingRadius"></strong></div><input type="range" id="ctl-vizRingRadius" data-setting="vizRingRadius" min="0.1" max="0.35" step="0.01" value="0.2"></div>
<div class="range-row"><div class="range-label-row"><span>Počet paprsků</span><strong id="val-vizRingCount"></strong></div><input type="range" id="ctl-vizRingCount" data-setting="vizRingCount" min="32" max="256" step="4" value="180"></div>
<div class="range-row"><div class="range-label-row"><span>Citlivost</span><strong id="val-vizRingGain"></strong></div><input type="range" id="ctl-vizRingGain" data-setting="vizRingGain" min="0.2" max="3" step="0.1" value="1"></div>
<div class="range-row"><div class="range-label-row"><span>Rychlost otáčení</span><strong id="val-vizRingSpeed"></strong></div><input type="range" id="ctl-vizRingSpeed" data-setting="vizRingSpeed" min="0" max="0.5" step="0.01" value="0.09"></div></div>
<div class="setting-block"><h3>Vzhled a efekty</h3><div class="range-row"><div class="range-label-row"><span>Tloušťka čar / velikost částic</span><strong id="val-vizRingThickness"></strong></div><input type="range" id="ctl-vizRingThickness" data-setting="vizRingThickness" min="0.5" max="8" step="0.5" value="2.5"></div>
<div class="range-row"><div class="range-label-row"><span>Pulzování velikosti podle basů</span><strong id="val-vizRingPulse"></strong></div><input type="range" id="ctl-vizRingPulse" data-setting="vizRingPulse" min="0" max="2" step="0.1" value="1"></div>
<div class="range-row"><div class="range-label-row"><span>Vytrácení paprsků směrem ven</span><strong id="val-vizRingFade"></strong></div><input type="range" id="ctl-vizRingFade" data-setting="vizRingFade" min="0" max="1" step="0.05" value="0.65"></div>
<div class="toggle-row"><span>Paprsky / světelné pásy</span><div class="switch" id="sw-vizRingRays" data-setting="vizRingRays"></div></div>
<div class="toggle-row"><span>Hlavní obrys</span><div class="switch" id="sw-vizRingContour" data-setting="vizRingContour"></div></div>
<div class="toggle-row"><span>Vnitřní pomocný kruh</span><div class="switch" id="sw-vizRingInner" data-setting="vizRingInner"></div></div>
<div class="toggle-row"><span>Částicová výplň (Pulse / Particles)</span><div class="switch" id="sw-vizRingParticles" data-setting="vizRingParticles"></div></div></div>
<div class="setting-block"><h3>Reakce a vyhlazení</h3><div class="range-row"><div class="range-label-row"><span>Smoothing</span><strong id="val-vizRingSmooth"></strong></div><input type="range" id="ctl-vizRingSmooth" data-setting="vizRingSmooth" min="0" max="0.95" step="0.05" value="0.5"></div>
<div class="range-row"><div class="range-label-row"><span>Deformace kruhu</span><strong id="val-vizRingDeform"></strong></div><input type="range" id="ctl-vizRingDeform" data-setting="vizRingDeform" min="0" max="2" step="0.05" value="1"></div>
<div class="range-row"><div class="range-label-row"><span>Síla záře</span><strong id="val-vizRingGlow"></strong></div><input type="range" id="ctl-vizRingGlow" data-setting="vizRingGlow" min="0" max="2" step="0.05" value="1"></div>
<div class="range-row"><div class="range-label-row"><span>Doznívání</span><strong id="val-vizRingTrail"></strong></div><input type="range" id="ctl-vizRingTrail" data-setting="vizRingTrail" min="0" max="0.85" step="0.05" value="0.2"></div>
<div class="range-row"><div class="range-label-row"><span>Rozmazání</span><strong id="val-vizRingBlur"></strong></div><input type="range" id="ctl-vizRingBlur" data-setting="vizRingBlur" min="0" max="12" step="0.5" value="0"></div></div></div>`);

window.Aurora.registerTemplate("page-appearance-filters", `<div id="page-appearance-filters" class="settings-page"><div class="setting-block"><h3>Effects / Filters</h3><p class="hint">Filters affect the scene, not the UI. Scanlines are applied last. Zero intensity disables an effect.</p><div class="range-row"><div class="range-label-row"><span>Pixel size</span><strong id="val-postPixel"></strong></div><input type="range" id="ctl-postPixel" data-setting="postPixel" min="0" max="64" step="1" value="0"></div><div class="range-row"><div class="range-label-row"><span>Chromatic aberration</span><strong id="val-postChroma"></strong></div><input type="range" id="ctl-postChroma" data-setting="postChroma" min="0" max="24" step="0.5" value="0"></div></div><div class="setting-block"><h3>Distortion</h3><div class="range-row"><div class="range-label-row"><span>Vertical stretch at side edges</span><strong id="val-postPanoramaVertical"></strong></div><input type="range" id="ctl-postPanoramaVertical" data-setting="postPanoramaVertical" min="0" max="1" step="0.05" value="1"></div><div class="range-row"><div class="range-label-row"><span>Distortion mask shape</span></div><select id="ctl-postMaskShape" data-extra-select="postMaskShape"><option value="panorama">Panorama — left and right edges</option><option value="radial">Radial — all edges</option></select></div><div class="range-row"><div class="range-label-row"><span>Mask transition</span><strong id="val-postMaskSoftness"></strong></div><input type="range" id="ctl-postMaskSoftness" data-setting="postMaskSoftness" min="0.01" max="1" step="0.01" value="0.2"></div><div class="toggle-row"><span>Invert distortion mask</span><div class="switch" id="sw-postInvertMask" data-setting="postInvertMask"></div></div><div class="range-row"><div class="range-label-row"><span>Outside-screen sampling</span></div><select id="ctl-postEdgeMode" data-extra-select="postEdgeMode"><option value="mirror">Mirror edges</option><option value="repeat">Repeat image</option><option value="clamp">Stretch edge pixels</option><option value="transparent">Transparent outside</option></select></div><div class="range-row"><div class="range-label-row"><span>Distortion frame limit</span><strong id="val-postDistortFps"></strong></div><input type="range" id="ctl-postDistortFps" data-setting="postDistortFps" min="30" max="240" step="30" value="60"></div><p id="distortionStatus" class="hint" role="status"></p><div class="range-row"><div class="range-label-row"><span>Distortion target</span></div><select id="ctl-postDistortTarget" data-extra-select="postDistortTarget"><option value="both">Background and visualizers</option><option value="background">Background only</option><option value="visualizers">Visualizers only</option></select></div><div class="range-row"><div class="range-label-row"><span>Distortion type</span></div><select id="ctl-postWarpType" data-extra-select="postWarpType"><option value="fisheye">Fisheye / barrel</option><option value="bubble">Bubble / sphere</option><option value="twist">Twist</option><option value="pinch">Pinch</option><option value="waves">Waves</option></select></div><div class="range-row"><div class="range-label-row"><span>Distortion strength (negative = reverse)</span><strong id="val-postFish"></strong></div><input type="range" id="ctl-postFish" data-setting="postFish" min="-1" max="1" step="0.05" value="0"></div><div class="range-row"><div class="range-label-row"><span>Center X</span><strong id="val-postCenterX"></strong></div><input type="range" id="ctl-postCenterX" data-setting="postCenterX" min="0" max="1" step="0.01" value="0.5"></div><div class="range-row"><div class="range-label-row"><span>Center Y</span><strong id="val-postCenterY"></strong></div><input type="range" id="ctl-postCenterY" data-setting="postCenterY" min="0" max="1" step="0.01" value="0.5"></div><div class="range-row"><div class="range-label-row"><span>Protected center radius</span><strong id="val-postRadius"></strong></div><input type="range" id="ctl-postRadius" data-setting="postRadius" min="0" max="1" step="0.05" value="0.7"></div><div class="range-row"><div class="range-label-row"><span>Zoom</span><strong id="val-postZoom"></strong></div><input type="range" id="ctl-postZoom" data-setting="postZoom" min="0.5" max="2" step="0.05" value="1"></div></div><div class="setting-block"><h3>Color and finishing</h3><div class="range-row"><div class="range-label-row"><span>Scanlines target</span></div><select id="ctl-scanlineTarget" data-extra-select="scanlineTarget"><option value="all">Background and visualizers</option><option value="background">Background only</option></select></div><div class="range-row"><div class="range-label-row"><span>Final hue offset</span><strong id="val-postHue"></strong></div><input type="range" id="ctl-postHue" data-setting="postHue" min="0" max="360" step="1" value="0"></div><div class="range-row"><div class="range-label-row"><span>Grayscale</span><strong id="val-postGray"></strong></div><input type="range" id="ctl-postGray" data-setting="postGray" min="0" max="1" step="0.05" value="0"></div><div class="range-row"><div class="range-label-row"><span>Edge outlines</span><strong id="val-postEdges"></strong></div><input type="range" id="ctl-postEdges" data-setting="postEdges" min="0" max="1" step="0.05" value="0"></div><div class="range-row"><div class="range-label-row"><span>Vignette</span><strong id="val-postVignette"></strong></div><input type="range" id="ctl-postVignette" data-setting="postVignette" min="0" max="1" step="0.05" value="0"></div><div class="range-row"><div class="range-label-row"><span>Glitch intensity</span><strong id="val-postGlitch"></strong></div><input type="range" id="ctl-postGlitch" data-setting="postGlitch" min="0" max="1" step="0.05" value="0"></div></div></div>`);
