/* visualizers.js — Spektrogram a časová osa včetně waveformu. */

// ── spectrum/renderer-ensure ──
(function(App){
  App.addParts("Spectrogram", {
ensure(){
      if(this._canvas) return;
      this._canvas = App.el('spectrogramCanvas');
      this._ctx = this._canvas.getContext('2d');
      this._innerCanvas = App.el('spectrogramCanvasInner');
      this._innerCtx = this._innerCanvas.getContext('2d');
      this._timelineCanvas = App.el('spectrogramCanvasTimeline');
      this._timelineCtx = this._timelineCanvas ? this._timelineCanvas.getContext('2d') : null;
      this._historyCanvas = document.createElement('canvas');
      this._historyCtx = this._historyCanvas.getContext('2d');
    },
alignAndSize(){
      this.ensure();
      const wallNow = performance.now();
      if(this._lastAlignT !== undefined && (wallNow - this._lastAlignT) < 100) return;
      this._lastAlignT = wallNow;
      const layer = App.el('spectrogramLayer');
      const bar = App.el('controlBar');
      const tlIsland = App.el('timelineIsland');
      if(!layer || !bar) return;
      const stageRect = (App.el('sceneContent')||App.stage).getBoundingClientRect();
      const barRect = bar.getBoundingClientRect();
      let topEdge = barRect.top, bottomEdge = barRect.bottom;
      if(tlIsland){
        const tlRect = tlIsland.getBoundingClientRect();
        if(tlRect.height > 0){
          topEdge = Math.min(topEdge, tlRect.top);
          bottomEdge = Math.max(bottomEdge, tlRect.bottom);
        }
      }
      const spanCenterY = (topEdge + bottomEdge)/2 - stageRect.top;
      const spanHeight = bottomEdge - topEdge;
      const barCenterY = spanCenterY;
      const h = Math.max(20, Math.round(App.settings.specHeight), Math.round(spanHeight));
      layer.style.top = Math.round(barCenterY - h/2) + 'px';
      layer.style.height = h + 'px';
      let rightInset = 0;
      if(App.settings.specAnchor !== 'center' && App.settings.specPlaylistOffset && !App.app.classList.contains('playlist-closed')){
        const playlistPanel = App.el('playlistPanel');
        if(playlistPanel){
          const plRect = playlistPanel.getBoundingClientRect();
          rightInset = Math.max(0, stageRect.right - plRect.left);
        }
      }
      layer.style.right = Math.round(rightInset) + 'px';
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(20, Math.round(stageRect.width - rightInset));
      this._nowXCss = App.settings.specAnchor === 'center' ? w/2 : w;
      const playhead = App.el('spectroPlayhead');
      const glow = App.el('spectroIslandGlow');
      if(playhead) playhead.style.left = Math.round(this._nowXCss) + 'px';
      if(glow) glow.style.left = Math.round(this._nowXCss) + 'px';
      const cw = Math.round(w*dpr), ch = Math.round(h*dpr);
      if(this._canvas.width !== cw || this._canvas.height !== ch){
        this._canvas.width = cw;
        this._canvas.height = ch;
      }
      const histSecEffective = App.settings.specFillWidth ? (w / Math.max(1,App.settings.specPxPerSec)) * 1.15 : App.settings.specHistorySec;
      const histPx = Math.max(50, Math.round(histSecEffective * App.settings.specPxPerSec));
      const histCH = ch, histCW = Math.max(1,Math.min(16384,Math.floor(16*1024*1024/(4*histCH)),Math.round(histPx*dpr)));
      if(this._historyCanvas.width !== histCW || this._historyCanvas.height !== histCH){
        this._historyCanvas.width = histCW;
        this._historyCanvas.height = histCH;
        this._historyColCount = 0;
      }
    },
_sizeIslandCanvas(hostId, canvas){
      const host = App.el(hostId);
      if(!host || !canvas) return null;
      const wallNow = performance.now();
      canvas._sizeCache = canvas._sizeCache || {};
      const cache = canvas._sizeCache;
      if(cache.t === undefined || (wallNow - cache.t) >= 100){
        const rect = host.getBoundingClientRect();
        cache.rectW = rect.width;
        cache.rectH = rect.height;
        cache.t = wallNow;
      }
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(20, Math.round(cache.rectW||0));
      const h = Math.max(20, Math.round(cache.rectH||0));
      const cw = Math.round(w*dpr), ch = Math.round(h*dpr);
      if(canvas.width !== cw || canvas.height !== ch){
        canvas.width = cw;
        canvas.height = ch;
      }
      return { w: cw, h: ch };
    },
_ensureIslandHistorySize(){
      const wallNow = performance.now();
      if(this._lastIslandHistT !== undefined && (wallNow - this._lastIslandHistT) < 100) return;
      this._lastIslandHistT = wallNow;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const barEl = App.el('controlBar');
      const tlEl = App.el('timelineIsland');
      const barRect = barEl ? barEl.getBoundingClientRect() : null;
      const tlRect = (tlEl && App.settings.specInsideIsland && App.settings.specInsideIslandBothPanels !== false) ? tlEl.getBoundingClientRect() : null;
      const wCss = Math.max(20, Math.round(Math.max(barRect ? barRect.width : 0, tlRect ? tlRect.width : 0)));
      const hCss = Math.max(20, Math.round(Math.max(barRect ? barRect.height : 0, tlRect ? tlRect.height : 0)));
      const ch = Math.round(hCss*dpr);
      const histSecEffective = App.settings.specFillWidth ? (wCss / Math.max(1,App.settings.specPxPerSec)) * 1.15 : App.settings.specHistorySec;
      const histPx = Math.max(50, Math.round(histSecEffective * App.settings.specPxPerSec));
      const histCH = ch, histCW = Math.max(1,Math.min(16384,Math.floor(16*1024*1024/(4*histCH)),Math.round(histPx*dpr)));
      if(this._historyCanvas.width !== histCW || this._historyCanvas.height !== histCH){
        this._historyCanvas.width = histCW;
        this._historyCanvas.height = histCH;
        this._historyColCount = 0;
      }
    },
_ensureFreqBins(rows, fftBinCount, sampleRate, fftSize){
      const sig = `${rows}|${fftBinCount}|${sampleRate}|${fftSize}|${App.settings.specFreqMin}|${App.settings.specFreqMax}|${App.settings.specLogScale}`;
      if(sig === this._freqBinsSig && this._freqBinsCache) return this._freqBinsCache;
      const fMin = Math.max(1, Math.min(App.settings.specFreqMin, App.settings.specFreqMax-1));
      const fMax = Math.max(fMin+1, App.settings.specFreqMax);
      const nyquist = sampleRate/2;
      const binHz = nyquist / fftBinCount;
      const out = new Array(rows);
      for(let row=0; row<rows; row++){
        const t = row/(Math.max(1,rows-1));
        let freq;
        if(App.settings.specLogScale){
          const logMin = Math.log(fMin), logMax = Math.log(fMax);
          freq = Math.exp(logMax - t*(logMax-logMin));
        } else {
          freq = fMax - t*(fMax-fMin);
        }
        const binF = Math.max(0, Math.min(fftBinCount-1, freq/binHz));
        out[row] = { idx0: Math.floor(binF), idx1: Math.min(fftBinCount-1, Math.floor(binF)+1), frac: binF - Math.floor(binF) };
      }
      this._freqBinsCache = out;
      this._freqBinsSig = sig;
      return out;
    },
_buildPaletteLUT(){
      const N = 256;
      const lut = new Uint8ClampedArray(N*3);
      const palette = App.settings.specPalette;
      if(palette === 'heatmap'){
        const stops = [
          [6,8,22],
          [30,20,90],
          [110,25,130],
          [200,40,110],
          [255,140,60],
          [255,235,120],
        ];
        const n = stops.length-1;
        for(let k=0;k<N;k++){
          const i = k/(N-1);
          const pos = i*n;
          const idx = Math.min(n-1, Math.floor(pos));
          const f = pos-idx;
          const a = stops[idx], b = stops[idx+1];
          lut[k*3]   = a[0]+(b[0]-a[0])*f;
          lut[k*3+1] = a[1]+(b[1]-a[1])*f;
          lut[k*3+2] = a[2]+(b[2]-a[2])*f;
        }
      } else {
        const c1 = App.PlayerColors._lastC1 || '#ff2ec4';
        const c2 = App.PlayerColors._lastC2 || '#7c3aed';
        const a = App.hexToRgb(c1), b = App.hexToRgb(c2);
        const floor = 0.04;
        for(let k=0;k<N;k++){
          const i = k/(N-1);
          const m = floor + (1-floor)*i;
          lut[k*3]   = (a.r+(b.r-a.r)*i)*m;
          lut[k*3+1] = (a.g+(b.g-a.g)*i)*m;
          lut[k*3+2] = (a.b+(b.b-a.b)*i)*m;
        }
      }
      this._paletteLUT = lut;
    }
  });
})(window.Aurora);

