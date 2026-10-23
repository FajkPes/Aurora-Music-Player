/* background.js — Pozadí, tvary, pohyb, mapování signálu, barvy, jiskry a stopy. */

// ── background/renderer-signature ──
(function(App){
  App.addParts("BgReact", {
_signature(){
      return App.settings.bgLayers.map(l => (l.enabled ? l.count : 0)).join(',');
    },
ensure(){
      const wrap = App.el('bgGlow');
      const sig = this._signature();
      if(sig !== this._layerSignature || !this.blobs){
        const trailCanvas = App.el('bgTrailCanvas');
        wrap.innerHTML = '';
        if(trailCanvas) wrap.appendChild(trailCanvas);
        this.blobs = [];
        App.settings.bgLayers.forEach((layer, layerIdx) => {
          if(!layer.enabled) return;
          const count = Math.min(100, Math.max(0, Math.round(layer.count)));
          for(let i=0;i<count;i++){
            const d = document.createElement('div');
            d.className = 'bg-blob';
            const svg = document.createElementNS(App.SVG_NS, 'svg');
            svg.setAttribute('viewBox', '0 0 100 100');
            const filterId = `bgBlobBlur${layerIdx}_${i}_${Math.random().toString(36).slice(2,8)}`;
            const defs = document.createElementNS(App.SVG_NS, 'defs');
            const filter = document.createElementNS(App.SVG_NS, 'filter');
            filter.setAttribute('id', filterId);
            filter.setAttribute('x', '-100%');
            filter.setAttribute('y', '-100%');
            filter.setAttribute('width', '300%');
            filter.setAttribute('height', '300%');
            const feBlur = document.createElementNS(App.SVG_NS, 'feGaussianBlur');
            feBlur.setAttribute('stdDeviation', '0');
            feBlur.setAttribute('edgeMode', 'none');
            filter.appendChild(feBlur);
            defs.appendChild(filter);
            svg.appendChild(defs);
            const path = document.createElementNS(App.SVG_NS, 'path');
            path.setAttribute('fill', '#fff');
            svg.appendChild(path);
            const radialFill = document.createElementNS(App.SVG_NS, 'radialGradient');
            const radialId = `bgBlobRadial${layerIdx}_${i}_${Math.random().toString(36).slice(2,8)}`;
            radialFill.setAttribute('id', radialId);
            radialFill.setAttribute('cx','50%'); radialFill.setAttribute('cy','50%'); radialFill.setAttribute('r','50%');
            ['0%','18%','45%','75%'].forEach(off=>{
              const stop = document.createElementNS(App.SVG_NS,'stop');
              stop.setAttribute('offset', off);
              radialFill.appendChild(stop);
            });
            defs.appendChild(radialFill);
            wrap.appendChild(d);
            d.appendChild(svg);
            const dm = document.createElement('div');
            dm.className = 'bg-blob';
            dm.style.display = 'none';
            const svgm = document.createElementNS(App.SVG_NS, 'svg');
            svgm.setAttribute('viewBox', '0 0 100 100');
            const filterIdM = `bgBlobBlurM${layerIdx}_${i}_${Math.random().toString(36).slice(2,8)}`;
            const defsM = document.createElementNS(App.SVG_NS, 'defs');
            const filterM = document.createElementNS(App.SVG_NS, 'filter');
            filterM.setAttribute('id', filterIdM);
            filterM.setAttribute('x', '-100%'); filterM.setAttribute('y', '-100%');
            filterM.setAttribute('width', '300%'); filterM.setAttribute('height', '300%');
            const feBlurM = document.createElementNS(App.SVG_NS, 'feGaussianBlur');
            feBlurM.setAttribute('stdDeviation', '0');
            feBlurM.setAttribute('edgeMode', 'none');
            filterM.appendChild(feBlurM);
            defsM.appendChild(filterM);
            svgm.appendChild(defsM);
            const pathM = document.createElementNS(App.SVG_NS, 'path');
            pathM.setAttribute('fill', '#fff');
            svgm.appendChild(pathM);
            const radialFillM = document.createElementNS(App.SVG_NS, 'radialGradient');
            const radialIdM = `bgBlobRadialM${layerIdx}_${i}_${Math.random().toString(36).slice(2,8)}`;
            radialFillM.setAttribute('id', radialIdM);
            radialFillM.setAttribute('cx','50%'); radialFillM.setAttribute('cy','50%'); radialFillM.setAttribute('r','50%');
            ['0%','18%','45%','75%'].forEach(off=>{
              const stop = document.createElementNS(App.SVG_NS,'stop');
              stop.setAttribute('offset', off);
              radialFillM.appendChild(stop);
            });
            defsM.appendChild(radialFillM);
            wrap.appendChild(dm);
            dm.appendChild(svgm);
            const dm2 = document.createElement('div');
            dm2.className = 'bg-blob';
            dm2.style.display = 'none';
            const svgm2 = document.createElementNS(App.SVG_NS, 'svg');
            svgm2.setAttribute('viewBox', '0 0 100 100');
            const filterIdM2 = `bgBlobBlurM2_${layerIdx}_${i}_${Math.random().toString(36).slice(2,8)}`;
            const defsM2 = document.createElementNS(App.SVG_NS, 'defs');
            const filterM2 = document.createElementNS(App.SVG_NS, 'filter');
            filterM2.setAttribute('id', filterIdM2);
            filterM2.setAttribute('x', '-100%'); filterM2.setAttribute('y', '-100%');
            filterM2.setAttribute('width', '300%'); filterM2.setAttribute('height', '300%');
            const feBlurM2 = document.createElementNS(App.SVG_NS, 'feGaussianBlur');
            feBlurM2.setAttribute('stdDeviation', '0');
            feBlurM2.setAttribute('edgeMode', 'none');
            filterM2.appendChild(feBlurM2);
            defsM2.appendChild(filterM2);
            svgm2.appendChild(defsM2);
            const pathM2 = document.createElementNS(App.SVG_NS, 'path');
            pathM2.setAttribute('fill', '#fff');
            svgm2.appendChild(pathM2);
            const radialFillM2 = document.createElementNS(App.SVG_NS, 'radialGradient');
            const radialIdM2 = `bgBlobRadialM2_${layerIdx}_${i}_${Math.random().toString(36).slice(2,8)}`;
            radialFillM2.setAttribute('id', radialIdM2);
            radialFillM2.setAttribute('cx','50%'); radialFillM2.setAttribute('cy','50%'); radialFillM2.setAttribute('r','50%');
            ['0%','18%','45%','75%'].forEach(off=>{
              const stop2 = document.createElementNS(App.SVG_NS,'stop');
              stop2.setAttribute('offset', off);
              radialFillM2.appendChild(stop2);
            });
            defsM2.appendChild(radialFillM2);
            wrap.appendChild(dm2);
            dm2.appendChild(svgm2);
            const angle = Math.random()*Math.PI*2;
            this.blobs.push({
              layerIdx,
              wrapEl: d,
              svgEl: svg,
              pathEl: path,
              feBlur, filterId,
              radialFill, radialId,
              mirrorWrapEl: dm, mirrorSvgEl: svgm, mirrorPathEl: pathM,
              mirrorFeBlur: feBlurM, mirrorFilterId: filterIdM,
              mirrorRadialFill: radialFillM, mirrorRadialId: radialIdM,
              _mirrorLastShape: null,
              mirror2WrapEl: dm2, mirror2SvgEl: svgm2, mirror2PathEl: pathM2,
              mirror2FeBlur: feBlurM2, mirror2FilterId: filterIdM2,
              mirror2RadialFill: radialFillM2, mirror2RadialId: radialIdM2,
              _mirror2LastShape: null,
              x: 0.15 + Math.random()*0.7,
              y: 0.15 + Math.random()*0.7,
              dirX: Math.cos(angle),
              dirY: Math.sin(angle),
              hueSeed: Math.random()*360,
              colorFlip: Math.random() > 0.5,
              phase: Math.random()*Math.PI*2,
              _lastShape: null,
              lane: 0.08 + Math.random()*0.84,
              along: Math.random(),
              orbitAngle: Math.random()*Math.PI*2,
              orbitRadius: 0.18 + Math.random()*0.30,
              orbitDir: Math.random() > 0.5 ? 1 : -1,
              _lastPath: null,
              pathFade: 1
            });
          }
        });
        this._layerSignature = sig;
      }
      return wrap;
    }
  });
})(window.Aurora);

