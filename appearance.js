/* appearance.js — Základní vzhled. Pořadí CSS pravidel zůstává zachované. */

// ── styles/ui/01-base.css ──
window.Aurora.addStyle(0, `
  :root{
    --bg: #08090d;
    --panel: #12141c;
    --panel-2: #191c27;
    --border: rgba(255,255,255,0.09);
    --text: #eceef3;
    --text-dim: #8a8e9c;
    --accent1: #ff2ec4;
    --accent2: #7c3aed;
    --accent3: #22d3ee;
    --player-c1: #ff2ec4;
    --player-c2: #7c3aed;
    --player-c1-thumb: #ff2ec4;
    --player-c2-thumb: #7c3aed;
    --player-c1-play: #ff2ec4;
    --player-c2-play: #7c3aed;
    --player-c1-gear: #ff2ec4;
    --player-c2-gear: #7c3aed;
    --player-c1-scanline: #ffffff;
    --player-c2-scanline: #ffffff;
    --positive: #4CAF82;
    --warn: #E0A050;
    --danger: #E05060;
    --radius: 18px;
    --radius-sm: 12px;
    --font-body: 'Inter', sans-serif;
    --font-display: 'Space Grotesk', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
    --mono: var(--font-mono);
    --ui-scale: 1;

    /* ---- Control-bar element "chips" ----
       Dark backing plates rendered behind each interactive cluster
       (transport buttons, time label, volume, progress bar, track info)
       so they stay legible when the spectrogram waterfall is showing
       through the glass control island. All tunable from Nastavení →
       Přehrávač → "Pozadí prvků ovládací lišty". */
    --ctrl-chip-alpha: 0.38;
    --ctrl-chip-blur: 10px;
    --ctrl-chip-radius: 14px;

    /* ---- Timeline island: a separate floating glass panel above the
       main control island, holding only the progress/timeline bar.
       Height and gap-to-control-bar are both user-tunable. */
    --timeline-island-h: 56px;
    --timeline-island-gap: 14px;
    --timeline-island-inset: 20px;
    --timeline-island-overlap: 10px;
  }

  *{ box-sizing: border-box; }
  html,body{ height:100%; }
  body{
    margin:0;
    background: radial-gradient(1200px 700px at 70% -10%, #14161f 0%, var(--bg) 55%), var(--bg);
    color: var(--text);
    font-family: var(--font-body);
    overflow:hidden;
  }

  #app{
    position:relative;
    display:grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto;
    height:100vh;
  }

  /* ---------- STAGE ---------- */
  #stage{
    position:relative;
    grid-column: 1 / span 2;
    grid-row: 1 / span 2;
    display:flex;
    align-items:center;
    justify-content:center;
    overflow:hidden;
    background:
      radial-gradient(1000px 500px at 50% 20%, rgba(124,58,237,0.10), transparent 60%),
      #0a0b10;
  }
  #bgGlow{
    position:absolute; inset:0;
    pointer-events:none;
    transition: opacity .4s ease;
    overflow:hidden;
    z-index:0;
  }
  /* Trail + sparkle canvas: sits behind the blob SVG <div>s (both are
     direct children of #bgGlow, and DOM order determines stacking here
     since neither has an explicit z-index — canvas comes first in
     markup so it paints first/underneath), sized to the stage and
     redrawn every frame by BgReact/TrailFx. Kept as ONE shared canvas
     rather than one per blob since trails/sparkles are cheap 2D drawing
     ops and a single canvas lets the fading-trail effect (low-alpha
     overdraw each frame) work naturally via simple compositing. */
  #bgTrailCanvas{
    position:absolute;
    inset:0;
    width:100%;
    height:100%;
    display:block;
  }
  /* Post-processing overlay: vignette + scanlines are drawn here as
     plain CSS gradients/backgrounds (cheap, no filter cost), while the
     glitch effect's RGB-split slices are injected as absolutely
     positioned bars at runtime by BgReact/FxEngine. Sits above bgGlow
     but still below foreground UI (track meta, controls, etc). */
  #bgFxOverlay{
    position:absolute; inset:0;
    pointer-events:none;
    overflow:hidden;
    z-index:1;
  }
  .fx-vignette-layer{
    position:absolute; inset:0;
    background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.85) 100%);
    opacity:0;
    transition: opacity .25s ease;
  }
  .fx-scanline-layer{
    position:absolute; inset:0;
    background: repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0px, rgba(0,0,0,0.35) 1px, transparent 1px, transparent 3px);
    opacity:0;
    mix-blend-mode: multiply;
    transition: opacity .25s ease;
  }
  /* Dither layer: a tiny tiled noise texture blended over the whole
     background at very low opacity. This exists purely to fix an image-
     quality artifact, not as a user-facing effect (no toggle, always on
     at a fixed subtle strength) — low-alpha blurred blobs (baseAlpha is
     often ~0.08-0.12, further softened by a large stdDeviation blur) get
     rasterized into an 8-bit-per-channel buffer, and at such low opacity
     the available alpha steps are too coarse for a smooth gradient,
     producing visible banding rings especially on a near-black
     background. A faint noise overlay breaks up those hard steps into
     imperceptible grain instead, which is the standard fix for banding.
     mix-blend-mode:overlay keeps it visually neutral (doesn't lighten or
     darken the overall scene) while still perturbing each pixel enough
     to kill the banding. */
  .fx-dither-layer{
    position:absolute; inset:0;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.6 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
    background-repeat: repeat;
    opacity: 0.035;
    mix-blend-mode: overlay;
  }
  .fx-glitch-slice{
    position:absolute;
    left:0; right:0;
    pointer-events:none;
    mix-blend-mode: screen;
    opacity:0;
  }
  .bg-blob{
    position:absolute;
    top:0; left:0;
    transform: translate(-50%,-50%);
    will-change: transform, opacity;
  }
  /* ---- Blob shape rendering ----
     Every shape is drawn as an inline SVG so blur can be applied via a
     real feGaussianBlur *inside* the SVG's own filter region (stdDeviation
     scaled with an oversized filter region, edgeMode="none" fades to
     transparent instead of clipping) rather than the CSS \`filter: blur()\`
     property on the DOM element. CSS blur samples right up to the box's
     edge, which is what made hard-cornered shapes like the hexagon look
     chopped/uneven when blurred — the SVG filter has proper headroom on
     all sides so soft glow radiates evenly past every edge, corner or not.
     The outer <div class="bg-blob"> stays a plain positioned box (size/
     position/rotation only); the <svg> inside fills it completely and
     does 100% of the shape + blur + fill work. */
  .bg-blob svg{
    display:block;
    width:100%;
    height:100%;
    overflow:visible;
  }

  /* ---------- BACKGROUND LAYERS ---------- */
  .bg-layer-card{
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 16px;
    display:flex;
    flex-direction:column;
    gap:13px;
  }`);

// ── styles/ui/02-background-layers.css ──
window.Aurora.addStyle(1, `
  .bg-layer-card + .bg-layer-card{ margin-top:12px; }
  .bg-layer-card.disabled{ opacity:.55; }
  .bg-layer-head{
    display:flex;
    align-items:center;
    gap:12px;
  }
  .bg-layer-shape-icon{
    width:36px; height:36px;
    border-radius:10px;
    background: rgba(255,255,255,0.05);
    border: 1px solid var(--border);
    display:flex; align-items:center; justify-content:center;
    flex-shrink:0;
  }
  .bg-layer-shape-icon svg{ width:20px; height:20px; }
  .bg-layer-title{
    display:flex;
    flex-direction:column;
    flex:1;
    min-width:0;
  }
  .bg-layer-title strong{
    font-size:14.5px;
    font-weight:600;
  }
  .bg-layer-title span{
    font-size:11.5px;
    color: var(--text-dim);
    font-family: var(--mono);
  }
  .bg-layer-head-actions{
    display:flex;
    align-items:center;
    gap:8px;
    flex-shrink:0;
  }
  .bg-layer-gear-btn{
    width:34px; height:34px;
    border-radius:10px;
    border:1px solid var(--border);
    background: rgba(255,255,255,0.04);
    color: var(--text-dim);
    display:flex; align-items:center; justify-content:center;
    cursor:pointer;
    transition: all .15s ease;
  }
  .bg-layer-gear-btn:hover{ color: var(--text); border-color: var(--accent2); background: rgba(124,58,237,0.1); }
  .bg-layer-gear-btn.active{ color: #fff; background: linear-gradient(135deg, var(--accent1), var(--accent2)); border-color: transparent; }
  .bg-layer-gear-btn svg{ width:16px; height:16px; }

  .bg-layer-pct-bar-wrap{
    display:flex;
    align-items:center;
    gap:10px;
  }
  .bg-layer-pct-bar-bg{
    flex:1;
    height:7px;
    border-radius:4px;
    background: rgba(255,255,255,0.06);
    overflow:hidden;
    display:flex;
  }
  .bg-layer-pct-bar-fill{
    height:100%;
    border-radius:3px;
    transition: width .2s ease;
  }
  .bg-layer-pct-label{
    font-family: var(--mono);
    font-size:11.5px;
    color: var(--text-dim);
    min-width:38px;
    text-align:right;
    flex-shrink:0;
  }

  .bg-layer-shape-grid{
    display:grid;
    grid-template-columns: repeat(6, 1fr);
    gap:8px;
  }
  .bg-layer-shape-tile{
    aspect-ratio:1;
    border-radius:10px;
    border:1px solid var(--border);
    background: rgba(255,255,255,0.03);
    display:flex; align-items:center; justify-content:center;
    cursor:pointer;
    transition: all .15s ease;
  }
  .bg-layer-shape-tile:hover{ background: rgba(255,255,255,0.07); }
  .bg-layer-shape-tile.active{
    border-color: var(--accent1);
    background: linear-gradient(160deg, rgba(255,46,196,0.14), rgba(124,58,237,0.09));
  }
  .bg-layer-shape-tile svg{ width:19px; height:19px; }

  .bg-layer-gear-panel{
    display:none;
    flex-direction:column;
    gap:15px;
    padding-top:13px;
    border-top:1px solid var(--border);
  }
  .bg-layer-gear-panel.open{ display:flex; }

  .bg-layer-overall-total{
    display:flex;
    align-items:center;
    justify-content:space-between;
    font-size:12.5px;
    color: var(--text-dim);
    padding: 10px 13px;
    border-radius:10px;
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--border);
  }
  .bg-layer-overall-total strong{ color: var(--text); font-family: var(--mono); font-weight:500; }

  .bg-layer-add-row{
    display:flex;
    justify-content:center;
    margin-top:12px;
  }
  .bg-layer-add-btn{
    display:flex;
    align-items:center;
    gap:8px;
    font-size:13px;
    font-weight:600;
    color: var(--text-dim);
    background: rgba(255,255,255,0.03);
    border: 1px dashed var(--border);
    padding: 11px 18px;
    border-radius:12px;
    cursor:pointer;
    transition: all .15s ease;
  }
  .bg-layer-add-btn:hover{ color: var(--text); border-color: var(--accent2); background: rgba(124,58,237,0.08); }
  .bg-layer-add-btn svg{ width:15px; height:15px; }
  .bg-layer-add-btn:disabled{ opacity:.4; cursor:default; pointer-events:none; }

  .shape-grid{
    display:grid;
    grid-template-columns: repeat(4, 1fr);
    gap:10px;
    margin-top:12px;
  }
  .shape-tile{
    aspect-ratio: 1;
    border-radius:12px;
    border:1px solid var(--border);
    background: rgba(255,255,255,0.03);
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    gap:6px;
    cursor:pointer;
    transition: all .15s ease;
    padding:8px 6px;
  }
  .shape-tile:hover{
    background: rgba(255,255,255,0.06);
    border-color: rgba(255,255,255,0.15);
    transform: translateY(-1px);
  }
  .shape-tile.active{
    border-color: var(--accent1);
    background: linear-gradient(160deg, rgba(255,46,196,0.12), rgba(124,58,237,0.08));
    box-shadow: 0 0 0 1px var(--accent1), 0 4px 14px -4px rgba(255,46,196,0.4);
  }
  .shape-tile svg{
    width:30px; height:30px;
    overflow:visible;
  }
  .shape-tile .shape-tile-swatch{
    fill: url(#shapeTilePreviewGrad);
  }
  .shape-tile span{
    font-size:10.5px;
    font-weight:600;
    color: var(--text-dim);
    text-align:center;
    line-height:1.2;
  }
  .shape-tile.active span{ color: var(--text); }

  /* ---------- Nicer section framing for the background tab ---------- */
  .setting-subhead{
    font-size:12px;
    font-weight:600;
    letter-spacing:.05em;
    text-transform:uppercase;
    color: var(--text-dim);
    margin: 18px 0 3px;
    display:flex;
    align-items:center;
    gap:8px;
  }
  .setting-subhead:first-child{ margin-top:0; }
  .setting-subhead::after{
    content:'';
    flex:1;
    height:1px;
    background: var(--border);
  }

  #emptyState{
    position:relative;
    z-index:5;
    text-align:center;
    max-width:480px;
    padding:40px;
    animation: fadeIn .6s ease;
  }
  #emptyState h1{
    font-family: var(--font-display);
    font-size: 32px;
    margin:0 0 12px;
    background: linear-gradient(90deg, var(--accent1), var(--accent2));
    -webkit-background-clip:text;
    background-clip:text;
    color:transparent;
  }
  #emptyState p{
    color: var(--text-dim);
    line-height:1.65;
    font-size:15px;
    margin: 0 0 26px;
  }
  .import-row{
    display:flex;
    gap:10px;
    justify-content:center;
    flex-wrap:wrap;
  }

  .track-meta{
    position:absolute;
    top:30px;
    left:34px;
    z-index:6;
    display:flex;
    align-items:center;
    gap:16px;
    opacity:0;
    transform: translateY(-6px);
    transition: opacity .4s ease, transform .4s ease;
    pointer-events:none;
    max-width: calc(100% - 280px);
  }
  .track-meta.show{ opacity:1; transform:none; pointer-events:auto; }
  .track-meta.show .track-meta-chip{pointer-events:auto;}
  /* User setting override (Nastavení → Control Island → "Zobrazit název
     skladby"): fully hides the chip regardless of .show's own opacity/
     transform, without touching that class's fade-in transition logic. */
  .track-meta.user-hidden{ display:none; }`);