// ── spectrum/renderer-ensure-palette-l-u-t ──
(function(App){
  App.addParts("Spectrogram", {
_ensurePaletteLUT(){
      const c1 = App.settings.specPalette === 'player' ? (App.PlayerColors._lastC1 || '') : '';
      const c2 = App.settings.specPalette === 'player' ? (App.PlayerColors._lastC2 || '') : '';
      const sig = `${App.settings.specPalette}|${c1}|${c2}`;
      if(sig !== this._paletteLUTSig || !this._paletteLUT){
        this._buildPaletteLUT();
        this._paletteLUTSig = sig;
      }
      return this._paletteLUT;
    },
_paintColumn(ctx, canvas, colIdx, intensities){
      const w = canvas.width, h = canvas.height;
      const colX = ((colIdx % w) + w) % w;
      const rows = intensities.length;
      const lut = this._ensurePaletteLUT();
      const gain = App.settings.specGain, gamma = App.settings.specGamma;
      const img = this._singleColumnImage?.height === h ? this._singleColumnImage : (this._singleColumnImage = ctx.createImageData(1, h));
      const data = img.data;
      for(let py=0; py<h; py++){
        const row = Math.min(rows-1, (rows*py/h) | 0);
        const inten = intensities[row];
        let shaped = inten * gain;
        if(shaped < 0) shaped = 0; else if(shaped > 1) shaped = 1;
        shaped = Math.pow(shaped, gamma);
        const lutIdx = (shaped*255) | 0;
        const off = py*4, lo = lutIdx*3;
        data[off] = lut[lo]; data[off+1] = lut[lo+1]; data[off+2] = lut[lo+2];
        data[off+3] = shaped*255 + 12 > 255 ? 255 : (shaped*255 + 12)|0;
      }
      ctx.putImageData(img, colX, 0);
    },
_paintColumns(ctx, canvas, startIdx, count, intensities){
      const w = canvas.width, h = canvas.height;
      if(!w || !h || count <= 0) return;
      const rows = intensities.length;
      const lut = this._ensurePaletteLUT();
      const gain = App.settings.specGain, gamma = App.settings.specGamma;
      this._columnImageCache = this._columnImageCache || new Map();
      const paintRun = (colX, runWidth)=>{
        const key = runWidth + 'x' + h;
        let img = this._columnImageCache.get(key);
        if(!img){
          img = ctx.createImageData(runWidth, h);
          // Retain at most eight small runs (maximum 4 MiB total).
          if(img.data.byteLength <= 512*1024){
            if(this._columnImageCache.size >= 8)this._columnImageCache.delete(this._columnImageCache.keys().next().value);
            this._columnImageCache.set(key, img);
          }
        }
        const data = img.data;
        for(let py=0; py<h; py++){
          const row = Math.min(rows-1, (rows*py/h) | 0);
          let shaped = intensities[row] * gain;
          if(shaped < 0) shaped = 0; else if(shaped > 1) shaped = 1;
          shaped = Math.pow(shaped, gamma);
          const lutIdx = (shaped*255) | 0;
          const lo = lutIdx*3;
          const alpha = shaped*255 + 12 > 255 ? 255 : (shaped*255 + 12)|0;
          let off = py * runWidth * 4;
          for(let x=0; x<runWidth; x++, off+=4){
            data[off] = lut[lo];
            data[off+1] = lut[lo+1];
            data[off+2] = lut[lo+2];
            data[off+3] = alpha;
          }
        }
        ctx.putImageData(img, colX, 0);
      };
      const firstX = ((startIdx % w) + w) % w;
      const firstWidth = Math.min(count, w - firstX);
      paintRun(firstX, firstWidth);
      const remainder = count - firstWidth;
      if(remainder > 0) paintRun(0, remainder);
    },
_computeIntensities(byteFreq, rows, fftBinCount, sampleRate, fftSize){
      const bins = this._ensureFreqBins(rows, fftBinCount, sampleRate, fftSize);
      if(!this._intensityScratch || this._intensityScratch.length !== rows){
        this._intensityScratch = new Float32Array(rows);
      }
      const out = this._intensityScratch;
      for(let row=0; row<rows; row++){
        const b = bins[row];
        const v0 = byteFreq[b.idx0]/255, v1 = byteFreq[b.idx1]/255;
        out[row] = v0 + (v1-v0)*b.frac;
      }
      return out;
    },
onLiveFrame(byteFreq, fftBinCount, sampleRate, fftSize){
      if(!App.settings.specEnabled) return;
      this.ensure();
      const rows = Math.max(8, this._historyCanvas.height);
      const now = (App.audioCtx ? App.audioCtx.currentTime : performance.now()/1000);
      const dpr = Math.min(2, window.devicePixelRatio||1);
      const pxPerSec = Math.max(1, App.settings.specPxPerSec) * dpr;
      const secPerCol = 1/pxPerSec;
      if(this._liveAccumTime < 0){
        this._liveAccumTime = now;
        const intensities = this._computeIntensities(byteFreq, rows, fftBinCount, sampleRate, fftSize);
        this._appendHistoryColumn(intensities);
        return;
      }
      let elapsed = now - this._liveAccumTime;
      const maxCatchupSec = 2;
      if(elapsed < 0 || elapsed > maxCatchupSec){
        this._liveAccumTime = now;
        const intensities = this._computeIntensities(byteFreq, rows, fftBinCount, sampleRate, fftSize);
        this._appendHistoryColumn(intensities);
        return;
      }
      let cols = Math.floor(elapsed / secPerCol);
      if(cols <= 0) return;
      const MAX_COLS_PER_CALL = 6;
      cols = Math.min(cols, MAX_COLS_PER_CALL);
      const intensities = this._computeIntensities(byteFreq, rows, fftBinCount, sampleRate, fftSize);
      this._paintColumns(this._historyCtx, this._historyCanvas, this._historyColCount, cols, intensities);
      this._historyColCount += cols;
      this._liveAccumTime = now;
    },
_appendHistoryColumn(intensities){
      this._paintColumn(this._historyCtx, this._historyCanvas, this._historyColCount, intensities);
      this._historyColCount++;
    },
resetForNewTrack(){
      this.ensure();
      this._liveAccumTime = -1;
      this._historyColCount = 0;
      this._columnImageCache?.clear();this._singleColumnImage=null;this._intensityScratch=null;
      if(this._historyCtx && this._historyCanvas.width && this._historyCanvas.height){
        this._historyCtx.clearRect(0,0,this._historyCanvas.width,this._historyCanvas.height);
      }
    },
_blitHistory(ctx, destW, destH, nowX, symmetric){
      const histCanvas = this._historyCanvas;
      const histW = histCanvas.width;
      const dataReachPx = Math.max(0, Math.min(histW, this._historyColCount));
      if(histW <= 0 || this._historyColCount <= 0) return { oldestEdgeX: nowX };
      const visibleHistPxLeft = Math.min(nowX, histW);
      if(visibleHistPxLeft > 0){
        const latestCol = (this._historyColCount - 1) % histW;
        const startCol = ((latestCol - Math.ceil(visibleHistPxLeft) + 1) % histW + histW) % histW;
        const destX = nowX - visibleHistPxLeft;
        if(startCol + visibleHistPxLeft <= histW){
          ctx.drawImage(histCanvas, startCol, 0, visibleHistPxLeft, histCanvas.height, destX, 0, visibleHistPxLeft, destH);
        } else {
          const firstPart = histW - startCol;
          ctx.drawImage(histCanvas, startCol, 0, firstPart, histCanvas.height, destX, 0, firstPart, destH);
          ctx.drawImage(histCanvas, 0, 0, visibleHistPxLeft-firstPart, histCanvas.height, destX+firstPart, 0, visibleHistPxLeft-firstPart, destH);
        }
      }
      if(symmetric){
        const visibleHistPxRight = Math.min(destW - nowX, histW);
        if(visibleHistPxRight > 0){
          const latestCol = (this._historyColCount - 1) % histW;
          const startCol = ((latestCol - Math.ceil(visibleHistPxRight) + 1) % histW + histW) % histW;
          ctx.save();
          ctx.translate(nowX, 0);
          ctx.scale(-1, 1);
          if(startCol + visibleHistPxRight <= histW){
            ctx.drawImage(histCanvas, startCol, 0, visibleHistPxRight, histCanvas.height, 0, 0, visibleHistPxRight, destH);
          } else {
            const firstPart = histW - startCol;
            ctx.drawImage(histCanvas, startCol, 0, firstPart, histCanvas.height, 0, 0, firstPart, destH);
            ctx.drawImage(histCanvas, 0, 0, visibleHistPxRight-firstPart, histCanvas.height, firstPart, 0, visibleHistPxRight-firstPart, destH);
          }
          ctx.restore();
        }
      }
      return { oldestEdgeX: Math.max(0, nowX - dataReachPx) };
    }
  });
})(window.Aurora);