// ── background/renderer-update ──
(function(App){
  App.addParts("BgReact", {
update(){
      const now = performance.now();
      const dt = this._lastTime ? Math.min(0.1, (now - this._lastTime)/1000) : 0;
      this._lastTime = now;
      const headacheReductionColorSpeed = App.settings.reduceColorSpeedIntensity ? 0.5 : 1;
      const colorSpeedDrv0 = App.applyTempoSpeedMult(App.settings.bgMapColorSpeed, App.MappingEngine.resolve('bgMapColorSpeed')) * headacheReductionColorSpeed;
      this._hueAccum += colorSpeedDrv0 * dt * 40;
      const wrap = App.el('bgGlow');
      if(!App.settings.bgEnabled||App.mobileSceneDisabled){
        wrap.style.opacity = '0';
        App.FxEngine.setBaseOpacity(0);
        App.TrailFx?.release();
        for(const blob of this.blobs||[])blob._trailHist=null;
        return;
      }
      this.ensure();
      const overallOpacity = typeof App.settings.fxOverallOpacity === 'number' ? App.settings.fxOverallOpacity : 1;
      wrap.style.opacity = String(overallOpacity);
      App.FxEngine.setBaseOpacity(overallOpacity);
      const w = App.stageBox.w, h = App.stageBox.h;
      if(!w || !h) return;
      this._frameToken++;
      const headacheReductionFlash = App.settings.reduceFlashIntensity ? 0.5 : 1;
      const sizeDrv0      = App.MappingEngine.resolve('bgMapSize');
      const speedDrv0      = App.applyTempoSpeedMult(App.settings.bgMapSpeed, App.MappingEngine.resolve('bgMapSpeed'));
      const flashDrvRaw0   = App.MappingEngine.resolve('bgMapFlash') * headacheReductionFlash;
      const blurDrv0       = App.MappingEngine.resolve('bgMapBlur');
      if(dt > 0){
        const attack = Math.max(0.001, App.settings.bgFlashAttack);
        const release = Math.max(0.001, App.settings.bgFlashRelease);
        if(flashDrvRaw0 > this._flashEnv){
          const k = 1 - Math.exp(-dt/attack);
          this._flashEnv += (flashDrvRaw0 - this._flashEnv) * k;
        } else {
          const k = 1 - Math.exp(-dt/release);
          this._flashEnv += (flashDrvRaw0 - this._flashEnv) * k;
        }
      }
      const baseSizePx = Math.min(w,h) * 0.34;
      const anyTrailsActive = App.settings.bgLayers.some(l => l.enabled && l.trailEnabled);
      const anySparklesActive = App.settings.sparklesEnabled && App.settings.bgLayers.some(l => l.enabled && l.sparklesEnabled);
      const trailCanvasReady = App.TrailFx.beginFrame(w, h, anyTrailsActive, anySparklesActive);
      const layerDrivers=[]; // Resolve each layer once, independent of its blob count.
      this.blobs.forEach((b)=>{
        const layer = App.settings.bgLayers[b.layerIdx];
        if(!layer || !layer.enabled){
          if(b.wrapEl.style.display !== 'none') b.wrapEl.style.display = 'none';
          return;
        }
        if(b.wrapEl.style.display !== ''){ b.wrapEl.style.display = ''; }
        const sensMult = typeof layer.sensMult === 'number' ? layer.sensMult : 1;
        const ov = layer.overrides || {};
        const layerIdx = b.layerIdx;
        let drivers=layerDrivers[layerIdx];
        if(!drivers){
          const sizeOv=ov.size, speedOv=ov.speed, blurOv=ov.blur;
          drivers=layerDrivers[layerIdx]={
            size:sizeOv?.enabled ? App.MappingEngine.resolveMap(sizeOv, `layer:${layerIdx}:size`) : sizeDrv0*sensMult,
            speed:speedOv?.enabled ? App.applyTempoSpeedMult(speedOv, App.MappingEngine.resolveMap(speedOv, `layer:${layerIdx}:speed`)) : speedDrv0*sensMult,
            blur:blurOv?.enabled ? App.MappingEngine.resolveMap(blurOv, `layer:${layerIdx}:blur`) : blurDrv0*sensMult
          };
        }
        const {size:sizeDrv,speed:speedDrv,blur:blurDrv}=drivers;
        const flashOv = ov.flash;
        let flashDrv;
        if(flashOv && flashOv.enabled){
          if(this._layerFlashFrameToken[layerIdx] !== this._frameToken){
            const rawOv = App.MappingEngine.resolveMap(flashOv, `layer:${layerIdx}:flash`) * headacheReductionFlash;
            const prevEnv = this._layerFlashEnv[layerIdx] || 0;
            if(dt > 0){
              const attack = Math.max(0.001, App.settings.bgFlashAttack);
              const release = Math.max(0.001, App.settings.bgFlashRelease);
              const k = 1 - Math.exp(-dt / (rawOv > prevEnv ? attack : release));
              this._layerFlashEnv[layerIdx] = prevEnv + (rawOv - prevEnv) * k;
            }
            this._layerFlashFrameToken[layerIdx] = this._frameToken;
          }
          flashDrv = (this._layerFlashEnv[layerIdx] || 0);
        } else {
          flashDrv = this._flashEnv * sensMult;
        }
        const driftSpeed = App.settings.bgBaseDrift * speedDrv;
        let px, py, pathFadeTarget = 1;
        if(layer.pathEnabled){
          const pathKey = layer.path || 'random';
          if(pathKey !== b._lastPath){
            b.along = pathKey === 'inward' ? 1 : (pathKey === 'outward' ? 0.02 : Math.random());
            b.lane = (pathKey === 'inward' || pathKey === 'outward') ? Math.random()*Math.PI*2 : (0.08 + Math.random()*0.84);
            b._lastPath = pathKey;
            b.pathFade = 0;
          }
          const pos = App.resolveMotionPath(pathKey).step(b, driftSpeed, dt || 0.016, layer);
          b.x = pos.px; b.y = pos.py;
          px = pos.px * w;
          py = pos.py * h;
          pathFadeTarget = (typeof pos.fade === 'number') ? pos.fade : 1;
        } else {
          b.phase += (0.002 + driftSpeed*0.01) * dt * 120;
          const step = driftSpeed * 0.0006 * dt * 120;
          b.x += b.dirX * step;
          b.y += b.dirY * step;
          if(b.x < -0.15 || b.x > 1.15) b.dirX *= -1;
          if(b.y < -0.15 || b.y > 1.15) b.dirY *= -1;
          b.x = Math.max(-0.15, Math.min(1.15, b.x));
          b.y = Math.max(-0.15, Math.min(1.15, b.y));
          const wobbleX = driftSpeed>0 ? Math.sin(b.phase)*0.02 : 0;
          const wobbleY = driftSpeed>0 ? Math.cos(b.phase*0.8)*0.02 : 0;
          px = (b.x+wobbleX) * w;
          py = (b.y+wobbleY) * h;
        }
        if(b.pathFade === undefined) b.pathFade = pathFadeTarget;
        const fadeK = 1 - Math.exp(-(dt||0.016)/0.12);
        b.pathFade += (pathFadeTarget - b.pathFade) * fadeK;
        const size = baseSizePx * layer.size * (0.75 + sizeDrv*0.65);
        const layerOpacity = typeof layer.opacity === 'number' ? layer.opacity : 1;
        const beatCutMult = this._updateLayerBeatCut(layerIdx, layer, dt);
        const alpha = (layer.baseAlpha + flashDrv*0.75) * b.pathFade * layerOpacity * beatCutMult;
        const clampedAlpha = Math.max(0, Math.min(1, alpha));
        let color;
        const colorSpeedOv = ov.colorSpeed;
        if(colorSpeedOv && colorSpeedOv.enabled){
          const colorMode = colorSpeedOv.colorMode || 'cycle';
          if(colorMode === 'player'){
            const syncActive = App.settings.playerColorSync && App.settings.bgMapColorSpeed.enabled;
            if(syncActive){
              const hue = App.BgReact._hueAccum % 360;
              color = b.colorFlip ? App.hslToHex(hue, 80, 60) : App.hslToHex((hue+40) % 360, 80, 55);
            } else {
              color = b.colorFlip ? App.settings.playerColor1 : App.settings.playerColor2;
            }
          } else if(colorMode === 'custom'){
            color = colorSpeedOv.customColor || '#ff2ec4';
          } else {
            if(this._layerHueFrameToken[layerIdx] !== this._frameToken){
              const drvOv = App.applyTempoSpeedMult(colorSpeedOv, App.MappingEngine.resolveMap(colorSpeedOv, `layer:${layerIdx}:colorSpeed`)) * headacheReductionColorSpeed;
              this._layerHueAccum[layerIdx] = (this._layerHueAccum[layerIdx] || 0) + drvOv * dt * 40;
              this._layerHueFrameToken[layerIdx] = this._frameToken;
            }
            const hue = (b.hueSeed + (this._layerHueAccum[layerIdx]||0)) % 360;
            color = App.hslToHex(hue, 80, 60);
          }
        } else if(App.settings.bgMapColorSpeed.enabled){
          const hue = (b.hueSeed + this._hueAccum) % 360;
          color = App.hslToHex(hue, 80, 60);
        } else {
          color = b.colorFlip ? App.settings.bgColor1 : App.settings.bgColor2;
        }
        const shapeKeyEarly = App.BlobShapes[layer.shape] ? layer.shape : 'circle';
        const wobbleDeg = (layer.rotationWobble && driftSpeed>0) ? Math.sin(b.phase*0.6)*8 : 0;
        const rotationDeg = layer.rotation + wobbleDeg;
        const rotationDegR = Math.round(rotationDeg*100)/100;
        if(!layer.trailEnabled)b._trailHist=null;
        if(trailCanvasReady){
          if(layer.trailEnabled){
            const trailLenSec = Math.max(0.05, (typeof layer.trailLength === 'number' ? layer.trailLength : 0.4) * 2.2);
            const trailSizeMult = typeof layer.trailWidth === 'number' ? Math.min(3,layer.trailWidth) : 1.05;
            App.TrailFx.drawTrail(b, px, py, size, color, clampedAlpha, trailLenSec, trailSizeMult, now, shapeKeyEarly, rotationDeg, layer.cornerRadius);
          }
          if(App.settings.sparklesEnabled && layer.sparklesEnabled && clampedAlpha > 0.02){
            App.TrailFx.spawnSparkle(b, px, py, size, color, dt||0.016, this._flashEnv);
          }
        }
        const sizeR = Math.round(size*100)/100;
        const pxR = Math.round(px*100)/100;
        const pyR = Math.round(py*100)/100;
        if(b._lastSize !== sizeR || b._lastPx !== pxR || b._lastPy !== pyR || b._lastRotation !== rotationDegR){
          b.wrapEl.style.cssText = `width:${sizeR}px;height:${sizeR}px;left:${pxR}px;top:${pyR}px;transform:translate(-50%,-50%) rotate(${rotationDegR}deg);`;
          b._lastSize = sizeR; b._lastPx = pxR; b._lastPy = pyR;
          b._lastRotation = rotationDegR;
        }
        const blurPx = Math.max(0, layer.blur + blurDrv*40);
        const blurUnits = layer.blurEnabled ? Math.min(22, (blurPx / Math.max(1,size)) * 60) : 0;
        const BLUR_QUANT = 0.4;
        const blurUnitsR = (Math.round(blurUnits / BLUR_QUANT) * BLUR_QUANT).toFixed(2);
        if(b._lastBlurUnits !== blurUnitsR){
          b.feBlur.setAttribute('stdDeviation', blurUnitsR);
          b.pathEl.style.filter = Number(blurUnitsR)>0 ? `url(#${b.filterId})` : 'none';
          b._lastBlurUnits = blurUnitsR;
        }
        const shapeKey = shapeKeyEarly;
        const shapeDef = App.BlobShapes[shapeKey];
        const cornerRadius = typeof layer.cornerRadius === 'number' ? layer.cornerRadius : 0;
        const shapeCacheKey = shapeKey + '|' + cornerRadius.toFixed(2);
        if(shapeCacheKey !== b._lastShape){
          b.pathEl.setAttribute('d', shapeDef.path(cornerRadius));
          b.pathEl.setAttribute('fill-rule', shapeDef.fillRule || 'nonzero');
          b.svgEl.querySelector('filter').setAttribute('id', b.filterId);
          b._lastShape = shapeCacheKey;
        }
        if(shapeDef.radial){
          const {r,g,b:bl} = App.hexToRgb(color);
          const alphaKey = clampedAlpha.toFixed(3);
          const radialKey = r+','+g+','+bl+'|'+alphaKey;
          if(b._lastRadialKey !== radialKey){
            const stops = b.radialFill.querySelectorAll('stop');
            stops[0].setAttribute('stop-color', `rgba(255,255,255,${(clampedAlpha*0.95).toFixed(3)})`);
            stops[1].setAttribute('stop-color', `rgba(${r},${g},${bl},${(clampedAlpha*0.85).toFixed(3)})`);
            stops[2].setAttribute('stop-color', `rgba(${r},${g},${bl},${(clampedAlpha*0.35).toFixed(3)})`);
            stops[3].setAttribute('stop-color', `rgba(${r},${g},${bl},0)`);
            b._lastRadialKey = radialKey;
          }
          if(b._lastFillUrl !== b.radialId){
            b.pathEl.setAttribute('fill', `url(#${b.radialId})`);
            b._lastFillUrl = b.radialId;
          }
        } else {
          const fillStr = App.rgbaFromHex(color, clampedAlpha);
          if(b._lastFill !== fillStr){
            b.pathEl.setAttribute('fill', fillStr);
            b._lastFill = fillStr;
          }
        }
        const layerMirrorAllowed = layer.mirrorEnabled !== false;
        if(App.settings.fxMirrorEnabled && layerMirrorAllowed){
          const axis = App.settings.fxMirrorAxis || 'x';
          const mirrorAmt = typeof App.settings.fxMirrorAmount === 'number' ? App.settings.fxMirrorAmount : 1;
          if(b.mirrorWrapEl.style.display !== ''){
            b.mirrorWrapEl.style.display = '';
          }
          let mpx = px, mpy = py;
          if(axis === 'x' || axis === 'both') mpx = w - px;
          if(axis === 'y' || axis === 'both') mpy = h - py;
          const mpxR = Math.round(mpx*100)/100;
          const mpyR = Math.round(mpy*100)/100;
          if(b._mLastSize !== sizeR || b._mLastPx !== mpxR || b._mLastPy !== mpyR){
            b.mirrorWrapEl.style.cssText = `width:${sizeR}px;height:${sizeR}px;left:${mpxR}px;top:${mpyR}px;`;
            b._mLastSize = sizeR; b._mLastPx = mpxR; b._mLastPy = mpyR;
          }
          const mirrorRotationDeg = (axis === 'y') ? -rotationDeg : rotationDeg;
          const mirrorScaleX = (axis === 'x' || axis === 'both') ? -1 : 1;
          const mirrorScaleY = (axis === 'y' || axis === 'both') ? -1 : 1;
          const mirrorRotationDegR = Math.round(mirrorRotationDeg*100)/100;
          const mTransformKey = mirrorScaleX+','+mirrorScaleY+','+mirrorRotationDegR;
          if(b._mLastTransformKey !== mTransformKey){
            b.mirrorWrapEl.style.transform = `translate(-50%,-50%) scale(${mirrorScaleX},${mirrorScaleY}) rotate(${mirrorRotationDegR}deg)`;
            b._mLastTransformKey = mTransformKey;
          }
          if(shapeCacheKey !== b._mirrorLastShape){
            b.mirrorPathEl.setAttribute('d', shapeDef.path(cornerRadius));
            b.mirrorPathEl.setAttribute('fill-rule', shapeDef.fillRule || 'nonzero');
            b.mirrorSvgEl.querySelector('filter').setAttribute('id', b.mirrorFilterId);
            b._mirrorLastShape = shapeCacheKey;
          }
          if(b._mLastBlurUnits !== blurUnitsR){
            b.mirrorFeBlur.setAttribute('stdDeviation', blurUnitsR);
            b.mirrorPathEl.style.filter = Number(blurUnitsR)>0 ? `url(#${b.mirrorFilterId})` : 'none';
            b._mLastBlurUnits = blurUnitsR;
          }
          const mirrorAlpha = clampedAlpha * mirrorAmt;
          if(shapeDef.radial){
            const {r,g,b:bl} = App.hexToRgb(color);
            const mAlphaKey = mirrorAlpha.toFixed(3);
            const mRadialKey = r+','+g+','+bl+'|'+mAlphaKey;
            if(b._mLastRadialKey !== mRadialKey){
              const mstops = b.mirrorRadialFill.querySelectorAll('stop');
              mstops[0].setAttribute('stop-color', `rgba(255,255,255,${(mirrorAlpha*0.95).toFixed(3)})`);
              mstops[1].setAttribute('stop-color', `rgba(${r},${g},${bl},${(mirrorAlpha*0.85).toFixed(3)})`);
              mstops[2].setAttribute('stop-color', `rgba(${r},${g},${bl},${(mirrorAlpha*0.35).toFixed(3)})`);
              mstops[3].setAttribute('stop-color', `rgba(${r},${g},${bl},0)`);
              b._mLastRadialKey = mRadialKey;
            }
            if(b._mLastFillUrl !== b.mirrorRadialId){
              b.mirrorPathEl.setAttribute('fill', `url(#${b.mirrorRadialId})`);
              b._mLastFillUrl = b.mirrorRadialId;
            }
          } else {
            const mFillStr = App.rgbaFromHex(color, mirrorAlpha);
            if(b._mLastFill !== mFillStr){
              b.mirrorPathEl.setAttribute('fill', mFillStr);
              b._mLastFill = mFillStr;
            }
          }
        } else if(b.mirrorWrapEl.style.display !== 'none'){
          b.mirrorWrapEl.style.display = 'none';
        }
        if(App.settings.fxMirror2Enabled && layerMirrorAllowed){
          const axis2 = App.settings.fxMirror2Axis || 'x';
          const mirrorAmt2 = typeof App.settings.fxMirror2Amount === 'number' ? App.settings.fxMirror2Amount : 1;
          if(b.mirror2WrapEl.style.display !== ''){
            b.mirror2WrapEl.style.display = '';
          }
          let mpx2 = px, mpy2 = py;
          if(axis2 === 'x' || axis2 === 'both') mpx2 = w - px;
          if(axis2 === 'y' || axis2 === 'both') mpy2 = h - py;
          const mpx2R = Math.round(mpx2*100)/100;
          const mpy2R = Math.round(mpy2*100)/100;
          if(b._m2LastSize !== sizeR || b._m2LastPx !== mpx2R || b._m2LastPy !== mpy2R){
            b.mirror2WrapEl.style.cssText = `width:${sizeR}px;height:${sizeR}px;left:${mpx2R}px;top:${mpy2R}px;`;
            b._m2LastSize = sizeR; b._m2LastPx = mpx2R; b._m2LastPy = mpy2R;
          }
          const mirror2RotationDeg = (axis2 === 'y') ? -rotationDeg : rotationDeg;
          const mirror2ScaleX = (axis2 === 'x' || axis2 === 'both') ? -1 : 1;
          const mirror2ScaleY = (axis2 === 'y' || axis2 === 'both') ? -1 : 1;
          const mirror2RotationDegR = Math.round(mirror2RotationDeg*100)/100;
          const m2TransformKey = mirror2ScaleX+','+mirror2ScaleY+','+mirror2RotationDegR;
          if(b._m2LastTransformKey !== m2TransformKey){
            b.mirror2WrapEl.style.transform = `translate(-50%,-50%) scale(${mirror2ScaleX},${mirror2ScaleY}) rotate(${mirror2RotationDegR}deg)`;
            b._m2LastTransformKey = m2TransformKey;
          }
          if(shapeCacheKey !== b._mirror2LastShape){
            b.mirror2PathEl.setAttribute('d', shapeDef.path(cornerRadius));
            b.mirror2PathEl.setAttribute('fill-rule', shapeDef.fillRule || 'nonzero');
            b.mirror2SvgEl.querySelector('filter').setAttribute('id', b.mirror2FilterId);
            b._mirror2LastShape = shapeCacheKey;
          }
          if(b._m2LastBlurUnits !== blurUnitsR){
            b.mirror2FeBlur.setAttribute('stdDeviation', blurUnitsR);
            b.mirror2PathEl.style.filter = Number(blurUnitsR)>0 ? `url(#${b.mirror2FilterId})` : 'none';
            b._m2LastBlurUnits = blurUnitsR;
          }
          const mirror2Alpha = clampedAlpha * mirrorAmt2;
          if(shapeDef.radial){
            const {r,g,b:bl} = App.hexToRgb(color);
            const m2AlphaKey = mirror2Alpha.toFixed(3);
            const m2RadialKey = r+','+g+','+bl+'|'+m2AlphaKey;
            if(b._m2LastRadialKey !== m2RadialKey){
              const m2stops = b.mirror2RadialFill.querySelectorAll('stop');
              m2stops[0].setAttribute('stop-color', `rgba(255,255,255,${(mirror2Alpha*0.95).toFixed(3)})`);
              m2stops[1].setAttribute('stop-color', `rgba(${r},${g},${bl},${(mirror2Alpha*0.85).toFixed(3)})`);
              m2stops[2].setAttribute('stop-color', `rgba(${r},${g},${bl},${(mirror2Alpha*0.35).toFixed(3)})`);
              m2stops[3].setAttribute('stop-color', `rgba(${r},${g},${bl},0)`);
              b._m2LastRadialKey = m2RadialKey;
            }
            if(b._m2LastFillUrl !== b.mirror2RadialId){
              b.mirror2PathEl.setAttribute('fill', `url(#${b.mirror2RadialId})`);
              b._m2LastFillUrl = b.mirror2RadialId;
            }
          } else {
            const m2FillStr = App.rgbaFromHex(color, mirror2Alpha);
            if(b._m2LastFill !== m2FillStr){
              b.mirror2PathEl.setAttribute('fill', m2FillStr);
              b._m2LastFill = m2FillStr;
            }
          }
        } else if(b.mirror2WrapEl.style.display !== 'none'){
          b.mirror2WrapEl.style.display = 'none';
        }
      });
      if(trailCanvasReady){
        App.TrailFx.updateAndDrawSparkles(dt||0.016, now);
        App.TrailFx.endFrame();
      }
      App.FxEngine.update(dt, this._flashEnv);
    }
  });
})(window.Aurora);