// ── styles/ui/03-track-card.css ──
window.Aurora.addStyle(2, `
  .track-art{
    width:52px; height:52px; border-radius:12px;
    background: linear-gradient(135deg, var(--player-c1), var(--player-c2));
    flex-shrink:0;
    box-shadow: 0 4px 18px rgba(0,0,0,.4);
  }
  /* ---- Stage track-meta "chip" ----
     Same clickable-chip design language as the control bar's own
     .bar-track-info (see far below): a rounded glass card that opens the
     same style of track-info popover on click, with a heart badge riding
     on its top edge. This variant is intentionally roomier — no
     max-width/ellipsis truncation on the title, since the whole point of
     this pass was to stop long track names from ever being cut off; it
     just wraps onto extra lines instead. */
  .track-meta-chip{
    display:flex;
    align-items:center;
    gap:16px;
    cursor:pointer;
    position:relative;
    padding: 12px 20px 12px 14px;
    border-radius: 18px;
    min-width:0;
    max-width: 520px;
    background: rgba(20,21,30,0.55);
    backdrop-filter: blur(20px) saturate(160%);
    -webkit-backdrop-filter: blur(20px) saturate(160%);
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 14px 34px -12px rgba(0,0,0,.55), 0 1px 0 rgba(255,255,255,0.04) inset;
    transition: background .15s ease, box-shadow .25s ease;
  }
  .track-meta-chip:hover{ background: rgba(28,29,40,0.62); }
  .track-meta-chip.liked{
    box-shadow: 0 0 0 1.5px #ff1f4d, 0 14px 34px -12px rgba(0,0,0,.55), 0 0 20px -4px rgba(255,31,77,0.55);
  }
  /* Opt-in music-reactive pulse (Nastavení → Control Island → Info panel):
     when active, the glow strength is driven every frame from JS based on
     a chosen MusicSense source (Loudness/Bass/Mid/High) instead of using
     the fixed box-shadow above — see updateLikedOutlinePulse(). Shorter
     transition than the base .liked rule so it can track fast audio
     changes without visibly lagging. */
  .track-meta-chip.liked-pulse-active.liked{
    transition: background .15s ease, box-shadow .06s linear;
  }
  /* Opt-in mode (Nastavení → Control Island): same hover-only-outline
     idea as .bar-track-info.liked-outline-hover-only — the liked box-
     shadow above is suppressed until the chip is actually hovered. */
  .track-meta-chip.liked-outline-hover-only.liked{
    box-shadow: 0 14px 34px -12px rgba(0,0,0,.55), 0 1px 0 rgba(255,255,255,0.04) inset;
  }
  .track-meta-chip.liked-outline-hover-only.liked:hover{
    box-shadow: 0 0 0 1.5px #ff1f4d, 0 14px 34px -12px rgba(0,0,0,.55), 0 0 20px -4px rgba(255,31,77,0.55);
  }
  .track-meta-titles{ min-width:0; }
  .track-meta h2{
    font-family: var(--font-display);
    font-size:17px;
    margin:0;
    font-weight:600;
    /* Never truncated: wraps onto extra lines instead of being clipped
       with an ellipsis. A generous soft cap keeps a truly pathological
       (500+ char) name from growing the chip without bound, without
       affecting any normal title. */
    max-width: 100%;
    max-height: 500px;
    overflow: hidden;
    white-space: normal;
    word-break: break-word;
    line-height: 1.28;
  }
  .track-meta span{
    display:block;
    margin-top:3px;
    font-size:13px;
    color: var(--text-dim);
    font-family: var(--mono);
  }
  /* Heart badge: a normal in-flow flex child of the chip (not an
     absolutely-positioned overlay riding the edge), separated from the
     title/artist block by a thin vertical divider. This makes the
     chip's own outline/box-shadow naturally wrap around the heart too,
     since it's just part of the card's regular content now instead of
     something hanging off its border. */
  .track-meta-heart-divider{
    align-self: stretch;
    width:1px;
    background: rgba(255,255,255,0.12);
    flex-shrink:0;
    margin: 2px 0;
  }
  .track-meta-heart-badge{
    position:relative;
    flex-shrink:0;
    width:40px; height:40px;
    border-radius:50%;
    background: rgba(255,255,255,0.06);
    border: none;
    display:flex; align-items:center; justify-content:center;
    color: var(--text-dim);
    cursor:pointer;
    transition: background .15s ease, color .15s ease, box-shadow .15s ease;
  }
  .track-meta-heart-badge:hover{
    color:#fff;
    background: rgba(255,255,255,0.11);
  }
  .track-meta-heart-badge svg{ width:20px; height:20px; }
  .track-meta-heart-badge svg path{ transition: fill .15s ease; }
  .track-meta-heart-badge.liked{
    color:#fff;
    background: linear-gradient(135deg, #ff3b5c, #ff1f4d);
    box-shadow: 0 2px 10px -1px rgba(255,31,77,0.7);
  }
  .track-meta-heart-badge.liked svg path{ fill:currentColor; }
  .track-meta-heart-badge.pop{ animation: heartPopCornered .35s cubic-bezier(.34,1.56,.64,1); }
  @keyframes heartPopCornered{
    0%{ transform: scale(1); }
    35%{ transform: scale(1.35); }
    100%{ transform: scale(1); }
  }

  /* Popover opened by clicking the stage chip — identical markup/behavior
     to #trackInfoPopover (control bar), just anchored below this chip
     instead of above the control bar. */
  #stageTrackInfoPopover{
    position:absolute;
    left:0;
    top: calc(100% + 12px);
    width: 260px;
    z-index: 30;
    background: rgba(18,20,28,0.92);
    backdrop-filter: blur(20px) saturate(160%);
    -webkit-backdrop-filter: blur(20px) saturate(160%);
    border: 1px solid var(--border);
    border-radius: 16px;
    box-shadow: 0 20px 50px -10px rgba(0,0,0,.6);
    padding: 16px 18px;
    opacity:0;
    transform: translateY(6px);
    pointer-events:none;
    transition: opacity .18s ease, transform .18s ease;
    cursor: default;
  }
  #stageTrackInfoPopover.show{
    opacity:1;
    pointer-events:auto;
    transform: translateY(0);
  }
  #stageTrackInfoPopover::after{
    content:'';
    position:absolute;
    bottom:100%; left:28px;
    width:14px; height:14px;
    background: inherit;
    border-left: 1px solid var(--border);
    border-top: 1px solid var(--border);
    clip-path: polygon(0 0, 100% 0, 0 100%);
    border-radius: 3px 0 0 0;
    margin-bottom:-8px;
  }

  /* top-right controls */
  .stage-tools{
    position:absolute;
    top:26px; right:30px;
    z-index:16;
    display:flex;
    gap:12px;
    transition: right .35s ease;
  }
  #app:not(.playlist-closed) .stage-tools{ right: 498px; }
  #app:not(.playlist-closed) #settingsPanel{ right: 496px; }
  .icon-btn{
    width:44px; height:44px;
    border-radius:12px;
    border:1px solid var(--border);
    background: rgba(255,255,255,0.05);
    color: var(--text);
    display:flex; align-items:center; justify-content:center;
    cursor:pointer;
    transition: all .18s ease;
    backdrop-filter: blur(10px);
  }
  .icon-btn:hover{ background: rgba(255,255,255,0.1); transform: translateY(-1px); }
  .icon-btn.active{
    background: linear-gradient(135deg, var(--player-c1), var(--player-c2));
    border-color: transparent;
  }
  #btnSettings.active{
    background: linear-gradient(135deg, var(--player-c1-gear), var(--player-c2-gear));
    border-color: transparent;
  }
  .icon-btn svg{ width:20px; height:20px; }

  /* ---------- SETTINGS PANEL ---------- */
  #settingsPanel{
    position:absolute;
    top: 78px; right:28px;
    z-index: 10;
    width: 430px;
    max-height: calc(100% - 96px);
    background: var(--panel-bg-resolved, rgba(18,20,28,0.72));
    backdrop-filter: blur(22px) saturate(150%);
    -webkit-backdrop-filter: blur(22px) saturate(150%);
    border:1px solid var(--border);
    border-radius: var(--radius);
    transition: right .35s ease;
    box-shadow: 0 24px 60px rgba(0,0,0,.5);
    display:none;
    flex-direction:column;
    animation: fadeIn .2s ease;
    overflow:hidden;
    contain: layout style paint;
    isolation: isolate;
  }`);