// ── spectrum/renderer-apply-smoothing ──
(function(App){
  App.addParts("Spectrogram", {
_applySmoothing(canvasEl, nowX, destW, symmetric, oldestEdgeX){
      if(!canvasEl) return;
      const nowXR = Math.round((nowX||0)*10)/10;
      const edgeR = Math.round((oldestEdgeX||0)*10)/10;
      const cacheKey = [
        App.settings.specHueOffset, App.settings.specSmoothBlur, App.settings.specEdgeFade, App.settings.specEdgeFadeLeft,
        App.settings.specEdgeFadeRight, App.settings.specEdgeFadeVAmount, App.settings.specEdgeFadeTop,
        App.settings.specEdgeFadeBottom, nowXR, destW, !!symmetric, edgeR
      ].join('|');
      if(canvasEl._lastSmoothKey === cacheKey) return;
      canvasEl._lastSmoothKey = cacheKey;
      const blurPx = Math.max(0, App.settings.specSmoothBlur || 0);
      canvasEl.style.filter = `blur(${blurPx}px) hue-rotate(${Number(App.settings.specHueOffset)||0}deg)`;
      const fade = Math.max(0, Math.min(1, App.settings.specEdgeFade || 0));
      const hFadeOn = fade > 0.001 && (App.settings.specEdgeFadeLeft || App.settings.specEdgeFadeRight);
      const vAmount = Math.max(0, Math.min(1, App.settings.specEdgeFadeVAmount ?? 0.2));
      const topOn = !!App.settings.specEdgeFadeTop && vAmount > 0.001;
      const bottomOn = !!App.settings.specEdgeFadeBottom && vAmount > 0.001;
      const vFadeOn = topOn || bottomOn;
      if((!hFadeOn && !vFadeOn) || destW <= 0){
        canvasEl.style.maskImage = '';
        canvasEl.style.webkitMaskImage = '';
        canvasEl.style.maskComposite = '';
        canvasEl.style.webkitMaskComposite = '';
        return;
      }
      const layers = [];
      if(hFadeOn){
        const maxFadePx = Math.max(4, destW * 0.6);
        const fadePx = 6 + fade * maxFadePx;
        let gradient;
        if(symmetric){
          const leftEdgePx = (typeof oldestEdgeX === 'number') ? oldestEdgeX : 0;
          const rightEdgePx = (typeof oldestEdgeX === 'number') ? (2*nowX - oldestEdgeX) : destW;
          const lp0 = (Math.max(0, leftEdgePx)/destW*100).toFixed(2);
          const lp1 = (Math.min(destW, leftEdgePx + fadePx)/destW*100).toFixed(2);
          const rp0 = (Math.max(0, rightEdgePx - fadePx)/destW*100).toFixed(2);
          const rp1 = (Math.min(destW, rightEdgePx)/destW*100).toFixed(2);
          const leftStop = App.settings.specEdgeFadeLeft ? `transparent ${lp0}%, black ${lp1}%` : `black ${lp0}%`;
          const rightStop = App.settings.specEdgeFadeRight ? `black ${rp0}%, transparent ${rp1}%` : `black ${rp1}%`;
          gradient = `linear-gradient(90deg, ${leftStop}, ${rightStop})`;
        } else if(nowX <= destW/2){
          const edgePx = (typeof oldestEdgeX === 'number') ? oldestEdgeX : destW;
          const p0 = (Math.max(0, edgePx - fadePx)/destW*100).toFixed(2);
          const p1 = (Math.min(destW, edgePx)/destW*100).toFixed(2);
          const leftStop = App.settings.specEdgeFadeRight ? `transparent 0%, black ${(fadePx/destW*100).toFixed(2)}%` : `black 0%`;
          const rightStop = App.settings.specEdgeFadeLeft ? `black ${p0}%, transparent ${p1}%` : `black 100%`;
          gradient = `linear-gradient(90deg, ${leftStop}, ${rightStop})`;
        } else {
          const edgePx = (typeof oldestEdgeX === 'number') ? oldestEdgeX : 0;
          const p0 = (Math.max(0, edgePx)/destW*100).toFixed(2);
          const p1 = (Math.min(destW, edgePx + fadePx)/destW*100).toFixed(2);
          const leftStop = App.settings.specEdgeFadeLeft ? `transparent ${p0}%, black ${p1}%` : `black ${p0}%`;
          const rp0 = (Math.max(0, destW-fadePx)/destW*100).toFixed(2);
          const rightStop = App.settings.specEdgeFadeRight ? `black ${rp0}%, transparent 100%` : `black 100%`;
          gradient = `linear-gradient(90deg, ${leftStop}, ${rightStop})`;
        }
        layers.push(gradient);
      }
      if(vFadeOn){
        const vPct = (6 + vAmount * 44).toFixed(2);
        const topStop = topOn ? `transparent 0%, black ${vPct}%` : `black 0%`;
        const bottomStop = bottomOn ? `black ${(100-parseFloat(vPct)).toFixed(2)}%, transparent 100%` : `black 100%`;
        layers.push(`linear-gradient(180deg, ${topStop}, ${bottomStop})`);
      }
      if(layers.length === 1){
        canvasEl.style.maskImage = layers[0];
        canvasEl.style.webkitMaskImage = layers[0];
        canvasEl.style.maskComposite = '';
        canvasEl.style.webkitMaskComposite = '';
      } else {
        canvasEl.style.maskImage = layers.join(', ');
        canvasEl.style.webkitMaskImage = layers.join(', ');
        canvasEl.style.maskComposite = 'intersect';
        canvasEl.style.webkitMaskComposite = 'source-in';
      }
    },
_drawIslandTarget(hostId, canvas, ctx){
      if(!canvas || !ctx) return;
      const size = this._sizeIslandCanvas(hostId, canvas);
      if(!size || !size.w || !size.h) return;
      ctx.clearRect(0,0,size.w,size.h);
      const visibility = Math.max(0, Math.min(1, typeof App.settings.specIslandVisibility === 'number' ? App.settings.specIslandVisibility : 1));
      ctx.globalAlpha = visibility;
      let nowX = App.settings.specAnchor === 'center' ? size.w/2 : size.w;
      if(App.settings.specAnchor !== 'center' && App.settings.specPlaylistOffset && !App.app.classList.contains('playlist-closed')){
        const playlistPanel = App.el('playlistPanel');
        if(playlistPanel){
          const dpr = Math.min(2, window.devicePixelRatio || 1);
          const wallNow = performance.now();
          canvas._offsetCache = canvas._offsetCache || {};
          const oc = canvas._offsetCache;
          if(oc.t === undefined || (wallNow - oc.t) >= 100){
            const canvasRect = canvas.getBoundingClientRect();
            const plRect = playlistPanel.getBoundingClientRect();
            oc.insetCss = Math.max(0, canvasRect.right - plRect.left);
            oc.t = wallNow;
          }
          nowX = Math.max(0, size.w - oc.insetCss*dpr);
        }
      }
      const blitInfo = this._blitHistory(ctx, size.w, size.h, nowX, !!App.settings.specSymmetric);
      ctx.globalAlpha = 1;
      this._applySmoothing(canvas, nowX, size.w, !!App.settings.specSymmetric, blitInfo && blitInfo.oldestEdgeX);
    },
update(){
      const layer = App.el('spectrogramLayer');
      const innerCanvas = App.el('spectrogramCanvasInner');
      const timelineCanvas = App.el('spectrogramCanvasTimeline');
      if(!layer) return;
      if(!App.settings.specEnabled){
        if(!App.Threads?.spectrumActive){
          for(const canvas of [this._canvas,this._innerCanvas,this._timelineCanvas,this._historyCanvas]){
            if(canvas&&(canvas.width!==1||canvas.height!==1)){canvas.width=1;canvas.height=1;}
          }
          this._columnImageCache?.clear();this._singleColumnImage=null;this._intensityScratch=null;
          this._historyColCount=0;this._liveAccumTime=-1;
          this._lastAlignT=undefined;this._lastIslandHistT=undefined;
        }
        layer.classList.remove('show');
        if(innerCanvas) innerCanvas.classList.remove('show');
        if(timelineCanvas) timelineCanvas.classList.remove('show');
        App.el('spectroIslandGlow').classList.remove('show');
        this._applyGlassMode(false);
        return;
      }
      this.ensure();
      if(App.settings.specInsideIsland){
        const drawTimelineToo = App.settings.specInsideIslandBothPanels !== false;
        layer.classList.remove('show');
        App.el('spectroIslandGlow').classList.remove('show');
        if(innerCanvas) innerCanvas.classList.add('show');
        if(timelineCanvas) timelineCanvas.classList.toggle('show', drawTimelineToo);
        this._applyGlassMode(true);
        this._ensureIslandHistorySize();
        this._drawIslandTarget('controlBar', this._innerCanvas, this._innerCtx);
        if(drawTimelineToo){
          this._drawIslandTarget('timelineIsland', this._timelineCanvas, this._timelineCtx);
        }
        return;
      }
      if(innerCanvas) innerCanvas.classList.remove('show');
      if(timelineCanvas) timelineCanvas.classList.remove('show');
      layer.classList.add('show');
      this.alignAndSize();
      this._applyGlassMode(true);
      const w = this._canvas.width, h = this._canvas.height;
      if(!w || !h) return;
      const ctx = this._ctx;
      ctx.clearRect(0,0,w,h);
      const dpr = Math.min(2, window.devicePixelRatio||1);
      const nowX = (typeof this._nowXCss === 'number' ? this._nowXCss*dpr : w);
      const blitInfo = this._blitHistory(ctx, w, h, nowX, !!App.settings.specSymmetric);
      this._applySmoothing(this._canvas, nowX, w, !!App.settings.specSymmetric, blitInfo && blitInfo.oldestEdgeX);
      const glowEl = App.el('spectroIslandGlow');
      if(App.settings.specGlassMode){
        glowEl.classList.add('show');
        glowEl.style.opacity = String(Math.max(0, Math.min(2, App.settings.specGlowStrength)) * 0.5);
      } else {
        glowEl.classList.remove('show');
      }
    }
  });
})(window.Aurora);

// ── spectrum/renderer-apply-glass-mode ──
(function(App){
  App.addParts("Spectrogram", {
_applyGlassMode(spectrogramOn){
      const bar = App.el('controlBar');
      const tlIsland = App.el('timelineIsland');
      const tlExt = App.el('timelineIslandExtension');
      if(!bar) return;
      const shouldGlass = spectrogramOn && App.settings.specGlassMode;
      const glassKey = [
        shouldGlass ? 1 : 0,
        App.settings.specInsideIsland ? 1 : 0,
        Number(App.settings.specGlassAlpha).toFixed(3),
        Number(App.settings.specGlassBlur).toFixed(2), Number(App.settings.specHueOffset)||0
      ].join('|');
      if(this._lastGlassKey === glassKey) return;
      this._lastGlassKey = glassKey;
      bar.classList.toggle('spectro-glass', shouldGlass);
      if(tlIsland) tlIsland.classList.toggle('spectro-glass', shouldGlass);
      if(tlExt) tlExt.classList.toggle('spectro-glass', shouldGlass);
      if(shouldGlass){
        const a = Math.max(0, Math.min(1, App.settings.specGlassAlpha));
        const blurPx = Math.max(0, App.settings.specGlassBlur);
        bar.style.background = `rgba(20,21,30,${a})`;
        bar.style.backdropFilter = `blur(${blurPx}px) saturate(190%)`;
        bar.style.webkitBackdropFilter = `blur(${blurPx}px) saturate(190%)`;
        if(tlIsland){
          tlIsland.style.background = `rgba(20,21,30,${a})`;
          tlIsland.style.backdropFilter = `blur(${blurPx}px) saturate(190%)`;
          tlIsland.style.webkitBackdropFilter = `blur(${blurPx}px) saturate(190%)`;
        }
        if(tlExt){
          tlExt.style.background = `rgba(20,21,30,${a})`;
          tlExt.style.backdropFilter = `blur(${blurPx}px) saturate(190%)`;
          tlExt.style.webkitBackdropFilter = `blur(${blurPx}px) saturate(190%)`;
        }
      } else {
        bar.style.background = '';
        bar.style.backdropFilter = '';
        bar.style.webkitBackdropFilter = '';
        if(tlIsland){
          tlIsland.style.background = '';
          tlIsland.style.backdropFilter = '';
          tlIsland.style.webkitBackdropFilter = '';
        }
        if(tlExt){
          tlExt.style.background = '';
          tlExt.style.backdropFilter = '';
          tlExt.style.webkitBackdropFilter = '';
        }
      }
      if(this._innerCanvas){
        if(spectrogramOn && App.settings.specInsideIsland && App.settings.specGlassMode){
          const blurPx = Math.max(0, App.settings.specGlassBlur);
          this._innerCanvas.style.filter = `blur(${blurPx}px) hue-rotate(${Number(App.settings.specHueOffset)||0}deg)`;
        } else {
          this._innerCanvas.style.filter = `hue-rotate(${Number(App.settings.specHueOffset)||0}deg)`;
        }
      }
      if(this._timelineCanvas){
        if(spectrogramOn && App.settings.specInsideIsland && App.settings.specGlassMode){
          const blurPx = Math.max(0, App.settings.specGlassBlur);
          this._timelineCanvas.style.filter = `blur(${blurPx}px) hue-rotate(${Number(App.settings.specHueOffset)||0}deg)`;
        } else {
          this._timelineCanvas.style.filter = `hue-rotate(${Number(App.settings.specHueOffset)||0}deg)`;
        }
      }
    }
  });
})(window.Aurora);