// ── background/renderer-update-layer-beat-cut ──
(function(App){
  App.addParts("BgReact", {
_updateLayerBeatCut(layerIdx, layer, dt){
      if(this._beatCutFrameToken === undefined) this._beatCutFrameToken = {};
      if(this._beatCutFrameToken[layerIdx] === this._frameToken){
        const st = this._layerBeatCut[layerIdx];
        return st ? st.opacityMult : 1;
      }
      this._beatCutFrameToken[layerIdx] = this._frameToken;
      if(!layer.beatCutEnabled){
        delete this._layerBeatCut[layerIdx];
        return 1;
      }
      let st = this._layerBeatCut[layerIdx];
      if(!st){
        st = { sustainTimer: 0, isSustained: false, lastPulse: 0, fallbackPhase: 0, cutElapsed: -1, opacityMult: 1 };
        this._layerBeatCut[layerIdx] = st;
      }
      const dtSafe = dt || 0.016;
      const loud = App.state.isPlaying ? (App.MusicSense.data.loudnessPct || 0) : 0;
      const threshold = Math.max(0, Math.min(100, typeof layer.beatCutThreshold === 'number' ? layer.beatCutThreshold : 97));
      if(loud >= threshold){
        st.sustainTimer += dtSafe;
      } else {
        st.sustainTimer = 0;
      }
      const sustainSec = Math.max(0.05, typeof layer.beatCutSustainSec === 'number' ? layer.beatCutSustainSec : 1.2);
      st.isSustained = st.sustainTimer >= sustainSec;
      const durationMs = Math.max(20, typeof layer.beatCutDuration === 'number' ? layer.beatCutDuration : 90);
      if(st.isSustained){
        const confidence = App.MusicSense.data.tempoConfidence || 0;
        const minConfidence = Math.max(0, Math.min(1, typeof layer.beatCutMinConfidence === 'number' ? layer.beatCutMinConfidence : 0.35));
        const trustBeat = confidence >= minConfidence && App.MusicSense.data.bpm > 0;
        let pulseNow;
        if(trustBeat){
          pulseNow = App.MusicSense.data.beatPulse || 0;
        } else {
          const bpm = Math.max(20, typeof layer.beatCutFallbackBpm === 'number' ? layer.beatCutFallbackBpm : 120);
          const period = 60 / bpm;
          st.fallbackPhase += dtSafe;
          if(st.fallbackPhase >= period) st.fallbackPhase -= period * Math.floor(st.fallbackPhase/period);
          const phaseFrac = st.fallbackPhase / period;
          pulseNow = Math.exp(-phaseFrac * 10);
        }
        if(pulseNow > 0.5 && st.lastPulse <= 0.5){
          st.cutElapsed = 0;
        }
        st.lastPulse = pulseNow;
      } else {
        st.fallbackPhase = 0;
        st.lastPulse = 0;
      }
      let darken = 0;
      if(st.cutElapsed >= 0){
        const darkness = Math.max(0, Math.min(1, typeof layer.beatCutDarkness === 'number' ? layer.beatCutDarkness : 0.7));
        const t = Math.max(0, Math.min(1, st.cutElapsed / durationMs));
        const attackFrac = 0.2;
        const envelope = t <= attackFrac ? (t/attackFrac) : (1 - (t-attackFrac)/(1-attackFrac));
        darken = envelope * darkness;
        st.cutElapsed += dtSafe * 1000;
        if(st.cutElapsed >= durationMs) st.cutElapsed = -1;
      }
      st.opacityMult = Math.max(0, Math.min(1, 1 - darken));
      return st.opacityMult;
    }
  });
})(window.Aurora);