// ── styles/ui/04-settings.css ──
window.Aurora.addStyle(3, `
  #settingsPanel.open{ display:flex; }
  #settingsPanel h3{
    margin:0;
    font-size:16.5px;
    text-transform:uppercase;
    letter-spacing:.06em;
    color: var(--text);
    font-weight:700;
    font-family: var(--font-display);
  }
  .settings-tabs{
    display:flex;
    flex-wrap:wrap;
    gap:4px;
    padding: 14px 14px 12px;
    flex-shrink:0;
    border-bottom: 1px solid var(--border);
  }
  .settings-tab{
    flex: 1 1 calc(33.333% - 4px);
    min-width: 90px;
    text-align:center;
    padding: 10px 4px;
    border-radius: 10px 10px 0 0;
    font-size:13px;
    font-weight:600;
    color: var(--text-dim);
    cursor:pointer;
    transition: all .15s ease;
    border-bottom: 2px solid transparent;
  }
  .settings-tab:hover{ color: var(--text); background: rgba(255,255,255,0.04); }
  .settings-tab.active{
    color: var(--text);
    border-bottom: 2px solid var(--accent1);
    background: rgba(255,255,255,0.03);
  }
  .settings-tabpanel{
    display:none;
    flex-direction:column;
    gap:22px;
    padding: 0 24px 24px;
    overflow-y:auto;
    overflow-x:hidden;
    flex:1 1 auto;
    min-height:0; /* required so overflow-y:auto works inside a flex column parent */
    font-size: 14.5px;
  }
  .settings-tabpanel > .setting-block:first-child{
    margin-top: 22px;
  }
  .settings-tabpanel.active{ display:flex; }
  .settings-tabpanel::-webkit-scrollbar{ width:8px; }
  .settings-tabpanel::-webkit-scrollbar-thumb{ background: rgba(255,255,255,0.14); border-radius:8px; }

  /* ---------- Sub-tabs (nested inside a top-level tabpanel, e.g.
     Pozadí → Obecné/Vrstvy/Mapování/Efekty). Visually lighter/smaller
     than the main tabs so the hierarchy (tab > subtab) stays obvious,
     but same underlying design language (pill-ish active state,
     accent-colored indicator). */
  .settings-subtabs{
    display:flex;
    flex-wrap:wrap;
    align-items:center;
    justify-content:center;
    gap:8px;
    margin: 0 -8px 22px;
    padding: 14px 16px;
    border-bottom: none;
    border-radius: 0 0 16px 16px;
    box-shadow: 0 8px 16px -12px rgba(0,0,0,0.5);
    /* Sticky within the scrolling .settings-tabpanel ancestor, so the
       subtab switcher stays reachable without scrolling back to the top
       of a long panel (e.g. Pozadí → Vrstvy, Control Island → Timeline).
       An opaque background is required for sticky to actually work
       visually — otherwise content scrolling underneath shows straight
       through and reads as an overlap rather than the bar sitting on
       top. Slightly lighter than the panel itself + rounded bottom
       corners so it reads as its own floating card rather than a flat
       divider strip. The parent tabpanel now has zero top padding, so
       this bar sits flush against the panel's top edge with a constant,
       compact height whether the panel is scrolled or not — no
       negative-margin/extra-padding compensation needed. */
    position: sticky;
    top: 0;
    z-index: 6;
    background: #101219;
  }
  .settings-subtab{
    box-sizing: border-box;
    display:inline-flex;
    align-items:center;
    line-height:1;
    padding: 8px 14px;
    border-radius: 999px;
    font-size:12px;
    font-weight:600;
    color: var(--text-dim);
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    cursor:pointer;
    transition: color .15s ease, background .15s ease, border-color .15s ease;
    white-space:nowrap;
  }
  .settings-subtab:hover{ color: var(--text); border-color: rgba(255,255,255,0.22); }
  .settings-subtab.active{
    color:#fff;
    background: linear-gradient(135deg, var(--accent1), var(--accent2));
    border-color: transparent;
  }
  .settings-subtabpanel{ display:none; flex-direction:column; gap:22px; }
  .settings-subtabpanel.active{ display:flex; }

  .setting-block + .setting-block{
    border-top:1px solid var(--border);
    padding-top:20px;
  }

  .export-import-row{
    display:flex;
    gap:10px;
    margin-top:12px;
  }
  .export-import-row button{
    flex:1;
    display:flex;
    align-items:center;
    justify-content:center;
    gap:7px;
    padding: 10px 12px;
    border-radius:10px;
    border:1px solid var(--border);
    background: rgba(255,255,255,0.04);
    color: var(--text);
    font-family: var(--font-body);
    font-size:13px;
    font-weight:600;
    cursor:pointer;
    transition: all .15s ease;
  }
  .export-import-row button:hover{ border-color: var(--accent2); background: rgba(124,58,237,0.08); }
  .export-import-row button svg{ width:14px; height:14px; }

  .profile-stat-row{
    display:flex;
    justify-content:space-between;
    font-size:13px;
    color: var(--text-dim);
    margin-top:12px;
  }
  .profile-stat-row strong{ color: var(--text); font-family: var(--mono); font-weight:500; }

  .range-row{ margin-top:12px; }
  .range-row + .range-row{ margin-top:16px; }
  .range-label-row{
    font-size:13.5px;
    color: var(--text-dim);
    display:flex;
    justify-content:space-between;
  }
  .range-label-row strong{ color: var(--text); font-weight:600; font-family: var(--mono); font-size: 13px; }
  .range-hint{
    font-size:12px;
    color: var(--text-dim);
    margin-top:5px;
    line-height:1.5;
  }

  input[type=range]{
    -webkit-appearance:none;
    appearance:none;
    width:100%;
    height:5px;
    border-radius:3px;
    background: rgba(255,255,255,0.15);
    outline:none;
    cursor:pointer;
    margin-top:8px;
    position:relative;
  }
  input[type=range]::-webkit-slider-thumb{
    -webkit-appearance:none;
    width:16px; height:16px;
    border-radius:50%;
    background:#fff;
    cursor:pointer;
    transition: box-shadow .15s ease;
  }
  input[type=range]:hover::-webkit-slider-thumb,
  input[type=range]:focus::-webkit-slider-thumb{
    box-shadow: 0 0 0 7px rgba(255,255,255,0.12);
  }
  input[type=range]:focus{ outline:none; }
  input[type=range].reset-flash::-webkit-slider-thumb{
    box-shadow: 0 0 0 7px rgba(255,46,196,0.35);
  }

  .toggle-row{
    display:flex;
    align-items:center;
    justify-content:space-between;
    font-size:14px;
    gap:12px;
  }
  .switch{
    position:relative;
    width:42px; height:24px;
    background: rgba(255,255,255,0.12);
    border-radius:999px;
    cursor:pointer;
    transition: background .2s ease;
    flex-shrink:0;
  }
  .switch.on{ background: linear-gradient(135deg, var(--accent1), var(--accent2)); }
  .switch::after{
    content:'';
    position:absolute;
    top:2px; left:2px;
    width:20px; height:20px;
    border-radius:50%;
    background:#fff;
    transition: transform .2s ease;
  }
  .switch.on::after{ transform: translateX(18px); }

  .reset-panel-btn{
    margin: 6px 24px 20px;
    padding: 12px 16px;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: rgba(255,255,255,0.04);
    color: var(--text-dim);
    font-family: var(--font-body);
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
    display:flex;
    align-items:center;
    justify-content:center;
    gap:8px;
    transition: all .15s ease;
    flex-shrink:0;
  }
  .reset-panel-btn:hover{ color: var(--text); border-color: var(--danger); background: rgba(224,80,96,0.08); }
  .reset-panel-btn svg{ width:15px; height:15px; }

  /* ---------- BACKGROUND TAB: color swatches ---------- */
  .color-row{
    display:flex;
    gap:9px;
    flex-wrap:wrap;
    margin-top:12px;
  }`);

// ── styles/ui/05-mapping-editor.css ──
window.Aurora.addStyle(4, `
  .swatch{
    width:30px; height:30px;
    border-radius:50%;
    cursor:pointer;
    border:2px solid transparent;
    transition: transform .15s ease;
    flex-shrink:0;
  }
  .swatch:hover{ transform: scale(1.12); }
  .swatch.active{ border-color: #fff; }
  .custom-color-wrap{
    display:flex;
    align-items:center;
    gap:10px;
    margin-top:10px;
  }
  .custom-color-wrap input[type=color]{
    width:30px; height:30px;
    border:none;
    background:none;
    padding:0;
    cursor:pointer;
    border-radius:50%;
    overflow:hidden;
    flex-shrink:0;
  }
  .custom-color-wrap label{ font-size:13px; color:var(--text-dim); }

  /* ---------- BACKGROUND TAB: MusicSense mapping rows ---------- */
  .map-row{
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--border);
    border-radius: 13px;
    padding: 16px;
    display:flex;
    flex-direction:column;
    gap:12px;
  }
  .map-row + .map-row{ margin-top:12px; }
  .map-row-head{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:10px;
  }
  .map-row-head .map-title{
    font-size:13.5px;
    font-weight:600;
    color: var(--text);
    display:flex;
    align-items:center;
    gap:8px;
  }
  .map-row-head-right{
    display:flex;
    align-items:center;
    gap:10px;
    flex-shrink:0;
  }
  .map-enable-switch{
    width:34px; height:19px;
  }
  .map-enable-switch::after{
    width:15px; height:15px;
  }
  .map-enable-switch.on::after{ transform: translateX(15px); }
  .map-row-disabled{ opacity:.55; }
  .map-body{ display:flex; flex-direction:column; gap:12px; }
  .map-live-val{
    font-family: var(--mono);
    font-size: 11.5px;
    color: var(--text-dim);
    background: rgba(255,255,255,0.05);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 3px 10px;
    flex-shrink:0;
    white-space:nowrap;
  }
  .map-live-val strong{ color: var(--text); font-weight:500; }
  .map-swatch-dot{
    width:10px; height:10px;
    border-radius:50%;
    flex-shrink:0;
  }
  /* Explicit background/color/border on both the select AND its options —
     without this the options fall back to the OS default (often white
     text on white background in some browsers/OS themes), making the
     dropdown list unreadable. */
  .map-select{
    width:100%;
    padding: 9px 11px;
    border-radius:9px;
    border:1px solid var(--border);
    background: var(--panel-2);
    color: var(--text);
    font-size:13px;
    font-family: var(--font-body);
    outline:none;
    cursor:pointer;
    appearance: auto;
    -webkit-appearance: menulist;
    color-scheme: dark;
  }
  .map-select:focus{ border-color: var(--accent2); }
  .map-select option{
    background: var(--panel-2);
    color: var(--text);
  }
  .map-select option:checked,
  .map-select option:hover{
    background: var(--accent2);
    color: #fff;
  }
  .map-subrow{
    display:flex;
    flex-direction:column;
    gap:5px;
  }
  .map-subrow-label{
    font-size:12px;
    color: var(--text-dim);
    display:flex;
    justify-content:space-between;
  }
  .map-subrow-label strong{ color: var(--text); font-family: var(--mono); font-weight:500; }
  .map-norm-row{
    display:flex;
    gap:10px;
    align-items:center;
  }
  .map-norm-row input[type=number]{
    width: 72px;
    padding: 8px 9px;
    border-radius:9px;
    border:1px solid var(--border);
    background: rgba(255,255,255,0.05);
    color: var(--text);
    font-size:12.5px;
    font-family: var(--mono);
    outline:none;
    color-scheme: dark;
  }
  .map-norm-row input[type=number]:focus{ border-color: var(--accent2); }
  .map-norm-row span{ font-size:11.5px; color: var(--text-dim); }
  .map-disabled{ opacity:.45; pointer-events:none; }

  .map-boost-detail{
    display:flex;
    flex-direction:column;
    gap:12px;
    background: rgba(255,46,196,0.04);
    border: 1px solid rgba(255,46,196,0.15);
    border-radius: 10px;
    padding: 12px 13px;
  }

  .curve-block{
    display:flex;
    flex-direction:column;
    gap:7px;
  }
  .curve-editor-head{
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:8px;
  }
  .curve-editor-actions{
    display:flex;
    gap:6px;
  }
  .curve-action-btn{
    font-family: var(--font-body);
    font-size:10px;
    font-weight:600;
    color: var(--text-dim);
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 4px 8px;
    cursor:pointer;
    transition: all .15s ease;
    display:flex;
    align-items:center;
    gap:4px;
  }
  .curve-action-btn:hover{ color: var(--text); border-color: var(--accent2); background: rgba(124,58,237,0.1); }
  .curve-action-btn:active{ transform: scale(0.96); }
  .curve-action-btn.copied{ color: var(--positive); border-color: var(--positive); background: rgba(76,175,130,0.1); }
  .curve-action-btn svg{ width:11px; height:11px; flex-shrink:0; }

  .curve-editor-svg-wrap{
    position:relative;
    width:100%;
    aspect-ratio: 16/10;
    background:
      linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px) 0 0/100% 25%,
      linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px) 0 0/25% 100%,
      linear-gradient(160deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015));
    border: 1px solid var(--border);
    border-radius: 10px;
    cursor: crosshair;
    touch-action:none;
    user-select:none;
    overflow: hidden; /* everything, including the live-value dot, is clipped cleanly to this box */
  }
  .curve-editor-svg-wrap svg{
    position:absolute; inset:0;
    width:100%; height:100%;
    display:block;
    overflow: visible; /* path itself can be told to clip via a clipPath; the wrapper above is the real safety net */
  }
  .curve-diagonal{
    stroke: rgba(255,255,255,0.09);
    stroke-width: 1;
    stroke-dasharray: 3,4;
    vector-effect: non-scaling-stroke;
  }
  .curve-path{
    fill:none;
    stroke-width: 2.5;
    vector-effect: non-scaling-stroke;
    filter: drop-shadow(0 0 4px currentColor);
  }
  .curve-fill{
    opacity: .14;
  }

  /* Draggable points + the live-value dot are plain HTML overlays instead
     of SVG shapes, positioned with left/top percentages. This sidesteps
     SVG viewBox non-uniform scaling entirely (a 16:10 box with a square
     100x100 viewBox stretches circular <circle> elements into ovals) —
     a div with border-radius:50% is always a perfect circle regardless
     of the parent's aspect ratio. */
  .curve-point-dot{
    position:absolute;
    width:15px; height:15px;
    margin-left:-7.5px; margin-top:-7.5px;
    border-radius:50%;
    border: 2px solid #fff;
    box-shadow: 0 2px 8px rgba(0,0,0,.4);
    cursor:grab;
    transition: width .12s ease, height .12s ease, margin .12s ease;
    z-index:3;
  }
  .curve-point-dot:hover, .curve-point-dot.dragging{
    width:19px; height:19px;
    margin-left:-9.5px; margin-top:-9.5px;
  }
  .curve-point-dot.dragging{ cursor:grabbing; }
  .curve-anchor-dot{
    position:absolute;
    width:8px; height:8px;
    margin-left:-4px; margin-top:-4px;
    border-radius:50%;
    background: rgba(255,255,255,0.35);
    z-index:2;
  }

  /* Live MusicSense value indicator: a small pulsing dot that rides along
     the curve at the source's current raw position, so it's obvious at a
     glance both what's driving this mapping right now AND what the curve
     is doing to it. */
  .curve-live-dot{
    position:absolute;
    width:9px; height:9px;
    margin-left:-4.5px; margin-top:-4.5px;
    border-radius:50%;
    background:#fff;
    box-shadow: 0 0 0 3px currentColor, 0 0 10px 2px currentColor;
    z-index:4;
    pointer-events:none;
    opacity:0;
    transition: left .06s linear, top .06s linear, opacity .2s ease;
  }
  .curve-live-dot.active{ opacity:1; }
  .curve-clamp-zone{
    position:absolute;
    top:0; bottom:0;
    background: repeating-linear-gradient(135deg, rgba(224,80,96,0.10) 0 6px, rgba(224,80,96,0.03) 6px 12px);
    z-index:1;
    pointer-events:none;
    display:none;
  }
  .curve-clamp-zone.show{ display:block; }
  .curve-boost-marker{
    position:absolute;
    top:0; bottom:0;
    width:2px;
    background: repeating-linear-gradient(180deg, var(--accent1) 0 4px, transparent 4px 8px);
    z-index:2;
    pointer-events:none;
    display:none;
  }
  .curve-boost-marker.show{ display:block; }
  .curve-boost-marker::after{
    content:'BOOST';
    position:absolute;
    top:2px; left:4px;
    font-family: var(--mono);
    font-size:7px;
    font-weight:600;
    letter-spacing:.04em;
    color: var(--accent1);
    white-space:nowrap;
  }

  .curve-live-readout{
    position:absolute;
    top:6px; right:8px;
    font-family: var(--mono);
    font-size:10px;
    color: var(--text-dim);
    background: rgba(8,9,13,0.65);
    padding: 2px 7px;
    border-radius: 999px;
    z-index:5;
    pointer-events:none;
    backdrop-filter: blur(3px);
  }
  .curve-live-readout strong{ color:#fff; font-weight:500; }

  .curve-hint-row{
    display:flex;
    justify-content:space-between;
    font-size:9.5px;
    color: var(--text-dim);
    opacity:.7;
  }

  /* ---------- LIVE MUSICSENSE READOUT ---------- */
  .ms-live-grid{
    display:grid;
    grid-template-columns: repeat(3, 1fr);
    gap:10px;
  }`);