// ── spectrum/renderer ──
(function(App){
  App.define("spectrum/renderer", function initialize(){
App.Spectrogram = {
_canvas: null,
_ctx: null,
_innerCanvas: null,
_innerCtx: null,
_timelineCanvas: null,
_timelineCtx: null,
_historyCanvas: null,
_historyCtx: null,
_freqBinsCache: null,
_freqBinsSig: '',
ensure: App.parts["Spectrogram"].ensure,
alignAndSize: App.parts["Spectrogram"].alignAndSize,
_sizeIslandCanvas: App.parts["Spectrogram"]._sizeIslandCanvas,
_ensureIslandHistorySize: App.parts["Spectrogram"]._ensureIslandHistorySize,
_ensureFreqBins: App.parts["Spectrogram"]._ensureFreqBins,
_paletteLUT: null,
_paletteLUTSig: '',
_buildPaletteLUT: App.parts["Spectrogram"]._buildPaletteLUT,
_ensurePaletteLUT: App.parts["Spectrogram"]._ensurePaletteLUT,
_paintColumn: App.parts["Spectrogram"]._paintColumn,
_paintColumns: App.parts["Spectrogram"]._paintColumns,
_computeIntensities: App.parts["Spectrogram"]._computeIntensities,
_liveAccumTime: -1,
onLiveFrame: App.parts["Spectrogram"].onLiveFrame,
_historyColCount: 0,
_appendHistoryColumn: App.parts["Spectrogram"]._appendHistoryColumn,
resetForNewTrack: App.parts["Spectrogram"].resetForNewTrack,
_blitHistory: App.parts["Spectrogram"]._blitHistory,
_applySmoothing: App.parts["Spectrogram"]._applySmoothing,
_drawIslandTarget: App.parts["Spectrogram"]._drawIslandTarget,
update: App.parts["Spectrogram"].update,
_applyGlassMode: App.parts["Spectrogram"]._applyGlassMode
};
  }, ["Spectrogram"]);
})(window.Aurora);

// ── timeline/waveform ──
(function(App){
  App.define("timeline/waveform", function initialize(){
App.TimelineWaveform = {
    data: null,
    trackKeyShown: null,
    _resampleCache: null,
    setTrack(track){
      const key = track ? App.trackKey(track) : null;
      this._generation=(this._generation||0)+1;
      this._computing=null;
      this.trackKeyShown = key;
      this.data = track ? App.ProfileStore.getWaveform(key) || null : null;
      this._resampleCache = null;
      if(track && !this.data && App.settings.timelineLoudnessWaveform !== false){
        this._computeRealtime(track);
      }
    },
    _computeRealtime(track){
      const key = App.trackKey(track);
      if(this._computing === key) return;
      this._computing = key;
      const generation=this._generation;
      const isNeeded=()=>this._generation===generation;
      App.measureIntegratedLufs(track.file, null, isNeeded).then(result => {
        if(!isNeeded()) return;
        this._computing = null;
        const waveform = App.buildTimelineWaveform(result.waveformDb);
        this.onTrackAnalyzed(track, waveform);
        if(App.settings.cacheWaveform !== false){
          App.ProfileStore.set(key, App.ProfileStore.get(key) !== undefined ? App.ProfileStore.get(key) : result.lufs, waveform);
        }
      }).catch(() => { if(isNeeded())this._computing = null; });
    },
    onTrackAnalyzed(track, waveform){
      if(App.trackKey(track) !== this.trackKeyShown) return;
      this.data = (Array.isArray(waveform) && waveform.length) ? waveform : null;
      this._resampleCache = null;
    },
    _resample(wPx){
      if(!this.data || this.data.length < 2 || wPx <= 0) return null;
      const smoothAmt = Math.max(0, Math.min(3, typeof App.settings.timelineWaveformSmooth === 'number' ? App.settings.timelineWaveformSmooth : 1));
      if(this._resampleCache && this._resampleCache.data === this.data && this._resampleCache.w === wPx && this._resampleCache.smoothAmt === smoothAmt){
        return this._resampleCache.points;
      }
      const src = this.data;
      const n = src.length;
      const out = new Float32Array(wPx);
      for(let x=0; x<wPx; x++){
        const t = (wPx>1) ? x/(wPx-1) : 0;
        const pos = t * (n-1);
        const i0 = Math.floor(pos);
        const i1 = Math.min(n-1, i0+1);
        const frac = pos - i0;
        out[x] = src[i0] + (src[i1]-src[i0])*frac;
      }
      let finalOut = out;
      if(smoothAmt > 0.001){
        const radius = Math.max(1, Math.round(smoothAmt * (wPx/140)));
        if(radius >= 1){
          const smoothed = new Float32Array(wPx);
          for(let x=0; x<wPx; x++){
            let sum=0, cnt=0;
            for(let k=-radius;k<=radius;k++){
              const idx = x+k;
              if(idx>=0 && idx<wPx){ sum+=out[idx]; cnt++; }
            }
            smoothed[x] = sum/cnt;
          }
          finalOut = smoothed;
        }
      }
      this._resampleCache = { data: this.data, w: wPx, smoothAmt, points: finalOut };
      return finalOut;
    },
    draw(ctx, W, H, progressFrac, opacity, scaleAmt){
      const pts = this._resample(Math.max(1, Math.round(W)));
      if(!pts) return;
      if(opacity === undefined) opacity = 1;
      if(opacity <= 0.004) return;
      if(scaleAmt === undefined) scaleAmt = 1;
      const topMargin = 4;
      const usableH = H - topMargin;
      const riseScale = scaleAmt * 0.85;
      function yAt(x){
        const v = Math.max(0, Math.min(1, pts[Math.max(0, Math.min(pts.length - 1, Math.round(x)))]));
        const rise = Math.min(1, (1 - Math.pow(v, 0.65)) * riseScale);
        return topMargin + rise * usableH;
      }
      const splitX = Math.max(0, Math.min(pts.length, Math.round(progressFrac * pts.length)));
      ctx.save();
      ctx.globalAlpha = opacity;
      const sections = [
        { x0: 0,       x1: splitX,     glowAlpha: 0.95, fillStart: 0.32 },
        { x0: splitX,  x1: pts.length, glowAlpha: 0.38, fillStart: 0.13 },
      ];
      for(const sec of sections){
        if(sec.x1 <= sec.x0) continue;
        ctx.save();
        ctx.beginPath();
        ctx.rect(sec.x0, 0, sec.x1 - sec.x0, H);
        ctx.clip();
        ctx.beginPath();
        ctx.moveTo(sec.x0, yAt(sec.x0));
        for(let x = sec.x0 + 1; x <= sec.x1; x++) ctx.lineTo(x, yAt(x));
        ctx.lineTo(sec.x1, H);
        ctx.lineTo(sec.x0, H);
        ctx.closePath();
        let minY = H;
        for(let x = sec.x0; x <= sec.x1; x++) minY = Math.min(minY, yAt(x));
        const gFill = ctx.createLinearGradient(0, minY, 0, H);
        gFill.addColorStop(0,    `rgba(255,255,255,${sec.fillStart.toFixed(3)})`);
        gFill.addColorStop(0.5,  `rgba(255,255,255,${(sec.fillStart * 0.25).toFixed(3)})`);
        gFill.addColorStop(1,    'rgba(255,255,255,0)');
        ctx.fillStyle = gFill;
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(sec.x0, yAt(sec.x0));
        for(let x = sec.x0 + 1; x <= sec.x1; x++) ctx.lineTo(x, yAt(x));
        ctx.strokeStyle = `rgba(255,255,255,${sec.glowAlpha})`;
        ctx.lineWidth = 1.2;
        ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(255,255,255,0.9)';
        ctx.shadowBlur = 7;
        ctx.stroke();
        ctx.shadowBlur = 2;
        ctx.lineWidth = 0.8;
        ctx.strokeStyle = `rgba(255,255,255,${Math.min(1, sec.glowAlpha * 1.3)})`;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
      }
      ctx.restore();
    }
  };
  }, ["TimelineWaveform"]);
})(window.Aurora);

// ── timeline/canvas-layout ──
(function(App){
App.tlResize = function tlResize(){
    if(App.Threads?.timelineActive){ App.Threads.resizeTimeline(); return; }
    const rect = App.progressTrack.getBoundingClientRect();
    const dpr = App.tlState.dpr;
    App.progressCanvas.width  = rect.width  * dpr;
    const mult=App.settings.timelineWaveSymmetry?2*App.CANVAS_HEIGHT_MULT-1:App.CANVAS_HEIGHT_MULT;
    App.progressCanvas.height = rect.height * mult * dpr;
    App.progressCanvas.style.height = mult*100+'%';
    App.progressCanvas.style.bottom = App.settings.timelineWaveSymmetry?-(App.CANVAS_HEIGHT_MULT-1)*100+'%':'0';
    App.progressCanvas.style.width  = rect.width  + 'px';
    App.tlState.cachedBoxH = App.progressCanvas.getBoundingClientRect().height || (App.progressCanvas.height/App.CANVAS_HEIGHT_MULT);
    App.tlState.cachedTrackH = rect.height || 4;
    if(App.waveformOverlayCanvas){
      const wfHeightMult = Math.max(0.1, Math.min(6, typeof App.settings.timelineWaveformHeight === 'number' ? App.settings.timelineWaveformHeight : 1));
      const offsetPx = (typeof App.settings.timelineWaveformOffset === 'number' ? App.settings.timelineWaveformOffset : 3);
      const extraH = 14 * wfHeightMult;
      const islandRect = App.el('timelineIsland').getBoundingClientRect();
      const topExtent = extraH + Math.max(0, offsetPx);
      const bottomExtent = Math.max(0, -offsetPx);
      const totalH = rect.height + topExtent + bottomExtent;
      App.waveformOverlayCanvas.style.height = totalH + 'px';
      App.waveformOverlayCanvas.style.top = (-topExtent) + 'px';
      App.waveformOverlayCanvas.width = Math.max(1, Math.round(islandRect.width * dpr));
      App.waveformOverlayCanvas.height = Math.max(1, Math.round(totalH * dpr));
      App.tlState.wfOverlayOffsetPx = offsetPx;
      App.tlState.wfOverlayTopExtent = topExtent;
      App.tlState.wfOverlayTrackH = rect.height;
      App.tlState.wfOverlayPadLeft = App.progressTrack.getBoundingClientRect().left - islandRect.left;
      App.tlState.wfOverlayPadRight = islandRect.right - App.progressTrack.getBoundingClientRect().right;
    }
  };
  App.define("timeline/canvas-layout", function initialize(){
App.progressWrap = App.el('progressWrap');
App.progressTrack = App.el('progressTrack');
App.progressCanvas = App.el('progressCanvas');
App.progressTooltip = App.el('progressTooltip');
App.pCtx = App.THREAD_SUPPORT ? null : App.progressCanvas.getContext('2d');
App.waveformOverlayCanvas = App.el('waveformOverlayCanvas');
App.wCtx = App.THREAD_SUPPORT ? null : (App.waveformOverlayCanvas ? App.waveformOverlayCanvas.getContext('2d') : null);
App.tlState = {
    progress: 0,
    mouseX: -1,
    waveAmp: 0,
    hovering: false,
    seeking: false,
    dpr: window.devicePixelRatio || 1,
  };
App.CANVAS_HEIGHT_MULT = 4.2;
App.tlResize();
window.addEventListener('resize', App.tlResize);
  }, ["progressWrap","progressTrack","progressCanvas","progressTooltip","pCtx","waveformOverlayCanvas","wCtx","tlState","CANVAS_HEIGHT_MULT","tlResize"]);
})(window.Aurora);