// ── background/curve-math ──
(function(App){
  App.define("background/curve-math", function initialize(){
App.CurveMath = {
    _fullPoints(points){
      const cache=this._pointCache||(this._pointCache=new WeakMap());
      const previous=cache.get(points);
      let unchanged=!!previous&&previous.values.length===points.length*2;
      for(let i=0;unchanged&&i<points.length;i++)unchanged=previous.values[i*2]===points[i].x&&previous.values[i*2+1]===points[i].y;
      if(unchanged)return previous.full;
      const values=new Float64Array(points.length*2);
      for(let i=0;i<points.length;i++){values[i*2]=points[i].x;values[i*2+1]=points[i].y;}
      const sorted=points.slice().sort((a,b)=>a.x-b.x);
      const full=[{x:0,y:0},...sorted,{x:1,y:1}];cache.set(points,{values,full});return full;
    },
    _segmentEval(pts, i, t){
      const p0 = pts[Math.max(0, i-1)];
      const p1 = pts[i];
      const p2 = pts[i+1];
      const p3 = pts[Math.min(pts.length-1, i+2)];
      const t2 = t*t, t3 = t2*t;
      const m1 = (p2.y - p0.y) * 0.5;
      const m2 = (p3.y - p1.y) * 0.5;
      const h00 = 2*t3 - 3*t2 + 1;
      const h10 = t3 - 2*t2 + t;
      const h01 = -2*t3 + 3*t2;
      const h11 = t3 - t2;
      return h00*p1.y + h10*m1 + h01*p2.y + h11*m2;
    },
    evaluate(points, x){
      const pts = this._fullPoints(points);
      if(x <= pts[0].x){
        const slope = this._localSlope(pts, 0);
        return pts[0].y + (x - pts[0].x) * slope;
      }
      const last = pts.length - 1;
      if(x >= pts[last].x){
        const slope = this._localSlope(pts, last-1);
        return pts[last].y + (x - pts[last].x) * slope;
      }
      for(let i=0;i<last;i++){
        if(x >= pts[i].x && x <= pts[i+1].x){
          const span = Math.max(1e-6, pts[i+1].x - pts[i].x);
          const t = (x - pts[i].x) / span;
          return this._segmentEval(pts, i, t);
        }
      }
      return x;
    },
    _localSlope(pts, segIdx){
      const a = pts[segIdx], b = pts[segIdx+1];
      const dx = Math.max(1e-6, b.x - a.x);
      const y0 = this._segmentEval(pts, segIdx, 0);
      const y1 = this._segmentEval(pts, segIdx, 0.02);
      return (y1 - y0) / (0.02*dx);
    },
    clampPointX(points, index, x){
      const MIN_GAP = 0.04;
      const loBound = index === 0 ? MIN_GAP : points[index-1].x + MIN_GAP;
      const hiBound = index === points.length-1 ? 1-MIN_GAP : points[index+1].x - MIN_GAP;
      return Math.max(loBound, Math.min(hiBound, x));
    }
  };
  }, ["CurveMath"]);
})(window.Aurora);