// ── styles/ui/06-music-readouts.css ──
window.Aurora.addStyle(5, `
  .ms-live-cell{
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px 13px;
  }
  .ms-live-cell .lbl{
    font-size: 10.5px;
    font-weight:600;
    letter-spacing:.07em;
    text-transform:uppercase;
    color: var(--text-dim);
  }
  .ms-live-cell .val{
    font-family: var(--mono);
    font-size: 17px;
    font-weight:500;
    color: var(--text);
    margin-top:4px;
    letter-spacing:-0.02em;
  }
  .ms-live-cell .bar-bg{
    height:4px;
    border-radius:2px;
    background: rgba(255,255,255,0.08);
    margin-top:9px;
    overflow:hidden;
  }
  .ms-live-cell .bar-fill{
    height:100%;
    width:100%;
    clip-path:inset(0 100% 0 0 round 2px);
    border-radius:2px;
    transition: clip-path .05s linear;
  }
  .ms-live-cell[data-key="bass"] .bar-fill{ background: var(--positive); }
  .ms-live-cell[data-key="mid"] .bar-fill{ background: var(--warn); }
  .ms-live-cell[data-key="high"] .bar-fill{ background: var(--accent3); }
  .ms-live-cell[data-key="loudnessPct"] .bar-fill{ background: var(--positive); }
  .ms-live-cell[data-key="bpm"] .bar-fill{ background: var(--accent1); }

  /* ---- Beat phase indicator: sits next to the BPM cell, shows a dot
     that visibly flashes right on each detected beat (driven by
     TempoTracker's beatPulse), plus a small confidence readout so it's
     obvious at a glance whether the tempo lock is solid or still
     unsettled. ---- */
  .beat-indicator-cell{
    display:flex;
    align-items:center;
    gap:12px;
  }
  .beat-indicator-dot-wrap{
    position:relative;
    width:34px; height:34px;
    flex-shrink:0;
    display:flex;
    align-items:center;
    justify-content:center;
  }
  .beat-indicator-ring{
    position:absolute;
    inset:0;
    border-radius:50%;
    border:1.5px solid var(--border);
  }
  .beat-indicator-dot{
    width:16px; height:16px;
    border-radius:50%;
    background: var(--accent1);
    box-shadow: 0 0 0 0 rgba(255,46,196,0);
    transform: scale(0.6);
    opacity:.35;
    transition: none; /* driven per-frame from JS, not CSS transitions */
  }
  .beat-indicator-meta{
    display:flex;
    flex-direction:column;
    gap:2px;
    min-width:0;
  }
  .beat-indicator-meta .lbl{
    font-size: 10.5px;
    font-weight:600;
    letter-spacing:.07em;
    text-transform:uppercase;
    color: var(--text-dim);
  }
  .beat-indicator-meta .conf{
    font-family: var(--mono);
    font-size: 12px;
    color: var(--text-dim);
  }
  .beat-indicator-meta .conf strong{ color: var(--text); font-weight:500; }

  .ms-live-header{
    display:flex;
    align-items:center;
    gap:10px;
  }
  .live-dot{
    width:7px; height:7px;
    border-radius:50%;
    background: var(--positive);
    animation: pulse 1s ease-in-out infinite;
    flex-shrink:0;
  }
  .live-dot.idle{ background: var(--text-dim); animation:none; }
  .ms-fps{
    font-family: var(--mono);
    font-size: 11.5px;
    color: var(--text-dim);
    margin-left:auto;
  }
  @keyframes pulse{ 0%,100%{opacity:1} 50%{opacity:.3} }

  /* ---------- BOTTOM BAR ---------- */
  #controlBar{
    position:absolute;
    left:50%;
    bottom:22px;
    transform: translateX(-50%);
    width: min(920px, calc(100% - 48px));
    z-index: 25;
    background: rgba(20,21,30,0.55);
    backdrop-filter: blur(26px) saturate(180%);
    -webkit-backdrop-filter: blur(26px) saturate(180%);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 22px;
    box-shadow: 0 20px 50px -14px rgba(0,0,0,.6), 0 1px 0 rgba(255,255,255,0.04) inset;
    display:flex;
    flex-direction:column;
    overflow:visible;
    transition: transform .35s ease;
    contain: layout style;
    isolation: isolate;
  }`);

