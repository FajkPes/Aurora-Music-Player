/* workers.js — Všechny výpočetní a vykreslovací workery a audio worklet. */

// ── workers/background/01-settings ──
window.Aurora.registerWorkerPart("background/01-settings", function(){
'use strict';
let settings = {}, stageBox = {w:1,h:1};
const state = {isPlaying:false};
const MusicSense = {data:{bass:0,mid:0,high:0,loudnessPct:0,bpm:0,beatPhase:0,beatPulse:0,tempoConfidence:0}};
const PlayerColors = {_lastC1:'#ff2ec4',_lastC2:'#7c3aed'};
const window = {devicePixelRatio:1};
const clamp01 = v=>Math.max(0,Math.min(1,v));
let running = false, frameId = 0, frames = 0, paintFrames=0, totalFrames=0, sensePackets=0, lastReport = 0, lastFrame = 0, nextFrame = 0, maxGap = 0, cpuMs = 0;
const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame.bind(self) : fn=>setTimeout(()=>fn(performance.now()),1000/Math.max(15,Math.min(240,Number(settings.renderFps)||120)));
const caf = typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame.bind(self) : clearTimeout;
function setActive(active){
  running=active;
  if(frameId) caf(frameId);
  frameId=0; lastFrame=0;nextFrame=0;
  if(active) frameId=raf(loop);
}
function loop(now){
  frameId=0;
  if(!running) return;
  const frameBudget=1000/Math.max(15,Math.min(240,Number(settings.renderFps)||120));
  if(now+.15<nextFrame){frameId=raf(loop);return;}
  nextFrame=nextFrame?nextFrame+frameBudget*(1+Math.floor(Math.max(0,now-nextFrame)/frameBudget)):now+frameBudget;
  const start=performance.now();
  if(lastFrame) maxGap=Math.max(maxGap,now-lastFrame);
  lastFrame=now;
  if(drawFrame(now)!==false)paintFrames++;
  cpuMs+=performance.now()-start;
  frames++;totalFrames++;
  if(now-lastReport>=1000){
    postMessage({type:'metrics',paintFps:paintFrames*1000/(now-lastReport),resources:typeof resourceStats==='function'?resourceStats():null,frames,totalFrames,wallTime:performance.timeOrigin+now,fps:frames*1000/(now-lastReport),cpuMs:cpuMs/frames,maxGap});
    frames=0;paintFrames=0;cpuMs=0;maxGap=0;lastReport=now;
  }
  frameId=raf(loop);
}
function attachSense(port){
  port.onmessage=({data:m})=>{
    sensePackets++;
    Object.assign(MusicSense.data,m.sense);
    state.isPlaying=m.playing;
    if(typeof onSpectrum==='function') onSpectrum(m);
    port.postMessage('ack');
  };
  port.start();
}
function sharedMessage(m){
  if(m.type==='settings') { settings=m.settings; settingsChanged(); postMessage({type:'settings-ack'}); }
  if(m.type==='active') setActive(m.active);
  if(m.type==='sense-port') attachSense(m.port);
  if(m.type==='colors') Object.assign(PlayerColors,m.colors);
  if(m.type==='playback') state.isPlaying=m.playing;
  if(m.type==='sense'){Object.assign(MusicSense.data,m.sense);state.isPlaying=m.playing;postMessage({type:'sense-ack'});}
  if(m.type==='probe') { const started=totalFrames,samples=sensePackets;setTimeout(()=>postMessage({type:'probe',id:m.id,now:performance.now(),frames:totalFrames-started,sensePackets:sensePackets-samples}),Math.min(5000,m.delay||0)); }
}
  const MusicSenseRegistry = {
    outputs: [
      { key: 'loudnessPct', label: 'Loudness (%)',   domain: [0, 100], fixedDomain: true },
      { key: 'bass',        label: 'Bass (%)',        domain: [0, 100], fixedDomain: true },
      { key: 'mid',         label: 'Mid (%)',         domain: [0, 100], fixedDomain: true },
      { key: 'high',        label: 'High (%)',        domain: [0, 100], fixedDomain: true },
      { key: 'beatPulse',   label: 'Beat pulse (tempo)', domain: [0, 1], fixedDomain: true },
      { key: 'beatPhase',   label: 'Beat fáze (0-1)', domain: [0, 1], fixedDomain: true },
      { key: 'tempoConfidence', label: 'Jistota tempa (%)', domain: [0, 1], fixedDomain: true },
    ],
    byKey(key){ return this.outputs.find(o=>o.key===key) || this.outputs[0]; },
    rawValue(key){
      const v = MusicSense.data[key];
      return typeof v === 'number' && isFinite(v) ? v : 0;
    }
  };
  const CurveMath = {
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
  };
});