// ── background/mapping-engine ──
(function(App){
App.computeTempoSpeedMult = function computeTempoSpeedMult(map){
    if(!map || !map.tempoSync) return 1;
    App.ensureTempoSyncDefaults(map);
    const bpm = Math.max(0, App.MusicSense.data.bpm || 0);
    const bpmLo = Math.min(map.tempoBpmMin, map.tempoBpmMax);
    const bpmHi = Math.max(map.tempoBpmMin, map.tempoBpmMax);
    const multLo = Math.min(map.tempoMultMin, map.tempoMultMax);
    const multHi = Math.max(map.tempoMultMin, map.tempoMultMax);
    const t = App.clamp01((bpm - bpmLo) / Math.max(bpmHi - bpmLo, 1e-6));
    const baseMult = multLo + (multHi - multLo) * t;
    const sens = Math.max(0, map.tempoSens);
    return 1 + (baseMult - 1) * sens;
  };
App.applyTempoSpeedMult = function applyTempoSpeedMult(map, speedDrv){
    return speedDrv * App.computeTempoSpeedMult(map);
  };
  App.define("background/mapping-engine", function initialize(){
App.MappingEngine = {
    _boostSmooth: {},
    _boostLastT: {},
    _valueSmooth: {},
    _valueLastT: {},
    resolve(settingKey){
      return this.resolveMap(App.settings[settingKey], settingKey);
    },
    resolveMap(map, cacheKey){
      if(!map || !map.enabled) return 0;
      const divisor = Math.max(0.0001, App.settings.bgSensDivisor);
      const raw = App.MusicSenseRegistry.rawValue(map.source);
      const meta = App.MusicSenseRegistry.byKey(map.source);
      let dLo, dHi;
      if(meta.fixedDomain || !map.normalize){
        [dLo, dHi] = meta.domain;
      } else {
        dLo = map.normMin;
        dHi = map.normMax;
      }
      let norm = (raw - dLo) / Math.max(dHi - dLo, 1e-6);
      if(map.clamp){
        const lo = Math.min(map.clampMin, map.clampMax);
        const hi = Math.max(map.clampMin, map.clampMax);
        norm = Math.max(lo, Math.min(hi, norm));
      }
      norm = this._applyBoost(cacheKey, map, norm);
      const curved = this._applyCurve(norm, map.curvePoints);
      const shaped = curved * Math.max(dHi - dLo, 1e-6);
      const result = shaped * (map.sensitivity / divisor);
      return this._applySmoothValue(cacheKey, map, result);
    },
    _applySmoothValue(cacheKey, map, value){
      const amount = Math.max(0, Math.min(1, map.smoothAmount || 0));
      if(amount <= 0.0001){
        delete this._valueSmooth[cacheKey];
        delete this._valueLastT[cacheKey];
        return value;
      }
      const now = performance.now();
      const lastT = this._valueLastT[cacheKey] || now;
      const dt = Math.max(0, Math.min(0.25, (now - lastT)/1000));
      this._valueLastT[cacheKey] = now;
      const prev = (this._valueSmooth[cacheKey] !== undefined) ? this._valueSmooth[cacheKey] : value;
      const tau = 0.02 + amount * 1.18;
      const k = dt > 0 ? (1 - Math.exp(-dt/tau)) : 0;
      const next = prev + (value - prev) * k;
      this._valueSmooth[cacheKey] = next;
      return next;
    },
    _applyCurve(norm, curvePoints){
      const pts = (Array.isArray(curvePoints) && curvePoints.length) ? curvePoints : null;
      if(!pts) return norm;
      return App.CurveMath.evaluate(pts, norm);
    },
    _applyBoost(cacheKey, map, norm){
      if(!map.boost) return norm;
      const threshold = Math.max(0, Math.min(0.98, map.boostThreshold));
      const amount = Math.max(0, map.boostAmount);
      const span = Math.max(1e-6, 1 - threshold);
      const t = (norm - threshold) / span;
      const tClamped = Math.max(0, Math.min(1, t));
      const eased = tClamped*tClamped*(3 - 2*tClamped);
      const targetProgress = t > 1 ? eased + (t - 1) : eased;
      const now = performance.now();
      const lastT = this._boostLastT[cacheKey] || now;
      const dt = Math.max(0, Math.min(0.25, (now - lastT)/1000));
      this._boostLastT[cacheKey] = now;
      const prev = this._boostSmooth[cacheKey] || 0;
      const attack = 0.12, release = 0.5;
      let next;
      if(dt <= 0){
        next = prev;
      } else if(targetProgress > prev){
        const k = 1 - Math.exp(-dt/attack);
        next = prev + (targetProgress - prev) * k;
      } else {
        const k = 1 - Math.exp(-dt/release);
        next = prev + (targetProgress - prev) * k;
      }
      this._boostSmooth[cacheKey] = next;
      return norm + next * amount;
    }
  };
  }, ["MappingEngine","computeTempoSpeedMult","applyTempoSpeedMult"]);
})(window.Aurora);

// ── background/shapes ──
(function(App){
App.roundedRectPath = function roundedRectPath(x,y,w,h,r){
    return `M${x+r},${y} H${x+w-r} A${r},${r} 0 0 1 ${x+w},${y+r} V${y+h-r} A${r},${r} 0 0 1 ${x+w-r},${y+h} H${x+r} A${r},${r} 0 0 1 ${x},${y+h-r} V${y+r} A${r},${r} 0 0 1 ${x+r},${y} Z`;
  };
App.starPoints = function starPoints(cx,cy,outerR,innerR,points,rotDeg){
    const rot = rotDeg * Math.PI/180;
    const pts = [];
    for(let i=0;i<points*2;i++){
      const r = i%2===0 ? outerR : innerR;
      const ang = rot + i*Math.PI/points;
      pts.push([cx + Math.cos(ang)*r, cy + Math.sin(ang)*r]);
    }
    return pts;
  };
App.roundPolygonPath = function roundPolygonPath(points, radius){
    const amount = Math.max(0, Math.min(1, radius || 0));
    if(amount <= 0.001){
      let d = '';
      points.forEach((p,i)=>{ d += (i===0 ? 'M' : 'L') + p[0].toFixed(2) + ',' + p[1].toFixed(2) + ' '; });
      return d + 'Z';
    }
    const n = points.length;
    const edgeLen = (a,b) => Math.hypot(b[0]-a[0], b[1]-a[1]);
    const lerp = (a,b,t) => [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t];
    const MAX_BITE_FRAC = 0.45;
    let d = '';
    for(let i=0;i<n;i++){
      const prev = points[(i-1+n)%n];
      const curr = points[i];
      const next = points[(i+1)%n];
      const lenIn = edgeLen(prev, curr);
      const lenOut = edgeLen(curr, next);
      const biteIn = Math.min(lenIn*MAX_BITE_FRAC, lenIn*0.5*amount);
      const biteOut = Math.min(lenOut*MAX_BITE_FRAC, lenOut*0.5*amount);
      const tIn = lenIn > 1e-6 ? Math.min(0.999, biteIn/lenIn) : 0;
      const tOut = lenOut > 1e-6 ? Math.min(0.999, biteOut/lenOut) : 0;
      const startPt = lerp(curr, prev, tIn);
      const endPt = lerp(curr, next, tOut);
      if(i===0){
        d += `M${startPt[0].toFixed(2)},${startPt[1].toFixed(2)} `;
      } else {
        d += `L${startPt[0].toFixed(2)},${startPt[1].toFixed(2)} `;
      }
      d += `Q${curr[0].toFixed(2)},${curr[1].toFixed(2)} ${endPt[0].toFixed(2)},${endPt[1].toFixed(2)} `;
    }
    return d + 'Z';
  };
  App.define("background/shapes", function initialize(){
App.BlobShapes = {
    circle: {
      label: 'Kruh',
      path: () => `M50,4 A46,46 0 1 1 49.99,4 Z`
    },
    square: {
      label: 'Čtverec',
      path: (radius) => App.roundedRectPath(8, 8, 84, 84, 10 + Math.max(0,Math.min(1,radius||0))*32)
    },
    diamond: {
      label: 'Diamant',
      supportsRounding: true,
      path: (radius) => App.roundPolygonPath([[50,2],[98,50],[50,98],[2,50]], radius)
    },
    hexagon: {
      label: 'Hexagon',
      supportsRounding: true,
      path: (radius) => App.roundPolygonPath([[27,4],[73,4],[98,50],[73,96],[27,96],[2,50]], radius)
    },
    star: {
      label: 'Hvězda',
      supportsRounding: true,
      path: (radius) => App.roundPolygonPath(App.starPoints(50,50, 48, 20, 5, -90), radius)
    },
    crosshair: {
      label: 'Crosshair',
      supportsRounding: true,
      path: (radius) => App.roundPolygonPath([[42,2],[58,2],[58,42],[98,42],[98,58],[58,58],[58,98],[42,98],[42,58],[2,58],[2,42],[42,42]], radius)
    },
    ring: {
      label: 'Prstenec',
      path: () => `M50,4 A46,46 0 1 1 49.99,4 Z M50,26 A24,24 0 1 0 50.01,26 Z`,
      fillRule: 'evenodd'
    },
    blob: {
      label: 'Organický',
      path: () => `M50,6 C68,4 92,20 94,42 C96,64 84,82 62,92 C40,101 14,90 6,68 C-2,46 8,20 28,10 C35,7 43,7 50,6 Z`
    },
    lensflare: {
      label: 'Lens flare',
      path: () => `M50,4 A46,46 0 1 1 49.99,4 Z`,
      radial: true
    },
  };
  }, ["BlobShapes","roundedRectPath","starPoints","roundPolygonPath"]);
})(window.Aurora);