// ── styles/ui/07-player-timeline.css ──
window.Aurora.addStyle(6, `
  #app:not(.playlist-closed) #controlBar{ transform: translateX(calc(-50% - 230px)); }

  /* ---------- TIMELINE ISLAND ----------
     A second, separate glass panel — same look/material as #controlBar
     (background/blur/border/shadow/width/playlist-shift behavior) — that
     holds ONLY the progress/timeline bar, floating in its own island
     above the main control island rather than living inside it. Height
     and gap are both tunable (see --timeline-island-* custom properties
     + the settings panel), and this panel gets the exact same
     spectrogram "glass" treatment as #controlBar (see
     Spectrogram._applyGlassMode, which now targets both bars), so the
     waterfall visibly shows through here too when glass mode is on. */
  #timelineIsland{
    position:absolute;
    left:50%;
    bottom: calc(22px + var(--control-bar-h, 96px) + var(--timeline-island-gap, 14px));
    transform: translateX(-50%);
    width: min(920px, calc(100% - 48px));
    height: var(--timeline-island-h, 56px);
    z-index: 24;
    background: rgba(20,21,30,0.55);
    backdrop-filter: blur(26px) saturate(180%);
    -webkit-backdrop-filter: blur(26px) saturate(180%);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 22px;
    box-shadow: 0 20px 50px -14px rgba(0,0,0,.6), 0 1px 0 rgba(255,255,255,0.04) inset;
    display:flex;
    align-items:center;
    /* NOTE: this panel itself stays overflow:visible — #timelineTimeLabel
       (the optional time readout, see below) deliberately positions
       itself OUTSIDE this box via right:100%/left:100%, and needs the
       parent to not clip it. The actual "keep the wave bump's raster
       headroom from bleeding into the control bar below" clipping is
       instead done by #timelineIslandClip, an inner wrapper sized to
       this panel's own rounded shape that contains everything except
       the time label — see its rules further below. */
    overflow:visible;
    transition: transform .35s ease, bottom .2s ease, width .2s ease, border-radius .2s ease;
    contain: layout style;
    isolation: isolate;
  }
  #timelineIsland.merged{
    width: min(calc(920px - var(--timeline-island-inset, 20px) * 2), calc(100% - 48px - var(--timeline-island-inset, 20px) * 2));
    border-bottom: none;
    border-radius: 22px 22px 0 0;
  }
  /* Inner clipping layer: fills the panel exactly (inset:0, radius
     inherited) and clips its own contents (the timeline waterfall
     canvas + the progress bar/canvas/handle/tooltip) flush to this
     panel's rounded silhouette. This is what actually stops the
     progress canvas's tall raster headroom (height:420%, needed so the
     wave-bump animation is never pixel-clipped by the canvas's own
     bounding box — see #progressCanvas below) from bleeding out past
     the panel's real visual edge into whatever sits behind/below it —
     most notably the translucent control bar, whose own backdrop-filter
     would otherwise reveal that overflow through its blur regardless of
     which panel it visually "belongs" to. Kept as a separate wrapper
     (rather than putting overflow:hidden directly on #timelineIsland)
     specifically so #timelineTimeLabel can still live outside it. */
  /* ---- Waveform overlay canvas ----
     Lives OUTSIDE #timelineIslandClip's own overflow:hidden box (it's a
     sibling, not a child), so unlike the progress bar's internal canvas
     it is free to visibly poke up ABOVE the timeline island panel. This
     is what actually lets "Výška křivky" make the curve look taller on
     screen — #timelineIslandClip hard-clips anything drawn inside it to
     the panel's own fixed CSS height, so no amount of internal canvas
     resolution or Y-scaling in JS can ever make content visibly taller
     than the panel itself from in there. Positioned to fill the same
     box as the island but allowed to overflow upward via a negative top
     inset; pointer-events:none so it never blocks the real progress bar
     underneath it. */
  #waveformOverlayCanvas{
    position:absolute;
    left:0; right:0;
    width:100%;
    pointer-events:none;
    z-index:2;
    display:block;
  }
  #timelineIslandClip{
    position:absolute;
    inset:0;
    border-radius:inherit;
    overflow:hidden;
    display:flex;
    align-items:center;
    width:100%;
    z-index:1;
    /* Mask out the bottom slice of this clip box that corresponds to
       the "overlap" zone — the strip where the timeline island visually
       sinks under the control island below it (see
       --timeline-island-overlap / #timelineIslandExtension). Without
       this, tall content drawn in here (e.g. #progressCanvas's own
       420%-height raster, used so the wave-bump animation never clips
       against ITS OWN box) can still end up occupying pixels in that
       overlap band, which then shows through the translucent control
       island's glass underneath as a visible double-render where the
       two panels touch. --timeline-mask-cut (set from JS, in CSS px,
       0 = no cut) draws a hard line above the true seam so nothing from
       this canvas ever paints into territory the control island owns.
       Kept as a mask (not a smaller box + overflow:hidden) so it doesn't
       have to fight with border-radius/inherit or the flex layout above. */
    -webkit-mask-image: linear-gradient(to bottom, #000 0, #000 calc(100% - var(--timeline-mask-cut, 0px)), transparent calc(100% - var(--timeline-mask-cut, 0px)));
    mask-image: linear-gradient(to bottom, #000 0, #000 calc(100% - var(--timeline-mask-cut, 0px)), transparent calc(100% - var(--timeline-mask-cut, 0px)));
  }
  /* ---- Extension strip: a plain, fully opaque slab of the same panel
     color sitting directly below the timeline island's own bottom edge,
     covering the small overlap zone down into the control bar beneath.
     This is NOT the timeline island itself sinking down — that would
     drag its real content (progress bar, time label) down with it,
     which is wrong. Instead this is an empty filler piece: same visual
     material, zero content, so it just patches over any gap/rounded-
     corner hole between the two islands and blocks the control bar's
     own translucent glass from letting the timeline's content show
     through doubled/ghosted underneath it. Sits BELOW the control bar
     in z-index (so the bar's own content/controls always render on top
     of it) but ABOVE the stage background. Opaque on purpose — no
     backdrop-filter/blur here, since it only needs to hide a seam, not
     look like its own glass panel. */
  #timelineIslandExtension{
    position:absolute;
    left:50%;
    transform: translateX(-50%);
    width: min(calc(920px - var(--timeline-island-inset, 20px) * 2), calc(100% - 48px - var(--timeline-island-inset, 20px) * 2));
    height: var(--timeline-island-overlap, 10px);
    /* Top edge of this strip must land exactly at the timeline island's
       own bottom edge (22px + control-bar-h + gap), then extend DOWN
       by \`overlap\` px into the control bar beneath — i.e. its bottom
       edge sits \`overlap\` px below the timeline's bottom edge. Since
       CSS \`bottom\` measures from the strip's own bottom, that's:
       (timeline's bottom offset) minus (overlap). */
    bottom: calc(22px + var(--control-bar-h, 96px) + var(--timeline-island-gap, 14px) - var(--timeline-island-overlap, 10px));
    /* Same glass material as both islands (not a flat opaque color) so
       it blends in seamlessly instead of reading as a visibly different
       patch — this was the mismatch: a plain rgb() fill next to the
       islands' own translucent rgba()+blur combo looks like a different
       shade depending on whatever background is behind it. */
    background: rgba(20,21,30,0.55);
    backdrop-filter: blur(26px) saturate(180%);
    -webkit-backdrop-filter: blur(26px) saturate(180%);
    /* Matches the timeline island's own side borders so the outline
       reads as one continuous line running down both islands instead
       of visibly stopping right at the seam where the extension strip
       begins. */
    border-left: 1px solid rgba(255,255,255,0.08);
    border-right: 1px solid rgba(255,255,255,0.08);
    /* Sits ABOVE both the timeline island and the control bar (not
       between them) so it fully covers the timeline's own rounded
       bottom corners and glass edge right at the seam, rather than
       just filling in behind — with the control bar's own glass being
       translucent, being merely "behind" it wasn't enough to hide the
       timeline peeking through underneath. */
    z-index: 26;
    display:none;
    pointer-events:none;
    transition: transform .35s ease, width .2s ease, bottom .2s ease;
  }
  #timelineIslandExtension.show{ display:block; }
  #app:not(.playlist-closed) #timelineIslandExtension{ transform: translateX(calc(-50% - 230px)); }
  #app:not(.playlist-closed) #timelineIsland{ transform: translateX(calc(-50% - 230px)); }
  #timelineIsland.spectro-glass{
    transition: background-color .3s ease, backdrop-filter .3s ease, transform .35s ease, bottom .2s ease;
  }
  #timelineIsland #progressWrap{
    width:100%;
    height:auto;
    flex:1;
    min-width:0;
    order:2;
  }
  /* Optional time readout riding alongside the timeline bar itself,
     independent of the main control row's own #timeLabel. Hidden by
     default (opt-in via Nastavení → Přehrávač).
     IMPORTANT: this floats OUTSIDE #timelineIsland's own box — to the
     left of it (left:100% is the island's own right edge... no: for the
     left-side variant we anchor via \`right:100%\` so the label's own
     right edge sits at the island's left edge, pushed further out by
     the gap) or to the right (\`left:100%\` + gap) — never overlapping the
     panel or its padding. It's still a child of #timelineIsland so it
     rides along with the island's position/transform (playlist slide,
     drag, etc.) automatically, it just renders past the panel's edge
     instead of inside it. */
  #timelineTimeLabel{
    display:none;
    position:absolute;
    top:50%;
    transform: translateY(-50%);
    font-size:13px;
    min-width:76px;
    text-align:center;
    font-variant-numeric: tabular-nums;
    font-family: var(--mono);
    padding: 6px 12px;
    pointer-events:none;
    z-index:5;
    white-space:nowrap;
  }
  #timelineTimeLabel.show{ display:block; }
  /* Sits OUTSIDE the panel, offset from its edge by a small gap, rather
     than overlapping the timeline bar's own padding. */
  #timelineTimeLabel.side-left{ right: calc(100% + 12px); }
  #timelineTimeLabel.side-right{ left: calc(100% + 12px); }

  /* ---------- LIVE STATS ISLAND ----------
     A third floating glass panel, stacked above the timeline island (same
     "glass island" family as #controlBar/#timelineIsland — same
     background/blur/border/shadow/width/playlist-shift behavior), showing
     a compact one-row readout of the same MusicSense values as the
     Nastavení → Audio → "Živé hodnoty" panel (Bass/Mid/High/Loudness/
     Tempo/Beat), so they're visible on the main screen without having to
     open Nastavení. Opt-in via Nastavení → Control Island; hidden by
     default so it never surprises anyone who doesn't want it. */
  /* ---------- LIVE STATS SIDE PANELS ----------
     Two small glass chips flanking the main control island at its own
     vertical position (bottom-anchored, same as #controlBar) — NOT a
     single centered strip. Left panel shows Bass + High, right panel
     shows Mid + Loudness. Both are children of #controlBar itself (like
     #timelineTimeLabel is a child of #timelineIsland) so they ride along
     automatically with the control bar's playlist-open slide transition
     and never need their own separate transform math. Positioned via
     right:100%/left:100% (mirroring #timelineTimeLabel's side-label
     technique) so they sit just outside the bar's own edge rather than
     overlapping it. Tempo/BPM and beat phase are intentionally NOT
     included here — this is only the four instantaneous band/loudness
     readouts. */
  .live-stats-side{
    position:absolute;
    bottom:0;
    display:none;
    align-items:stretch;
    gap:1px;
    background: rgba(20,21,30,0.55);
    backdrop-filter: blur(26px) saturate(180%);
    -webkit-backdrop-filter: blur(26px) saturate(180%);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 18px;
    box-shadow: 0 20px 50px -14px rgba(0,0,0,.6), 0 1px 0 rgba(255,255,255,0.04) inset;
    padding: 10px 6px;
    overflow:hidden;
    z-index:5;
  }
  .live-stats-side.show{ display:flex; }
  #liveStatsLeft{ right: calc(100% + 12px); }
  #liveStatsRight{ left: calc(100% + 12px); }
  .live-stats-cell{
    width:64px;
    flex-shrink:0;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    gap:5px;
    padding: 2px 8px;
    position:relative;
  }
  .live-stats-side .live-stats-cell + .live-stats-cell{
    position:relative;
  }
  .live-stats-side .live-stats-cell + .live-stats-cell::before{
    content:'';
    position:absolute;
    left:0; top:12%; bottom:12%;
    width:1px;
    background: rgba(255,255,255,0.08);
  }
  .live-stats-cell .lsc-lbl{
    font-size: 9.5px;
    font-weight:700;
    letter-spacing:.08em;
    text-transform:uppercase;
    color: var(--text-dim);
    white-space:nowrap;
  }
  .live-stats-cell .lsc-val{
    font-family: var(--mono);
    font-size: 14px;
    font-weight:500;
    color: var(--text);
    letter-spacing:-0.02em;
    white-space:nowrap;
    font-variant-numeric: tabular-nums;
  }
  .live-stats-cell .lsc-bar-bg{
    width:100%;
    height:3px;
    border-radius:2px;
    background: rgba(255,255,255,0.09);
    overflow:hidden;
  }
  .live-stats-cell .lsc-bar-fill{
    height:100%;
    width:100%;
    clip-path:inset(0 100% 0 0 round 2px);
    border-radius:2px;
    transition: clip-path .05s linear;
  }
  .live-stats-cell[data-key="bass"] .lsc-bar-fill{ background: var(--positive); }
  .live-stats-cell[data-key="mid"] .lsc-bar-fill{ background: var(--warn); }
  .live-stats-cell[data-key="high"] .lsc-bar-fill{ background: var(--accent3); }
  .live-stats-cell[data-key="loudnessPct"] .lsc-bar-fill{ background: var(--positive); }`);

// ── styles/ui/09-player-timeline.css ──
window.Aurora.addStyle(8, `

  /* ---------- SPECTROGRAM ---------- */
  /* Full-width waterfall band whose vertical center is pinned to the
     control island's vertical center (see JS: alignSpectrogramBand()).
     Sits above bgGlow/bgFxOverlay but below the control island itself,
     so the island can composite a glass/warp look on top of it. The
     canvas is drawn edge-to-edge; the island's own backdrop-filter blur
     lets the waterfall visibly pass "through" it (frosted glass), while
     an extra glow strip riding right behind the island (#spectroIslandGlow)
     sells the warp/press feeling of the band being compressed as it
     passes under the panel. */
  #spectrogramLayer{
    position:absolute;
    left:0; right:0;
    z-index: 4; /* above bgFxOverlay(1), below track-meta(6)/stage-tools/controlBar */
    pointer-events:none;
    opacity:0;
    transition: opacity .35s ease, right .35s ease;
  }`);