// ── workers/background/02-mapping-engine ──
window.Aurora.registerWorkerPart("background/02-mapping-engine", function(){const MappingEngine = {
    _boostSmooth: {},
    _boostLastT: {},
    _valueSmooth: {},
    _valueLastT: {},
    resolve(settingKey){
      return this.resolveMap(settings[settingKey], settingKey);
    },
    resolveMap(map, cacheKey){
      if(!map || !map.enabled) return 0;
      const divisor = Math.max(0.0001, settings.bgSensDivisor);
      const raw = MusicSenseRegistry.rawValue(map.source);
      const meta = MusicSenseRegistry.byKey(map.source);
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
      return CurveMath.evaluate(pts, norm);
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
  function computeTempoSpeedMult(map){
    if(!map || !map.tempoSync) return 1;
    ensureTempoSyncDefaults(map);
    const bpm = Math.max(0, MusicSense.data.bpm || 0);
    const bpmLo = Math.min(map.tempoBpmMin, map.tempoBpmMax);
    const bpmHi = Math.max(map.tempoBpmMin, map.tempoBpmMax);
    const multLo = Math.min(map.tempoMultMin, map.tempoMultMax);
    const multHi = Math.max(map.tempoMultMin, map.tempoMultMax);
    const t = clamp01((bpm - bpmLo) / Math.max(bpmHi - bpmLo, 1e-6));
    const baseMult = multLo + (multHi - multLo) * t;
    const sens = Math.max(0, map.tempoSens);
    return 1 + (baseMult - 1) * sens;
  }
  function applyTempoSpeedMult(map, speedDrv){
    return speedDrv * computeTempoSpeedMult(map);
  }
  const BlobShapes = {
    circle: {
      label: 'Kruh',
      path: () => `M50,4 A46,46 0 1 1 49.99,4 Z`
    },
    square: {
      label: 'Čtverec',
      path: (radius) => roundedRectPath(8, 8, 84, 84, 10 + Math.max(0,Math.min(1,radius||0))*32)
    },
    diamond: {
      label: 'Diamant',
      supportsRounding: true,
      path: (radius) => roundPolygonPath([[50,2],[98,50],[50,98],[2,50]], radius)
    },
    hexagon: {
      label: 'Hexagon',
      supportsRounding: true,
      path: (radius) => roundPolygonPath([[27,4],[73,4],[98,50],[73,96],[27,96],[2,50]], radius)
    },
    star: {
      label: 'Hvězda',
      supportsRounding: true,
      path: (radius) => roundPolygonPath(starPoints(50,50, 48, 20, 5, -90), radius)
    },
    crosshair: {
      label: 'Crosshair',
      supportsRounding: true,
      path: (radius) => roundPolygonPath([[42,2],[58,2],[58,42],[98,42],[98,58],[58,58],[58,98],[42,98],[42,58],[2,58],[2,42],[42,42]], radius)
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
  function roundedRectPath(x,y,w,h,r){
    return `M${x+r},${y} H${x+w-r} A${r},${r} 0 0 1 ${x+w},${y+r} V${y+h-r} A${r},${r} 0 0 1 ${x+w-r},${y+h} H${x+r} A${r},${r} 0 0 1 ${x},${y+h-r} V${y+r} A${r},${r} 0 0 1 ${x+r},${y} Z`;
  }
  function starPoints(cx,cy,outerR,innerR,points,rotDeg){
    const rot = rotDeg * Math.PI/180;
    const pts = [];
    for(let i=0;i<points*2;i++){
      const r = i%2===0 ? outerR : innerR;
      const ang = rot + i*Math.PI/points;
      pts.push([cx + Math.cos(ang)*r, cy + Math.sin(ang)*r]);
    }
    return pts;
  }
});

// ── workers/background/03-round-polygon-path ──
window.Aurora.registerWorkerPart("background/03-round-polygon-path", function(){function roundPolygonPath(points, radius){
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
  }
  const RESPAWN_MARGIN = 0.16;
  const SPAWN_FADE_FRACTION = 0.16;
  const PATH_TRAVEL_RATE = 0.09;
  const ORBIT_RATE = 0.35;
  function edgeFade(t){
    const f = SPAWN_FADE_FRACTION;
    if(t < f) return t/f;
    if(t > 1-f) return (1-t)/f;
    return 1;
  }
  const MotionPaths = {
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
        const span = 1 + RESPAWN_MARGIN*2;
        b.along += driftSpeed * PATH_TRAVEL_RATE * dt;
        if(b.along > 1 + RESPAWN_MARGIN){
          b.along = -RESPAWN_MARGIN;
          b.lane = 0.06 + Math.random()*0.88;
        }
        const t = (b.along + RESPAWN_MARGIN) / span;
        const swayAmt = typeof (layer && layer.swayAmount) === 'number' ? layer.swayAmount : 0.02;
        const wob = driftSpeed>0 ? Math.sin(b.phase)*swayAmt : 0;
        return { px: b.lane + wob, py: b.along, fade: edgeFade(t) };
      }
    },
    rise: {
      label: 'Zdola nahoru',
      step(b, driftSpeed, dt, layer){
        b.phase += (0.002 + driftSpeed*0.01) * dt * 120;
        const span = 1 + RESPAWN_MARGIN*2;
        b.along -= driftSpeed * PATH_TRAVEL_RATE * dt;
        if(b.along < -RESPAWN_MARGIN){
          b.along = 1 + RESPAWN_MARGIN;
          b.lane = 0.06 + Math.random()*0.88;
        }
        const t = 1 - (b.along + RESPAWN_MARGIN) / span;
        const swayAmt = typeof (layer && layer.swayAmount) === 'number' ? layer.swayAmount : 0.02;
        const wob = driftSpeed>0 ? Math.sin(b.phase)*swayAmt : 0;
        return { px: b.lane + wob, py: b.along, fade: edgeFade(t) };
      }
    },
    left: {
      label: 'Zprava doleva',
      step(b, driftSpeed, dt, layer){
        b.phase += (0.002 + driftSpeed*0.01) * dt * 120;
        const span = 1 + RESPAWN_MARGIN*2;
        b.along -= driftSpeed * PATH_TRAVEL_RATE * dt;
        if(b.along < -RESPAWN_MARGIN){
          b.along = 1 + RESPAWN_MARGIN;
          b.lane = 0.06 + Math.random()*0.88;
        }
        const t = 1 - (b.along + RESPAWN_MARGIN) / span;
        const swayAmt = typeof (layer && layer.swayAmount) === 'number' ? layer.swayAmount : 0.02;
        const wob = driftSpeed>0 ? Math.cos(b.phase*0.8)*swayAmt : 0;
        return { px: b.along, py: b.lane + wob, fade: edgeFade(t) };
      }
    },
    right: {
      label: 'Zleva doprava',
      step(b, driftSpeed, dt, layer){
        b.phase += (0.002 + driftSpeed*0.01) * dt * 120;
        const span = 1 + RESPAWN_MARGIN*2;
        b.along += driftSpeed * PATH_TRAVEL_RATE * dt;
        if(b.along > 1 + RESPAWN_MARGIN){
          b.along = -RESPAWN_MARGIN;
          b.lane = 0.06 + Math.random()*0.88;
        }
        const t = (b.along + RESPAWN_MARGIN) / span;
        const swayAmt = typeof (layer && layer.swayAmount) === 'number' ? layer.swayAmount : 0.02;
        const wob = driftSpeed>0 ? Math.cos(b.phase*0.8)*swayAmt : 0;
        return { px: b.along, py: b.lane + wob, fade: edgeFade(t) };
      }
    },
    inward: {
      label: 'Z okrajů do středu',
      step(b, driftSpeed, dt){
        b.phase += (0.002 + driftSpeed*0.01) * dt * 120;
        b.along -= driftSpeed * PATH_TRAVEL_RATE * dt;
        if(b.along < 0.02){
          b.along = 1;
          b.lane = Math.random()*Math.PI*2;
        }
        const t = 1 - b.along;
        const r = b.along * 0.62;
        const wob = driftSpeed>0 ? Math.sin(b.phase)*0.01 : 0;
        return { px: 0.5 + Math.cos(b.lane)*(r+wob), py: 0.5 + Math.sin(b.lane)*(r+wob), fade: edgeFade(t) };
      }
    },
    outward: {
      label: 'Ze středu ven',
      step(b, driftSpeed, dt){
        b.phase += (0.002 + driftSpeed*0.01) * dt * 120;
        b.along += driftSpeed * PATH_TRAVEL_RATE * dt;
        if(b.along > 1){
          b.along = 0.02;
          b.lane = Math.random()*Math.PI*2;
        }
        const t = b.along;
        const r = b.along * 0.62;
        const wob = driftSpeed>0 ? Math.sin(b.phase)*0.01 : 0;
        return { px: 0.5 + Math.cos(b.lane)*(r+wob), py: 0.5 + Math.sin(b.lane)*(r+wob), fade: edgeFade(t) };
      }
    },
    orbit: {
      label: 'Orbit kolem středu',
      step(b, driftSpeed, dt){
        b.phase += (0.002 + driftSpeed*0.01) * dt * 120;
        b.orbitAngle += b.orbitDir * driftSpeed * ORBIT_RATE * dt;
        const wob = driftSpeed>0 ? Math.sin(b.phase)*0.015 : 0;
        const r = b.orbitRadius + wob;
        return { px: 0.5 + Math.cos(b.orbitAngle)*r, py: 0.5 + Math.sin(b.orbitAngle)*r*0.82, fade: 1 };
      }
    }
  };
  function resolveMotionPath(key){
    return MotionPaths[key] || MotionPaths.random;
  }
  function hexToRgb(hex){
    const h = hex.replace('#','');
    const bigint = parseInt(h,16);
    return { r:(bigint>>16)&255, g:(bigint>>8)&255, b:bigint&255 };
  }
  function hslToHex(h,s,l){
    s/=100; l/=100;
    const k = n => (n + h/30) % 12;
    const a = s * Math.min(l, 1-l);
    const f = n => l - a*Math.max(-1, Math.min(k(n)-3, Math.min(9-k(n),1)));
    const toHex = x => Math.round(255*x).toString(16).padStart(2,'0');
    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
  }
  const _trailPathCache = {};
  function getTrailPath2D(shapeKey, cornerRadius){
    const radius = Math.max(0, Math.min(1, cornerRadius||0));
    const cacheKey = shapeKey + '|' + radius.toFixed(2);
    if(_trailPathCache[cacheKey]) return _trailPathCache[cacheKey];
    const def = BlobShapes[shapeKey] || BlobShapes.circle;
    try { _trailPathCache[cacheKey] = new Path2D(def.path(radius)); } catch(e){ _trailPathCache[cacheKey] = new Path2D(BlobShapes.circle.path()); }
    return _trailPathCache[cacheKey];
  }
});

// ── workers/background/04-trail-fx ──
window.Aurora.registerWorkerPart("background/04-trail-fx", function(){const TrailFx = {
    _canvas: null, _ctx: null,
    _lastW: 0, _lastH: 0,
    _particles: [],
    _blobAccum: new WeakMap(),
    _wasActive: false,
    ensure(){
      if(this._canvas) return;
      this._canvas = el('bgTrailCanvas');
      this._ctx = this._canvas ? this._canvas.getContext('2d') : null;
    },
    resize(w, h){
      this.ensure();
      if(!this._canvas) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
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
        if(this._wasActive || this._particles.length){
          const cw = this._canvas.width, ch = this._canvas.height;
          this._ctx.clearRect(0, 0, cw, ch);
          this._particles = [];
        }
        if(this._canvas.width!==1||this._canvas.height!==1){this._canvas.width=1;this._canvas.height=1;this._lastW=0;this._lastH=0;}
        this._wasActive = false;
        return false;
      }
      if(w !== this._lastW || h !== this._lastH)this.resize(w,h);
      this._wasActive = true;
      const ctx = this._ctx;
      const dpr = Math.min(2, window.devicePixelRatio||1);
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
      const fade=Math.max(.02,Math.min(.6,settings.trailFadeRate));
      const decayMs=-1000/(60*Math.log(1-fade));
      lengthSec=Math.max(0,Math.min(30,Number(lengthSec)||0));
      const lifetime=lengthSec*1000+Math.min(2500,decayMs*4);
      if(!hist.length || nowMs-hist[hist.length-1].t>=Math.max(16,lifetime/128)){
        hist.push({x:px,y:py,t:nowMs,rot:rotationDeg||0,size:size*Math.max(.1,Math.min(3,Number.isFinite(sizeMult)?sizeMult:1.05)),color,alpha,shape:shapeKey||'circle',radius:cornerRadius});
      }
      while(hist.length && (hist.length>128||nowMs-hist[0].t>=lifetime))hist.shift();
      const ctx=this._ctx;
      const count=Math.min(hist.length,48,Math.max(1,Math.floor(4096/Math.max(1,BgReact.blobs?.length||1))));
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
        ctx.fill(getTrailPath2D(pt.shape,pt.radius),(BlobShapes[pt.shape]||BlobShapes.circle).fillRule||'nonzero');
        ctx.restore();
      }
    },
    spawnSparkle(blobRef, px, py, size, color, dt, flashEnv){
      let accum = this._blobAccum.get(blobRef) || 0;
      const rate = Math.max(0, settings.sparklesRate) * (0.4 + flashEnv * 1.6);
      accum += rate * dt;
      while(accum >= 1){
        accum -= 1;
        if(Math.random() > 0.6) continue;
        const ang = Math.random() * Math.PI * 2;
        const dist = size * (0.12 + Math.random() * 0.30);
        const life = Math.max(0.15, settings.sparklesLife) * (0.7 + Math.random() * 0.6);
        const speed = dist / life;
        this._particles.push({
          x: px + Math.cos(ang) * dist * 0.25,
          y: py + Math.sin(ang) * dist * 0.25,
          vx: Math.cos(ang) * speed * 0.7,
          vy: Math.sin(ang) * speed * 0.7,
          born: performance.now(),
          life: life * 1000,
          size: Math.max(0.8, 3.5 * Math.max(0.2, settings.sparklesSize) * (0.5 + Math.random() * 0.8)),
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
      let aliveCount = 0;
      for(let i=0;i<this._particles.length;i++){
        const p = this._particles[i];
        const age = nowMs - p.born;
        if(age >= p.life) continue;
        p.x += p.vx*dt;
        p.y += p.vy*dt;
        const t = age/p.life;
        const fade = t < 0.15 ? (t/0.15) : (1 - (t-0.15)/0.85);
        const {r,g,b:bl} = hexToRgb(p.color);
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
        this._particles[aliveCount++]=p;
      }
      this._particles.length=aliveCount;
    }
  };
});

// ── workers/background/05-bg-react ──
window.Aurora.registerWorkerPart("background/05-bg-react", function(){const BgReact = {
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
    _signature(){
      return settings.bgLayers.map(l => (l.enabled ? l.count : 0)).join(',');
    },
    ensure(){
      const sig=this._signature();
      if(sig!==this._layerSignature || !this.blobs){
        this.blobs=[];
        settings.bgLayers.forEach((layer,layerIdx)=>{
          if(!layer.enabled) return;
          for(let i=0;i<Math.min(100,Math.max(0,Math.round(layer.count)));i++){
            const angle=Math.random()*Math.PI*2;
            this.blobs.push({layerIdx,x:0.15+Math.random()*0.7,y:0.15+Math.random()*0.7,
              dirX:Math.cos(angle),dirY:Math.sin(angle),hueSeed:Math.random()*360,
              colorFlip:Math.random()>0.5,phase:Math.random()*Math.PI*2,
              lane:0.08+Math.random()*0.84,along:Math.random(),orbitAngle:angle,
              orbitRadius:0.18+Math.random()*0.30,orbitDir:Math.random()>0.5?1:-1,
              _lastPath:null,pathFade:1});
          }
        });
        this._layerSignature=sig;
        this._layerBeatCut={}; this._layerFlashEnv={};
      }
      return glow;
    },
    update(){
      const now = performance.now();
      const dt = this._lastTime ? Math.min(0.1, (now - this._lastTime)/1000) : 0;
      this._lastTime = now;
      const headacheReductionColorSpeed = settings.reduceColorSpeedIntensity ? 0.5 : 1;
      const colorSpeedDrv0 = applyTempoSpeedMult(settings.bgMapColorSpeed, MappingEngine.resolve('bgMapColorSpeed')) * headacheReductionColorSpeed;
      this._hueAccum += colorSpeedDrv0 * dt * 40;
      const wrap = el('bgGlow');
      if(!settings.bgEnabled){
        wrap.style.opacity = '0';
        FxEngine.setBaseOpacity(0);
        return;
      }
      this.ensure();
      const overallOpacity = typeof settings.fxOverallOpacity === 'number' ? settings.fxOverallOpacity : 1;
      wrap.style.opacity = String(overallOpacity);
      FxEngine.setBaseOpacity(overallOpacity);
      const w = stageBox.w, h = stageBox.h;
      if(!w || !h) return;
      this._frameToken++;
      const headacheReductionFlash = settings.reduceFlashIntensity ? 0.5 : 1;
      const sizeDrv0      = MappingEngine.resolve('bgMapSize');
      const speedDrv0      = applyTempoSpeedMult(settings.bgMapSpeed, MappingEngine.resolve('bgMapSpeed'));
      const flashDrvRaw0   = MappingEngine.resolve('bgMapFlash') * headacheReductionFlash;
      const blurDrv0       = MappingEngine.resolve('bgMapBlur');
      if(dt > 0){
        const attack = Math.max(0.001, settings.bgFlashAttack);
        const release = Math.max(0.001, settings.bgFlashRelease);
        if(flashDrvRaw0 > this._flashEnv){
          const k = 1 - Math.exp(-dt/attack);
          this._flashEnv += (flashDrvRaw0 - this._flashEnv) * k;
        } else {
          const k = 1 - Math.exp(-dt/release);
          this._flashEnv += (flashDrvRaw0 - this._flashEnv) * k;
        }
      }
      const baseSizePx = Math.min(w,h) * 0.34;
      const anyTrailsActive = settings.bgLayers.some(l => l.enabled && l.trailEnabled);
      const anySparklesActive = settings.sparklesEnabled && settings.bgLayers.some(l => l.enabled && l.sparklesEnabled);
      const trailCanvasReady = TrailFx.beginFrame(w, h, anyTrailsActive, anySparklesActive);
      const layerDrivers=[]; // Resolve each layer once, independent of its blob count.
      this.blobs.forEach((b)=>{
        const layer = settings.bgLayers[b.layerIdx];
        if(!layer || !layer.enabled){
          if(false) void 0;
          return;
        }
        const sensMult = typeof layer.sensMult === 'number' ? layer.sensMult : 1;
        const ov = layer.overrides || {};
        const layerIdx = b.layerIdx;
        let drivers=layerDrivers[layerIdx];
        if(!drivers){
          const sizeOv=ov.size, speedOv=ov.speed, blurOv=ov.blur;
          drivers=layerDrivers[layerIdx]={
            size:sizeOv?.enabled ? MappingEngine.resolveMap(sizeOv, `layer:${layerIdx}:size`) : sizeDrv0*sensMult,
            speed:speedOv?.enabled ? applyTempoSpeedMult(speedOv, MappingEngine.resolveMap(speedOv, `layer:${layerIdx}:speed`)) : speedDrv0*sensMult,
            blur:blurOv?.enabled ? MappingEngine.resolveMap(blurOv, `layer:${layerIdx}:blur`) : blurDrv0*sensMult
          };
        }
        const {size:sizeDrv,speed:speedDrv,blur:blurDrv}=drivers;
        const flashOv = ov.flash;
        let flashDrv;
        if(flashOv && flashOv.enabled){
          if(this._layerFlashFrameToken[layerIdx] !== this._frameToken){
            const rawOv = MappingEngine.resolveMap(flashOv, `layer:${layerIdx}:flash`) * headacheReductionFlash;
            const prevEnv = this._layerFlashEnv[layerIdx] || 0;
            if(dt > 0){
              const attack = Math.max(0.001, settings.bgFlashAttack);
              const release = Math.max(0.001, settings.bgFlashRelease);
              const k = 1 - Math.exp(-dt / (rawOv > prevEnv ? attack : release));
              this._layerFlashEnv[layerIdx] = prevEnv + (rawOv - prevEnv) * k;
            }
            this._layerFlashFrameToken[layerIdx] = this._frameToken;
          }
          flashDrv = (this._layerFlashEnv[layerIdx] || 0);
        } else {
          flashDrv = this._flashEnv * sensMult;
        }
        const driftSpeed = settings.bgBaseDrift * speedDrv;
        let px, py, pathFadeTarget = 1;
        if(layer.pathEnabled){
          const pathKey = layer.path || 'random';
          if(pathKey !== b._lastPath){
            b.along = pathKey === 'inward' ? 1 : (pathKey === 'outward' ? 0.02 : Math.random());
            b.lane = (pathKey === 'inward' || pathKey === 'outward') ? Math.random()*Math.PI*2 : (0.08 + Math.random()*0.84);
            b._lastPath = pathKey;
            b.pathFade = 0;
          }
          const pos = resolveMotionPath(pathKey).step(b, driftSpeed, dt || 0.016, layer);
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
            const syncActive = settings.playerColorSync && settings.bgMapColorSpeed.enabled;
            if(syncActive){
              const hue = BgReact._hueAccum % 360;
              color = b.colorFlip ? hslToHex(hue, 80, 60) : hslToHex((hue+40) % 360, 80, 55);
            } else {
              color = b.colorFlip ? settings.playerColor1 : settings.playerColor2;
            }
          } else if(colorMode === 'custom'){
            color = colorSpeedOv.customColor || '#ff2ec4';
          } else {
            if(this._layerHueFrameToken[layerIdx] !== this._frameToken){
              const drvOv = applyTempoSpeedMult(colorSpeedOv, MappingEngine.resolveMap(colorSpeedOv, `layer:${layerIdx}:colorSpeed`)) * headacheReductionColorSpeed;
              this._layerHueAccum[layerIdx] = (this._layerHueAccum[layerIdx] || 0) + drvOv * dt * 40;
              this._layerHueFrameToken[layerIdx] = this._frameToken;
            }
            const hue = (b.hueSeed + (this._layerHueAccum[layerIdx]||0)) % 360;
            color = hslToHex(hue, 80, 60);
          }
        } else if(settings.bgMapColorSpeed.enabled){
          const hue = (b.hueSeed + this._hueAccum) % 360;
          color = hslToHex(hue, 80, 60);
        } else {
          color = b.colorFlip ? settings.bgColor1 : settings.bgColor2;
        }
        const shapeKeyEarly = BlobShapes[layer.shape] ? layer.shape : 'circle';
        const wobbleDeg = (layer.rotationWobble && driftSpeed>0) ? Math.sin(b.phase*0.6)*8 : 0;
        const rotationDeg = layer.rotation + wobbleDeg;
        if(!layer.trailEnabled)b._trailHist=null;
        if(trailCanvasReady){
          if(layer.trailEnabled){
            const trailLenSec = Math.max(0.05, (typeof layer.trailLength === 'number' ? layer.trailLength : 0.4) * 2.2);
            const trailSizeMult = typeof layer.trailWidth === 'number' ? Math.min(3,layer.trailWidth) : 1.05;
            TrailFx.drawTrail(b, px, py, size, color, clampedAlpha, trailLenSec, trailSizeMult, now, shapeKeyEarly, rotationDeg, layer.cornerRadius);
          }
          if(settings.sparklesEnabled && layer.sparklesEnabled && clampedAlpha > 0.02){
            TrailFx.spawnSparkle(b, px, py, size, color, dt||0.016, this._flashEnv);
          }
        }
        paintBlob(b, layer, px, py, size, color, clampedAlpha,
          rotationDeg, blurDrv, shapeKeyEarly, w, h);
      });
      if(trailCanvasReady){
        TrailFx.updateAndDrawSparkles(dt||0.016, now);
        TrailFx.endFrame();
      }
      FxEngine.update(dt, this._flashEnv);
    },
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
      const loud = state.isPlaying ? (MusicSense.data.loudnessPct || 0) : 0;
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
        const confidence = MusicSense.data.tempoConfidence || 0;
        const minConfidence = Math.max(0, Math.min(1, typeof layer.beatCutMinConfidence === 'number' ? layer.beatCutMinConfidence : 0.35));
        const trustBeat = confidence >= minConfidence && MusicSense.data.bpm > 0;
        let pulseNow;
        if(trustBeat){
          pulseNow = MusicSense.data.beatPulse || 0;
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
  };
});

// ── workers/background/06-canvas ──
window.Aurora.registerWorkerPart("background/06-canvas", function(){let canvas, ctx, scene, sceneCtx, bufferCtx, trail;
const glow={style:{opacity:'1'}};
const el=id=>id==='bgGlow'?glow:id==='bgTrailCanvas'?trail:null;
const FxEngine={setBaseOpacity(){},update(){}};
function ensureTempoSyncDefaults(map){
  const defaults={tempoSync:false,tempoSens:1,tempoMultMin:0,tempoMultMax:1,tempoBpmMin:60,tempoBpmMax:180};
  for(const key of Object.keys(defaults))if(map[key]===undefined)map[key]=settings.bgMapSpeed?.[key]??defaults[key];
}
const pathCache=new Map();
const spriteCache=new Map();
let tintCanvas, tintCtx;
// Bounded LRU of finished colors, shared across blobs and frames.
const tintCache=new Map();
function blobPath(shape,corner){
  const key=shape+'|'+corner;
  let path=pathCache.get(key);
  if(!path){
    path=new Path2D(BlobShapes[shape].path(corner));
    if(pathCache.size>=128)pathCache.clear();
    pathCache.set(key,path);
  }
  return path;
}
function blobSprite(shape,corner,blur){
  const key=shape+'|'+corner+'|'+blur;
  let sprite=spriteCache.get(key);
  if(sprite){spriteCache.delete(key);spriteCache.set(key,sprite);return sprite;}
  const size=384, unit=size/300;
  // Reuse the least-recently-used surface once the bounded cache is full.
  if(spriteCache.size>=80){
    const oldest=spriteCache.keys().next().value;
    sprite=spriteCache.get(oldest);spriteCache.delete(oldest);
  }else sprite=new OffscreenCanvas(size,size);
  const c=sprite.getContext('2d');
  c.setTransform(1,0,0,1,0,0);c.filter='none';c.clearRect(0,0,size,size);
  c.scale(unit,unit); c.translate(100,100);
  c.filter=blur>0?`blur(${blur*unit}px)`:'none';
  c.fillStyle='white';
  c.fill(blobPath(shape,corner),BlobShapes[shape].fillRule||'nonzero');
  if(spriteCache.size>=80) spriteCache.delete(spriteCache.keys().next().value);
  spriteCache.set(key,sprite); return sprite;
}
function radialFill(ctx,color,center,radius){
  const rgb=hexToRgb(color),g=ctx.createRadialGradient(center,center,0,center,center,radius);
  g.addColorStop(0,'rgba(255,255,255,.95)');
  g.addColorStop(.18,`rgba(${rgb.r},${rgb.g},${rgb.b},.85)`);
  g.addColorStop(.45,`rgba(${rgb.r},${rgb.g},${rgb.b},.35)`);
  g.addColorStop(.75,`rgba(${rgb.r},${rgb.g},${rgb.b},0)`);g.addColorStop(1,'transparent');
  return g;
}
function stamp(x,y,size,color,alpha,rotation,blur,shape,corner,sx=1,sy=1){
  if(size<=0 || alpha<=0.001) return;
  // Cull using a conservative circle around the rotated sprite square.
  const reach=size*1.5*Math.SQRT2*Math.max(Math.abs(sx),Math.abs(sy));
  if(x+reach<0||y+reach<0||x-reach>stageBox.w||y-reach>stageBox.h)return;
  // Unblurred shapes do not need a raster mask, tint surface or texture upload.
  // Use the same 0..100 shape geometry and screen blend as the blurred path.
  if(blur===0){
    sceneCtx.save();sceneCtx.translate(x,y);sceneCtx.scale(sx,sy);sceneCtx.rotate(rotation*Math.PI/180);
    sceneCtx.globalAlpha=clamp01(alpha);sceneCtx.globalCompositeOperation='screen';
    sceneCtx.scale(size/100,size/100);sceneCtx.translate(-50,-50);
    sceneCtx.fillStyle=BlobShapes[shape].radial?radialFill(sceneCtx,color,50,50):color;
    sceneCtx.fill(blobPath(shape,corner),BlobShapes[shape].fillRule||'nonzero');
    sceneCtx.restore();return;
  }
  const key=shape+'|'+corner+'|'+blur+'|'+color;
  const cached=tintCache.get(key);
  if(cached){
    tintCache.delete(key);tintCache.set(key,cached);tintCanvas=cached;tintCtx=cached.getContext('2d');
  }else{
  if(tintCache.size>=8){
    const oldest=tintCache.keys().next().value;
    tintCanvas=tintCache.get(oldest);tintCache.delete(oldest);
  }else tintCanvas=new OffscreenCanvas(384,384);
  tintCtx=tintCanvas.getContext('2d');
  const sprite=blobSprite(shape,corner,blur);
  const c=tintCtx;
  c.globalCompositeOperation='copy';c.drawImage(sprite,0,0);
  c.globalCompositeOperation='source-in';
  if(BlobShapes[shape].radial){
    c.fillStyle=radialFill(c,color,192,64);
  }else c.fillStyle=color;
  c.fillRect(0,0,384,384);
  tintCache.set(key,tintCanvas);
  }
  sceneCtx.save();sceneCtx.translate(x,y);sceneCtx.scale(sx,sy);sceneCtx.rotate(rotation*Math.PI/180);
  sceneCtx.globalAlpha=clamp01(alpha);sceneCtx.globalCompositeOperation='screen';
  sceneCtx.drawImage(tintCanvas,-size*1.5,-size*1.5,size*3,size*3);sceneCtx.restore();
}
function paintBlob(b,layer,x,y,size,color,alpha,rotation,blurDrv,shape,w,h){
  const blurPx=Math.max(0,layer.blur+blurDrv*40);
  const blur=layer.blurEnabled?Math.round(Math.min(22,blurPx/Math.max(1,size)*60)/.4)*.4:0;
  const corner=Number(layer.cornerRadius)||0;
  stamp(x,y,size,color,alpha,rotation,blur,shape,corner);
  if(layer.mirrorEnabled===false) return;
  for(const prefix of ['fxMirror','fxMirror2']){
    if(!settings[prefix+'Enabled'])continue;
    const axis=settings[prefix+'Axis']||'x', flipX=axis==='x'||axis==='both',flipY=axis==='y'||axis==='both';
    stamp(flipX?w-x:x,flipY?h-y:y,size,color,alpha*(settings[prefix+'Amount']??1),axis==='y'?-rotation:rotation,blur,shape,corner,flipX?-1:1,flipY?-1:1);
  }
}
let grade='none', glitchUntil=0, glitchNext=0, glitchSlices=[];
function settingsChanged(){
  grade=[['brightness',settings.fxBrightness??1,1,''],['contrast',settings.fxContrast??1,1,''],['saturate',settings.fxSaturation??1,1,''],['hue-rotate',settings.fxHue??0,0,'deg']].filter(([,v,neutral])=>v!==neutral).map(([name,v,,unit])=>`${name}(${v}${unit})`).join(' ')||'none';
}
function resize(m){
  stageBox=m.size;window.devicePixelRatio=m.dpr;
  const w=settings.bgEnabled?Math.max(1,Math.round(stageBox.w*m.dpr)):1,h=settings.bgEnabled?Math.max(1,Math.round(stageBox.h*m.dpr)):1;
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  if(TrailFx._wasActive)TrailFx.resize(stageBox.w,stageBox.h);
}
function resourceStats(){return {canvasBytes:4*(canvas.width*canvas.height+scene.width*scene.height+trail.width*trail.height+384*384*(spriteCache.size+tintCache.size)),spriteCount:spriteCache.size,trailParticles:TrailFx._particles.length};}
let backgroundCleared=false;
function drawFrame(now){
  if(!ctx)return;
  if(!settings.bgEnabled){
    BgReact.update();
    if(now-(BgReact._reportTime||0)>100){postMessage({type:'hue',hue:BgReact._hueAccum,blobs:0});BgReact._reportTime=now;}
    if(!backgroundCleared){
      canvas.width=canvas.height=scene.width=scene.height=trail.width=trail.height=1;
      TrailFx._particles.length=0;TrailFx._wasActive=false;
      TrailFx._lastW=0;TrailFx._lastH=0;
      for(const blob of BgReact.blobs||[])blob._trailHist=null;
      for(const surface of [...spriteCache.values(),...tintCache.values()])surface.width=surface.height=1;
      spriteCache.clear();tintCache.clear();pathCache.clear();tintCanvas=null;tintCtx=null;
    }
    backgroundCleared=true;return false;
  }
  if(backgroundCleared)resize({size:stageBox,dpr:window.devicePixelRatio});
  backgroundCleared=false;
  const w=canvas.width,h=canvas.height,dpr=window.devicePixelRatio;
  const direct=grade==='none'&&!settings.fxGlitchEnabled&&(settings.fxOverallOpacity??1)===1;
  if(direct){if(scene.width!==1||scene.height!==1){scene.width=1;scene.height=1;}sceneCtx=ctx;}
  else{if(scene.width!==w||scene.height!==h){scene.width=w;scene.height=h;}sceneCtx=bufferCtx;}
  sceneCtx.clearRect(0,0,w,h);sceneCtx.save();sceneCtx.scale(dpr,dpr);
  BgReact.update();sceneCtx.restore();
  if(!direct)ctx.clearRect(0,0,w,h);
  if(!settings.bgEnabled)return;
  ctx.save();ctx.filter=grade;ctx.globalAlpha=clamp01(settings.fxOverallOpacity??1);
  if(direct){
    if(TrailFx._wasActive){ctx.globalCompositeOperation='destination-over';ctx.drawImage(trail,0,0,w,h);ctx.globalCompositeOperation='source-over';}
  }else{if(TrailFx._wasActive)ctx.drawImage(trail,0,0,w,h);ctx.drawImage(scene,0,0);}
  if(settings.fxGlitchEnabled && now>glitchNext){
    const freq=Math.max(.02,settings.fxGlitchFreq||.4);
    glitchNext=now+1100/freq*(.6+Math.random()*.8);
    if(!settings.fxGlitchOnBeat||Math.random()<.15+BgReact._flashEnv*.85){
      glitchUntil=now+Math.max(60,settings.fxGlitchDuration||180);
      glitchSlices=Array.from({length:5},(_,i)=>({y:h*i/5,offset:(i%2?1:-1)*(settings.fxGlitchAmount||28)*dpr*(.4+Math.random()*.9)}));
    }
  }
  if(settings.fxGlitchEnabled && now<glitchUntil){
    for(const s of glitchSlices){ctx.save();ctx.beginPath();ctx.rect(0,s.y,w,h/5);ctx.clip();ctx.globalCompositeOperation='screen';ctx.filter=(grade==='none'?'':grade+' ')+'hue-rotate(35deg)';ctx.drawImage(scene,s.offset,0);ctx.restore();}
  }
  ctx.restore();
  if(now-(BgReact._reportTime||0)>100){postMessage({type:'hue',hue:BgReact._hueAccum,blobs:BgReact.blobs?.length||0});BgReact._reportTime=now;}
}
onmessage=({data:m})=>{
  if(m.type==='init'){
    canvas=m.canvas;ctx=canvas.getContext('2d',{alpha:true});scene=new OffscreenCanvas(1,1);bufferCtx=scene.getContext('2d');sceneCtx=bufferCtx;
    trail=new OffscreenCanvas(1,1);
    settings=m.settings;settingsChanged();resize(m);postMessage({type:'ready'});setActive(m.active);
  }else if(m.type==='resize')resize(m);else sharedMessage(m);
};
});

// ── workers/spectrum/01-settings ──
window.Aurora.registerWorkerPart("spectrum/01-settings", function(){
'use strict';
let settings = {};
const state = {isPlaying:false};
const MusicSense = {data:{bass:0,mid:0,high:0,loudnessPct:0,bpm:0,beatPhase:0,beatPulse:0,tempoConfidence:0}};
const PlayerColors = {_lastC1:'#ff2ec4',_lastC2:'#7c3aed'};
const window = {devicePixelRatio:1};
const clamp01 = v=>Math.max(0,Math.min(1,v));
let running = false, frameId = 0, frames = 0, paintFrames=0, totalFrames=0, sensePackets=0, lastReport = 0, lastFrame = 0, nextFrame = 0, maxGap = 0, cpuMs = 0;
const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame.bind(self) : fn=>setTimeout(()=>fn(performance.now()),1000/Math.max(15,Math.min(240,Number(settings.renderFps)||120)));
const caf = typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame.bind(self) : clearTimeout;
function wake(){if(running&&!frameId)frameId=raf(loop);}
function setActive(active){
  running=active;
  if(frameId) caf(frameId);
  frameId=0; lastFrame=0;nextFrame=0;
  if(active) frameId=raf(loop);
}
function loop(now){
  frameId=0;
  if(!running) return;
  const frameBudget=1000/Math.max(15,Math.min(240,Number(settings.renderFps)||120));
  if(now+.15<nextFrame){frameId=raf(loop);return;}
  nextFrame=nextFrame?nextFrame+frameBudget*(1+Math.floor(Math.max(0,now-nextFrame)/frameBudget)):now+frameBudget;
  const start=performance.now();
  if(lastFrame) maxGap=Math.max(maxGap,now-lastFrame);
  lastFrame=now;
  if(drawFrame(now)!==false)paintFrames++;
  cpuMs+=performance.now()-start;
  frames++;totalFrames++;
  if(now-lastReport>=1000){
    postMessage({type:'metrics',paintFps:paintFrames*1000/(now-lastReport),resources:typeof resourceStats==='function'?resourceStats():null,frames,totalFrames,wallTime:performance.timeOrigin+now,fps:frames*1000/(now-lastReport),cpuMs:cpuMs/frames,maxGap});
    frames=0;paintFrames=0;cpuMs=0;maxGap=0;lastReport=now;
  }
  if(spectrumDirty||pendingSpectrum)wake();
}
function attachSense(port){
  port.onmessage=({data:m})=>{
    sensePackets++;
    Object.assign(MusicSense.data,m.sense);
    state.isPlaying=m.playing;
    if(typeof onSpectrum==='function') onSpectrum(m);
    port.postMessage('ack');
  };
  port.start();
}
function sharedMessage(m){
  if(m.type==='settings') { settings=m.settings; settingsChanged(); postMessage({type:'settings-ack'}); }
  if(m.type==='active') setActive(m.active);
  if(m.type==='sense-port') attachSense(m.port);
  if(m.type==='colors') Object.assign(PlayerColors,m.colors);
  if(m.type==='playback') state.isPlaying=m.playing;
  if(m.type==='sense'){Object.assign(MusicSense.data,m.sense);state.isPlaying=m.playing;postMessage({type:'sense-ack'});}
  if(m.type==='probe') { const started=totalFrames,samples=sensePackets;setTimeout(()=>postMessage({type:'probe',id:m.id,now:performance.now(),frames:totalFrames-started,sensePackets:sensePackets-samples}),Math.min(5000,m.delay||0)); }
}
  function hexToRgb(hex){
    const h = hex.replace('#','');
    const bigint = parseInt(h,16);
    return { r:(bigint>>16)&255, g:(bigint>>8)&255, b:bigint&255 };
  }
});

// ── workers/spectrum/02-spectrogram ──
window.Aurora.registerWorkerPart("spectrum/02-spectrogram", function(){const Spectrogram = {
    _historyCanvas: null, _historyCtx: null,
    _freqBinsCache: null,
    _freqBinsSig: '',
    _ensureFreqBins(rows, fftBinCount, sampleRate, fftSize){
      const sig = `${rows}|${fftBinCount}|${sampleRate}|${fftSize}|${settings.specFreqMin}|${settings.specFreqMax}|${settings.specLogScale}`;
      if(sig === this._freqBinsSig && this._freqBinsCache) return this._freqBinsCache;
      const fMin = Math.max(1, Math.min(settings.specFreqMin, settings.specFreqMax-1));
      const fMax = Math.max(fMin+1, settings.specFreqMax);
      const nyquist = sampleRate/2;
      const binHz = nyquist / fftBinCount;
      const out = new Array(rows);
      for(let row=0; row<rows; row++){
        const t = row/(Math.max(1,rows-1));
        let freq;
        if(settings.specLogScale){
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
    _paletteLUT: null,
    _paletteLUTSig: '',
    _buildPaletteLUT(){
      const N = 256;
      const lut = new Uint8ClampedArray(N*3);
      const palette = settings.specPalette;
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
        const c1 = PlayerColors._lastC1 || '#ff2ec4';
        const c2 = PlayerColors._lastC2 || '#7c3aed';
        const a = hexToRgb(c1), b = hexToRgb(c2);
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
    },
    _ensurePaletteLUT(){
      const c1 = settings.specPalette === 'player' ? (PlayerColors._lastC1 || '') : '';
      const c2 = settings.specPalette === 'player' ? (PlayerColors._lastC2 || '') : '';
      const sig = `${settings.specPalette}|${c1}|${c2}`;
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
      const gain = settings.specGain, gamma = settings.specGamma;
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
      const gain = settings.specGain, gamma = settings.specGamma;
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
    _liveAccumTime: -1,
    onLiveFrame(byteFreq, fftBinCount, sampleRate, fftSize){
      if(!settings.specEnabled) return;
      const rows = Math.max(8, this._historyCanvas.height);
      const now = (audioCtx ? audioCtx.currentTime : performance.now()/1000);
      const dpr = Math.min(2, window.devicePixelRatio||1);
      const pxPerSec = Math.max(1, settings.specPxPerSec) * dpr;
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
    _historyColCount: 0,
    _appendHistoryColumn(intensities){
      this._paintColumn(this._historyCtx, this._historyCanvas, this._historyColCount, intensities);
      this._historyColCount++;
    },
    resetForNewTrack(){
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
    },
  };
});

// ── workers/spectrum/03-targets ──
window.Aurora.registerWorkerPart("spectrum/03-targets", function(){let targets=[], layout={}, audioCtx={currentTime:0}, spectrumDirty=true;
let pendingSpectrum=null;
function settingsChanged(){ if(targets.length) resize(layout); }
function resize(m){
  spectrumDirty=true;wake();layout=m;window.devicePixelRatio=m.dpr||1;
  const dpr=window.devicePixelRatio;
  for(let i=0;i<targets.length;i++){
    const target=targets[i],box=m.boxes[i];target.box=box;
    const show=settings.specEnabled&&(settings.specInsideIsland?(i===1||i===2&&settings.specInsideIslandBothPanels!==false):i===0);
    const w=show?Math.max(1,Math.round(box.w*dpr)):1,h=show?Math.max(1,Math.round(box.h*dpr)):1;
    if(target.canvas.width!==w||target.canvas.height!==h){target.canvas.width=w;target.canvas.height=h;target.cleared=false;}
  }
  const visible=settings.specInsideIsland?targets.slice(1,settings.specInsideIslandBothPanels!==false?3:2):targets.slice(0,1);
  const w=Math.max(20,...visible.map(t=>t.canvas.width)),h=settings.specEnabled?Math.max(8,...visible.map(t=>t.canvas.height)):1;
  const hw=settings.specEnabled?Math.max(1,Math.min(16384,Math.floor(16*1024*1024/(4*h)),Math.max(50,Math.round(settings.specFillWidth?w*1.15:settings.specHistorySec*settings.specPxPerSec*dpr)))):1;
  const history=Spectrogram._historyCanvas;
  if(history.width!==hw||history.height!==h){
    history.width=hw;history.height=h;Spectrogram._historyColCount=0;
    Spectrogram._columnImageCache?.clear();
    Spectrogram._singleColumnImage=null;Spectrogram._intensityScratch=null;Spectrogram._liveAccumTime=-1;
  }
}
function onSpectrum(m){
  if(!running||!m.playing||!m.freq||!settings.specEnabled){pendingSpectrum=null;return;}
  // Keep only the newest packet; process it at the renderer's cadence.
  pendingSpectrum=m;wake();
}
const spectrumMasks=new WeakMap();
function mask(ctx,w,h,nowX,edge){
  let cached=spectrumMasks.get(ctx);if(!cached){cached={};spectrumMasks.set(ctx,cached);}
  ctx.save();ctx.globalCompositeOperation='destination-in';
  const amount=clamp01(settings.specEdgeFade||0),f=6+amount*Math.max(4,w*.6);
  if(amount>.001&&(settings.specEdgeFadeLeft||settings.specEdgeFadeRight)){
    const key=[w,nowX,edge,amount,settings.specSymmetric,settings.specEdgeFadeLeft,settings.specEdgeFadeRight].join('|');
    let g=cached.horizontal;
    if(cached.horizontalKey!==key){
    g=ctx.createLinearGradient(0,0,w,0);const left=clamp01(edge/w);
    const right=settings.specSymmetric?clamp01((2*nowX-edge)/w):1;
    if(settings.specEdgeFadeLeft){g.addColorStop(left,'transparent');g.addColorStop(Math.min(right,clamp01((edge+f)/w)),'black');}else g.addColorStop(0,'black');
    if(settings.specEdgeFadeRight){g.addColorStop(Math.max(left,clamp01((right*w-f)/w)),'black');g.addColorStop(right,'transparent');}else g.addColorStop(1,'black');
    cached.horizontalKey=key;cached.horizontal=g;
    }
    ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  }
  const v=clamp01(settings.specEdgeFadeVAmount??.2),vf=(6+v*44)/100;
  if(v>.001&&(settings.specEdgeFadeTop||settings.specEdgeFadeBottom)){
    const key=[h,v,settings.specEdgeFadeTop,settings.specEdgeFadeBottom].join('|');
    let g=cached.vertical;
    if(cached.verticalKey!==key){
    g=ctx.createLinearGradient(0,0,0,h);
    g.addColorStop(0,settings.specEdgeFadeTop?'transparent':'black');g.addColorStop(vf,'black');
    g.addColorStop(1-vf,'black');g.addColorStop(1,settings.specEdgeFadeBottom?'transparent':'black');
    cached.verticalKey=key;cached.vertical=g;
    }
    ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  }
  ctx.restore();
}
function resourceStats(){return {canvasBytes:4*(targets.reduce((sum,t)=>sum+t.canvas.width*t.canvas.height,0)+Spectrogram._historyCanvas.width*Spectrogram._historyCanvas.height),pixelCacheBytes:[...(Spectrogram._columnImageCache?.values()||[])].reduce((sum,img)=>sum+img.data.byteLength,0)};}
function drawFrame(){
  if(pendingSpectrum){
    const m=pendingSpectrum;pendingSpectrum=null;
    if(running&&settings.specEnabled){
      const before=Spectrogram._historyColCount;audioCtx.currentTime=m.time;
      Spectrogram.onLiveFrame(m.freq,m.freq.length,m.sampleRate,m.freq.length*2);
      if(Spectrogram._historyColCount!==before)spectrumDirty=true;
    }
  }
  if(!spectrumDirty)return false;
  spectrumDirty=false;
  for(let i=0;i<targets.length;i++){
    const t=targets[i],c=t.ctx,w=t.canvas.width,h=t.canvas.height;
    const show=settings.specEnabled&&(settings.specInsideIsland?(i===1||i===2&&settings.specInsideIslandBothPanels!==false):i===0);
    if(!show){if(!t.cleared)c.clearRect(0,0,w,h);t.cleared=true;continue;}
    t.cleared=false;c.clearRect(0,0,w,h);
    const nowX=settings.specAnchor==='center'?w/2:Math.max(0,w-(t.box.inset||0)*window.devicePixelRatio);
    c.globalAlpha=i?clamp01(settings.specIslandVisibility??1):1;
    const info=Spectrogram._blitHistory(c,w,h,nowX,!!settings.specSymmetric);
    c.globalAlpha=1;mask(c,w,h,nowX,info.oldestEdgeX);
  }
}
onmessage=({data:m})=>{
  if(m.type==='init'){
    settings=m.settings;targets=m.canvases.map(canvas=>({canvas,ctx:canvas.getContext('2d')}));
    Spectrogram._historyCanvas=new OffscreenCanvas(1,1);Spectrogram._historyCtx=Spectrogram._historyCanvas.getContext('2d');
    resize(m.layout);postMessage({type:'ready'});setActive(m.active);
  }else if(m.type==='resize')resize(m);
  else if(m.type==='reset'){pendingSpectrum=null;Spectrogram.resetForNewTrack();spectrumDirty=true;wake();}
  else if(m.type==='spectrum'){onSpectrum(m);postMessage({type:'spectrum-ack'});}
  else sharedMessage(m);
};
});

// ── workers/timeline/01-settings ──
window.Aurora.registerWorkerPart("timeline/01-settings", function(){
'use strict';
let settings = {};
const state = {isPlaying:false};
const MusicSense = {data:{bass:0,mid:0,high:0,loudnessPct:0,bpm:0,beatPhase:0,beatPulse:0,tempoConfidence:0}};
const PlayerColors = {_lastC1:'#ff2ec4',_lastC2:'#7c3aed'};
const clamp01 = v=>Math.max(0,Math.min(1,v));
let running = false, frameId = 0, frames = 0, paintFrames=0, totalFrames=0, sensePackets=0, lastReport = 0, lastFrame = 0, nextFrame = 0, maxGap = 0, cpuMs = 0;
const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame.bind(self) : fn=>setTimeout(()=>fn(performance.now()),1000/Math.max(15,Math.min(240,Number(settings.renderFps)||120)));
const caf = typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame.bind(self) : clearTimeout;
function wake(){if(running&&!frameId)frameId=raf(loop);}
function setActive(active){
  running=active;
  if(frameId) caf(frameId);
  frameId=0; lastFrame=0;nextFrame=0;
  if(active) frameId=raf(loop);
}
function loop(now){
  frameId=0;
  if(!running) return;
  const frameBudget=1000/Math.max(15,Math.min(240,Number(settings.renderFps)||120));
  if(now+.15<nextFrame){frameId=raf(loop);return;}
  nextFrame=nextFrame?nextFrame+frameBudget*(1+Math.floor(Math.max(0,now-nextFrame)/frameBudget)):now+frameBudget;
  const start=performance.now();
  if(lastFrame) maxGap=Math.max(maxGap,now-lastFrame);
  lastFrame=now;
  if(drawFrame(now)!==false)paintFrames++;
  cpuMs+=performance.now()-start;
  frames++;totalFrames++;
  if(now-lastReport>=1000){
    postMessage({type:'metrics',paintFps:paintFrames*1000/(now-lastReport),resources:typeof resourceStats==='function'?resourceStats():null,frames,totalFrames,wallTime:performance.timeOrigin+now,fps:frames*1000/(now-lastReport),cpuMs:cpuMs/frames,maxGap});
    frames=0;paintFrames=0;cpuMs=0;maxGap=0;lastReport=now;
  }
  if(playAnchor.playing||Math.abs((tlState.hovering||settings.timelineWaveformAlwaysVisible?1:0)-tlState.waveAmp)>.00001)wake();
}
function attachSense(port){
  port.onmessage=({data:m})=>{
    sensePackets++;
    Object.assign(MusicSense.data,m.sense);
    state.isPlaying=m.playing;
    if(typeof onSpectrum==='function') onSpectrum(m);
    port.postMessage('ack');
  };
  port.start();
}
function sharedMessage(m){
  if(m.type==='settings') { settings=m.settings; settingsChanged(); postMessage({type:'settings-ack'}); }
  if(m.type==='active') setActive(m.active);
  if(m.type==='sense-port') attachSense(m.port);
  if(m.type==='colors') Object.assign(PlayerColors,m.colors);
  if(m.type==='playback') state.isPlaying=m.playing;
  if(m.type==='sense'){Object.assign(MusicSense.data,m.sense);state.isPlaying=m.playing;postMessage({type:'sense-ack'});}
  if(m.type==='probe') { const started=totalFrames,samples=sensePackets;setTimeout(()=>postMessage({type:'probe',id:m.id,now:performance.now(),frames:totalFrames-started,sensePackets:sensePackets-samples}),Math.min(5000,m.delay||0)); }
}
  const TimelineWaveform = {
    data: null,
    _resampleCache: null,
    _resample(wPx){
      if(!this.data || this.data.length < 2 || wPx <= 0) return null;
      const smoothAmt = Math.max(0, Math.min(3, typeof settings.timelineWaveformSmooth === 'number' ? settings.timelineWaveformSmooth : 1));
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
});

// ── workers/timeline/02-tl-draw ──
window.Aurora.registerWorkerPart("timeline/02-tl-draw", function(){function tlDraw(){
    const canvas = progressCanvas;
    const ctx = pCtx;
    const dpr = tlState.dpr;
    const W = canvas.width;
    const H = canvas.height;
    const drawKey = [
      W, H,
      Math.round(tlState.progress * W),
      Math.round(tlState.mouseX * W),
      Math.round(tlState.waveAmp * 200),
      settings.timelineWave !== false ? 1 : 0,
      Number(settings.timelineWavePeak).toFixed(3),
      Number(settings.timelineSigma).toFixed(4),
      settings.timelineWaveSymmetry === true ? 1 : 0,
      PlayerColors._lastC1 || '',
      PlayerColors._lastC2 || ''
    ].join('|');
    if(tlState._lastDrawKey === drawKey) return;
    tlState._lastDrawKey = drawKey;
    ctx.clearRect(0, 0, W, H);
    const boxH = tlState.cachedBoxH || (H/CANVAS_HEIGHT_MULT);
    const pxScale = boxH > 0 ? H / boxH : dpr;
    const waveEnabled = settings.timelineWave !== false;
    const trackH = tlState.cachedTrackH || 4;
    const baseH = trackH * pxScale;
    const peakStrength = typeof settings.timelineWavePeak === 'number' ? settings.timelineWavePeak : 0.35;
    const sigma   = typeof settings.timelineSigma   === 'number' ? settings.timelineSigma   : 0.055;
    const bottomMargin = pxScale*0.35;
    const topSafety = pxScale*4;
    const upperH = settings.timelineWaveSymmetry === true ? (H + baseH) / 2 : H;
    const maxPeakH = upperH - bottomMargin - topSafety;
    const peakH   = Math.min(maxPeakH, upperH * 2.6 * peakStrength);
    const mu      = tlState.mouseX;
    const amp     = waveEnabled ? tlState.waveAmp : 0;
    const prog    = tlState.progress;
    const bottomY = upperH - (settings.timelineWaveSymmetry === true ? 0 : bottomMargin);
    if(amp < 0.001 || mu < 0){
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.fillRect(0, bottomY - baseH, W, baseH);
      if(prog > 0){
        const c1 = PlayerColors._lastC1 || '#ff2ec4';
        const c2 = PlayerColors._lastC2 || '#7c3aed';
        if(!tlState._gradCache || tlState._gradCache.c1 !== c1 || tlState._gradCache.c2 !== c2 || tlState._gradCache.w !== W){
          const grad = ctx.createLinearGradient(0, 0, W, 0);
          grad.addColorStop(0, c1);
          grad.addColorStop(1, c2);
          tlState._gradCache = { c1, c2, w: W, grad };
        }
        ctx.fillStyle = tlState._gradCache.grad;
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
    const symEnabled = settings.timelineWaveSymmetry === true;
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
    const c1 = PlayerColors._lastC1 || '#ff2ec4';
    const c2 = PlayerColors._lastC2 || '#7c3aed';
    if(!tlState._gradCache || tlState._gradCache.c1 !== c1 || tlState._gradCache.c2 !== c2 || tlState._gradCache.w !== W){
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, c1);
      grad.addColorStop(1, c2);
      tlState._gradCache = { c1, c2, w: W, grad };
    }
    ctx.fillStyle = tlState._gradCache.grad;
    ctx.fill();
    ctx.restore();
  }
  function waveformOverlayDraw(){
    if(!wCtx || !waveformOverlayCanvas) return;
    const W = waveformOverlayCanvas.width;
    const H = waveformOverlayCanvas.height;
    const dpr = tlState.dpr;
    const offsetPx = (tlState.wfOverlayOffsetPx || 0) * dpr;
    const padLeftPx = (tlState.wfOverlayPadLeft || 0) * dpr;
    const padRightPx = (tlState.wfOverlayPadRight || 0) * dpr;
    const trackHPx = (tlState.wfOverlayTrackH || 4) * dpr;
    const drawW = Math.max(1, W - padLeftPx - padRightPx);
    const visible = settings.timelineLoudnessWaveform !== false
      && !!TimelineWaveform.data
      && tlState.waveAmp > 0.004;
    if(!visible){
      const previous=tlState._waveformDrawCache;
      if(!previous||previous.visible||previous.W!==W||previous.H!==H)wCtx.clearRect(0,0,W,H);
      if(!previous||previous.visible||previous.W!==W||previous.H!==H)tlState._waveformDrawCache={W,H,visible:false};
      return;
    }
    const nextCache = {
      W, H, visible,
      data: TimelineWaveform.data,
      amp: Math.round(tlState.waveAmp * 200),
      progressPx: Math.round(tlState.progress * drawW),
      offsetPx, padLeftPx, padRightPx, trackHPx,
      scale: Number(settings.timelineWaveformScale).toFixed(3),
      smooth: Number(settings.timelineWaveformSmooth).toFixed(3)
    };
    const prevCache = tlState._waveformDrawCache;
    if(prevCache
      && Object.keys(nextCache).every(key => prevCache[key] === nextCache[key])){
      return;
    }
    tlState._waveformDrawCache = nextCache;
    wCtx.clearRect(0, 0, W, H);
    if(!visible) return;
    const bottomExtentPx = Math.max(0, -offsetPx);
    const trackBottomY = H - bottomExtentPx;
    const trackTopY = trackBottomY - trackHPx;
    const baselineY = trackTopY - Math.max(0, offsetPx);
    const wfH = Math.max(4, baselineY);
    const yScale = Math.max(0.1, Math.min(4, typeof settings.timelineWaveformScale === 'number' ? settings.timelineWaveformScale : 1));
    wCtx.save();
    wCtx.translate(padLeftPx, baselineY - wfH);
    TimelineWaveform.draw(wCtx, drawW, wfH, tlState.progress, tlState.waveAmp, yScale);
    wCtx.restore();
  }
let progressCanvas,pCtx,waveformOverlayCanvas,wCtx;
let tlState={waveAmp:0,progress:0,mouseX:-1,hovering:false,dpr:1};
const CANVAS_HEIGHT_MULT=4.2;
let playAnchor={position:0,duration:0,rate:1,at:0,playing:false},previousTime=0;
function settingsChanged(){delete tlState._lastDrawKey;delete tlState._waveformDrawCache;wake();}
function resize(m){
  Object.assign(tlState,m.state);
  const pairs=[[progressCanvas,m.progress],[waveformOverlayCanvas,m.waveform]];
  for(const [canvas,size] of pairs)if(canvas.width!==size.w||canvas.height!==size.h){canvas.width=Math.max(1,size.w);canvas.height=Math.max(1,size.h);}
  settingsChanged();
}
function drawFrame(now){
  const dt=previousTime?Math.min(.1,(now-previousTime)/1000):0;previousTime=now;
  if(playAnchor.playing&&!tlState.seeking&&playAnchor.duration>0){
    tlState.progress=clamp01((playAnchor.position+(now-playAnchor.at)/1000*playAnchor.rate)/playAnchor.duration);
  }
  const target=tlState.hovering||settings.timelineWaveformAlwaysVisible?1:0;
  tlState.waveAmp+=(target-tlState.waveAmp)*Math.min(1,(target?10:5)*dt);
  tlDraw();waveformOverlayDraw();
}
onmessage=({data:m})=>{
  if(m.type==='init'){
    settings=m.settings;[progressCanvas,waveformOverlayCanvas]=m.canvases;
    pCtx=progressCanvas.getContext('2d');wCtx=waveformOverlayCanvas.getContext('2d');
    resize(m.layout);postMessage({type:'ready'});setActive(m.active);
  }else if(m.type==='resize')resize(m);
  else if(m.type==='timeline'){
    Object.assign(tlState,m.state);Object.assign(PlayerColors,m.colors);
    playAnchor={...m.play,at:performance.now()};wake();
    postMessage({type:'timeline-ack'});
  }else if(m.type==='waveform'){TimelineWaveform.data=m.data;TimelineWaveform._resampleCache=null;delete tlState._waveformDrawCache;wake();}
  else sharedMessage(m);
};
});

// ── workers/dsp/01-events ──
window.Aurora.registerWorkerPart("dsp/01-events", function(){
});

// ── workers/dsp/02-tempo-tracker ──
window.Aurora.registerWorkerPart("dsp/02-tempo-tracker", function(){const TempoTracker = {
    SAMPLE_RATE: 50,
    BUFFER_SEC: 6,
    MIN_BPM: 50,
    MAX_BPM: 200,
    PREFERRED_BPM: 120,
    PREFERRED_WIDTH: 55,
    BAND_WEIGHTS: { bass: 1.0, mid: 0.55, high: 0.35 },
    _buf: null,
    _bufLen: 0,
    _writeIdx: 0,
    _filled: 0,
    _accumTime: 0,
    _flux: 0,
    _fluxFrames: 0,
    _prevBass: null, _prevMid: null, _prevHigh: null,
    _runningFluxAvg: 0,
    _candidateBpm: 0,
    _candidateRun: 0,
    _lockedBpm: 0,
    _displayBpm: 0,
    _lastAnalysisTime: 0,
    _confidence: 0,
    _periodSec: 0,
    _phaseSec: 0,
    _phaseLocked: false,
    _lastPhaseSearchTime: 0,
    _beatPulse: 0,
    reset(){
      this._bufLen = Math.round(this.SAMPLE_RATE * this.BUFFER_SEC);
      this._buf = new Float32Array(this._bufLen);
      this._writeIdx = 0;
      this._filled = 0;
      this._accumTime = 0;
      this._flux = 0;
      this._fluxFrames = 0;
      this._prevBass = null; this._prevMid = null; this._prevHigh = null;
      this._runningFluxAvg = 0;
      this._candidateBpm = 0;
      this._candidateRun = 0;
      this._lockedBpm = 0;
      this._displayBpm = this.FALLBACK_BPM;
      this._lastAnalysisTime = 0;
      this._confidence = 0;
      this._periodSec = 60/this.FALLBACK_BPM;
      this._phaseSec = 0;
      this._phaseLocked = false;
      this._lastPhaseSearchTime = 0;
      this._beatPulse = 0;
    },
    _bandFlux(analyser, prevRef, scratchRef){
      if(!analyser) return 0;
      const bins = analyser.frequencyBinCount;
      if(!prevRef.buf || prevRef.buf.length !== bins) prevRef.buf = new Uint8Array(bins);
      if(!scratchRef.buf || scratchRef.buf.length !== bins) scratchRef.buf = new Uint8Array(bins);
      const spec = scratchRef.buf;
      analyser.getByteFrequencyData(spec);
      let flux = 0;
      const prev = prevRef.buf;
      for(let i=0;i<bins;i++){
        const diff = spec[i] - prev[i];
        if(diff > 0) flux += diff;
      }
      prevRef.buf.set(spec);
      return flux / bins;
    },
    update(dtSec, bassAnalyser, sr, midAnalyser, highAnalyser){
      if(!this._buf) this.reset();
      if(!this._prevBass) this._prevBass = {buf:null};
      if(!this._prevMid) this._prevMid = {buf:null};
      if(!this._prevHigh) this._prevHigh = {buf:null};
      if(!this._scratchBass) this._scratchBass = {buf:null};
      if(!this._scratchMid) this._scratchMid = {buf:null};
      if(!this._scratchHigh) this._scratchHigh = {buf:null};
      const w = this.BAND_WEIGHTS;
      const bassFlux = this._bandFlux(bassAnalyser, this._prevBass, this._scratchBass);
      const midFlux  = this._bandFlux(midAnalyser,  this._prevMid,  this._scratchMid);
      const highFlux = this._bandFlux(highAnalyser, this._prevHigh, this._scratchHigh);
      const frameFlux = bassFlux*w.bass + midFlux*w.mid + highFlux*w.high;
      this._flux += frameFlux;
      this._fluxFrames++;
      const dt = Math.max(0, Math.min(0.25, dtSec));
      this._accumTime += dt;
      const samplePeriod = 1/this.SAMPLE_RATE;
      let pushedAny = false;
      let lastNormalized = 0;
      while(this._accumTime >= samplePeriod){
        this._accumTime -= samplePeriod;
        const avgFrameFlux = this._fluxFrames > 0 ? this._flux/this._fluxFrames : 0;
        this._flux = 0;
        this._fluxFrames = 0;
        this._runningFluxAvg = this._runningFluxAvg*0.98 + avgFrameFlux*0.02;
        const normalized = avgFrameFlux - this._runningFluxAvg;
        lastNormalized = normalized;
        this._buf[this._writeIdx] = normalized;
        this._writeIdx = (this._writeIdx + 1) % this._bufLen;
        this._filled = Math.min(this._bufLen, this._filled + 1);
        pushedAny = true;
      }
      if(this._periodSec > 0){
        this._phaseSec += dt;
        if(pushedAny && lastNormalized > this._runningFluxAvg*0.5 + 1e-6){
          const nearestBeatDist = Math.min(
            this._phaseSec % this._periodSec,
            this._periodSec - (this._phaseSec % this._periodSec)
          );
          if(nearestBeatDist < this._periodSec*0.18){
            const mod = this._phaseSec % this._periodSec;
            const toZero = mod < this._periodSec/2 ? -mod : (this._periodSec - mod);
            this._phaseSec += toZero * 0.35;
          }
        }
        this._phaseSec = ((this._phaseSec % this._periodSec) + this._periodSec) % this._periodSec;
        const phaseFrac = this._phaseSec / this._periodSec;
        const target = Math.exp(-phaseFrac * 10);
        const k = target > this._beatPulse ? 1 : (1 - Math.exp(-dt/0.12));
        this._beatPulse += (target - this._beatPulse) * (target > this._beatPulse ? 1 : k);
      } else {
        this._beatPulse *= 0.9;
      }
      const minSamplesNeeded = Math.ceil(this.SAMPLE_RATE * (60/this.MIN_BPM) * 2);
      if(pushedAny && this._filled >= minSamplesNeeded){
        const nowSec = performance.now()/1000;
        if(nowSec - this._lastAnalysisTime >= 0.4){
          this._lastAnalysisTime = nowSec;
          this._analyze();
        }
      }
    },
    _orderedBuffer(){
      const n = this._filled;
      const out = new Float32Array(n);
      const start = (this._writeIdx - n + this._bufLen*4) % this._bufLen;
      for(let i=0;i<n;i++){
        out[i] = this._buf[(start+i) % this._bufLen];
      }
      return out;
    },
    _analyze(){
      const buf = this._orderedBuffer();
      const n = buf.length;
      const minLag = Math.max(1, Math.round(this.SAMPLE_RATE * 60/this.MAX_BPM));
      const maxLag = Math.min(n-1, Math.round(this.SAMPLE_RATE * 60/this.MIN_BPM));
      if(maxLag <= minLag) return;
      let bestLag = -1, bestScore = -Infinity;
      let scoreSum = 0, scoreSumSq = 0;
      const scores = new Float32Array(maxLag - minLag + 1);
      for(let lag=minLag; lag<=maxLag; lag++){
        let sum = 0;
        const count = n - lag;
        for(let i=0;i<count;i++){
          sum += buf[i]*buf[i+lag];
        }
        let score = count > 0 ? sum/count : 0;
        const bpmAtLag = 60 / (lag/this.SAMPLE_RATE);
        const distFromPref = (bpmAtLag - this.PREFERRED_BPM) / this.PREFERRED_WIDTH;
        const prefWeight = Math.exp(-0.5*distFromPref*distFromPref);
        score *= (0.7 + 0.3*prefWeight);
        scores[lag-minLag] = score;
        scoreSum += score;
        scoreSumSq += score*score;
        if(score > bestScore){ bestScore = score; bestLag = lag; }
      }
      if(bestLag < 0) return;
      const count = scores.length;
      const mean = scoreSum / count;
      const variance = Math.max(1e-9, scoreSumSq/count - mean*mean);
      const stdDev = Math.sqrt(variance);
      const zScore = (bestScore - mean) / stdDev;
      const confidence = Math.max(0, Math.min(1, zScore / 6));
      const idx = bestLag - minLag;
      let refinedLag = bestLag;
      if(idx > 0 && idx < scores.length-1){
        const s0 = scores[idx-1], s1 = scores[idx], s2 = scores[idx+1];
        const denom = (s0 - 2*s1 + s2);
        if(Math.abs(denom) > 1e-9){
          const offset = 0.5*(s0-s2)/denom;
          if(offset > -1 && offset < 1) refinedLag = bestLag + offset;
        }
      }
      let candidateBpm = 60 / (refinedLag/this.SAMPLE_RATE);
      if(this._lockedBpm > 0){
        const ratios = [1, 2, 0.5, 3, 1/3, 1.5, 2/3];
        let bestRatioBpm = candidateBpm, bestRatioDist = Infinity;
        for(const r of ratios){
          const folded = candidateBpm * r;
          if(folded < this.MIN_BPM || folded > this.MAX_BPM) continue;
          const dist = Math.abs(folded - this._lockedBpm) / this._lockedBpm;
          if(dist < bestRatioDist){ bestRatioDist = dist; bestRatioBpm = folded; }
        }
        if(bestRatioDist < 0.06) candidateBpm = bestRatioBpm;
      }
      const TOLERANCE = 0.035;
      const MIN_CONFIDENCE_TO_COUNT = this._lockedBpm > 0 ? 0.22 : 0.12;
      const confidentEnough = confidence >= MIN_CONFIDENCE_TO_COUNT;
      if(confidentEnough && this._candidateBpm > 0 && Math.abs(candidateBpm - this._candidateBpm)/this._candidateBpm < TOLERANCE){
        this._candidateRun++;
        this._candidateBpm += (candidateBpm - this._candidateBpm) * 0.25;
      } else if(confidentEnough){
        this._candidateBpm = candidateBpm;
        this._candidateRun = 1;
      }
      const REQUIRED_RUN = this._lockedBpm > 0 ? 4 : 3;
      if(confidentEnough && this._candidateRun >= REQUIRED_RUN){
        const bpmChanged = Math.abs(this._candidateBpm - this._lockedBpm) > 1e-6;
        this._lockedBpm = this._candidateBpm;
        this._confidence = confidence;
        const newPeriod = 60/this._lockedBpm;
        if(Math.abs(newPeriod - this._periodSec) > 1e-6){
          this._periodSec = newPeriod;
          this._searchPhase(buf);
        } else if(bpmChanged){
          this._periodSec = newPeriod;
        }
      }
      if(this._periodSec > 0){
        const nowSec2 = performance.now()/1000;
        if(nowSec2 - this._lastPhaseSearchTime > 4){
          this._lastPhaseSearchTime = nowSec2;
          this._searchPhase(buf);
        }
      }
    },
    _searchPhase(buf){
      if(this._periodSec <= 0 || !buf.length) return;
      const periodSamples = this._periodSec * this.SAMPLE_RATE;
      if(periodSamples < 2) return;
      const CANDIDATES = 24;
      let bestOffset = 0, bestScore = -Infinity;
      const lookback = Math.min(buf.length, Math.round(periodSamples * 8));
      const start = buf.length - lookback;
      for(let c=0;c<CANDIDATES;c++){
        const offsetSamples = (c/CANDIDATES) * periodSamples;
        let score = 0;
        for(let pos = buf.length - 1 - offsetSamples; pos >= start; pos -= periodSamples){
          const i0 = Math.floor(pos);
          if(i0 < 0 || i0 >= buf.length) continue;
          score += buf[i0];
          if(i0+1 < buf.length) score += buf[i0+1]*0.5;
          if(i0-1 >= 0) score += buf[i0-1]*0.5;
        }
        if(score > bestScore){ bestScore = score; bestOffset = offsetSamples; }
      }
      const offsetSec = bestOffset / this.SAMPLE_RATE;
      this._phaseSec = ((offsetSec % this._periodSec) + this._periodSec) % this._periodSec;
      this._phaseLocked = true;
    },
    FALLBACK_BPM: 120,
    getBpm(dtSec){
      const target = this._lockedBpm > 0 ? this._lockedBpm : this.FALLBACK_BPM;
      const k = 1 - Math.exp(-Math.max(0,dtSec)/0.6);
      this._displayBpm += (target - this._displayBpm) * k;
      if(this._displayBpm < 1) this._displayBpm = this.FALLBACK_BPM;
      if(this._lockedBpm <= 0){
        this._periodSec = 60/this._displayBpm;
      }
      return this._displayBpm;
    },
    getBeatPhase(){
      if(this._periodSec <= 0) return 0;
      return this._phaseSec / this._periodSec;
    },
    getBeatPulse(){
      return this._beatPulse;
    },
    getConfidence(){
      return this._confidence;
    }
  };
});

// ── workers/dsp/03-settings ──
window.Aurora.registerWorkerPart("dsp/03-settings", function(){let settings={},playing=false,active=true,source,previousTime=0;
const sinks=[],fftCache=new Map(),fftPlans=new Map(),smoothed={},visualizerWave=new Float32Array(260);
// The three tempo bands share the immutable FFT plan. Sample/smoothing state
// remains separate; changing tracks can reset it without reallocating tables.
function fftPlan(n){
  let a=fftPlans.get(n);if(a)return a;
  a={window:new Float32Array(n),reverse:new Uint32Array(n),stages:[]};
  for(let i=0;i<n;i++)a.window[i]=.42-.5*Math.cos(2*Math.PI*i/n)+.08*Math.cos(4*Math.PI*i/n);
  for(let i=0,j=0;i<n;i++){if(i){let bit=n>>1;while(j&bit){j^=bit;bit>>=1;}j^=bit;}a.reverse[i]=j;}
  for(let len=2;len<=n;len<<=1){
    const angle=-2*Math.PI/len,wr=Math.cos(angle),wi=Math.sin(angle),re=new Float64Array(len/2),im=new Float64Array(len/2);
    for(let j=0,tr=1,ti=0;j<len/2;j++){re[j]=tr;im[j]=ti;const next=tr*wr-ti*wi;ti=tr*wi+ti*wr;tr=next;}
    a.stages.push({re,im});
  }
  fftPlans.set(n,a);return a;
}
function fft(samples,slot,smoothing=0){
  const n=samples.length,key=n+'|'+slot;
  let a=fftCache.get(key);
  if(!a){a={...fftPlan(n),re:new Float64Array(n),im:new Float64Array(n),last:new Float32Array(n/2),bytes:new Uint8Array(n/2),visualLevels:slot==='main'?new Float32Array(n/2):null};fftCache.set(key,a);}
  for(let i=0;i<n;i++){const j=a.reverse[i];a.re[j]=samples[i]*a.window[i];a.im[j]=0;}
  for(let len=2,stage=0;len<=n;len<<=1,stage++){
    const twiddle=a.stages[stage];
    for(let start=0;start<n;start+=len){
      for(let j=0;j<len/2;j++){
        const tr=twiddle.re[j],ti=twiddle.im[j];
        const u=start+j,v=u+len/2,re=a.re[v]*tr-a.im[v]*ti,im=a.re[v]*ti+a.im[v]*tr;
        a.re[v]=a.re[u]-re;a.im[v]=a.im[u]-im;a.re[u]+=re;a.im[u]+=im;
      }
    }
  }
  for(let i=0;i<n/2;i++){
    const magnitude=Math.hypot(a.re[i],a.im[i])/n;
    // Keep visual dynamics above -30 dB; byte spectra saturate there.
    if(slot==='main')a.visualLevels[i]=Math.max(0,Math.min(1,(20*Math.log10(Math.max(1e-12,magnitude))+80)/80));
    a.last[i]=a.last[i]*smoothing+magnitude*(1-smoothing);
    const db=20*Math.log10(Math.max(1e-12,a.last[i]));
    a.bytes[i]=Math.max(0,Math.min(255,(db+100)/70*255));
  }
  return a.bytes;
}
function db(samples){let sum=0;for(let i=0;i<samples.length;i++)sum+=samples[i]*samples[i];return 10*Math.log10(sum/samples.length+1e-12);}
function sinkMessage(sink,message){
  const packet={sense:message.sense,playing:message.playing,time:message.time};
  if(sink.visualizer){
    if(settings.vizMode==='wave')packet.wave=message.wave;
    else packet.visualFreq=message.visualFreq||message.freq;
    packet.sampleRate=message.sampleRate;
  }else if(sink.spectrum&&settings.specEnabled!==false){packet.freq=message.freq;packet.sampleRate=message.sampleRate;}
  return packet;
}
function broadcast(message){
  for(const sink of sinks){
    if(sink.visualizer&&(settings.vizMode==='none'||settings.vizOpacity===0)){sink.pending=null;continue;}
    if(sink.busy){sink.pending=message;continue;}
    sink.busy=true;
    sink.port.postMessage(sinkMessage(sink,message));
  }
}
function reset(){TempoTracker.reset();previousTime=0;for(const a of fftCache.values())a.last.fill(0);for(const k of Object.keys(smoothed))delete smoothed[k];}
function samples(m){
  try{
    if(!playing||!active)return;
    const all=new Float32Array(m.buffer),n=m.fftSize,main=all.subarray(0,n);
    const bands=[0,1,2].map(i=>all.subarray(n+i*1024,n+(i+1)*1024));
    const freq=fft(main,'main',settings.smoothing??.75),bandFreq=bands.map((b,i)=>fft(b,i));
    const dt=previousTime?Math.min(.25,Math.max(0,m.time-previousTime)):.02;previousTime=m.time;
    const toPct=value=>Math.max(0,Math.min(1,(value-settings.loudFloorDb)/Math.max(.001,settings.loudCeilDb-settings.loudFloorDb)))*100;
    const gain=s=>s>0?20*Math.log10(s):-60;
    const sense={loudnessPct:toPct(db(main.subarray(n/2)))};
    ['bass','mid','high'].forEach((key,i)=>sense[key]=toPct(db(bands[i])+gain(settings[['sensBass','sensMid','sensHigh'][i]])+gain(settings.globalSens)));
    const smooth=1-Math.pow(1-Math.max(.001,Math.min(1,settings.senseSmooth??.4)),dt*60);
    for(const key of ['bass','mid','high','loudnessPct']){smoothed[key]=(smoothed[key]||0)+(sense[key]-(smoothed[key]||0))*smooth;sense[key]=smoothed[key];}
    const taps=bandFreq.map(f=>({frequencyBinCount:f.length,getByteFrequencyData:out=>out.set(f)}));
    TempoTracker.update(dt,taps[0],m.sampleRate,taps[1],taps[2]);
    Object.assign(sense,{bpm:TempoTracker.getBpm(dt),beatPhase:TempoTracker.getBeatPhase(),beatPulse:TempoTracker.getBeatPulse(),tempoConfidence:TempoTracker.getConfidence()});
    let wave;
    if(settings.vizMode==='wave'&&settings.vizOpacity!==0&&sinks.some(s=>s.visualizer)){wave=visualizerWave;for(let i=0;i<260;i++)wave[i]=main[Math.floor(i/259*(n-1))];}
    broadcast({sense,freq,wave,visualFreq:sinks.some(s=>s.visualizer)?fftCache.get(n+'|main')?.visualLevels:undefined,sampleRate:m.sampleRate,time:m.time,playing:true});
  }finally{source.postMessage({buffer:m.buffer},[m.buffer]);}
}
onmessage=({data:m})=>{
  if(m.type==='settings'){settings=m.settings;postMessage({type:'settings-ack'});}
  if(m.type==='connect'){
    source=m.port;source.onmessage=({data:m})=>samples(m);source.start();
    for(let i=0;i<2;i++){const buffer=new ArrayBuffer((8192+3072)*4);source.postMessage({buffer},[buffer]);}
    postMessage({type:'ready'});
  }
  if(m.type==='sink'){
    const sink={port:m.port,spectrum:m.spectrum,visualizer:m.visualizer,busy:false};
    sink.port.onmessage=({data})=>{
      if(data?.type==='demand'){sink.spectrum=!!data.spectrum;return;}
      sink.busy=false;
      if(sink.pending){const message=sink.pending;sink.pending=null;sink.busy=true;sink.port.postMessage(sinkMessage(sink,message));}
    };
    sink.port.start();sinks.push(sink);
  }
  if(m.type==='active'){active=m.active;previousTime=0;}
  if(m.type==='playback'){
    playing=m.playing;if(m.reset)reset();
    if(!playing)broadcast({sense:{bass:0,mid:0,high:0,loudnessPct:0,bpm:0,beatPhase:0,beatPulse:0,tempoConfidence:0},playing:false,time:0});
  }
};
});

// ── workers/background ──
window.Aurora.registerWorker("background", [
  "background/01-settings",
  "background/02-mapping-engine",
  "background/03-round-polygon-path",
  "background/04-trail-fx",
  "background/05-bg-react",
  "background/06-canvas"
]);

// ── workers/spectrum ──
window.Aurora.registerWorker("spectrum", [
  "spectrum/01-settings",
  "spectrum/02-spectrogram",
  "spectrum/03-targets"
]);

// ── workers/timeline ──
window.Aurora.registerWorker("timeline", [
  "timeline/01-settings",
  "timeline/02-tl-draw"
]);

// ── workers/dsp ──
window.Aurora.registerWorker("dsp", [
  "dsp/01-events",
  "dsp/02-tempo-tracker",
  "dsp/03-settings"
]);

// ── workers/analysis ──
window.Aurora.registerWorker("analysis", function(){
// Same high-shelf/high-pass parameters as createKWeightingFilters.
// Coefficients: https://www.w3.org/TR/webaudio-1.0/#filters-characteristics
function weightInPlace(channels,sampleRate){
  const normalize=(b0,b1,b2,a0,a1,a2)=>[b0/a0,b1/a0,b2/a0,a1/a0,a2/a0];
  const A=Math.pow(10,4/40),w=2*Math.PI*Math.min(1500,sampleRate/2)/sampleRate,c=Math.cos(w),t=Math.sin(w)*Math.SQRT2*Math.sqrt(A);
  const shelf=normalize(A*((A+1)+(A-1)*c+t),-2*A*((A-1)+(A+1)*c),A*((A+1)+(A-1)*c-t),(A+1)-(A-1)*c+t,2*((A-1)-(A+1)*c),(A+1)-(A-1)*c-t);
  const hpw=2*Math.PI*Math.min(38,sampleRate/2)/sampleRate,hpc=Math.cos(hpw),alpha=Math.sin(hpw)/(2*Math.pow(10,.5/20));
  const highpass=normalize((1+hpc)/2,-(1+hpc),(1+hpc)/2,1+alpha,-2*hpc,1-alpha);
  for(const channel of channels){
    for(const [b0,b1,b2,a1,a2] of [shelf,highpass]){
      let x1=0,x2=0,y1=0,y2=0;
      for(let i=0;i<channel.length;i++){
        const x=channel[i],y=b0*x+b1*x1+b2*x2-a1*y1-a2*y2;
        channel[i]=y;x2=x1;x1=x;y2=y1;y1=y;
      }
    }
  }
}
function analyze(channels, sampleRate, settings){
const rendered={length:channels[0].length,duration:channels[0].length/sampleRate}; const onProgress=null;
    const blockSize = Math.floor(sampleRate * 0.4);
    const hop = Math.floor(blockSize * 0.25);
    const numBlocks = Math.max(0, Math.floor((rendered.length - blockSize) / hop) + 1);
    const blockLoudness = [];
    for(let b=0; b<numBlocks; b++){
      const start = b*hop;
      let sumSquares = 0;
      for(let c=0;c<channels.length;c++){
        const data = channels[c];
        let s = 0;
        for(let i=start;i<start+blockSize;i+=4){
          const v = data[i] || 0;
          s += v*v;
        }
        sumSquares += s / (blockSize/4);
      }
      const meanSquare = sumSquares / channels.length;
      const loudness = -0.691 + 10*Math.log10(meanSquare + 1e-12);
      blockLoudness.push(loudness);
    }
    onProgress && onProgress(95);
    let integrated;
    if(!blockLoudness.length){
      integrated = -23;
    } else {
      const absGated = blockLoudness.filter(l => l > -70);
      if(!absGated.length){
        integrated = -23;
      } else {
        const meanAbs = absGated.reduce((a,b)=>a+b,0)/absGated.length;
        const relThresh = meanAbs - 10;
        const relGated = absGated.filter(l => l > relThresh);
        const finalSet = relGated.length ? relGated : absGated;
        integrated = finalSet.reduce((a,b)=>a+b,0)/finalSet.length;
      }
    }
    const normDiffDb = settings.targetLufs - integrated;
    const normClampedDb = Math.max(-24, Math.min(24, normDiffDb));
    const normLinearGain = settings.normalize ? Math.pow(10, normClampedDb/20) : 1;
    const normGainSq = normLinearGain * normLinearGain;
    const samplesPerSec = Math.max(0.2, Math.min(8, typeof settings.timelineWaveformSamplesPerSec === 'number' ? settings.timelineWaveformSamplesPerSec : 1));
    const secSamples = Math.max(1, Math.round((rendered.duration || (rendered.length/sampleRate)) * samplesPerSec));
    const secLen = Math.max(1, Math.floor(rendered.length / secSamples));
    const waveformDb = new Array(secSamples);
    for(let s=0; s<secSamples; s++){
      const start = s*secLen;
      const end = Math.min(rendered.length, start+secLen);
      let sumSquares = 0;
      let n = 0;
      for(let c=0;c<channels.length;c++){
        const data = channels[c];
        let sq = 0;
        for(let i=start;i<end;i+=8){ const v = data[i]||0; sq += v*v; n++; }
        sumSquares += sq;
      }
      const meanSquare = (n>0 ? sumSquares/n : 0) * normGainSq;
      waveformDb[s] = -0.691 + 10*Math.log10(meanSquare + 1e-12);
    }
    onProgress && onProgress(100);
    return { lufs: integrated, waveformDb };
}
onmessage=({data:m})=>{try{if(m.weightRaw)weightInPlace(m.channels,m.sampleRate);postMessage({id:m.id,result:analyze(m.channels,m.sampleRate,m.settings)});}catch(e){postMessage({id:m.id,error:e.message});}finally{m.channels=null;}};
});

// ── workers/worklet ──
window.Aurora.registerWorker("worklet", function(){
class AuroraCapture extends AudioWorkletProcessor{
  constructor(){
    super();this.ring=new Float32Array(8192+3072);this.index=0;this.elapsed=0;this.fftSize=2048;this.active=true;this.buffers=[];
    this.port.onmessage=({data:m})=>{
      if(m.type==='connect'){
        this.sink=m.port;
        this.sink.onmessage=({data:r})=>{if(r.buffer)this.buffers.push(r.buffer);};
      }
      if(m.type==='settings')this.fftSize=m.fftSize;
      if(m.type==='active')this.active=m.active;
      if(m.type==='dispose'){
        this.disposed=true;this.active=false;this.buffers.length=0;
        if(this.sink){this.sink.onmessage=null;this.sink.close();this.sink=null;}
        this.port.onmessage=null;
      }
    };
  }
  process(inputs){
    if(this.disposed)return false;
    if(!this.active){this.elapsed=0;return true;}
    const count=inputs[0]?.[0]?.length||128;
    for(let i=0;i<count;i++){
      for(let band=0;band<4;band++){
        const input=inputs[band];let value=0;
        if(input?.length){for(let c=0;c<input.length;c++)value+=input[c][i]||0;value/=input.length;}
        const length=band?1024:8192,offset=band?8192+(band-1)*1024:0;
        this.ring[offset+(this.index%length)]=value;
      }
      this.index++;
    }
    this.elapsed+=count;
    if(this.elapsed>=sampleRate/50){
      this.elapsed%=Math.round(sampleRate/50);
      if(this.active&&this.sink&&this.buffers.length){
        const buffer=this.buffers.pop(),out=new Float32Array(buffer),n=this.fftSize;
        for(let band=0;band<4;band++){
          const length=band?1024:n,ringLength=band?1024:8192,offset=band?8192+(band-1)*1024:0,outOffset=band?n+(band-1)*1024:0;
          for(let i=0;i<length;i++)out[outOffset+i]=this.ring[offset+((this.index-length+i)&(ringLength-1))];
        }
        this.sink.postMessage({type:'samples',buffer,fftSize:n,sampleRate,time:currentTime},[buffer]);
      }
    }
    return true;
  }
}
registerProcessor('aurora-capture',AuroraCapture);
});

// ── workers/library ──
window.Aurora.registerWorker("library", function(){
let index=[];
const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
onmessage=({data:m})=>{
  try{
    if(m.type==='index'){index=m.tracks.map(t=>normalize(t.name+' '+t.artist+' '+(t.filename||'')));return;}
    if(m.type==='parse'){App.settings.smartTitleParsing=m.smart;postMessage({id:m.id,result:m.names.map(App.parseNameArtist)});}
    if(m.type==='search'){
      const found=[],tokens=normalize(m.query).trim().split(/\s+/).filter(Boolean);
      for(let i=0;i<index.length;i++)if(tokens.every(token=>index[i].includes(token)))found.push(i);
      postMessage({id:m.id,result:found});
    }
  }catch(e){postMessage({id:m.id,error:e.message});}
};
});