// ── background/motion-paths ──
(function(App){
App.edgeFade = function edgeFade(t){
    const f = App.SPAWN_FADE_FRACTION;
    if(t < f) return t/f;
    if(t > 1-f) return (1-t)/f;
    return 1;
  };
App.resolveMotionPath = function resolveMotionPath(key){
    return App.MotionPaths[key] || App.MotionPaths.random;
  };
  App.define("background/motion-paths", function initialize(){
App.SVG_NS = 'http://www.w3.org/2000/svg';
App.MAX_BG_LAYERS = 4;
App.RESPAWN_MARGIN = 0.16;
App.SPAWN_FADE_FRACTION = 0.16;
App.PATH_TRAVEL_RATE = 0.09;
App.ORBIT_RATE = 0.35;
App.MotionPaths = {
    random: {
      label: 'Náhodně (drift)',
      step(b, driftSpeed, dt){
        b.phase += (0.002 + driftSpeed*0.01) * dt * 120;
        const step = driftSpeed * 0.0006 * dt * 120;
        b.x += b.dirX * step;
        b.y += b.dirY * step;
        if(b.x < -0.15 || b.x > 1.15) b.dirX *= -1;
        if(b.y < -0.15 || b.y > 1.15) b.dirY *= -1;
        b.x = Math.max(-0.15, Math.min(1.15, b.x));
        b.y = Math.max(-0.15, Math.min(1.15, b.y));
        const wobbleX = driftSpeed>0 ? Math.sin(b.phase)*0.02 : 0;
        const wobbleY = driftSpeed>0 ? Math.cos(b.phase*0.8)*0.02 : 0;
        return { px: b.x+wobbleX, py: b.y+wobbleY, fade: 1 };
      }
    },
    fall: {
      label: 'Padání shora',
      step(b, driftSpeed, dt, layer){
        b.phase += (0.002 + driftSpeed*0.01) * dt * 120;
        const span = 1 + App.RESPAWN_MARGIN*2;
        b.along += driftSpeed * App.PATH_TRAVEL_RATE * dt;
        if(b.along > 1 + App.RESPAWN_MARGIN){
          b.along = -App.RESPAWN_MARGIN;
          b.lane = 0.06 + Math.random()*0.88;
        }
        const t = (b.along + App.RESPAWN_MARGIN) / span;
        const swayAmt = typeof (layer && layer.swayAmount) === 'number' ? layer.swayAmount : 0.02;
        const wob = driftSpeed>0 ? Math.sin(b.phase)*swayAmt : 0;
        return { px: b.lane + wob, py: b.along, fade: App.edgeFade(t) };
      }
    },
    rise: {
      label: 'Zdola nahoru',
      step(b, driftSpeed, dt, layer){
        b.phase += (0.002 + driftSpeed*0.01) * dt * 120;
        const span = 1 + App.RESPAWN_MARGIN*2;
        b.along -= driftSpeed * App.PATH_TRAVEL_RATE * dt;
        if(b.along < -App.RESPAWN_MARGIN){
          b.along = 1 + App.RESPAWN_MARGIN;
          b.lane = 0.06 + Math.random()*0.88;
        }
        const t = 1 - (b.along + App.RESPAWN_MARGIN) / span;
        const swayAmt = typeof (layer && layer.swayAmount) === 'number' ? layer.swayAmount : 0.02;
        const wob = driftSpeed>0 ? Math.sin(b.phase)*swayAmt : 0;
        return { px: b.lane + wob, py: b.along, fade: App.edgeFade(t) };
      }
    },
    left: {
      label: 'Zprava doleva',
      step(b, driftSpeed, dt, layer){
        b.phase += (0.002 + driftSpeed*0.01) * dt * 120;
        const span = 1 + App.RESPAWN_MARGIN*2;
        b.along -= driftSpeed * App.PATH_TRAVEL_RATE * dt;
        if(b.along < -App.RESPAWN_MARGIN){
          b.along = 1 + App.RESPAWN_MARGIN;
          b.lane = 0.06 + Math.random()*0.88;
        }
        const t = 1 - (b.along + App.RESPAWN_MARGIN) / span;
        const swayAmt = typeof (layer && layer.swayAmount) === 'number' ? layer.swayAmount : 0.02;
        const wob = driftSpeed>0 ? Math.cos(b.phase*0.8)*swayAmt : 0;
        return { px: b.along, py: b.lane + wob, fade: App.edgeFade(t) };
      }
    },
    right: {
      label: 'Zleva doprava',
      step(b, driftSpeed, dt, layer){
        b.phase += (0.002 + driftSpeed*0.01) * dt * 120;
        const span = 1 + App.RESPAWN_MARGIN*2;
        b.along += driftSpeed * App.PATH_TRAVEL_RATE * dt;
        if(b.along > 1 + App.RESPAWN_MARGIN){
          b.along = -App.RESPAWN_MARGIN;
          b.lane = 0.06 + Math.random()*0.88;
        }
        const t = (b.along + App.RESPAWN_MARGIN) / span;
        const swayAmt = typeof (layer && layer.swayAmount) === 'number' ? layer.swayAmount : 0.02;
        const wob = driftSpeed>0 ? Math.cos(b.phase*0.8)*swayAmt : 0;
        return { px: b.along, py: b.lane + wob, fade: App.edgeFade(t) };
      }
    },
    inward: {
      label: 'Z okrajů do středu',
      step(b, driftSpeed, dt){
        b.phase += (0.002 + driftSpeed*0.01) * dt * 120;
        b.along -= driftSpeed * App.PATH_TRAVEL_RATE * dt;
        if(b.along < 0.02){
          b.along = 1;
          b.lane = Math.random()*Math.PI*2;
        }
        const t = 1 - b.along;
        const r = b.along * 0.62;
        const wob = driftSpeed>0 ? Math.sin(b.phase)*0.01 : 0;
        return { px: 0.5 + Math.cos(b.lane)*(r+wob), py: 0.5 + Math.sin(b.lane)*(r+wob), fade: App.edgeFade(t) };
      }
    },
    outward: {
      label: 'Ze středu ven',
      step(b, driftSpeed, dt){
        b.phase += (0.002 + driftSpeed*0.01) * dt * 120;
        b.along += driftSpeed * App.PATH_TRAVEL_RATE * dt;
        if(b.along > 1){
          b.along = 0.02;
          b.lane = Math.random()*Math.PI*2;
        }
        const t = b.along;
        const r = b.along * 0.62;
        const wob = driftSpeed>0 ? Math.sin(b.phase)*0.01 : 0;
        return { px: 0.5 + Math.cos(b.lane)*(r+wob), py: 0.5 + Math.sin(b.lane)*(r+wob), fade: App.edgeFade(t) };
      }
    },
    orbit: {
      label: 'Orbit kolem středu',
      step(b, driftSpeed, dt){
        b.phase += (0.002 + driftSpeed*0.01) * dt * 120;
        b.orbitAngle += b.orbitDir * driftSpeed * App.ORBIT_RATE * dt;
        const wob = driftSpeed>0 ? Math.sin(b.phase)*0.015 : 0;
        const r = b.orbitRadius + wob;
        return { px: 0.5 + Math.cos(b.orbitAngle)*r, py: 0.5 + Math.sin(b.orbitAngle)*r*0.82, fade: 1 };
      }
    }
  };
  }, ["SVG_NS","MAX_BG_LAYERS","RESPAWN_MARGIN","SPAWN_FADE_FRACTION","PATH_TRAVEL_RATE","ORBIT_RATE","edgeFade","MotionPaths","resolveMotionPath"]);
})(window.Aurora);

// ── background/effects ──
(function(App){
  App.define("background/effects", function initialize(){
App.FxEngine = {
    _baseOpacity: 1,
    _glitchTimer: 0,
    _glitchActiveUntil: 0,
    _vignetteEl: null,
    _scanEl: null,
    _ditherEl: null,
    _glitchContainer: null,
    setBaseOpacity(v){ this._baseOpacity = v; },
    _ensureOverlayNodes(){
      const overlay = App.el('bgFxOverlay');
      if(!this._vignetteEl){
        this._vignetteEl = document.createElement('div');
        this._vignetteEl.className = 'fx-vignette-layer';
        overlay.appendChild(this._vignetteEl);
      }
      if(!this._scanEl){
        this._scanEl = document.createElement('div');
        this._scanEl.className = 'fx-scanline-layer';
        (App.el(App.settings.scanlineTarget==='background'?'sceneBackground':'sceneFinalOverlay')||overlay).appendChild(this._scanEl);
      }
      if(!this._ditherEl){
        this._ditherEl = document.createElement('div');
        this._ditherEl.className = 'fx-dither-layer';
        overlay.appendChild(this._ditherEl);
      }
      if(!this._glitchContainer){
        this._glitchContainer = document.createElement('div');
        this._glitchContainer.style.position = 'absolute';
        this._glitchContainer.style.inset = '0';
        this._glitchContainer.style.pointerEvents = 'none';
        this._glitchContainer.style.overflow = 'hidden';
        overlay.appendChild(this._glitchContainer);
      }
    },
    update(dt, flashEnv){
      this._ensureOverlayNodes();
      dt = dt || 0.016;
      const wrap = App.el('bgGlow');
      const filterParts = [];
      const brightness = typeof App.settings.fxBrightness === 'number' ? App.settings.fxBrightness : 1;
      const contrast = typeof App.settings.fxContrast === 'number' ? App.settings.fxContrast : 1;
      const saturation = typeof App.settings.fxSaturation === 'number' ? App.settings.fxSaturation : 1;
      const hue = typeof App.settings.fxHue === 'number' ? App.settings.fxHue : 0;
      if(brightness !== 1) filterParts.push(`brightness(${brightness})`);
      if(contrast !== 1) filterParts.push(`contrast(${contrast})`);
      if(saturation !== 1) filterParts.push(`saturate(${saturation})`);
      if(hue !== 0) filterParts.push(`hue-rotate(${hue}deg)`);
      wrap.style.filter = filterParts.join(' ');
      const vignetteAmt = Math.max(0, Math.min(1, App.settings.fxVignette || 0));
      this._vignetteEl.style.opacity = String(vignetteAmt);
      const scanAmt = Math.max(0, Math.min(1, App.settings.fxScanlines || 0));
      this._scanEl.style.opacity = String(scanAmt * 0.9);
      if(App.settings.fxGlitchEnabled){
        const freq = Math.max(0.02, Math.min(1, App.settings.fxGlitchFreq ?? 0.4));
        const now = performance.now();
        if(now > this._glitchActiveUntil){
          this._glitchTimer -= dt;
          if(this._glitchTimer <= 0){
            const baseInterval = 1.1 / freq;
            let willFire = true;
            if(App.settings.fxGlitchOnBeat){
              const chance = 0.15 + (flashEnv || 0) * 0.85;
              willFire = Math.random() < chance;
            }
            if(willFire){
              const duration = Math.max(60, App.settings.fxGlitchDuration || 180);
              this._fireGlitchBurst(duration);
              this._glitchActiveUntil = now + duration;
            }
            this._glitchTimer = baseInterval * (0.6 + Math.random()*0.8);
          }
        }
      } else if(this._glitchContainer && this._glitchContainer.childNodes.length){
        this._glitchContainer.innerHTML = '';
        this._glitchActiveUntil = 0;
      }
      if(this._glitchContainer && this._glitchContainer.childNodes.length && performance.now() > this._glitchActiveUntil){
        this._glitchContainer.innerHTML = '';
      }
    },
    _fireGlitchBurst(durationMs){
      const container = this._glitchContainer;
      container.innerHTML = '';
      const source = App.el('bgGlow');
      if(!source) return;
      const amount = Math.max(1, App.settings.fxGlitchAmount || 28);
      const sliceCount = 3 + Math.floor(Math.random()*4);
      let cursor = 0;
      const bands = [];
      for(let i=0;i<sliceCount;i++){
        const remaining = sliceCount - i;
        const maxSpan = (100 - cursor) - (remaining-1)*2;
        const span = i === sliceCount-1 ? (100 - cursor) : Math.max(2, Math.random()*Math.max(2,maxSpan/remaining)*1.8);
        bands.push([cursor, Math.min(100, cursor+span)]);
        cursor = Math.min(100, cursor+span);
      }
      bands.forEach(([topPct, bottomPct], i)=>{
        const dir = (i % 2 === 0) ? 1 : -1;
        const offsetPx = dir * (amount * (0.4 + Math.random()*0.9));
        const clone = source.cloneNode(true);
        clone.removeAttribute('id');
        const cloneCanvas = clone.querySelector('#bgTrailCanvas');
        if(cloneCanvas) cloneCanvas.remove();
        clone.style.position = 'absolute';
        clone.style.inset = '0';
        clone.style.opacity = source.style.opacity || '1';
        clone.style.filter = '';
        clone.style.clipPath = `inset(${topPct}% 0 ${100-bottomPct}% 0)`;
        clone.style.transform = `translateX(${offsetPx.toFixed(1)}px)`;
        clone.style.willChange = 'transform';
        container.appendChild(clone);
        const ghostR = clone.cloneNode(true);
        ghostR.style.transform = `translateX(${(offsetPx*1.4 + 3).toFixed(1)}px)`;
        ghostR.style.mixBlendMode = 'screen';
        ghostR.style.filter = 'sepia(1) saturate(6) hue-rotate(-50deg) brightness(1.1)';
        ghostR.style.opacity = '0.55';
        container.appendChild(ghostR);
        const ghostC = clone.cloneNode(true);
        ghostC.style.transform = `translateX(${(offsetPx*1.4 - 3).toFixed(1)}px)`;
        ghostC.style.mixBlendMode = 'screen';
        ghostC.style.filter = 'sepia(1) saturate(6) hue-rotate(140deg) brightness(1.1)';
        ghostC.style.opacity = '0.55';
        container.appendChild(ghostC);
      });
      const glintCount = 1 + Math.floor(Math.random()*2);
      for(let i=0;i<glintCount;i++){
        const topPct = Math.random()*100;
        const glint = document.createElement('div');
        glint.className = 'fx-glitch-slice';
        glint.style.top = topPct + '%';
        glint.style.height = (0.4 + Math.random()*1.2) + '%';
        glint.style.background = 'rgba(255,255,255,0.5)';
        glint.style.opacity = '0.7';
        container.appendChild(glint);
      }
    }
  };
  }, ["FxEngine"]);
})(window.Aurora);