// ── styles/ui/10-spectrogram.css ──
window.Aurora.addStyle(9, `
  #spectrogramLayer.show{ opacity:1; }
  #spectrogramCanvas{
    position:absolute;
    left:0; top:0;
    width:100%;
    height:100%;
    display:block;
  }
  /* Vignette fade DISABLED per user request — was painting a hard dark
     band over the top/bottom of the waterfall. Element kept in the DOM
     (harmless, just invisible) rather than removed everywhere, in case
     it's wanted back later as a toggle. */
  #spectrogramFade{
    display:none;
  }
  /* Playhead marker: a thin vertical line at the island's horizontal
     center showing exactly where "now" sits on the waterfall (past to
     the left, predicted future to the right). */
  #spectroPlayhead{
    position:absolute;
    top:0; bottom:0;
    width:2px;
    left:50%; /* fallback; actual position set dynamically by Spectrogram (tracks the control island's real center, including when shifted by the open playlist) */
    transform: translateX(-50%);
    background: linear-gradient(180deg, transparent, rgba(255,255,255,0.55) 20%, rgba(255,255,255,0.55) 80%, transparent);
    box-shadow: 0 0 12px 1px rgba(255,255,255,0.35);
    z-index:2;
  }
  /* Glow strip riding directly behind the control island: a horizontal
     band, brighter + slightly blurred, that reads as the waterfall
     "pressing/glowing" right where it passes under the glass panel —
     this is the "warp" cue requested, cheap (just a gradient + blend),
     no actual geometry distortion needed to sell the effect. */
  #spectroIslandGlow{
    position:absolute;
    top:50%; left:50%; /* fallback; actual left set dynamically to track the control island's real center */
    transform: translate(-50%,-50%);
    height: 70px;
    width: min(1040px, calc(100% + 80px));
    background: radial-gradient(ellipse 50% 100% at center, rgba(255,255,255,0.16), transparent 70%);
    mix-blend-mode: screen;
    opacity:0;
    transition: opacity .3s ease;
    pointer-events:none;
  }
  #spectroIslandGlow.show{ opacity:1; }

  /* Control island "glass" mode: when spectroGlassMode is enabled, the
     bar's own background becomes more transparent and its blur is
     reduced so the waterfall visibly shows through underneath it,
     while still keeping enough saturation/blur to stay legible as a
     floating panel rather than disappearing entirely. */
  /* Actual alpha/blur values are set directly as inline styles by
     Spectrogram._applyGlassMode() (JS), since interpolating a CSS custom
     property as the alpha channel inside rgba()/blur() is unreliable
     across browsers. This class only marks the transition timing. */
  #controlBar.spectro-glass{
    transition: background-color .3s ease, backdrop-filter .3s ease;
  }
  /* Inner waterfall: only used when specInsideIsland is on. Sits behind
     all the island's real content (progress bar, buttons, labels) but
     needs to be ABOVE the island's own background-color fill so it's
     actually visible through the glass — the island's background is
     kept semi-transparent via the same glass alpha/blur logic as the
     full-width mode, letting this canvas read as "waterfall behind
     glass" rather than painted on top of the controls. */
  #spectrogramCanvasInner{
    position:absolute;
    inset:0;
    width:100%; height:100%;
    display:block;
    border-radius: inherit;
    z-index:0;
    pointer-events:none;
    opacity:0;
    transition: opacity .3s ease;
  }
  #spectrogramCanvasInner.show{ opacity:1; }
  /* Every direct child of #controlBar other than the inner canvas needs
     to sit above it once it's active. The live-stats side panels are
     excluded — they're deliberately position:absolute (anchored via
     right:100%/left:100% to float just outside the bar's own edges,
     same technique as #timelineTimeLabel on #timelineIsland) and must
     keep that positioning rather than being forced into normal flow. */
  #controlBar > *:not(#spectrogramCanvasInner):not(.live-stats-side){
    position:relative;
    z-index:1;
  }

  /* Same "window into the spectrum" treatment as #spectrogramCanvasInner
     above, applied to the timeline island instead — when "Jen uvnitř
     ovládacího panelu" is on, both floating glass islands get their own
     waterfall window rather than only the lower one. */
  #spectrogramCanvasTimeline{
    position:absolute;
    inset:0;
    width:100%; height:100%;
    display:block;
    border-radius: inherit;
    z-index:0;
    pointer-events:none;
    opacity:0;
    transition: opacity .3s ease;
  }
  #spectrogramCanvasTimeline.show{ opacity:1; }
  #timelineIslandClip > *:not(#spectrogramCanvasTimeline){
    position:relative;
    z-index:1;
  }

  #progressWrap{
    position:relative;
    height:100%;
    min-height:24px;
    padding: 0 20px;
    cursor:pointer;
    background:transparent;
    display:flex;
    align-items:center;
    z-index:21;
    overflow:visible;
  }
  #progressTrack{
    position:relative;
    width:100%;
    /* Scale the visible bar with the island height: at 32px island the bar
       is 4px (the original default); at 56px it's ~7px; at 120px it reaches
       ~16px. Clamp keeps it reasonable at extreme sizes. */
    height: clamp(3px, calc(var(--timeline-island-h, 32px) * 0.14), 18px);
    display:flex;
    align-items:center;
    overflow:visible;
  }
  #progressCanvas{
    position:absolute;
    left:0; bottom:0;
    width:100%;
    /* Tall enough to contain the wave bump even at max "Síla wave efektu"
       (100%) — see tlResize()/tlDraw() in JS, where peakH can reach
       roughly 3.2x the track's base height. 420% gives real headroom
       above that so the animation is never raster-clipped by the
       canvas's own bounds, regardless of #progressWrap/#progressTrack's
       overflow (which was never the actual problem — a canvas simply
       can't draw pixels outside its own width/height, no matter what
       CSS overflow says about its containers). */
    height:420%;
    pointer-events:none;
    display:block;
  }
  #progressHandle{
    position:absolute;
    bottom: 1.5px; left:0%;
    width: clamp(11px, calc(var(--timeline-island-h, 56px) * 0.32), 22px);
    height: clamp(11px, calc(var(--timeline-island-h, 56px) * 0.32), 22px);
    border-radius:50%;
    background: var(--player-c1);
    transform: translateX(-50%) translateY(50%) scale(0);
    box-shadow: 0 0 0 3px rgba(255,255,255,0.15), 0 2px 8px rgba(0,0,0,.5);
    opacity:0;
    transition: opacity .2s ease, transform .2s cubic-bezier(.34,1.56,.64,1), background .3s ease;
    pointer-events:none;
    z-index:10;
  }
  #progressWrap:hover #progressHandle{ opacity:1; transform: translateX(-50%) translateY(50%) scale(1); }
  #progressTooltip{
    position:absolute;
    top:-30px;
    transform: translateX(-50%);
    background: rgba(10,11,18,0.88);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 7px;
    padding: 3px 9px;
    font-size: 11.5px;
    font-family: var(--mono);
    color: var(--text);
    pointer-events:none;
    opacity:0;
    transition: opacity .15s ease;
    white-space:nowrap;
    z-index:3;
  }
  #progressWrap:hover #progressTooltip{ opacity:1; }

  #controlsRow{
    display:flex;
    align-items:center;
    padding: 14px 20px;
    gap: 10px;
  }

  /* ---------- CONTROL-BAR ELEMENT CHIPS ----------
     Shared "backing plate" look applied to each interactive cluster in
     the control island (transport, time, volume, progress track, track
     info) so text/icons stay readable when the spectrogram waterfall or
     glass mode is showing through underneath. Toggleable + tunable via
     --ctrl-chip-* custom properties (see :root and the settings panel). */
  .ctrl-chip{
    background: rgba(8,9,14, var(--ctrl-chip-alpha, 0.38));
    backdrop-filter: blur(var(--ctrl-chip-blur, 10px));
    -webkit-backdrop-filter: blur(var(--ctrl-chip-blur, 10px));
    border: none;
    border-radius: var(--ctrl-chip-radius, 14px);
    box-shadow: 0 8px 24px -10px rgba(0,0,0,.55);
    transition: background .2s ease, backdrop-filter .2s ease, box-shadow .2s ease;
  }`);