// ── timeline/renderer ──
(function(App){
App.tlDraw = function tlDraw(){
    if(App.Threads?.timelineActive) return;
    const canvas = App.progressCanvas;
    const ctx = App.pCtx;
    const dpr = App.tlState.dpr;
    const W = canvas.width;
    const H = canvas.height;
    const drawKey = [
      W, H,
      Math.round(App.tlState.progress * W),
      Math.round(App.tlState.mouseX * W),
      Math.round(App.tlState.waveAmp * 200),
      App.settings.timelineWave !== false ? 1 : 0,
      Number(App.settings.timelineWavePeak).toFixed(3),
      Number(App.settings.timelineSigma).toFixed(4),
      App.settings.timelineWaveSymmetry === true ? 1 : 0,
      App.PlayerColors._lastC1 || '',
      App.PlayerColors._lastC2 || ''
    ].join('|');
    if(App.tlState._lastDrawKey === drawKey) return;
    App.tlState._lastDrawKey = drawKey;
    ctx.clearRect(0, 0, W, H);
    const boxH = App.tlState.cachedBoxH || (H/App.CANVAS_HEIGHT_MULT);
    const pxScale = boxH > 0 ? H / boxH : dpr;
    const waveEnabled = App.settings.timelineWave !== false;
    const trackH = App.tlState.cachedTrackH || 4;
    const baseH = trackH * pxScale;
    const peakStrength = typeof App.settings.timelineWavePeak === 'number' ? App.settings.timelineWavePeak : 0.35;
    const sigma   = typeof App.settings.timelineSigma   === 'number' ? App.settings.timelineSigma   : 0.055;
    const bottomMargin = pxScale*0.35;
    const topSafety = pxScale*4;
    const upperH = App.settings.timelineWaveSymmetry === true ? (H + baseH) / 2 : H;
    const maxPeakH = upperH - bottomMargin - topSafety;
    const peakH   = Math.min(maxPeakH, upperH * 2.6 * peakStrength);
    const mu      = App.tlState.mouseX;
    const amp     = waveEnabled ? App.tlState.waveAmp : 0;
    const prog    = App.tlState.progress;
    const bottomY = upperH - (App.settings.timelineWaveSymmetry === true ? 0 : bottomMargin);
    if(amp < 0.001 || mu < 0){
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.fillRect(0, bottomY - baseH, W, baseH);
      if(prog > 0){
        const c1 = App.PlayerColors._lastC1 || '#ff2ec4';
        const c2 = App.PlayerColors._lastC2 || '#7c3aed';
        if(!App.tlState._gradCache || App.tlState._gradCache.c1 !== c1 || App.tlState._gradCache.c2 !== c2 || App.tlState._gradCache.w !== W){
          const grad = ctx.createLinearGradient(0, 0, W, 0);
          grad.addColorStop(0, c1);
          grad.addColorStop(1, c2);
          App.tlState._gradCache = { c1, c2, w: W, grad };
        }
        ctx.fillStyle = App.tlState._gradCache.grad;
        ctx.fillRect(0, bottomY - baseH, prog * W, baseH);
      }
      return;
    }
    const EDGE = 0.08;
    function edgeFade(nx){
      if(nx < EDGE)  return nx / EDGE;
      if(nx > 1-EDGE) return (1-nx) / EDGE;
      return 1;
    }
    const steps = Math.ceil(W);
    const symEnabled = App.settings.timelineWaveSymmetry === true;
    function barH(nx){
      if(amp < 0.001 || mu < 0) return baseH;
      const d = nx - mu;
      const gauss = Math.exp(-(d*d)/(2*sigma*sigma));
      const lift  = (peakH - baseH) * amp * gauss * edgeFade(nx);
      return baseH + lift;
    }
    function topY(nx){ return bottomY - barH(nx); }
    function drawBarPath(){
      ctx.beginPath();
      for(let i = 0; i <= steps; i++){
        const nx = i / steps;
        const x  = nx * W;
        if(i === 0) ctx.moveTo(x, topY(nx));
        else        ctx.lineTo(x, topY(nx));
      }
      if(symEnabled){
        const axisY = bottomY - baseH / 2;
        for(let i=steps;i>=0;i--){const nx=i/steps;ctx.lineTo(nx*W,2*axisY-topY(nx));}
      }else{
        ctx.lineTo(W, bottomY);ctx.lineTo(0, bottomY);
      }
      ctx.closePath();
    }
    ctx.save();
    drawBarPath();
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, -H * 10, prog * W, H * 12);
    ctx.clip();
    drawBarPath();
    const c1 = App.PlayerColors._lastC1 || '#ff2ec4';
    const c2 = App.PlayerColors._lastC2 || '#7c3aed';
    if(!App.tlState._gradCache || App.tlState._gradCache.c1 !== c1 || App.tlState._gradCache.c2 !== c2 || App.tlState._gradCache.w !== W){
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, c1);
      grad.addColorStop(1, c2);
      App.tlState._gradCache = { c1, c2, w: W, grad };
    }
    ctx.fillStyle = App.tlState._gradCache.grad;
    ctx.fill();
    ctx.restore();
  };
App.waveformOverlayDraw = function waveformOverlayDraw(){
    if(App.Threads?.timelineActive) return;
    if(!App.wCtx || !App.waveformOverlayCanvas) return;
    const W = App.waveformOverlayCanvas.width;
    const H = App.waveformOverlayCanvas.height;
    const dpr = App.tlState.dpr;
    const offsetPx = (App.tlState.wfOverlayOffsetPx || 0) * dpr;
    const padLeftPx = (App.tlState.wfOverlayPadLeft || 0) * dpr;
    const padRightPx = (App.tlState.wfOverlayPadRight || 0) * dpr;
    const trackHPx = (App.tlState.wfOverlayTrackH || 4) * dpr;
    const drawW = Math.max(1, W - padLeftPx - padRightPx);
    const visible = App.settings.timelineLoudnessWaveform !== false
      && !!App.TimelineWaveform.data
      && App.tlState.waveAmp > 0.004;
    if(!visible){
      const previous=App.tlState._waveformDrawCache;
      if(!previous||previous.visible||previous.W!==W||previous.H!==H)App.wCtx.clearRect(0,0,W,H);
      if(!previous||previous.visible||previous.W!==W||previous.H!==H)App.tlState._waveformDrawCache={W,H,visible:false};
      return;
    }
    const nextCache = {
      W, H, visible,
      data: App.TimelineWaveform.data,
      amp: Math.round(App.tlState.waveAmp * 200),
      progressPx: Math.round(App.tlState.progress * drawW),
      offsetPx, padLeftPx, padRightPx, trackHPx,
      scale: Number(App.settings.timelineWaveformScale).toFixed(3),
      smooth: Number(App.settings.timelineWaveformSmooth).toFixed(3)
    };
    const prevCache = App.tlState._waveformDrawCache;
    if(prevCache
      && Object.keys(nextCache).every(key => prevCache[key] === nextCache[key])){
      return;
    }
    App.tlState._waveformDrawCache = nextCache;
    App.wCtx.clearRect(0, 0, W, H);
    if(!visible) return;
    const bottomExtentPx = Math.max(0, -offsetPx);
    const trackBottomY = H - bottomExtentPx;
    const trackTopY = trackBottomY - trackHPx;
    const baselineY = trackTopY - Math.max(0, offsetPx);
    const wfH = Math.max(4, baselineY);
    const yScale = Math.max(0.1, Math.min(4, typeof App.settings.timelineWaveformScale === 'number' ? App.settings.timelineWaveformScale : 1));
    App.wCtx.save();
    App.wCtx.translate(padLeftPx, baselineY - wfH);
    App.TimelineWaveform.draw(App.wCtx, drawW, wfH, App.tlState.progress, App.tlState.waveAmp, yScale);
    App.wCtx.restore();
  };
  App.define("timeline/renderer", function initialize(){
  }, ["tlDraw","waveformOverlayDraw"]);
})(window.Aurora);