// ── background/trails-sparkles ──
(function(App){
App.getTrailPath2D = function getTrailPath2D(shapeKey, cornerRadius){
    const radius = Math.max(0, Math.min(1, cornerRadius||0));
    const cacheKey = shapeKey + '|' + radius.toFixed(2);
    if(App._trailPathCache[cacheKey]) return App._trailPathCache[cacheKey];
    const def = App.BlobShapes[shapeKey] || App.BlobShapes.circle;
    try { App._trailPathCache[cacheKey] = new Path2D(def.path(radius)); } catch(e){ App._trailPathCache[cacheKey] = new Path2D(App.BlobShapes.circle.path()); }
    return App._trailPathCache[cacheKey];
  };
  App.define("background/trails-sparkles", function initialize(){
App._trailPathCache = {};
App.TrailFx = {
    _canvas: null, _ctx: null,
    _lastW: 0, _lastH: 0,
    _particles: [],
    _blobAccum: new WeakMap(),
    _wasActive: false,
    release(){
      if(this._canvas&&(this._canvas.width!==1||this._canvas.height!==1))this._canvas.width=this._canvas.height=1;
      this._particles.length=0;this._wasActive=false;this._lastW=0;this._lastH=0;
    },
    ensure(){
      if(this._canvas) return;
      this._canvas = App.el('bgTrailCanvas');
      this._ctx = this._canvas ? this._canvas.getContext('2d') : null;
    },
    resize(w, h){
      this.ensure();
      if(!this._canvas) return;
      const dpr = App.scenePixelRatio(w,h);
      const cw = Math.round(w*dpr), ch = Math.round(h*dpr);
      if(this._canvas.width !== cw || this._canvas.height !== ch){
        this._canvas.width = cw;
        this._canvas.height = ch;
      }
      this._lastW = w; this._lastH = h;
    },
    beginFrame(w, h, anyTrailsActive, anySparklesActive){
      this.ensure();
      if(!this._ctx) return false;
      const nowActive = anyTrailsActive || anySparklesActive;
      if(!nowActive){
        this.release();
        return false;
      }
      if(w !== this._lastW || h !== this._lastH) this.resize(w, h);
      this._wasActive = true;
      const ctx = this._ctx;
      const dpr = App.scenePixelRatio(w,h);
      const cw = this._canvas.width, ch = this._canvas.height;
      ctx.save();
      ctx.setTransform(1,0,0,1,0,0);
      ctx.clearRect(0,0,cw,ch);
      ctx.restore();
      ctx.save();
      ctx.scale(dpr, dpr);
      return true;
    },
    endFrame(){
      if(this._ctx) this._ctx.restore();
    },
    drawTrail(b, px, py, size, color, alpha, lengthSec, sizeMult, nowMs, shapeKey, rotationDeg, cornerRadius){
      if(!this._ctx) return;
      const hist=b._trailHist || (b._trailHist=[]);
      const fade=Math.max(.02,Math.min(.6,App.settings.trailFadeRate));
      const decayMs=-1000/(60*Math.log(1-fade));
      lengthSec=Math.max(0,Math.min(30,Number(lengthSec)||0));
      const lifetime=lengthSec*1000+Math.min(2500,decayMs*4);
      if(!hist.length || nowMs-hist[hist.length-1].t>=Math.max(16,lifetime/128)){
        hist.push({x:px,y:py,t:nowMs,rot:rotationDeg||0,size:size*Math.max(.1,Math.min(3,Number.isFinite(sizeMult)?sizeMult:1.05)),color,alpha,shape:shapeKey||'circle',radius:cornerRadius});
      }
      while(hist.length && (hist.length>128||nowMs-hist[0].t>=lifetime))hist.shift();
      const ctx=this._ctx;
      const count=Math.min(hist.length,48,Math.max(1,Math.floor(4096/Math.max(1,App.BgReact.blobs?.length||1))));
      for(let sample=0;sample<count;sample++){
        const pt=hist[count===1?hist.length-1:Math.round(sample*(hist.length-1)/(count-1))];
        const age=nowMs-pt.t;
        const fadeAge=Math.max(0,age-lengthSec*1000);
        const strength=Math.exp(-fadeAge/decayMs)*Math.max(0,1-age/lifetime);
        const stampSize=pt.size*(.55+.45*strength);
        if(stampSize<.5 || pt.alpha*strength<.001)continue;
        ctx.save();ctx.translate(pt.x,pt.y);ctx.rotate(pt.rot*Math.PI/180);
        ctx.scale(stampSize/100,stampSize/100);ctx.translate(-50,-50);
        ctx.globalAlpha=Math.max(0,Math.min(1,pt.alpha*strength*.45));ctx.fillStyle=pt.color;
        ctx.fill(App.getTrailPath2D(pt.shape,pt.radius),(App.BlobShapes[pt.shape]||App.BlobShapes.circle).fillRule||'nonzero');
        ctx.restore();
      }
    },
    spawnSparkle(blobRef, px, py, size, color, dt, flashEnv){
      let accum = this._blobAccum.get(blobRef) || 0;
      const rate = Math.max(0, App.settings.sparklesRate) * (0.4 + flashEnv * 1.6);
      accum += rate * dt;
      while(accum >= 1){
        accum -= 1;
        if(Math.random() > 0.6) continue;
        const ang = Math.random() * Math.PI * 2;
        const dist = size * (0.12 + Math.random() * 0.30);
        const life = Math.max(0.15, App.settings.sparklesLife) * (0.7 + Math.random() * 0.6);
        const speed = dist / life;
        this._particles.push({
          x: px + Math.cos(ang) * dist * 0.25,
          y: py + Math.sin(ang) * dist * 0.25,
          vx: Math.cos(ang) * speed * 0.7,
          vy: Math.sin(ang) * speed * 0.7,
          born: performance.now(),
          life: life * 1000,
          size: Math.max(0.8, 3.5 * Math.max(0.2, App.settings.sparklesSize) * (0.5 + Math.random() * 0.8)),
          color
        });
      }
      this._blobAccum.set(blobRef, accum);
      const MAX_PARTICLES = 500;
      if(this._particles.length > MAX_PARTICLES){
        this._particles.splice(0, this._particles.length - MAX_PARTICLES);
      }
    },
    updateAndDrawSparkles(dt, nowMs){
      if(!this._ctx || !this._particles.length) return;
      const ctx = this._ctx;
      const alive = [];
      for(let i=0;i<this._particles.length;i++){
        const p = this._particles[i];
        const age = nowMs - p.born;
        if(age >= p.life) continue;
        p.x += p.vx*dt;
        p.y += p.vy*dt;
        const t = age/p.life;
        const fade = t < 0.15 ? (t/0.15) : (1 - (t-0.15)/0.85);
        const {r,g,b:bl} = App.hexToRgb(p.color);
        const alpha = Math.max(0, Math.min(1, fade));
        if(alpha > 0.01){
          const r2 = p.size * (0.6 + fade*0.5);
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = `rgb(${r},${g},${bl})`;
          ctx.lineWidth = Math.max(0.4, r2*0.22);
          ctx.beginPath();
          ctx.moveTo(-r2,0); ctx.lineTo(r2,0);
          ctx.moveTo(0,-r2); ctx.lineTo(0,r2);
          ctx.stroke();
          ctx.beginPath();
          ctx.fillStyle = `rgb(255,255,255)`;
          ctx.globalAlpha = alpha*0.9;
          ctx.arc(0,0,Math.max(0.4,r2*0.28),0,Math.PI*2);
          ctx.fill();
          ctx.restore();
        }
        alive.push(p);
      }
      this._particles = alive;
    }
  };
  }, ["_trailPathCache","getTrailPath2D","TrailFx"]);
})(window.Aurora);