// ── styles/ui/11-player-controls.css ──
window.Aurora.addStyle(10, `
  /* Keep glass and liked shadows stable during scroll/drag. Changing
     compositor effects mid-gesture causes visible brightness flashes. */
  /* JS render loops are cancelled while the tab/window is not active.
     Pause compositor-driven CSS animations as well, so no decorative
     animation keeps producing frames behind the user's back. */
  body.render-paused *,
  body.render-paused *::before,
  body.render-paused *::after{
    animation-play-state: paused !important;
  }
  body.ctrl-chips-off .ctrl-chip{
    background: transparent;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    box-shadow: none;
  }
  /* Legibility: text sitting on top of a chip needs to read clearly even
     when a bright/busy spectrogram is blurred behind it, so it gets a
     tighter, higher-contrast treatment than the app's default
     --text-dim (which is fine over a flat dark panel but washes out
     here). Primary text stays the normal --text color plus a soft dark
     shadow for edge contrast; secondary/dim text switches to a lighter,
     higher-contrast grey (also with a shadow) instead of the muted
     default so numbers/labels stay legible over any background color. */
  .ctrl-chip, .ctrl-chip *{
    text-shadow: 0 1px 3px rgba(0,0,0,0.65), 0 0 10px rgba(0,0,0,0.35);
  }
  .ctrl-chip .track-dur,
  #timeLabel.ctrl-chip,
  .bar-track-info.ctrl-chip span{
    color: #c7cad4;
  }
  .transport.ctrl-chip{ padding: 12px 4px; gap:4px; }
  #timeLabel.ctrl-chip{ padding: 8px 14px; border-radius: var(--ctrl-chip-radius, 14px); }
  .volume-group.ctrl-chip{ padding: 4px 14px 4px 4px; }
  .bar-track-info.ctrl-chip{ padding: 8px 16px; }
  .transport{
    display:flex;
    align-items:center;
    gap:4px;
  }
  .ctrl-btn{
    background:none;
    border:none;
    color: var(--text);
    cursor:pointer;
    display:flex;
    align-items:center;
    justify-content:center;
    width:42px; height:42px;
    padding:0;
    border-radius:50%;
    transition: all .15s ease;
    opacity:.9;
  }
  .ctrl-btn:hover{ opacity:1; background: rgba(255,255,255,0.1); }
  .ctrl-btn svg{ width:22px; height:22px; }

  .ctrl-btn.big{
    width:56px; height:56px;
    background: linear-gradient(135deg, var(--player-c1-play), var(--player-c2-play));
    color: #fff;
    border-radius:50%;
    opacity:1;
    box-shadow: 0 6px 18px -6px rgba(0,0,0,.55);
  }
  .ctrl-btn.big:hover{ transform: scale(1.05); filter: brightness(1.1); }
  .ctrl-btn.big svg{ width:26px; height:26px; }

  #timeLabel{
    font-size:14.5px;
    color: var(--text-dim);
    min-width:106px;
    margin-left:10px;
    font-variant-numeric: tabular-nums;
    font-family: var(--mono);
  }

  .volume-group{
    display:flex;
    align-items:center;
    gap:4px;
    padding: 4px 14px 4px 4px;
    border-radius:999px;
    transition: background .15s ease;
  }
  .volume-group:hover{ background: rgba(255,255,255,0.07); }

  /* ---- Shuffle / Repeat toggle buttons ---- */
  .playback-mode-group{
    display:flex;
    align-items:center;
    gap:2px;
    padding: 6px;
  }
  .playback-mode-btn{
    width:38px; height:38px;
    opacity: .55;
  }
  .playback-mode-btn svg{ width:18px; height:18px; }
  .playback-mode-btn:hover{ opacity: .85; }
  .playback-mode-btn.active{
    opacity: 1;
    color: #fff;
    background: linear-gradient(135deg, var(--player-c1), var(--player-c2));
  }
  .playback-mode-btn.active:hover{ background: linear-gradient(135deg, var(--player-c1), var(--player-c2)); filter: brightness(1.1); }

  .volume-icon-btn{
    background:none; border:none; color:var(--text); opacity:.9;
    display:flex; align-items:center; justify-content:center;
    width:42px; height:42px; border-radius:50%; cursor:pointer;
    flex-shrink:0; transition: all .15s ease;
  }
  .volume-icon-btn:hover{ opacity:1; }
  .volume-icon-btn svg{ width:20px; height:20px; }
  .volume-wrap{
    display:flex;
    align-items:center;
    width:100px;
    flex-shrink:0;
  }
  input#volumeRange{
    -webkit-appearance: none;
    appearance: none;
    width:100%;
    height:20px;
    margin:0;
    background: transparent;
    outline:none;
    cursor:pointer;
  }
  input#volumeRange::-webkit-slider-runnable-track{
    -webkit-appearance:none;
    width:100%;
    height:4px;
    border-radius:2px;
    background: linear-gradient(to right, #fff 0%, #fff var(--vol-pct,20%), rgba(255,255,255,0.22) var(--vol-pct,20%), rgba(255,255,255,0.22) 100%);
  }
  input#volumeRange::-moz-range-track{
    width:100%;
    height:4px;
    border-radius:2px;
    background: rgba(255,255,255,0.22);
    border:none;
  }
  input#volumeRange::-moz-range-progress{
    height:4px;
    border-radius:2px;
    background:#fff;
  }
  input#volumeRange::-webkit-slider-thumb{
    -webkit-appearance:none;
    width:14px; height:14px;
    margin-top:-5px;
    border-radius:50%;
    background:#fff;
    border:none;
    cursor:pointer;
  }
  input#volumeRange::-moz-range-thumb{
    width:14px; height:14px;
    border:none;
    border-radius:50%;
    background:#fff;
    cursor:pointer;
  }

  .spacer{ flex:1; }

  .bar-track-info{
    display:flex;
    flex-direction:column;
    min-width:0;
    max-width: 300px;
    cursor:pointer;
    position:relative;
    border-radius: var(--ctrl-chip-radius, 14px);
    transition: box-shadow .25s ease, background .15s ease;
  }
  .bar-track-info:hover{ background: rgba(255,255,255,0.05); }
  .bar-track-info strong{
    font-size:14.5px;
    font-weight:600;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
  }
  .bar-track-info span{
    font-size:12.5px;
    color: var(--text-dim);
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
    font-family: var(--mono);
  }
  /* Liked-track outline: a soft red-into-pink ring around the whole
     track-info chip, so a favorited track is visibly distinct in the
     control bar at a glance, not just inside the playlist/stage heart
     buttons. Layered as a box-shadow ring (not border) so it doesn't
     shift the chip's own padding/box size. */
  .bar-track-info.liked{
    box-shadow: 0 0 0 1.5px #ff1f4d, 0 0 16px -2px rgba(255,31,77,0.65);
  }
  .bar-track-info.liked:hover{
    box-shadow: 0 0 0 1.5px #ff2f5c, 0 0 20px -1px rgba(255,31,77,0.8);
  }
  /* Opt-in mode (Nastavení → Control Island): the liked outline above is
     suppressed while not hovering, and only appears on :hover — same
     colors/glow as the always-on variant, just gated on hover instead of
     on the .liked class alone. */
  .bar-track-info.liked-outline-hover-only.liked{
    box-shadow: none;
  }
  .bar-track-info.liked-outline-hover-only.liked:hover{
    box-shadow: 0 0 0 1.5px #ff2f5c, 0 0 20px -1px rgba(255,31,77,0.8);
  }
  /* Small heart badge riding right on top of the outline's edge (top-
     center), like a little pin. Now an actual clickable toggle (not
     just a liked-state indicator): always present so it can be used to
     LIKE a track too, not just to show it's already liked — filled red
     when liked, a dim outline version when not, same as any other heart
     button in the app. */
  .bar-track-info-heart-badge{
    position:absolute;
    top:0; left:50%;
    transform: translate(-50%,-50%) scale(0.001);
    width:22px; height:22px;
    border-radius:50%;
    background: rgba(30,20,26,0.92);
    border: 2px solid var(--bg);
    display:flex; align-items:center; justify-content:center;
    color: var(--text-dim);
    opacity:0;
    z-index:5;
    cursor:pointer;
    box-shadow: 0 2px 8px -1px rgba(0,0,0,0.5);
    transition: opacity .18s ease, transform .18s cubic-bezier(.34,1.56,.64,1), background .15s ease, color .15s ease, box-shadow .15s ease;
  }
  .bar-track-info:hover .bar-track-info-heart-badge{
    opacity:1;
    transform: translate(-50%,-50%) scale(1);
  }
  .bar-track-info-heart-badge:hover{
    color:#fff;
    background: rgba(50,35,42,0.95);
  }
  .bar-track-info-heart-badge svg{ width:12px; height:12px; }
  .bar-track-info-heart-badge svg path{ transition: fill .15s ease; }
  .bar-track-info-heart-badge.liked{
    color:#fff;
    background: linear-gradient(135deg, #ff3b5c, #ff1f4d);
    box-shadow: 0 2px 10px -1px rgba(255,31,77,0.7);
  }
  .bar-track-info-heart-badge.liked svg path{ fill:currentColor; }
  /* Uses its own keyframes (not the shared .pop/heartPop used by the
     other heart buttons) because this badge's resting transform already
     includes translate(-50%,-50%) for centering — the shared heartPop
     keyframes only animate scale(), so applying them here would
     momentarily replace the whole transform and make the badge jump
     away from its centered position for the animation's duration. */
  .bar-track-info-heart-badge.pop{ animation: heartPopCentered .35s cubic-bezier(.34,1.56,.64,1); }
  @keyframes heartPopCentered{
    0%{ transform: translate(-50%,-50%) scale(1); }
    35%{ transform: translate(-50%,-50%) scale(1.35); }
    100%{ transform: translate(-50%,-50%) scale(1); }
  }

  /* ---------- TRACK INFO POPOVER ----------
     Small card floating above the control island's track-info chip,
     showing everything ProfileStore/PlayStatsStore/LikeStore know about
     the current track: LUFS, duration, play count, last played date,
     and a like toggle mirroring the stage/playlist hearts. */
  #trackInfoPopover{
    position:absolute;
    left:50%;
    bottom: calc(100% + 12px);
    transform: translateX(-50%) translateY(6px);
    width: 260px;
    z-index: 30;
    background: rgba(18,20,28,0.92);
    backdrop-filter: blur(20px) saturate(160%);
    -webkit-backdrop-filter: blur(20px) saturate(160%);
    border: 1px solid var(--border);
    border-radius: 16px;
    box-shadow: 0 20px 50px -10px rgba(0,0,0,.6);
    padding: 16px 18px;
    opacity:0;
    pointer-events:none;
    transition: opacity .18s ease, transform .18s ease;
    cursor: default;
  }`);

// ── styles/ui/12-track-info.css ──
window.Aurora.addStyle(11, `
  #trackInfoPopover.show{
    opacity:1;
    pointer-events:auto;
    transform: translateX(-50%) translateY(0);
  }
  #trackInfoPopover::after{
    content:'';
    position:absolute;
    top:100%; left:50%;
    transform: translateX(-50%);
    width:14px; height:14px;
    background: inherit;
    border-right: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    clip-path: polygon(0 0, 100% 0, 0 100%);
    border-radius: 0 0 0 3px;
    margin-top:-8px;
  }
  .tip-head{
    display:flex;
    align-items:flex-start;
    justify-content:space-between;
    gap:10px;
    margin-bottom:12px;
    padding-bottom:12px;
    border-bottom: 1px solid var(--border);
  }
  .tip-head-titles{ min-width:0; }
  .tip-head-titles strong{
    display:block;
    font-size:14.5px;
    font-weight:600;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
  }
  .tip-head-titles span{
    display:block;
    font-size:12px;
    color: var(--text-dim);
    font-family: var(--mono);
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
    margin-top:2px;
  }
  .tip-heart-btn{
    padding:0; font:inherit; appearance:none;
    width:32px; height:32px;
    flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    background: rgba(255,255,255,0.05);
    border: 1px solid var(--border);
    border-radius:50%;
    color: var(--text-dim);
    cursor:pointer;
    transition: color .15s ease, background .15s ease, border-color .15s ease;
  }
  .tip-heart-btn svg{ width:16px; height:16px; }
  .tip-heart-btn svg path{ transition: fill .15s ease; }
  .tip-heart-btn:hover{ color: var(--text); }
  .tip-heart-btn.liked{
    color: #ff3b5c;
    border-color: color-mix(in srgb, #ff3b5c 45%, transparent);
    background: rgba(255,59,92,0.12);
  }
  .tip-heart-btn.liked svg path{ fill: currentColor; }
  .tip-heart-btn.pop{ animation: heartPop .35s cubic-bezier(.34,1.56,.64,1); }

  .tip-stat-row{
    display:flex;
    align-items:center;
    justify-content:space-between;
    font-size:12.5px;
    color: var(--text-dim);
    padding: 6px 0;
  }
  .tip-stat-row strong{
    color: var(--text);
    font-family: var(--mono);
    font-weight:500;
    font-size:12.5px;
    text-align:right;
    max-width: 150px;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
  }
  .tip-stat-row + .tip-stat-row{ border-top: 1px solid rgba(255,255,255,0.05); }
  .tip-empty-hint{
    font-size:11.5px;
    color: var(--text-dim);
    line-height:1.5;
    text-align:center;
    padding: 4px 2px 2px;
  }

  /* ---------- PLAYLIST ---------- */
  #playlistPanel{
    position:absolute;
    top:12px; right:12px;
    bottom: 12px;
    width: 460px;
    z-index: 15;
    background: rgba(12,13,19,0.72);
    backdrop-filter: blur(22px) saturate(150%);
    -webkit-backdrop-filter: blur(22px) saturate(150%);
    border: 1px solid var(--border);
    border-radius: 22px;
    box-shadow: -4px 0 40px rgba(0,0,0,.35), 0 8px 32px rgba(0,0,0,.3);
    display:flex;
    flex-direction:column;
    overflow:hidden;
    min-width:0;
    transition: transform .35s ease;
    contain: layout style paint;
    isolation: isolate;
  }`);