// ── timeline/interaction ──
(function(App){
App.tlLoop = function tlLoop(ts){
    App.tlAnimId = 0;
    if(!App.VisualRenderState.active) return;
    const dt = Math.min(0.1, (ts - (App.tlLastTime || ts)) / 1000);
    App.tlLastTime = ts;
    const target = (App.tlState.hovering || App.settings.timelineWaveformAlwaysVisible) ? 1 : 0;
    const speed  = (App.tlState.hovering || App.settings.timelineWaveformAlwaysVisible) ? 10 : 5;
    App.tlState.waveAmp += (target - App.tlState.waveAmp) * Math.min(1, speed * dt);
    if(App.Threads?.timelineActive) App.Threads.timelineState();
    else { App.tlDraw(); App.waveformOverlayDraw(); }
    App.tlAnimId = requestAnimationFrame(App.tlLoop);
  };
App.tlMouseX = function tlMouseX(e){
    const rect = App.progressTrack.getBoundingClientRect();
    return Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
  };
App.seek = function seek(e){
    const nx = App.tlMouseX(e);
    App.tlState.mouseX = nx;
    if(App.audio.duration) App.audio.currentTime = nx * App.audio.duration;
  };
App.syncTimelineFromAudio = function syncTimelineFromAudio(){
    if(!App.audio.duration) return;
    const pct = App.audio.currentTime / App.audio.duration;
    App.tlState.progress = pct;
    App.el('progressHandle').style.left = (pct * 100) + '%';
    const timeText = `${App.formatTime(App.audio.currentTime)} / ${App.formatTime(App.audio.duration)}`;
    const timeLabel=App.el('timeLabel');if(timeLabel.textContent!==timeText)timeLabel.textContent=timeText;
    const tlLabel = App.el('timelineTimeLabel');
    if(tlLabel&&tlLabel.textContent!==timeText) tlLabel.textContent = timeText;
  };
  App.define("timeline/interaction", function initialize(){
App.tlLastTime = 0;
App.tlAnimId = 0;
App.VisualRenderState.subscribe(active =>{
    if(!active){
      if(App.tlAnimId) cancelAnimationFrame(App.tlAnimId);
      App.tlAnimId = 0;
      return;
    }
    App.tlLastTime = 0;
    if(!App.tlAnimId) App.tlAnimId = requestAnimationFrame(App.tlLoop);
  });
App.progressWrap.addEventListener('mouseenter', ()=>{
    App.tlState.hovering = true;
  });
App.progressWrap.addEventListener('mouseleave', ()=>{
    App.tlState.hovering = false;
    if(!App.tlState.seeking) App.tlState.mouseX = -1;
  });
App.progressWrap.addEventListener('mousemove', e=>{
    const nx = App.tlMouseX(e);
    App.tlState.mouseX = nx;
    App.el('progressHandle').style.left = (App.tlState.progress * 100) + '%';
    if(App.audio.duration && isFinite(App.audio.duration)){
      const hoverTime = nx * App.audio.duration;
      App.progressTooltip.textContent = App.formatTime(hoverTime);
      const rect = App.progressTrack.getBoundingClientRect();
      const wrapRect = App.progressWrap.getBoundingClientRect();
      App.progressTooltip.style.left = (e.clientX - wrapRect.left) + 'px';
    }
  });
App.progressWrap.addEventListener('mousedown', e=>{ App.tlState.seeking=true; App.seek(e); });
window.addEventListener('mousemove', e=>{ if(App.tlState.seeking) App.seek(e); });
window.addEventListener('mouseup', ()=>{ App.tlState.seeking=false; });
App.audio.addEventListener('timeupdate', ()=>{
    if(App.VisualRenderState.active) App.syncTimelineFromAudio();
  });
App.VisualRenderState.subscribe(active =>{
    if(active) App.syncTimelineFromAudio();
  });
  }, ["tlLastTime","tlAnimId","tlLoop","tlMouseX","seek","syncTimelineFromAudio"]);
})(window.Aurora);