// ── background/renderer ──
(function(App){
  App.define("background/renderer", function initialize(){
App.BgReact = {
blobs: null,
_layerSignature: '',
_lastTime: 0,
_flashEnv: 0,
_hueAccum: 0,
_layerFlashEnv: {},
_layerHueAccum: {},
_layerHueFrameToken: {},
_layerFlashFrameToken: {},
_frameToken: 0,
_layerBeatCut: {},
_signature: App.parts["BgReact"]._signature,
ensure: App.parts["BgReact"].ensure,
update: App.parts["BgReact"].update,
_updateLayerBeatCut: App.parts["BgReact"]._updateLayerBeatCut
};
  }, ["BgReact"]);
})(window.Aurora);

// ── background/player-colors ──
(function(App){
App.hexToRgb = function hexToRgb(hex){
    const h = hex.replace('#','');
    const bigint = parseInt(h,16);
    return { r:(bigint>>16)&255, g:(bigint>>8)&255, b:bigint&255 };
  };
App.rgbaFromHex = function rgbaFromHex(hex, a){
    const {r,g,b} = App.hexToRgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  };
App.hslToHex = function hslToHex(h,s,l){
    s/=100; l/=100;
    const k = n => (n + h/30) % 12;
    const a = s * Math.min(l, 1-l);
    const f = n => l - a*Math.max(-1, Math.min(k(n)-3, Math.min(9-k(n),1)));
    const toHex = x => Math.round(255*x).toString(16).padStart(2,'0');
    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
  };
  App.define("background/player-colors", function initialize(){
App.PlayerColors = {
    _hueFrom: 0, _hueTo: 0, _hueAt: 0, _hueDuration: 100,
    displayHue(now = performance.now()){
      if(!this._hueAt) return App.BgReact._hueAccum;
      const t = Math.min(1, Math.max(0, (now-this._hueAt)/this._hueDuration));
      return this._hueFrom + (this._hueTo-this._hueFrom)*t;
    },
    receiveHue(hue){
      const now = performance.now();
      this._hueFrom = this._hueAt ? this.displayHue(now) : hue;
      this._hueDuration = this._hueAt ? Math.max(16, Math.min(250, now-this._hueAt)) : 100;
      this._hueTo = hue; this._hueAt = now;
    },
    _lastC1: null, _lastC2: null,
    _lastC1Thumb: null, _lastC2Thumb: null,
    _lastC1Play: null, _lastC2Play: null,
    _lastC1Gear: null, _lastC2Gear: null,
    _lastC1Scanline: null, _lastC2Scanline: null,
    _paletteStyle: null,
    _writeColors(changes){
      if(!changes.length)return;
      if(!this._paletteStyle){
        // Mutating inherited inline variables on <html> retained huge amounts of
        // native style data in Chromium during playback. Update one CSS rule
        // instead: stylesheet invalidation releases those obsolete style entries.
        // Keep the same palette and full-rate color synchronization.
        let selector=':root';
        if(window.CSS?.registerProperty){
          // Only actual color consumers need these values. Non-inherited typed
          // properties avoid restyling thousands of unrelated/hidden controls.
          // Derive the consumers from our CSS, including pseudo-elements, so
          // new controls and responsive rules keep working without a DOM cache.
          const consumers=new Set();
          const visit=rules=>{for(const rule of rules){
            if(rule.selectorText&&rule.style&&/var\(\s*--player-c[12](?:\b|-)/.test(rule.style.cssText))consumers.add(rule.selectorText);
            if(rule.cssRules)visit(rule.cssRules);
          }};
          for(const sheet of document.styleSheets)try{visit(sheet.cssRules);}catch{/* Cross-origin font styles do not contain our palette. */}
          if(consumers.size){
            for(const suffix of ['','-thumb','-play','-gear','-scanline'])for(const i of [1,2])window.CSS.registerProperty({
              name:'--player-c'+i+suffix,syntax:'<color>',inherits:false,
              initialValue:suffix==='-scanline'?'#ffffff':i===1?'#ff2ec4':'#7c3aed'
            });
            selector=[...consumers].join(',');
          }
        }
        const sheet=document.createElement('style');
        sheet.id='aurora-live-palette';document.head.appendChild(sheet);
        sheet.sheet.insertRule(selector+' {}');
        this._paletteStyle=sheet.sheet.cssRules[0].style;
      }
      for(const [key,value] of changes)this._paletteStyle.setProperty(key,value);
    },
    update(){
      const changes=[];
      const writeColor=(key,value)=>changes.push([key,value]);
      // The empty player uses its configured MusicViz palette; hue sync starts with music.
      const syncActive = App.settings.playerColorSync && App.settings.bgMapColorSpeed.enabled && App.state?.tracks?.length > 0;
      let c1, c2;
      if(syncActive){
        const hue = (App.Threads.backgroundActive ? this.displayHue() : App.BgReact._hueAccum) % 360;
        c1 = App.hslToHex(hue, 80, 60);
        c2 = App.hslToHex((hue+40) % 360, 80, 55);
      } else {
        c1 = App.settings.playerColor1;
        c2 = App.settings.playerColor2;
      }
      const fixed1 = App.settings.playerColor1;
      const fixed2 = App.settings.playerColor2;
      const thumbC1 = (syncActive && !App.settings.playerSyncThumbs) ? fixed1 : c1;
      const thumbC2 = (syncActive && !App.settings.playerSyncThumbs) ? fixed2 : c2;
      const playC1 = (syncActive && !App.settings.playerSyncPlayBtn) ? fixed1 : c1;
      const playC2 = (syncActive && !App.settings.playerSyncPlayBtn) ? fixed2 : c2;
      const gearC1 = (syncActive && !App.settings.playerSyncGear) ? fixed1 : c1;
      const gearC2 = (syncActive && !App.settings.playerSyncGear) ? fixed2 : c2;
      const scanlineC1 = (syncActive && App.settings.playerSyncScanline) ? c1 : '#ffffff';
      const scanlineC2 = (syncActive && App.settings.playerSyncScanline) ? c2 : '#ffffff';
      if(c1 !== this._lastC1 || c2 !== this._lastC2){
        writeColor('--player-c1', c1);
        writeColor('--player-c2', c2);
        this._lastC1 = c1; this._lastC2 = c2;
      }
      if(thumbC1 !== this._lastC1Thumb || thumbC2 !== this._lastC2Thumb){
        writeColor('--player-c1-thumb', thumbC1);
        writeColor('--player-c2-thumb', thumbC2);
        this._lastC1Thumb = thumbC1; this._lastC2Thumb = thumbC2;
      }
      if(playC1 !== this._lastC1Play || playC2 !== this._lastC2Play){
        writeColor('--player-c1-play', playC1);
        writeColor('--player-c2-play', playC2);
        this._lastC1Play = playC1; this._lastC2Play = playC2;
      }
      if(gearC1 !== this._lastC1Gear || gearC2 !== this._lastC2Gear){
        writeColor('--player-c1-gear', gearC1);
        writeColor('--player-c2-gear', gearC2);
        this._lastC1Gear = gearC1; this._lastC2Gear = gearC2;
      }
      if(scanlineC1 !== this._lastC1Scanline || scanlineC2 !== this._lastC2Scanline){
        writeColor('--player-c1-scanline', scanlineC1);
        writeColor('--player-c2-scanline', scanlineC2);
        this._lastC1Scanline = scanlineC1; this._lastC2Scanline = scanlineC2;
      }
      this._writeColors(changes);
    }
  };
  }, ["hexToRgb","rgbaFromHex","hslToHex","PlayerColors"]);
})(window.Aurora);

// ── background/render-loop ──
(function(App){
App.bgLoop = function bgLoop(ts){
    App.bgAnimId = 0;
    if(!App.VisualRenderState.active) return;
    App.PerfDebug.beginFrame();
    App.PerfDebug.mark('bgreact');
    const budget=1000/Math.max(15,Math.min(240,Number(App.settings.renderFps)||120));
    const paint=ts+.15>=(App._bgNextFrame||0);
    if(paint)App._bgNextFrame=App._bgNextFrame?App._bgNextFrame+budget*(1+Math.floor(Math.max(0,ts-App._bgNextFrame)/budget)):ts+budget;
    if(paint&&!App.Threads?.backgroundActive) App.BgReact.update();
    App.PerfDebug.mark('playercolors');
    App.PlayerColors.update();
    App.PerfDebug.mark('spectrogram');
    if(paint&&!App.Threads?.spectrumActive) App.Spectrogram.update();
    App.PerfDebug.endFrame();
    App.bgAnimId = requestAnimationFrame(App.bgLoop);
  };
  App.define("background/render-loop", function initialize(){
App.bgAnimId = 0;
App.VisualRenderState.subscribe(active =>{
    if(!active){
      if(App.bgAnimId) cancelAnimationFrame(App.bgAnimId);
      App.bgAnimId = 0;App._bgNextFrame=0;
      return;
    }
    if(!App.bgAnimId) App.bgAnimId = requestAnimationFrame(App.bgLoop);
  });
  }, ["bgAnimId","bgLoop"]);
})(window.Aurora);