// ── styles/ui/13-playlist.css ──
window.Aurora.addStyle(12, `
  #app.playlist-closed #playlistPanel{ transform: translateX(calc(100% + 16px)); }
  .playlist-header{
    padding: 22px 22px 16px;
    display:flex;
    flex-direction:column;
    gap:14px;
    border-bottom:1px solid var(--border);
  }
  .playlist-header-top{
    display:flex;
    align-items:center;
    justify-content:space-between;
  }
  .playlist-header-top h3{
    margin:0;
    font-family: var(--font-display);
    font-size:19px;
  }
  .playlist-count{
    font-family: var(--mono);
    font-size:12px;
    color: var(--text-dim);
  }
  .import-drop-zone{
    display:flex;
    flex-direction:column;
    gap:9px;
    padding: 12px;
    border-radius: 14px;
    border: 1.5px dashed var(--border);
    background: rgba(255,255,255,0.025);
    transition: border-color .15s ease, background .15s ease;
  }
  .import-drop-row{ display:flex; gap:8px; }
  .import-drop-hint{
    text-align:center;
    font-size:11px;
    color: var(--text-dim);
    opacity:.75;
  }
  .import-drop-zone.dragover{
    border-color: var(--accent2);
    background: rgba(124,58,237,0.08);
  }
  .import-drop-zone.dragover .import-drop-hint{
    color: var(--accent2);
    opacity:1;
  }
  .import-btn{
    display:flex;
    align-items:center;
    justify-content:center;
    gap:8px;
    font-size:13.5px;
    font-weight:600;
    color:#fff;
    background: linear-gradient(135deg, var(--player-c1-import, var(--player-c1)), var(--player-c2-import, var(--player-c2)));
    border:1px solid transparent;
    padding: 11px 16px;
    border-radius:12px;
    cursor:pointer;
    transition: filter .15s ease, transform .15s ease, box-shadow .15s ease;
    box-shadow: 0 6px 16px -6px rgba(0,0,0,.5);
  }
  .import-btn svg{ width:16px; height:16px; flex-shrink:0; }
  .import-btn:hover{ filter:brightness(1.12); transform: translateY(-1px); box-shadow: 0 10px 20px -6px rgba(0,0,0,.55); }
  .import-btn:active{ transform: translateY(0); filter:brightness(1.02); }
  .import-btn.ghost{
    background: rgba(255,255,255,0.05);
    color: var(--text);
    border: 1px solid var(--border);
    box-shadow: none;
  }
  .import-btn.ghost:hover{ background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.22); }
  /* .plain: same look as .ghost but a distinct class so it's clearly
     "opt out of the colored/synced import button styling" rather than
     visually implying it's the folder-picker's ghost variant reused. */
  .import-btn.plain{
    background: rgba(255,255,255,0.05);
    color: var(--text);
    border: 1px solid var(--border);
    box-shadow: none;
  }
  .import-btn.plain:hover{ background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.22); }
  #searchInput{
    width:100%;
    padding: 11px 14px;
    border-radius:10px;
    border:1px solid var(--border);
    background: rgba(255,255,255,0.04);
    color: var(--text);
    font-size:14px;
    font-family: var(--font-body);
    outline:none;
  }
  #searchInput:focus{ border-color: var(--accent2); }
  .search-wrap{
    position:relative;
    display:flex;
    align-items:center;
  }
  .search-wrap #searchInput{ padding-right:36px; }
  .search-clear-btn{
    position:absolute;
    right:6px;
    width:26px; height:26px;
    border-radius:8px;
    border:none;
    background:transparent;
    color: var(--text-dim);
    display:none;
    align-items:center;
    justify-content:center;
    cursor:pointer;
    transition: all .15s ease;
  }
  .search-clear-btn.show{ display:flex; }
  .search-clear-btn:hover{ color: var(--text); background: rgba(255,255,255,0.08); }
  .search-clear-btn svg{ width:14px; height:14px; }

  /* ---------- BULK ANALYZE BAR ---------- */
  #bulkAnalyzeBar{
    display:flex;
    flex-direction:column;
    gap:8px;
    flex-shrink:0;
    padding: 14px 22px 18px;
    border-top: 1px solid var(--border);
  }
  #bulkAnalyzeBtn{
    display:flex;
    align-items:center;
    justify-content:center;
    gap:9px;
    width:100%;
    padding: 11px 14px;
    border-radius:10px;
    border:1px solid var(--border);
    background: rgba(255,255,255,0.04);
    color: var(--text);
    font-size:13.5px;
    font-weight:600;
    cursor:pointer;
    transition: all .15s ease;
  }
  #bulkAnalyzeBtn:hover{ border-color: var(--accent2); background: rgba(124,58,237,0.08); }
  #bulkAnalyzeBtn.running{
    border-color: var(--danger);
    color: var(--danger);
    background: rgba(224,80,96,0.08);
  }
  #bulkAnalyzeBtn svg{ width:15px; height:15px; flex-shrink:0; }
  #bulkAnalyzeBtn .spinner{
    width:14px; height:14px;
    border-radius:50%;
    border: 2px solid rgba(255,255,255,0.2);
    border-top-color: var(--accent1);
    animation: spin .7s linear infinite;
    flex-shrink:0;
  }
  #bulkAnalyzeProgress{
    display:none;
    flex-direction:column;
    gap:6px;
  }
  #bulkAnalyzeProgress.show{ display:flex; }
  #bulkAnalyzeProgress .row{
    display:flex;
    justify-content:space-between;
    font-size:12px;
    color: var(--text-dim);
    font-family: var(--mono);
  }
  #bulkAnalyzeProgress .row strong{ color: var(--text); font-weight:500; }
  #bulkAnalyzeProgress .bar-bg{
    height:5px;
    border-radius:3px;
    background: rgba(255,255,255,0.1);
    overflow:hidden;
  }
  #bulkAnalyzeProgress .bar-fill{
    height:100%;
    width:0%;
    border-radius:3px;
    background: linear-gradient(90deg, var(--accent1), var(--accent2));
    transition: width .15s ease;
  }

  #trackList{
    flex:1;
    overflow-y:auto;
    padding: 10px 12px 22px;
  }
  #trackList::-webkit-scrollbar{ width:8px; }
  #trackList::-webkit-scrollbar-thumb{ background: rgba(255,255,255,0.12); border-radius:8px; }

  .track-row{
    display:flex;
    align-items:center;
    gap:14px;
    padding: 10px 12px;
    height: 76px;
    box-sizing: border-box;
    border-radius:12px;
    cursor:pointer;
    transition: background .15s ease;
    position:relative;
    overflow:hidden;
    contain: layout style paint;
  }
  .track-row:hover{ background: rgba(255,255,255,0.05); }
  .track-row.playing{
    background: rgba(255,46,196,0.09);
    box-shadow: 0 0 0 1.5px var(--player-c1), 0 0 14px -2px var(--player-c1);
  }
  .track-row.playing.norm-loading{
    box-shadow: 0 0 0 1.5px color-mix(in srgb, var(--player-c1) 60%, transparent), 0 0 14px -2px var(--player-c1);
  }
  .track-norm-progress{
    position:absolute;
    top:0; bottom:0;
    left:0%;
    width:3px;
    background: linear-gradient(180deg, transparent, var(--player-c1-scanline) 15%, var(--player-c2-scanline) 85%, transparent);
    box-shadow: 0 0 10px 1px color-mix(in srgb, var(--player-c1-scanline) 85%, transparent);
    opacity:0;
    pointer-events:none;
    transition: left .12s linear;
  }
  .track-norm-progress::before{
    content:'';
    position:absolute;
    top:0; bottom:0;
    right:100%;
    width:70px;
    background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--player-c1-scanline) 28%, transparent));
  }
  .track-norm-progress.active{ opacity:1; }
  .track-norm-progress.finishing{
    transition: left .12s linear, opacity .35s ease .05s;
    opacity:0;
  }
  .track-num{
    width:24px;
    text-align:center;
    font-size:13px;
    color: var(--text-dim);
    font-variant-numeric: tabular-nums;
    flex-shrink:0;
    font-family: var(--mono);
  }
  .track-row.playing .track-num{ color: var(--player-c1); }
  .track-thumb{
    width:42px; height:42px;
    border-radius:9px;
    background: linear-gradient(135deg, var(--player-c1-thumb), var(--player-c2-thumb));
    flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    opacity:.85;
  }
  .track-row.playing .track-thumb{ opacity:1; }
  .eq-bars{ display:flex; gap:2px; align-items:flex-end; height:14px; }
  .eq-bars span{ width:2.5px; background:#fff; border-radius:1px; animation: eq 1s ease-in-out infinite; }
  .eq-bars span:nth-child(2){ animation-delay:.2s; }
  .eq-bars span:nth-child(3){ animation-delay:.4s; }
  @keyframes eq{ 0%,100%{ height:3px; } 50%{ height:13px; } }

  .track-info{ min-width:0; flex:1; }
  .track-info strong{
    display:-webkit-box;
    -webkit-line-clamp:2;
    -webkit-box-orient:vertical;
    font-size:14.5px;
    font-weight:500;
    overflow:hidden;
    text-overflow:ellipsis;
    line-height:1.28;
    white-space:normal;
    word-break:break-word;
  }
  .track-info .track-meta-row{
    display:flex;
    align-items:center;
    gap:8px;
    margin-top:3px;
  }
  .track-info small{
    font-size:12.5px;
    color: var(--text-dim);
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
    font-family: var(--mono);
  }
  .norm-badge{
    font-family: var(--mono);
    font-size: 10px;
    padding: 2px 7px;
    border-radius: 999px;
    background: rgba(76,175,130,.15);
    color: var(--positive);
    flex-shrink: 0;
    white-space: nowrap;
  }
  .norm-badge.pending{ background: rgba(224,160,80,.12); color: var(--warn); }

  /* ---------- FAVORITE / LIKE HEART ----------
     Sits at the far right of a track-row (before the duration column,
     see .track-row markup) and doubles as the "like this track" toggle
     shown next to the now-playing track's title on the stage. Uses a
     simple SVG heart, outline-only when unliked, filled + accent color
     when liked. Click handling stops propagation so clicking the heart
     inside a playlist row doesn't ALSO trigger that row's own "play this
     track" click handler. */
  .heart-btn{
    width:28px; height:28px;
    flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    background:none; border:none;
    color: var(--text-dim);
    cursor:pointer;
    border-radius:50%;
    transition: color .15s ease, transform .12s ease, background .15s ease;
    opacity:.55;
  }`);

// ── styles/ui/16-favorites-normalization.css ──
window.Aurora.addStyle(15, `

/* Card-based UI shell. Opaque layered surfaces avoid sampling the animated
   background through a large backdrop filter on every settings scroll. */
#settingsPanel, #app:not(.playlist-closed) #settingsPanel{
  position:absolute;right:24px;top:76px;width:min(760px,calc(100vw - 48px));
  height:min(790px,calc(100% - 102px));max-height:calc(100% - 102px);
  border-radius:22px;background:linear-gradient(145deg,#1b1a27,#11121c 65%);
  border:1px solid rgba(208,187,255,.19);backdrop-filter:none;-webkit-backdrop-filter:none;
  box-shadow:0 28px 90px #0009,0 0 0 5px #ffffff03;transition:none;z-index:100;
  font-size:13px;animation:settings-arrive .16s ease-out;
}`);

// ── styles/ui/19-ui-shell.css ──
window.Aurora.addStyle(18, `
@media(prefers-reduced-motion:reduce){#settingsPanel{animation:none;}.settings-result,.settings-nav-item{transition:none;}}

/* v2.0: keep floating surfaces consistent and soften scroll transitions. */
#playlistPanel{transition:transform .25s ease,background-color .12s ease;}
#controlBar,#timelineIsland{transition:background-color .12s ease;}
#settingsPanel,#playlistPanel,#controlBar,#timelineIsland{border-radius:22px;}`);

// ── styles/ui/23-ui-shell.css ──
window.Aurora.addStyle(22, `
@media(prefers-reduced-motion:reduce){#controlBar,#timelineIsland,#timelineIslandExtension,#playlistPanel{transition:none;}}


#trackInfoPopover{transform:translateY(6px);}#trackInfoPopover.show{transform:none;}
.track-meta{max-width:calc(100% - var(--player-reserve) - 68px);}
#settingsPanel .setting-block h3,#settingsPanel .setting-subhead{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.map-subrow-label{gap:8px;min-width:0;}.map-subrow-label>span{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}.map-subrow-label>strong{flex:none;white-space:nowrap;}
.map-row-head{min-width:0;}.map-row-head .map-title{min-width:0;white-space:nowrap;overflow:hidden;}.map-row-head-right{gap:5px;}.map-live-val{font-size:10px;padding:3px 6px;}
.map-norm-row{overflow-x:auto;max-width:100%;padding-bottom:4px;}.map-norm-row>span{white-space:nowrap;flex:none;}.map-norm-row input[type=number]{flex:0 0 64px;width:64px;}
.mapping-advanced{display:block;}.curve-editor-head{overflow-x:auto;padding-bottom:5px;}.curve-editor-actions{flex:none;}.curve-action-btn{white-space:nowrap;}.curve-hint-row{flex-wrap:wrap;}`);

// ── styles/ui/25-ui-shell.css ──
window.Aurora.addStyle(24, `

/* Preserve inset alignment even while the playlist is open. */
#app:not(.playlist-closed) #timelineIsland.merged,#app:not(.playlist-closed) #timelineIslandExtension{
 width:min(calc(920px - var(--timeline-island-inset,20px) * 2),calc(100% - var(--player-reserve) - 48px - var(--timeline-island-inset,20px) * 2));
}
.volume-wrap{display:flex;}
/* Aurora 2.1 — classic settings skin, based on the supplied reference. */
#settingsPanel,#app:not(.playlist-closed) #settingsPanel{
  left:auto;right:24px;top:70px;width:min(560px,calc(100vw - 48px));
  height:min(920px,calc(100% - 94px));max-height:calc(100% - 94px);
  background:linear-gradient(160deg,#101116,#101119);border:1px solid #292a33;
  border-radius:20px;box-shadow:0 16px 44px #0005;animation:none;
  color:#e5e5ec;font-size:13px;
}`);

// ── styles/ui/33-settings-skin.css ──
window.Aurora.addStyle(32, `


/* High-contrast player chrome; preserve accent colors and toggle states. */
#controlBar, #timelineIsland, .live-stats-side{
  --text: #ffffff;
  --text-dim: #dce0ea;
  color: #ffffff;
  border-color: rgba(255,255,255,.28);
}`);