// Stage visualizers: one canvas, bounded geometry, reused audio buffers, no idle loop.
(function(App){
App.drawMusicVisualizer=function drawMusicVisualizer(ctx,w,h,mode,levels,wave,settings,rotation){
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const value=(key,fallback,a,b)=>clamp(Number.isFinite(settings[key])?settings[key]:fallback,a,b);
  const cx=w/2,cy=h/2,c1=settings.vizColor1||App.PlayerColors?._lastC1||'#ff2ec4',c2=settings.vizColor2||App.PlayerColors?._lastC2||'#7c3aed';
  const density=Math.min(1.5,settings.vizDpr||window.devicePixelRatio||1);
  ctx.save();ctx.globalAlpha=1;ctx.lineCap='round';ctx.lineJoin='round';ctx.shadowColor=c1;
  if(mode==='equalizer'){
    const count=Math.round(value('vizEqCount',64,16,128)),step=w/count;
    const barW=Math.max(.5,step*value('vizEqThickness',.58,.1,1)),height=h*value('vizEqHeight',.7,.1,.7),gain=value('vizEqGain',1,.2,3);
    const fade=value('vizEqFade',.35,0,1);
    const ceiling=h*.94,knee=ceiling*value('vizEqPeakKnee',.65,.1,.9);
    let peak=0;for(let i=0;i<count;i++)peak=Math.max(peak,(levels[i]||0)*height*gain);
    const fit=Math.min(1,ceiling/Math.max(1,peak));
    const barHeight=i=>{
      const raw=Math.max(0,(levels[i]||0)*height*gain);
      if(settings.vizEqPeakMode==='fit')return Math.max(4,raw*fit);
      if(settings.vizEqPeakMode==='clip')return Math.max(4,Math.min(h*.86,raw));
      // A continuous, strictly increasing knee preserves differences between loud bands.
      const excess=Math.max(0,raw-knee),span=ceiling-knee;
      return Math.max(4,raw<=knee?raw:knee+span*excess/(span+excess));
    };
    ctx.shadowBlur=18*density*value('vizEqGlow',1,0,2);ctx.beginPath();
    let maxBar=4;
    for(let i=0;i<count;i++){
      const bar=barHeight(i);maxBar=Math.max(maxBar,bar);
      ctx.roundRect((i+.5)*step-barW/2,cy-bar/2,barW,bar,Math.min(barW/2,bar/2,8));
    }
    if(settings.vizSurface==='outline'){ctx.lineWidth=Math.max(1,Math.min(3,barW*.18));ctx.stroke();}
    else if(settings.vizSurface==='glass'){ctx.globalAlpha=.16;ctx.fill();ctx.globalAlpha=1;ctx.lineWidth=1.5;ctx.stroke();}
    else ctx.fill();
    if(fade>0){
      const mask=ctx.createLinearGradient(0,cy-maxBar/2,0,cy+maxBar/2);
      mask.addColorStop(0,`rgba(0,0,0,${1-fade})`);mask.addColorStop(.5,'rgba(0,0,0,1)');mask.addColorStop(1,`rgba(0,0,0,${1-fade})`);
      ctx.save();ctx.shadowBlur=0;ctx.globalCompositeOperation='destination-in';ctx.fillStyle=mask;ctx.fillRect(0,0,w,h);ctx.restore();
    }
    if(settings.vizEqTips===true){
      ctx.beginPath();for(let i=0;i<count;i++){
        const bar=barHeight(i),x=(i+.5)*step,r=Math.max(1,barW*.35);
        for(const direction of [-1,1]){const y=cy+direction*bar/2;ctx.moveTo(x+r,y);ctx.arc(x,y,r,0,Math.PI*2);}
      }ctx.fill();
    }
  }else if(mode==='wave'){
    const span=w*value('vizWaveWidth',1,.3,1),amp=h*.32*value('vizWaveGain',1,.2,3);
    ctx.lineWidth=value('vizWaveLine',3,1,6);ctx.shadowBlur=20*density*value('vizWaveGlow',1,0,2);
    if(settings.vizSurface==='glass'){
      ctx.save();ctx.globalAlpha=.14;ctx.shadowBlur=0;ctx.beginPath();
      for(let i=0;i<wave.length;i++){
        const x=cx-span/2+i/(wave.length-1)*span,y=cy+clamp(wave[i]*amp,-h*.46,h*.46);
        if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }
      for(let i=wave.length-1;i>=0;i--){const x=cx-span/2+i/(wave.length-1)*span;ctx.lineTo(x,cy-clamp(wave[i]*amp,-h*.46,h*.46));}
      ctx.fill();ctx.restore();
    }
    for(const direction of settings.vizWaveMirror===false?[1]:[1,-1]){
      ctx.globalAlpha=direction===1?1:.55;ctx.beginPath();
      for(let i=0;i<wave.length;i++){
        const x=cx-span/2+i/(wave.length-1)*span,y=cy+clamp(wave[i]*amp,-h*.46,h*.46)*direction;
        if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }ctx.stroke();
    }
  }else if(mode==='ring'){
    const count=Math.round(value('vizRingCount',180,32,256)),gain=value('vizRingGain',1,.2,3),glow=value('vizRingGlow',1,0,2);
    const style=['rays','pulse','particles'].includes(settings.vizRingStyle)?settings.vizRingStyle:'pulse';
    const sample=i=>{
      const phase=((i/count)%1+1)%1,index=Math.abs(phase*2-1)*(count-1),lo=Math.floor(index),mix=index-lo;
      // Interpolation preserves narrow peaks instead of averaging seven bands away.
      return (levels[lo]||0)*(1-mix)+(levels[Math.min(count-1,lo+1)]||0)*mix;
    };
    let bass=0;for(let i=0;i<Math.min(16,count);i++)bass=Math.max(bass,levels[i]||0);
    const thickness=value('vizRingThickness',2.5,.5,8),fade=value('vizRingFade',.65,0,1),deform=value('vizRingDeform',1,0,2);
    const limit=Math.max(8,Math.min(w,h)/2-28*density*glow-thickness-6);
    const baseRadius=Math.min(w,h)*value('vizRingRadius',.2,.1,.35)*(1+bass*.18*value('vizRingPulse',1,0,2));
    const rawExtent=Math.min(w,h)*.22;
    let peak=0;for(let i=0;i<count;i++)peak=Math.max(peak,levels[i]||0);
    const maxContour=baseRadius+rawExtent*peak*gain*.62*deform+rawExtent*.1*peak;
    const maxRay=baseRadius+2+peak*rawExtent*.72*gain;
    // Fit the entire shape uniformly; never flatten individual frequency peaks.
    const fit=Math.min(1,limit/(Math.max(style==='rays'?maxRay:maxContour,1)*(1+.035*bass)));
    const radius=baseRadius*fit,extent=rawExtent*fit;
    const contour=i=>radius+extent*Math.max(0,sample(i))*gain*.62*deform;
    const cache=drawMusicVisualizer._ringAngles||(drawMusicVisualizer._ringAngles={x:new Float32Array(257),y:new Float32Array(257)});
    for(let i=0;i<=count;i++){const a=rotation+i/count*Math.PI*2;cache.x[i]=Math.cos(a);cache.y[i]=Math.sin(a);}
    ctx.shadowBlur=20*density*glow;ctx.lineWidth=thickness;
    if(style==='rays'&&settings.vizRingRays!==false){
      const bands=fade>0?8:1;
      for(let band=0;band<bands;band++){
        ctx.shadowBlur=band===0?20*density*glow:0;
        ctx.globalAlpha=1-fade*Math.pow((band+.5)/bands,1.4);ctx.beginPath();
        for(let i=0;i<count;i++){
          const angle=rotation+i/count*Math.PI*2,length=2*fit+sample(i)*extent*.72*gain,r=radius+band/bands*length;
          ctx.moveTo(cx+cache.x[i]*r,cy+cache.y[i]*r);
          ctx.lineTo(cx+cache.x[i]*(r+length/bands),cy+cache.y[i]*(r+length/bands));
        }ctx.stroke();
      }
    }
    // Layered ribbons move with the spectrum, not a decorative unrelated oscillator.
    if(style==='pulse'&&settings.vizRingRays!==false){
      for(let layer=5;layer>=0;layer--){
        ctx.shadowBlur=layer===0?20*density*glow:0;
        ctx.globalAlpha=(1-layer/6)*(.65-fade*.25);ctx.lineWidth=thickness+layer*.5;ctx.beginPath();
        for(let i=0;i<=count;i++){
          const angle=rotation+i/count*Math.PI*2,r=contour(i)+layer*extent*.02*sample(i);
          const x=cx+cache.x[i]*r,y=cy+cache.y[i]*r;
          if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
        }ctx.stroke();
      }
    }
    if(style!=='rays'&&settings.vizRingParticles!==false){
      // At most 1,536 dots, batched by depth; no individual particle shadows.
      ctx.shadowBlur=0;
      const layers=style==='particles'?12:8;
      for(let layer=1;layer<=layers;layer++){
        const depth=layer/layers;ctx.globalAlpha=(.08+depth*.42)*(1-fade*(1-depth));ctx.beginPath();
        const dots=Math.min(count,style==='particles'?128:96),size=Math.max(.45,thickness*.28*depth);
        for(let i=0;i<dots;i++){
          const phase=i/dots,angle=rotation+phase*Math.PI*2+(1-depth)*Math.sin(rotation*2+phase*6)*.18;
          const r=contour(phase*count)*depth*(1+.035*Math.sin(phase*18+depth*8+rotation*3)*bass);
          const x=cx+Math.cos(angle)*r,y=cy+Math.sin(angle)*r;ctx.moveTo(x+size,y);ctx.arc(x,y,size,0,Math.PI*2);
        }ctx.fill();
      }
    }
    if(settings.vizRingContour!==false){
      ctx.globalAlpha=1;ctx.lineWidth=thickness;ctx.shadowBlur=24*density*glow;ctx.beginPath();
      for(let i=0;i<=count;i++){
        const angle=rotation+i/count*Math.PI*2,r=contour(i);
        const x=cx+cache.x[i]*r,y=cy+cache.y[i]*r;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }ctx.stroke();
    }
    if(settings.vizRingInner===true){
      ctx.globalAlpha=.3;ctx.shadowColor=c2;ctx.shadowBlur=10*density*glow;ctx.lineWidth=Math.max(.5,thickness*.4);
      ctx.beginPath();for(let i=0;i<=count;i++){const a=rotation+i/count*Math.PI*2,r=Math.max(1,contour(i)-9);const x=cx+cache.x[i]*r,y=cy+cache.y[i]*r;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();
    }
  }
  ctx.restore();
};
// Shared render runtime is serialized into its own worker; the fallback uses the same code.
App.musicVisualizerRuntime=function(draw,schedule,cancel,report=null){
  let renderDpr=1,surfaceWidth=1,surfaceHeight=1;
  let measuredFrames=0,measuredTime=0,reportedAt=0,maximumGap=0;
  let canvas,ctx,settings={},box={x:0,y:0,w:1,h:1},active=false,playing=false,handle=0,last=0,nextFrame=0,rotation=0,gradient,key='',modeBefore='';
  const levels=new Float32Array(256),wave=new Float32Array(260),target=new Float32Array(256),waveTarget=new Float32Array(260),boost=new Float32Array(256).fill(1),waveBoost=new Float32Array(260).fill(1);
  const bandLow=new Uint32Array(256),bandHigh=new Uint32Array(256);let bandKey='';
  function syncSurface(){
    if(!canvas||!ctx)return;
    const width=active?surfaceWidth:1,height=active?surfaceHeight:1;
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;key='';}
    ctx.setTransform(renderDpr,0,0,renderDpr,0,0);
  }
  function wake(){if(!handle&&ctx&&active&&playing)handle=schedule(frame);}
  function frame(now){
    handle=0;if(!active||!ctx)return;
    const fps=Math.max(15,Math.min(240,Number(settings.vizFps)||60));
    const budget=1000/fps;
    if(now+.15<nextFrame){handle=schedule(frame);return;}
    nextFrame=nextFrame?nextFrame+budget*(1+Math.floor(Math.max(0,now-nextFrame)/budget)):now+budget;
    const started=report?performance.now():0;
    if(last)maximumGap=Math.max(maximumGap,now-last);
    const dt=last?Math.min(.1,(now-last)/1000):1/60;last=now;
    const mode=settings.vizMode,changed=mode!==modeBefore;modeBefore=mode;
    if(changed){levels.fill(0);wave.fill(0);boost.fill(1);waveBoost.fill(1);}
    const smooth=mode==='wave'?settings.vizWaveSmooth:mode==='equalizer'?settings.vizEqSmooth:(settings.vizRingSmooth??.5);
    const blend=1-Math.pow(Math.max(0,Math.min(.95,Number(smooth)||0)),dt*30);
    const threshold=Math.max(0,Math.min(.95,Number(settings.vizResponseThreshold) || 0));
    const maximum=Math.max(1,Math.min(8,Number(settings.vizResponseBoost)||3));
    const attack=Math.max(5,Math.min(500,Number(settings.vizBoostAttack)||50))/1000,release=Math.max(20,Math.min(2000,Number(settings.vizBoostRelease)||300))/1000;
    const attackBlend=1-Math.exp(-dt/attack),releaseBlend=1-Math.exp(-dt/release);
    const updateBoost=(level,current)=>{
      if(!settings.vizResponseEnabled)return 1;
      const desired=level>threshold?maximum:1;
      return current+(desired-current)*(desired>current?attackBlend:releaseBlend);
    };
    for(let i=0;i<256;i++){
      boost[i]=updateBoost(target[i],boost[i]);
      levels[i]+=((playing?Math.min(8,target[i]*boost[i]):0)-levels[i])*blend;
    }
    for(let i=0;i<260;i++){
      waveBoost[i]=updateBoost(Math.abs(waveTarget[i]),waveBoost[i]);
      wave[i]+=((playing?waveTarget[i]*waveBoost[i]:0)-wave[i])*blend;
    }
    rotation=(rotation+dt*Math.max(0,Math.min(.5,Number(settings.vizRingSpeed)||0)))%(Math.PI*2);
    const trail=Math.max(0,Math.min(.85,Number(settings[mode==='ring'?'vizRingTrail':mode==='wave'?'vizWaveTrail':'vizEqTrail'])||0));
    const dpr=settings.vizDpr||1;
    if(changed||!playing||!trail)ctx.clearRect(0,0,canvas.width/dpr,canvas.height/dpr);
    else{ctx.save();ctx.globalCompositeOperation='destination-out';ctx.fillStyle=`rgba(0,0,0,${1-Math.pow(trail,dt*60)})`;ctx.fillRect(0,0,canvas.width/dpr,canvas.height/dpr);ctx.restore();}
    ctx.save();ctx.translate(box.x,box.y);
    const nextKey=[mode,settings.vizColor1,settings.vizColor2,box.w,box.h].join('|');
    if(key!==nextKey){
      gradient=ctx.createLinearGradient(0,mode==='equalizer'?box.h:0,box.w,0);
      gradient.addColorStop(0,settings.vizColor2||'#7c3aed');gradient.addColorStop(1,settings.vizColor1||'#ff2ec4');key=nextKey;
    }
    ctx.strokeStyle=gradient;ctx.fillStyle=gradient;
    draw(ctx,box.w,box.h,mode,levels,wave,settings,rotation);ctx.restore();
    if(report){
      if(!reportedAt)reportedAt=now;
      measuredFrames++;measuredTime+=performance.now()-started;
      if(now-reportedAt>=1000){report({type:'metrics',fps:measuredFrames*1000/(now-reportedAt),cpuMs:measuredTime/measuredFrames,maxGap:maximumGap,resources:{canvasBytes:canvas.width*canvas.height*4}});reportedAt=now;measuredFrames=0;measuredTime=0;maximumGap=0;}
    }
    if(playing)handle=schedule(frame);else last=0;
  }
  return function receive(m){
    if(m.type==='init'){canvas=m.canvas;ctx=canvas.getContext('2d');if(!ctx)throw Error('Visualizer canvas unavailable');}
    if(m.type==='state'){
      settings=m.settings;settings.vizDpr=renderDpr;playing=m.playing;active=m.active;
      syncSurface();
      // Keep the last rendered image intact during the CSS fade-out.
      if(!playing){if(handle)cancel(handle);handle=0;last=0;nextFrame=0;target.fill(0);waveTarget.fill(0);boost.fill(1);waveBoost.fill(1);}
      if(!active){if(handle)cancel(handle);handle=0;last=0;nextFrame=0;if(ctx)ctx.clearRect(0,0,canvas.width,canvas.height);}
    }
    if(m.type==='layout'){
      box=m.box;renderDpr=m.dpr;settings.vizDpr=renderDpr;
      surfaceWidth=m.width;surfaceHeight=m.height;syncSurface();key='';
    }
    if(m.type==='colors'){settings.vizColor1=m.c1;settings.vizColor2=m.c2;}
    if(m.type==='audio'){

      const count=settings.vizMode==='equalizer'?Math.max(16,Math.min(128,Math.round(settings.vizEqCount)||64)):Math.max(32,Math.min(256,Math.round(settings.vizRingCount)||180));
      if(m.freq?.length){
        const nextBandKey=count+'|'+m.freq.length+'|'+m.sampleRate;
        if(nextBandKey!==bandKey){
          bandKey=nextBandKey;
          const hz=(Number(m.sampleRate)||44100)/(m.freq.length*2),low=Math.max(30,hz),high=Math.min(16000,(Number(m.sampleRate)||44100)*.45);
          for(let i=0;i<count;i++){
            bandLow[i]=Math.min(m.freq.length-1,Math.floor(low*Math.pow(high/low,i/count)/hz));
            bandHigh[i]=Math.min(m.freq.length-1,Math.max(bandLow[i],Math.floor(low*Math.pow(high/low,(i+1)/count)/hz)));
          }
        }
        for(let i=0;i<count;i++){
          const lo=bandLow[i],hi=bandHigh[i];
          let peak=0;for(let bin=lo;bin<=hi;bin++)peak=Math.max(peak,m.freq[bin]);
          target[i]=m.freq.BYTES_PER_ELEMENT===1?peak/255:peak;
        }
      }
      if(m.wave?.length)for(let i=0;i<260;i++)waveTarget[i]=m.wave[Math.floor(i/259*(m.wave.length-1))];
    }
    wake();
  };
};
App.define('stage/music-visualizers',function(){
  let canvas=App.el('musicVisualizerCanvas');const dock=App.el('visualizerDock');
  let worker=null,receive,sourceUrl,layoutKey='',sampleTimer=0,connectedDsp=null,disposed=false,initialized=false,audioBusy=false,colorKey='',fadeTimer=0,shown=false;
  const vizSettings=()=>Object.fromEntries(Object.entries(App.settings).filter(([key])=>key.startsWith('viz')));
  const send=m=>worker?worker.postMessage(m):receive(m);
  function fallback(){
    if(disposed)return;
    worker?.terminate();worker=null;connectedDsp=null;audioBusy=false;
    if(sourceUrl){URL.revokeObjectURL(sourceUrl);sourceUrl=null;}
    const replacement=canvas.cloneNode(false);canvas.replaceWith(replacement);canvas=replacement;
    receive=App.musicVisualizerRuntime(App.drawMusicVisualizer,requestAnimationFrame,cancelAnimationFrame);
    receive({type:'init',canvas});layoutKey='';if(initialized)wake();
    canvas.dataset.renderer='main-thread';
  }
  try{
    if(!canvas.transferControlToOffscreen||typeof Worker==='undefined')throw Error('OffscreenCanvas unavailable');
    const source=`const App={},window={devicePixelRatio:1};const receive=(${App.musicVisualizerRuntime.toString()})(${App.drawMusicVisualizer.toString()},typeof requestAnimationFrame==='function'?requestAnimationFrame:fn=>setTimeout(()=>fn(performance.now()),1000/240),typeof cancelAnimationFrame==='function'?cancelAnimationFrame:clearTimeout,m=>postMessage(m));onmessage=({data:m})=>{if(m.type==='sense-port'){m.port.onmessage=({data:a})=>{receive({type:'audio',freq:a.visualFreq||a.freq,wave:a.wave,sampleRate:a.sampleRate,loudness:(a.sense?.loudnessPct||0)/100});m.port.postMessage('ack');};m.port.start();}else {receive(m);if(m.type==='audio')postMessage({type:'audio-ack'});}};`;
    sourceUrl=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));worker=new Worker(sourceUrl,{name:'Aurora visualizers'});worker.onmessage=({data:m})=>{if(m.type==='audio-ack')audioBusy=false;if(m.type==='metrics'&&App.Threads)App.Threads.metrics.visualizer=m;};
    worker.onerror=fallback;const offscreen=canvas.transferControlToOffscreen();worker.postMessage({type:'init',canvas:offscreen},[offscreen]);canvas.dataset.renderer='worker';
  }catch(error){fallback();}
  function layout(){
    const rect=(App.el('sceneContent')||App.stage).getBoundingClientRect();
    const right=rect.width;
    let bottom=rect.height-24;
    for(const id of ['controlBar','timelineIsland']){const el=App.el(id),r=el?.getBoundingClientRect();if(r?.height&&r.top>rect.top+rect.height*.35)bottom=Math.min(bottom,r.top-rect.top-32);}
    const top=Math.min(110,rect.height*.16),pad=Math.min(48,right*.06),dpr=App.scenePixelRatio(rect.width,rect.height);
    const box={x:pad,y:top,w:Math.max(1,right-pad*2),h:Math.max(1,bottom-top)};
    const message={type:'layout',box,width:Math.max(1,Math.round(rect.width*dpr)),height:Math.max(1,Math.round(rect.height*dpr)),dpr};
    const key=JSON.stringify(message);if(key!==layoutKey){layoutKey=key;send(message);}
  }
  App.connectMusicVisualizerAudio=()=>{
    const dsp=App.Threads?.workers?.get('dsp');if(!worker||!dsp||!App.Threads.audioActive||connectedDsp===dsp)return;
    const channel=new MessageChannel();worker.postMessage({type:'sense-port',port:channel.port1},[channel.port1]);
    App.Threads.send('dsp',{type:'sink',port:channel.port2,spectrum:true,visualizer:true},[channel.port2]);connectedDsp=dsp;
  };
  let freq=new Float32Array(0),time=new Uint8Array(0),wave=new Float32Array(260);
  function sample(){
    sampleTimer=0;if(disposed||document.hidden||!App.VisualRenderState.active||!App.state.isPlaying||App.settings.vizMode==='none'||!Number(App.settings.vizOpacity))return;
    App.connectMusicVisualizerAudio();
    const staticColor=App.settings.vizColorMode==='static'&&/^#[0-9a-f]{6}$/i.test(App.settings.vizStaticColor)?App.settings.vizStaticColor:null;
    const c1=staticColor||App.PlayerColors?._lastC1,c2=staticColor||App.PlayerColors?._lastC2,nextColorKey=c1+'|'+c2;
    if(nextColorKey!==colorKey){colorKey=nextColorKey;send({type:'colors',c1,c2});}
    if(!connectedDsp||!App.Threads.audioActive){
      const analyser=App.analyserNode;if(analyser&&!audioBusy){
        if(freq.length!==analyser.frequencyBinCount){freq=new Float32Array(analyser.frequencyBinCount);time=new Uint8Array(analyser.fftSize);}
        // Float dB bins retain bass dynamics above the byte analyser ceiling.
        analyser.getFloatFrequencyData(freq);
        for(let i=0;i<freq.length;i++)freq[i]=Math.max(0,Math.min(1,(freq[i]+80)/80));
        analyser.getByteTimeDomainData(time);
        for(let i=0;i<260;i++)wave[i]=(time[Math.floor(i/259*(time.length-1))]-128)/128;
        let energy=0;for(let i=0;i<wave.length;i++)energy+=wave[i]*wave[i];
        const loudness=Math.max(0,Math.min(1,(10*Math.log10(energy/wave.length+1e-12)+60)/60));
        audioBusy=!!worker;send({type:'audio',freq,wave,sampleRate:App.audioCtx?.sampleRate||44100,loudness});
      }
    }
    // Only fallback audio capture depends on UI. DSP feeds the worker through a MessagePort.
    sampleTimer=setTimeout(sample,connectedDsp&&App.Threads.audioActive?1000/30:1000/60);
  }
  function wake(){
    if(disposed||(!worker&&!receive))return;
    const settings=vizSettings();settings.vizColor1=App.PlayerColors?._lastC1;settings.vizColor2=App.PlayerColors?._lastC2;settings.vizDpr=Math.min(1.5,devicePixelRatio||1);
    if(settings.vizColorMode==='static'&&/^#[0-9a-f]{6}$/i.test(settings.vizStaticColor))settings.vizColor1=settings.vizColor2=settings.vizStaticColor;
    const active=!document.hidden&&App.VisualRenderState.active&&settings.vizMode!=='none'&&Number(settings.vizOpacity)>0;
    const playing=!!App.state.isPlaying&&App.audio.paused!==true&&App.audio.ended!==true;
    const visible=active&&playing;
    const motion=App.SettingsUI?.motionDuration?.()??320;
    const duration=visible?motion*.5:motion*2.5;
    const blurKey=settings.vizMode==='ring'?'vizRingBlur':settings.vizMode==='wave'?'vizWaveBlur':'vizEqBlur';
    const blur=Math.max(0,Math.min(12,Number(settings[blurKey])||0));
    canvas.style.filter=blur?`blur(${blur}px)`:'none';
    canvas.style.transitionDuration=duration+'ms';
    canvas.style.transitionTimingFunction=visible?'ease-out':'ease-in-out';
    canvas.style.opacity=visible?String(Math.max(0,Math.min(1,Number(settings.vizOpacity)||0))):'0';
    if(visible){clearTimeout(fadeTimer);fadeTimer=0;}
    else if(shown){
      clearTimeout(fadeTimer);fadeTimer=0;
      if(active&&duration>0)fadeTimer=setTimeout(()=>{
        fadeTimer=0;send({type:'state',settings,active:false,playing:false});
      },duration);
    }
    shown=visible;
    for(const button of dock.querySelectorAll('[data-viz-mode]')){const selected=button.dataset.vizMode===settings.vizMode;button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));}
    send({type:'state',settings,active:visible||!!fadeTimer,playing});layout();
    clearTimeout(sampleTimer);sampleTimer=0;if(active&&App.state.isPlaying)sample();
  }
  dock.addEventListener('click',e=>{const button=e.target.closest('[data-viz-mode]');if(!button)return;App.settings.vizMode=button.dataset.vizMode;App.saveSettings();App.applyInteractionAppearance();});
  const change=e=>{const key=e.target.dataset?.setting||e.target.dataset?.extraSelect;if(key?.startsWith('viz'))wake();};
  document.addEventListener('input',change);document.addEventListener('change',change);
  document.addEventListener('transitionend',layout);document.addEventListener('click',layout);
  for(const event of ['play','playing','pause','ended','emptied','error','loadedmetadata'])App.audio.addEventListener(event,wake);
  document.addEventListener('visibilitychange',wake);window.addEventListener('focus',wake);window.addEventListener('blur',wake);
  const observer=new ResizeObserver(wake);observer.observe(App.el('sceneContent')||App.stage);observer.observe(App.el('controlBar'));
  App.VisualRenderState.subscribe(wake);
  window.addEventListener('pagehide',e=>{if(e.persisted)return;disposed=true;clearTimeout(sampleTimer);clearTimeout(fadeTimer);observer.disconnect();worker?.terminate();if(sourceUrl)URL.revokeObjectURL(sourceUrl);});
  App.refreshMusicVisualizer=wake;initialized=true;wake();
},['drawMusicVisualizer','musicVisualizerRuntime','refreshMusicVisualizer','connectMusicVisualizerAudio']);
})(window.Aurora);
