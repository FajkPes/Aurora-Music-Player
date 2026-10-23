/* settings.js — Výchozí nastavení, obsluha všech editorů, ukládání a import/export nastavení. */

// ── core/settings ──
(function(App){
// One merge path for startup, import and reset. Invalid stored types fall back
// per value instead of breaking the entire application during initialization.
App.mergeSettings = function mergeSettings(incoming){
    const clone=value=>JSON.parse(JSON.stringify(value));
    const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
    function merge(def,value,key){
      if(Array.isArray(def)){
        if(!Array.isArray(value))return clone(def);
        if(key==='bgLayers')return def.map((layer,i)=>merge(layer,value[i],'layer'));
        if(key==='curvePoints')return value.filter(p=>object(p)&&Number.isFinite(p.x)&&Number.isFinite(p.y)).slice(0,3).map(p=>({x:Math.max(.04,Math.min(.96,p.x)),y:Math.max(-.15,Math.min(1.15,p.y))})).sort((a,b)=>a.x-b.x);
        return clone(value);
      }
      if(object(def)){
        if(key.startsWith('bgMap')||['size','speed','flash','colorSpeed','blur'].includes(key))def={colorMode:'cycle',customColor:'#ff2ec4',curve:1,...def};
        // An explicit empty override object means "use the global mapping".
        const result=key==='overrides'&&object(value)?{}:clone(def);
        if(object(value))for(const name of Object.keys(value)){
          if(['__proto__','constructor','prototype'].includes(name))continue;
          if(Object.hasOwn(def,name))result[name]=merge(def[name],value[name],name);
          else if(key==='overrides'&&['size','speed','flash','colorSpeed','blur'].includes(name)&&object(value[name]))result[name]=merge(App.defaultSettings['bgMap'+name[0].toUpperCase()+name.slice(1)],value[name],name);
        }
        return result;
      }
      return typeof value===typeof def&&(typeof def!=='number'||Number.isFinite(value))?value:def;
    }
    return merge(App.defaultSettings,incoming,'settings');
  };
App.loadSettings = function loadSettings(){
    try{
      const raw = localStorage.getItem(App.STORAGE_KEY);
      if(!raw) return JSON.parse(JSON.stringify(App.defaultSettings));
      const parsed = JSON.parse(raw);
      const merged = App.mergeSettings(parsed);
      if(!["clear","light","glow","none"].includes(parsed.islandHover)) merged.islandHover=merged.hoverClear?"clear":"none";
      if(parsed.vizStyleVersion!==2){
        const previous={vizEqGain:1.2,vizEqHeight:.45,vizWaveWidth:.8,vizWaveLine:2,vizRingCount:96,vizRingSpeed:.12};
        for(const [key,oldValue] of Object.entries(previous))if(parsed[key]===oldValue)merged[key]=App.defaultSettings[key];
        merged.vizStyleVersion=2;
      }
      if(parsed.vizBrightnessVersion!==1){
        if(parsed.vizOpacity===.65)merged.vizOpacity=1;
        merged.vizBrightnessVersion=1;
      }
      return merged;
    } catch(e){
      return JSON.parse(JSON.stringify(App.defaultSettings));
    }
  };
App.saveSettings = function saveSettings(){
    App._settingsDirty=true;
    App.VisualRenderState?.refresh();
    App.refreshSceneEffects?.();
    if(App.Threads) App.Threads.settingsChanged();
    if(App._saveSettingsTimer) clearTimeout(App._saveSettingsTimer);
    App._saveSettingsTimer = setTimeout(App._flushSettings, 250);
  };
App._flushSettings = function _flushSettings(){
    App._saveSettingsTimer = null;
    const status=App.el?.('settingsSaveStatus');
    try{
      localStorage.setItem(App.STORAGE_KEY, JSON.stringify(App.settings));
      App._settingsDirty=false;
      if(status){status.removeAttribute('data-save-error');status.textContent=App.SettingsUI?.text('Změny uloženy','Changes saved')||'Changes saved';}
    } catch(e){
      if(status){status.dataset.saveError='true';status.textContent=App.SettingsUI?.text('Uložení selhalo — exportujte nastavení','Save failed — export your settings')||'Save failed — export your settings';}
      console.warn('Aurora: settings could not be saved',e);
    }
  };
App.ensureTempoSyncDefaults = function ensureTempoSyncDefaults(map){
    if(!map) return;
    const defs = App.defaultSettings.bgMapSpeed;
    if(map.tempoSync === undefined) map.tempoSync = defs.tempoSync;
    if(map.tempoSens === undefined) map.tempoSens = defs.tempoSens;
    if(map.tempoMultMin === undefined) map.tempoMultMin = defs.tempoMultMin;
    if(map.tempoMultMax === undefined) map.tempoMultMax = defs.tempoMultMax;
    if(map.tempoBpmMin === undefined) map.tempoBpmMin = defs.tempoBpmMin;
    if(map.tempoBpmMax === undefined) map.tempoBpmMax = defs.tempoBpmMax;
  };
App.ensureColorModeDefaults = function ensureColorModeDefaults(map){
    if(!map) return;
    if(map.colorMode === undefined) map.colorMode = 'cycle';
    if(map.customColor === undefined) map.customColor = '#ff2ec4';
  };
App.ensureSmoothDefaults = function ensureSmoothDefaults(map){
    if(!map) return;
    if(map.smoothAmount === undefined) map.smoothAmount = 0;
  };
  App.define("core/settings", function initialize(){
App.THREAD_SUPPORT = typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined" && !!HTMLCanvasElement.prototype.transferControlToOffscreen;
App.Threads = null;
App.WORKER_SOURCES = App.workerSources;
App.STORAGE_KEY = 'musicviz-settings-v1';
// Canonical factory preset: musicviz-nastaveni-2026-10-01.json.
// Inline data keeps direct file:// startup working without fetch/server access.
App.DEFAULT_SETTINGS_PRESET = "2026-10-01";
App.defaultSettings = {
  "normalize": true,
  "shuffleEnabled": false,
  "repeatEnabled": false,
  "repeatOne": false,
  "autoplayOnImport": true,
  "randomFirstTrack": true,
  "smartTitleParsing": true,
  "targetLufs": -14,
  "loudFloorDb": -45,
  "loudCeilDb": -11,
  "sensBass": 1,
  "sensMid": 1.6,
  "sensHigh": 2.2,
  "globalSens": 1,
  "fftIdx": 2,
  "smoothing": 0.75,
  "senseSmooth": 0.4,
  "fontBody": "Plus Jakarta Sans",
  "fontDisplay": "Space Grotesk",
  "fontMono": "JetBrains Mono",
  "panelAlpha": 0.72,
  "timelineLoudnessWaveform": true,
  "timelineWaveformAlwaysVisible": true,
  "cacheWaveform": false,
  "timelineWaveformHeight": 2,
  "timelineWaveformOffset": 0,
  "timelineWaveformScale": 2,
  "timelineWaveformSamplesPerSec": 1.5,
  "timelineWaveformSmooth": 1,
  "timelineWave": true,
  "timelineWavePeak": 1,
  "timelineWaveSymmetry": false,
  "timelineSigma": 0.022,
  "ctrlChipsEnabled": true,
  "ctrlChipAlpha": 0.78,
  "ctrlChipBlur": 0,
  "ctrlChipRadius": 30,
  "timelineIslandHeight": 30,
  "timelineIslandGap": 14,
  "timelineIslandMerged": true,
  "timelineIslandInset": 14,
  "timelineIslandOverlap": 0,
  "timelineTimeLabelEnabled": true,
  "timelineTimeLabelSide": "right",
  "ctrlBarTimeLabelEnabled": true,
  "ctrlBarTrackInfoEnabled": true,
  "ctrlBarLikedOutlineHoverOnly": true,
  "stageTrackInfoEnabled": true,
  "stageLikedOutlineHoverOnly": false,
  "stageLikedOutlinePulse": true,
  "stageLikedOutlinePulseSource": "mid",
  "stageLikedOutlinePulseSensitivity": 1,
  "stageLikedOutlinePulseFloor": 20,
  "liveStatsIslandEnabled": true,
  "playerColorSync": true,
  "playerColor1": "#ff2ec4",
  "playerColor2": "#7c3aed",
  "playerSyncThumbs": true,
  "playerSyncPlayBtn": true,
  "playerSyncGear": false,
  "playerSyncScanline": true,
  "bgEnabled": true,
  "reduceFlashIntensity": false,
  "reduceColorSpeedIntensity": false,
  "bgColor1": "#0091ff",
  "bgColor2": "#ff00ae",
  "bgBaseDrift": 1,
  "bgLayers": [
    {
      "enabled": true,
      "shape": "circle",
      "count": 8,
      "size": 1,
      "rotation": 23,
      "baseAlpha": 0.21,
      "blurEnabled": true,
      "blur": 100,
      "sensMult": 1,
      "pathEnabled": false,
      "path": "random",
      "swayAmount": 0.02,
      "opacity": 1,
      "rotationWobble": false,
      "trailEnabled": false,
      "trailLength": 0.05,
      "trailWidth": 0.7,
      "sparklesEnabled": false,
      "mirrorEnabled": true,
      "cornerRadius": 0,
      "beatCutEnabled": false,
      "beatCutThreshold": 95,
      "beatCutSustainSec": 0.1,
      "beatCutDarkness": 0.3,
      "beatCutDuration": 200,
      "beatCutMinConfidence": 0.35,
      "beatCutFallbackBpm": 120,
      "overrides": {
        "blur": {
          "source": "loudnessPct",
          "sensitivity": 0.3,
          "enabled": false,
          "curvePoints": [
            {
              "x": 0.7068273092369478,
              "y": 0.08895582329317264
            },
            {
              "x": 0.8032128514056225,
              "y": 0.41666666666666663
            },
            {
              "x": 0.9116465863453815,
              "y": 0.1275100401606426
            }
          ],
          "clamp": true,
          "clampMin": 0,
          "clampMax": 1,
          "normalize": false,
          "normMin": 0,
          "normMax": 1,
          "boost": true,
          "boostThreshold": 0.8,
          "boostAmount": 0.1,
          "smoothAmount": 0,
          "curve": 3
        }
      }
    },
    {
      "enabled": true,
      "shape": "crosshair",
      "count": 8,
      "size": 0.2,
      "rotation": 135,
      "baseAlpha": 0,
      "blurEnabled": false,
      "blur": 5,
      "sensMult": 1,
      "pathEnabled": true,
      "path": "fall",
      "swayAmount": 0.01,
      "opacity": 0.06,
      "rotationWobble": true,
      "trailEnabled": false,
      "trailLength": 0.05,
      "trailWidth": 1.35,
      "sparklesEnabled": true,
      "mirrorEnabled": false,
      "cornerRadius": 0.4,
      "beatCutEnabled": true,
      "beatCutThreshold": 90,
      "beatCutSustainSec": 0.1,
      "beatCutDarkness": 0.7,
      "beatCutDuration": 400,
      "beatCutMinConfidence": 0.35,
      "beatCutFallbackBpm": 120,
      "overrides": {
        "flash": {
          "source": "high",
          "sensitivity": 1.02,
          "enabled": true,
          "curvePoints": [
            {
              "x": 0.5287769784172662,
              "y": 0.12275179856115104
            },
            {
              "x": 0.6693548387096774,
              "y": 0.42993951612903225
            },
            {
              "x": 0.8467741935483871,
              "y": 0.7654233870967742
            }
          ],
          "clamp": true,
          "clampMin": 0,
          "clampMax": 0.78,
          "normalize": true,
          "normMin": 0,
          "normMax": 100,
          "boost": true,
          "boostThreshold": 0.55,
          "boostAmount": 2,
          "curve": 5,
          "smoothAmount": 0.05
        },
        "colorSpeed": {
          "source": "high",
          "sensitivity": 2,
          "enabled": true,
          "curvePoints": [
            {
              "x": 0.4497991967871486,
              "y": 0.08775100401606428
            },
            {
              "x": 0.8084415584415584,
              "y": 0.2517857142857143
            },
            {
              "x": 0.9058441558441559,
              "y": 0.4751623376623376
            }
          ],
          "clamp": false,
          "clampMin": 0,
          "clampMax": 1,
          "normalize": false,
          "normMin": 0,
          "normMax": 1,
          "boost": false,
          "boostThreshold": 0.9,
          "boostAmount": 0.1,
          "curve": 2.063177067680795,
          "tempoSync": false,
          "tempoSens": 1,
          "tempoMultMin": 0,
          "tempoMultMax": 1,
          "tempoBpmMin": 0,
          "tempoBpmMax": 250,
          "colorMode": "player",
          "customColor": "#000000",
          "smoothAmount": 0
        },
        "size": {
          "source": "high",
          "sensitivity": 0.3,
          "enabled": true,
          "curvePoints": [
            {
              "x": 0.5287769784172662,
              "y": 0.1817446043165467
            },
            {
              "x": 0.7697841726618705,
              "y": 0.6824640287769784
            },
            {
              "x": 0.8920863309352518,
              "y": 0.7572841726618705
            }
          ],
          "clamp": false,
          "clampMin": 0,
          "clampMax": 0.92,
          "normalize": false,
          "normMin": 0,
          "normMax": 100,
          "boost": true,
          "boostThreshold": 0.85,
          "boostAmount": 0.5,
          "curve": 2.846626597125765,
          "smoothAmount": 0.01
        },
        "speed": {
          "source": "high",
          "sensitivity": 2.81,
          "enabled": true,
          "curvePoints": [
            {
              "x": 0.5215827338129496,
              "y": 0.5098021582733813
            },
            {
              "x": 0.7050359712230215,
              "y": 0.4867805755395683
            }
          ],
          "clamp": true,
          "clampMin": 0,
          "clampMax": 1,
          "normalize": false,
          "normMin": 0,
          "normMax": 100,
          "boost": true,
          "boostThreshold": 0.7,
          "boostAmount": 0.4,
          "tempoSync": false,
          "tempoSens": 1,
          "tempoMultMin": 0.3,
          "tempoMultMax": 1,
          "tempoBpmMin": 0,
          "tempoBpmMax": 250,
          "curve": 3.0851693136000478,
          "smoothAmount": 0.1
        }
      }
    },
    {
      "enabled": false,
      "shape": "square",
      "count": 24,
      "size": 0.3,
      "rotation": 0,
      "baseAlpha": 0,
      "blurEnabled": false,
      "blur": 135,
      "sensMult": 0.3,
      "pathEnabled": false,
      "path": "random",
      "swayAmount": 0.02,
      "opacity": 0.52,
      "rotationWobble": false,
      "trailEnabled": false,
      "trailLength": 0.43,
      "trailWidth": 1,
      "sparklesEnabled": false,
      "mirrorEnabled": false,
      "cornerRadius": 0,
      "beatCutEnabled": false,
      "beatCutThreshold": 97,
      "beatCutSustainSec": 1.2,
      "beatCutDarkness": 0.7,
      "beatCutDuration": 90,
      "beatCutMinConfidence": 0.35,
      "beatCutFallbackBpm": 120,
      "overrides": {
        "size": {
          "source": "mid",
          "sensitivity": 0.84,
          "enabled": true,
          "curvePoints": [
            {
              "x": 0.6103896103896104,
              "y": 0.27516233766233766
            },
            {
              "x": 0.7871485943775101,
              "y": 0.4576305220883534
            },
            {
              "x": 0.9123376623376623,
              "y": 0.5660714285714286
            }
          ],
          "clamp": false,
          "clampMin": 0,
          "clampMax": 0.96,
          "normalize": false,
          "normMin": 0,
          "normMax": 100,
          "boost": false,
          "boostThreshold": 0.8,
          "boostAmount": 0.5,
          "smoothAmount": 0.01,
          "curve": 2.846626597125765
        }
      }
    },
    {
      "enabled": false,
      "shape": "diamond",
      "count": 4,
      "size": 0.2,
      "rotation": 0,
      "baseAlpha": 0,
      "blurEnabled": false,
      "blur": 0,
      "sensMult": 1.2,
      "pathEnabled": true,
      "path": "orbit",
      "swayAmount": 0.02,
      "opacity": 0.05,
      "rotationWobble": true,
      "trailEnabled": false,
      "trailLength": 0.4,
      "trailWidth": 0.6,
      "sparklesEnabled": false,
      "mirrorEnabled": true,
      "cornerRadius": 0,
      "beatCutEnabled": false,
      "beatCutThreshold": 97,
      "beatCutSustainSec": 1.2,
      "beatCutDarkness": 0.7,
      "beatCutDuration": 90,
      "beatCutMinConfidence": 0.35,
      "beatCutFallbackBpm": 120,
      "overrides": {
        "size": {
          "source": "mid",
          "sensitivity": 1,
          "enabled": true,
          "curvePoints": [
            {
              "x": 0.6103896103896104,
              "y": 0.27516233766233766
            },
            {
              "x": 0.7871485943775101,
              "y": 0.4576305220883534
            },
            {
              "x": 0.9123376623376623,
              "y": 0.5660714285714286
            }
          ],
          "clamp": false,
          "clampMin": 0,
          "clampMax": 0.96,
          "normalize": false,
          "normMin": 0,
          "normMax": 100,
          "boost": false,
          "boostThreshold": 0.8,
          "boostAmount": 0.5,
          "curve": 2.846626597125765,
          "smoothAmount": 0
        },
        "speed": {
          "source": "mid",
          "sensitivity": 1.6,
          "enabled": true,
          "curvePoints": [
            {
              "x": 0.6038961038961039,
              "y": 0.3712662337662338
            },
            {
              "x": 0.7550200803212851,
              "y": 0.6608433734939759
            },
            {
              "x": 0.8634538152610441,
              "y": 0.8214859437751004
            }
          ],
          "clamp": true,
          "clampMin": 0,
          "clampMax": 1,
          "normalize": false,
          "normMin": 0,
          "normMax": 100,
          "boost": true,
          "boostThreshold": 0.85,
          "boostAmount": 1.1,
          "curve": 3.0851693136000478,
          "tempoSync": false,
          "tempoSens": 1,
          "tempoMultMin": 0,
          "tempoMultMax": 1,
          "tempoBpmMin": 0,
          "tempoBpmMax": 250,
          "smoothAmount": 0
        },
        "flash": {
          "source": "mid",
          "sensitivity": 1.49,
          "enabled": true,
          "curvePoints": [
            {
              "x": 0.5582329317269076,
              "y": 0.1614457831325301
            },
            {
              "x": 0.7590361445783133,
              "y": 0.2829317269076306
            },
            {
              "x": 0.8955823293172691,
              "y": 0.4977911646586345
            }
          ],
          "clamp": false,
          "clampMin": 0.7,
          "clampMax": 1,
          "normalize": true,
          "normMin": 0,
          "normMax": 100,
          "boost": false,
          "boostThreshold": 0.95,
          "boostAmount": 2,
          "curve": 5,
          "smoothAmount": 0
        },
        "colorSpeed": {
          "source": "loudnessPct",
          "sensitivity": 2,
          "enabled": true,
          "curvePoints": [
            {
              "x": 0.4497991967871486,
              "y": 0.08775100401606428
            },
            {
              "x": 0.8084415584415584,
              "y": 0.2517857142857143
            },
            {
              "x": 0.9058441558441559,
              "y": 0.4751623376623376
            }
          ],
          "clamp": false,
          "clampMin": 0,
          "clampMax": 1,
          "normalize": false,
          "normMin": 0,
          "normMax": 1,
          "boost": false,
          "boostThreshold": 0.9,
          "boostAmount": 0.1,
          "curve": 2.063177067680795,
          "tempoSync": false,
          "tempoSens": 1,
          "tempoMultMin": 0,
          "tempoMultMax": 1,
          "tempoBpmMin": 0,
          "tempoBpmMax": 250,
          "colorMode": "cycle",
          "customColor": "#ff2ec4",
          "smoothAmount": 0
        }
      }
    }
  ],
  "bgMapSize": {
    "source": "loudnessPct",
    "sensitivity": 0.24,
    "enabled": true,
    "curvePoints": [
      {
        "x": 0.6103896103896104,
        "y": 0.27516233766233766
      },
      {
        "x": 0.7871485943775101,
        "y": 0.4576305220883534
      },
      {
        "x": 0.9123376623376623,
        "y": 0.5660714285714286
      }
    ],
    "clamp": false,
    "clampMin": 0,
    "clampMax": 0.96,
    "normalize": false,
    "normMin": 0,
    "normMax": 100,
    "boost": false,
    "boostThreshold": 0.8,
    "boostAmount": 0.5,
    "smoothAmount": 0.01,
    "curve": 2.846626597125765
  },
  "bgMapSpeed": {
    "source": "loudnessPct",
    "sensitivity": 3,
    "enabled": true,
    "curvePoints": [
      {
        "x": 0.6038961038961039,
        "y": 0.3712662337662338
      },
      {
        "x": 0.7550200803212851,
        "y": 0.6608433734939759
      },
      {
        "x": 0.8634538152610441,
        "y": 0.8214859437751004
      }
    ],
    "clamp": true,
    "clampMin": 0,
    "clampMax": 1,
    "normalize": false,
    "normMin": 0,
    "normMax": 100,
    "boost": true,
    "boostThreshold": 0.95,
    "boostAmount": 0.5,
    "tempoSync": true,
    "tempoSens": 0.9,
    "tempoMultMin": 0.4,
    "tempoMultMax": 0.9,
    "tempoBpmMin": 0,
    "tempoBpmMax": 250,
    "smoothAmount": 0,
    "curve": 3.0851693136000478
  },
  "bgMapFlash": {
    "source": "bass",
    "sensitivity": 0.2,
    "enabled": true,
    "curvePoints": [
      {
        "x": 0.5582329317269076,
        "y": 0.1614457831325301
      },
      {
        "x": 0.7590361445783133,
        "y": 0.2829317269076306
      },
      {
        "x": 0.8955823293172691,
        "y": 0.4977911646586345
      }
    ],
    "clamp": false,
    "clampMin": 0,
    "clampMax": 1,
    "normalize": true,
    "normMin": 0,
    "normMax": 100,
    "boost": false,
    "boostThreshold": 0.95,
    "boostAmount": 2,
    "smoothAmount": 0,
    "curve": 5
  },
  "bgMapColorSpeed": {
    "source": "loudnessPct",
    "sensitivity": 2,
    "enabled": true,
    "curvePoints": [
      {
        "x": 0.4497991967871486,
        "y": 0.08775100401606428
      },
      {
        "x": 0.8084415584415584,
        "y": 0.2517857142857143
      },
      {
        "x": 0.9058441558441559,
        "y": 0.4751623376623376
      }
    ],
    "clamp": false,
    "clampMin": 0,
    "clampMax": 1,
    "normalize": false,
    "normMin": 0,
    "normMax": 1,
    "boost": false,
    "boostThreshold": 0.9,
    "boostAmount": 0.1,
    "tempoSync": true,
    "tempoSens": 1,
    "tempoMultMin": 0.4,
    "tempoMultMax": 1,
    "tempoBpmMin": 0,
    "tempoBpmMax": 250,
    "smoothAmount": 0,
    "curve": 2.063177067680795
  },
  "bgMapBlur": {
    "source": "loudnessPct",
    "sensitivity": 0.3,
    "enabled": false,
    "curvePoints": [
      {
        "x": 0.7068273092369478,
        "y": 0.08895582329317264
      },
      {
        "x": 0.8032128514056225,
        "y": 0.41666666666666663
      },
      {
        "x": 0.9116465863453815,
        "y": 0.1275100401606426
      }
    ],
    "clamp": true,
    "clampMin": 0,
    "clampMax": 1,
    "normalize": false,
    "normMin": 0,
    "normMax": 1,
    "boost": true,
    "boostThreshold": 0.8,
    "boostAmount": 0.1,
    "smoothAmount": 0,
    "curve": 3
  },
  "bgSensDivisor": 20,
  "bgFlashAttack": 0.01,
  "bgFlashRelease": 0.3,
  "trailFadeRate": 0.12,
  "sparklesEnabled": false,
  "sparklesRate": 2,
  "sparklesSize": 3,
  "sparklesLife": 0.2,
  "fxMirrorEnabled": true,
  "fxMirrorAxis": "both",
  "fxMirrorAmount": 0.25,
  "fxMirror2Enabled": false,
  "fxMirror2Axis": "x",
  "fxMirror2Amount": 0.25,
  "fxGlitchEnabled": false,
  "fxGlitchFreq": 1,
  "fxGlitchAmount": 4,
  "fxGlitchDuration": 60,
  "fxGlitchOnBeat": true,
  "fxVignette": 0.1,
  "fxScanlines": 1,
  "fxOverallOpacity": 1,
  "fxBrightness": 0.83,
  "fxContrast": 1.21,
  "fxSaturation": 1,
  "fxHue": 0,
  "specEnabled": true,
  "specHeight": 250,
  "specPxPerSec": 102,
  "specHistorySec": 25,
  "specFillWidth": true,
  "specFreqMin": 20,
  "specFreqMax": 16000,
  "specLogScale": true,
  "specGain": 1,
  "specGamma": 0.8,
  "specSmoothBlur": 0.5,
  "specEdgeFade": 0.29,
  "specEdgeFadeLeft": true,
  "specEdgeFadeRight": true,
  "specEdgeFadeTop": true,
  "specEdgeFadeBottom": false,
  "specEdgeFadeVAmount": 0.25,
  "specPalette": "heatmap",
  "specGlassMode": true,
  "specGlassAlpha": 0.2,
  "specGlassBlur": 1,
  "specGlowStrength": 2,
  "specPlaylistOffset": true,
  "specAnchor": "right",
  "specSymmetric": false,
  "specInsideIsland": true,
  "specInsideIslandBothPanels": true,
  "specIslandVisibility": 1,
  "uiStyle": "oneui",
  "uiRadiusScale": 1,
  "uiBlurAmount": 0,
  "screenFlashEnabled": true,
  "screenFlashThreshold": 97,
  "screenFlashSustainSec": 0.5,
  "screenFlashDarkness": 0.4,
  "screenFlashCutDuration": 80,
  "screenFlashMinConfidence": 0.35,
  "screenFlashFallbackBpm": 120,
  "screenFlashIntensity": 0.35,
  "timelineIslandFillet": 0,
  "tempoModifierEnabled": true,
  "tempoBpmFloor": 0,
  "tempoBpmCeil": 200,
  "tempoMultFloor": 0.1,
  "tempoMultCeil": 1,
  "tempoSmoothTime": 0.6,
  "tempoBpmLow": 0,
  "tempoBpmHigh": 170,
  "tempoBpmMax": 250,
  "timelineTimeLabelPos": "left",
  "specFutureSec": 14,
  "specShowFuture": true,
  "specAutoAnalyze": true,
  "playerSyncImportBtn": true,
  "sensRms": 1,
  "tempoWin": 2,
  "fxChromaEnabled": false,
  "fxChromaAmount": 0,
  "bgMapChroma": {
    "source": "loudnessPct",
    "sensitivity": 0.99,
    "enabled": false,
    "curvePoints": [
      {
        "x": 0.8112449799196787,
        "y": 0.21867469879518076
      }
    ],
    "clamp": false,
    "clampMin": 0,
    "clampMax": 1,
    "normalize": false,
    "normMin": 0,
    "normMax": 1,
    "boost": false,
    "boostThreshold": 0.8,
    "boostAmount": 0.5
  },
  "fxDistortEnabled": false,
  "fxDistortAmount": 80,
  "fxDistortScale": 0.007,
  "fxDistortSpeed": 4,
  "bgCount": 8,
  "bgSize": 0.75,
  "bgBlur": 40,
  "bgBaseAlpha": 0.1,
  "bgBlurEnabled": true,
  "bgShape": "circle",
  "bgRotation": 0,
  "bgColorChaos": true,
  "bgColorBaseSpeed": 0.6,
  "scrollFrameSkipEnabled": false,
  "playlistAlpha": 0.3,
  "playlistBlur": 30,
  "playlistRadius": 22,
  "playlistOutlineOpacity": 28,
  "playlistOutlineWidth": 1,
  "postPanoramaVertical": 1,
  "scanlineTarget": "all",
  "postMaskShape": "panorama",
  "postMaskSoftness": 1,
  "postInvertMask": false,
  "postEdgeMode": "mirror",
  "postDistortFps": 60,
  "vizBoostAttack": 50,
  "vizBoostRelease": 300,
  "postDistortTarget": "visualizers",
  "vizResponseEnabled": true,
  "vizResponseThreshold": 0.9,
  "vizResponseBoost": 1.5,
  "vizRingSmooth": 0.4,
  "postWarpType": "fisheye",
  "postCenterX": 0.5,
  "postCenterY": 0.5,
  "postRadius": 0,
  "postZoom": 0.85,
  "vizColorMode": "theme",
  "vizStaticColor": "#55eaff",
  "vizSurface": "solid",
  "postPixel": 0,
  "postChroma": 1,
  "postFish": -1,
  "postHue": 0,
  "postGray": 0,
  "postEdges": 0,
  "postVignette": 0,
  "postGlitch": 0,
  "powerSaveMode": "hidden",
  "renderFps": 120,
  "vizEqPeakMode": "soft",
  "vizEqPeakKnee": 0.65,
  "vizEqTips": false,
  "vizEqBlur": 0,
  "vizWaveBlur": 0,
  "vizRingBlur": 0,
  "vizRingDeform": 0.3,
  "vizRingStyle": "pulse",
  "vizRingThickness": 4.5,
  "vizRingFade": 0.1,
  "vizRingPulse": 1,
  "vizRingInner": true,
  "vizRingContour": false,
  "vizRingRays": true,
  "vizRingParticles": true,
  "vizEqThickness": 0.5,
  "vizEqFade": 0,
  "vizWaveMirror": true,
  "vizBrightnessVersion": 1,
  "vizStyleVersion": 2,
  "vizEqGlow": 0.5,
  "vizWaveGlow": 1,
  "vizRingGlow": 2,
  "vizEqTrail": 0.2,
  "vizWaveTrail": 0.2,
  "vizRingTrail": 0,
  "vizMode": "equalizer",
  "vizOpacity": 1,
  "vizFps": 60,
  "vizEqCount": 72,
  "vizEqGain": 0.8,
  "vizEqHeight": 0.7,
  "vizEqSmooth": 0.15,
  "vizWaveGain": 3,
  "vizWaveWidth": 1,
  "vizWaveLine": 3.5,
  "vizWaveSmooth": 0.6,
  "vizRingGain": 2,
  "vizRingRadius": 0.2,
  "vizRingCount": 100,
  "vizRingSpeed": 0.48,
  "hoverGlow": true,
  "hoverClear": true,
  "islandHover": "clear",
  "ctrlTrackAlign": "right",
  "ctrlTrackWidth": "content",
  "hoverGlowStrength": 0.3,
  "hoverOutlineCoverage": 50,
  "hoverFullOutlineStrength": 95,
  "hoverGlowColor": "#ffffff",
  "hoverRadius": 100,
  "hoverIslandRadiusPercent": 50,
  "specHueOffset": 0,
  "settingsGlass": true,
  "settingsAlpha": 0.72,
  "settingsBlur": 12,
  "settingsRadius": 22,
  "settingsOutlineOpacity": 28,
  "settingsOutlineWidth": 1,
  "liveRevealMode": "near",
  "liveIdleSeconds": 5,
  "playlistSort": "title",
  "playlistSortDirection": "asc",
  "vizResponseQuiet": 0.5,
  "vizResponsePower": 1,
  "postRasterMode": "lines",
  "postRasterCell": 7,
  "postPalette": 16,
  "postRaster": 0,
  "specHue": 255,
  "hoverControlRadiusPct": 50
};
App._saveSettingsTimer = null;
const flushPending=()=>{
    if(App._saveSettingsTimer||App._settingsDirty){ clearTimeout(App._saveSettingsTimer); App._flushSettings(); }
    if(App.ProfileStore?._persistTimer){ clearTimeout(App.ProfileStore._persistTimer); App.ProfileStore._flushPersist(); }
  };
window.addEventListener('beforeunload',flushPending);
window.addEventListener('pagehide',flushPending);
App.settings = App.loadSettings();
App.ensureTempoSyncDefaults(App.settings.bgMapSpeed);
App.ensureTempoSyncDefaults(App.settings.bgMapColorSpeed);
App.ensureSmoothDefaults(App.settings.bgMapSize);
App.ensureSmoothDefaults(App.settings.bgMapSpeed);
App.ensureSmoothDefaults(App.settings.bgMapFlash);
App.ensureSmoothDefaults(App.settings.bgMapColorSpeed);
App.ensureSmoothDefaults(App.settings.bgMapBlur);
App.settings.bgLayers.forEach(layer=>{
    if(layer.overrides && layer.overrides.speed) App.ensureTempoSyncDefaults(layer.overrides.speed);
    if(layer.overrides && layer.overrides.colorSpeed){
      App.ensureTempoSyncDefaults(layer.overrides.colorSpeed);
      App.ensureColorModeDefaults(layer.overrides.colorSpeed);
    }
    if(layer.overrides){
      ['size','speed','flash','colorSpeed','blur'].forEach(k=>{
        if(layer.overrides[k]) App.ensureSmoothDefaults(layer.overrides[k]);
      });
    }
  });
  }, ["THREAD_SUPPORT","Threads","WORKER_SOURCES","STORAGE_KEY","defaultSettings","loadSettings","_saveSettingsTimer","saveSettings","_flushSettings","settings","ensureTempoSyncDefaults","ensureColorModeDefaults","ensureSmoothDefaults"]);
})(window.Aurora);

// ── ui/mapping-readouts ──
(function(App){
App._getLiveValNodes = function _getLiveValNodes(key){
    let n = App._liveValNodeCache.get(key);
    if(n && n.pill && n.pill.isConnected) return n;
    n = {
      pill: document.querySelector(`.map-live-val[data-live-for="${key}"]`),
      liveDot: document.querySelector(`.curve-live-dot[data-curve-live="${key}"]`),
      readout: document.querySelector(`.curve-live-readout[data-curve-readout="${key}"]`),
    };
    if(n.pill){
      n.pillStrong = n.pill.querySelector('strong');
    }
    if(n.readout){
      n.readoutStrong1 = null;
    }
    App._liveValNodeCache.set(key, n);
    return n;
  };
App.updateOneMapLiveValue = function updateOneMapLiveValue(key, target){
    const map = App.getMapByKey(key);
    if(!map) return;
    const meta = App.MusicSenseRegistry.byKey(map.source);
    const raw = App.MusicSenseRegistry.rawValue(map.source);
    const nodes = App._getLiveValNodes(key);
    if(nodes.pill && nodes.pillStrong){
      const labelPrefix = meta.label + ' ';
      if(nodes.pill.firstChild && nodes.pill.firstChild.nodeType === 3){
        if(nodes.pill.firstChild.textContent !== labelPrefix) nodes.pill.firstChild.textContent = labelPrefix;
      }
      const valText = raw.toFixed(4);
      if(nodes.pillStrong.textContent !== valText) nodes.pillStrong.textContent = valText;
    }
    const liveDot = nodes.liveDot;
    const readout = nodes.readout;
    if(!liveDot) return;
    let dLo, dHi;
    if(meta.fixedDomain || !map.normalize){
      [dLo, dHi] = meta.domain;
    } else {
      dLo = map.normMin; dHi = map.normMax;
    }
    let norm = (raw - dLo) / Math.max(dHi - dLo, 1e-6);
    if(map.clamp){
      const lo = Math.min(map.clampMin, map.clampMax);
      const hi = Math.max(map.clampMin, map.clampMax);
      norm = Math.max(lo, Math.min(hi, norm));
    }
    const boosted = App.MappingEngine._applyBoost(key, map, norm);
    const curvedY = App.CurveMath.evaluate(map.curvePoints, boosted);
    const active = App.state.isPlaying && map.enabled;
    liveDot.classList.toggle('active', active);
    const dotX = boosted * 100;
    const dotY = (1 - curvedY) * 100;
    const leftStr = dotX + '%';
    const topStr = dotY + '%';
    if(liveDot.style.left !== leftStr) liveDot.style.left = leftStr;
    if(liveDot.style.top !== topStr) liveDot.style.top = topStr;
    if(readout){
      const readoutHtml = active
        ? `${meta.label} <strong>${(norm*100).toFixed(0)}%</strong> → <strong>${(curvedY*100).toFixed(0)}%</strong>`
        : `${meta.label} <strong>—</strong>`;
      if(readout._lastHtml !== readoutHtml){
        readout.innerHTML = readoutHtml;
        readout._lastHtml = readoutHtml;
      }
    }
  };
App.updateBgMapLiveValues = function updateBgMapLiveValues(){
    // Only editors currently mounted in the UI need readouts. Iterating every
    // layer/override used to perform repeated document queries for absent nodes.
    const keys=new Set();
    const group=App.SettingsUI?.groups?.[App.SettingsUI.current];
    const root=group?.pages.find(p=>p.key===group.selected)?.panel||document;
    root.querySelectorAll('.map-live-val[data-live-for],.curve-live-dot[data-curve-live]').forEach(node=>{
      if(node.closest('details:not([open]),[hidden],.settings-condition-hidden'))return;
      const key=node.dataset.liveFor||node.dataset.curveLive;if(key)keys.add(key);
    });
    for(const key of keys)App.updateOneMapLiveValue(key);
  };
App.updateTempoSyncLiveReadouts = function updateTempoSyncLiveReadouts(){
    const group=App.SettingsUI?.groups?.[App.SettingsUI.current];
    const root=group?.pages.find(p=>p.key===group.selected)?.panel||document;
    root.querySelectorAll('[data-tempo-live]').forEach(node=>{
      if(node.closest('details:not([open]),[hidden],.settings-condition-hidden'))return;
      const key = node.dataset.tempoLive;
      const map = App.getMapByKey(key);
      if(!map || !map.tempoSync){
        if(node.textContent!=='—')node.textContent = '—';
        return;
      }
      const bpm = Math.round(App.MusicSense.data.bpm || 0);
      const mult = App.computeTempoSpeedMult(map);
      const text = App.state.isPlaying
        ? `${bpm} BPM → ×${mult.toFixed(2)}`
        : '—';
      if(node.textContent!==text)node.textContent=text;
    });
  };
  App.define("ui/mapping-readouts", function initialize(){
App._liveValNodeCache = new Map();
  }, ["_liveValNodeCache","_getLiveValNodes","updateOneMapLiveValue","updateBgMapLiveValues","updateTempoSyncLiveReadouts"]);
})(window.Aurora);

// ── ui/settings-controls ──
(function(App){
App.applySettingToUI = function applySettingToUI(key){
    const val = App.settings[key];
    const rangeCtl = document.querySelector(`[data-setting="${key}"]`);
    if(!rangeCtl) return;
    if(rangeCtl.type === 'range'){
      rangeCtl.value = val;
      const label = App.el('val-'+key);
      if(label) label.textContent = App.settingFormatters[key] ? App.settingFormatters[key](parseFloat(val)) : val;
    }
  };
App.wireRangeControl = function wireRangeControl(input){
    const key = input.dataset.setting;
    App.applySettingToUI(key);
    input.addEventListener('input', ()=>{
      const v = parseFloat(input.value);
      App.settings[key] = v;
      const label = App.el('val-'+key);
      if(label) label.textContent = App.settingFormatters[key] ? App.settingFormatters[key](v) : v;
      if(App.settingSideEffects[key]) App.settingSideEffects[key]();
      App.saveSettings();
    });
    input.addEventListener('mouseenter', ()=>{ input.dataset.hovering = '1'; });
    input.addEventListener('mouseleave', ()=>{ delete input.dataset.hovering; });
    input.addEventListener('keydown', e=>{
      if(e.key === 'Backspace'){
        e.preventDefault();
        App.resetSingleControl(input);
      }
    });
  };
App.initRangeControls = function initRangeControls(){
    document.querySelectorAll('input[type=range][data-setting]').forEach(App.wireRangeControl);
    document.addEventListener('keydown', e=>{
      if(e.key !== 'Backspace') return;
      if(document.activeElement && document.activeElement.tagName === 'INPUT' && document.activeElement.type !== 'range') return;
      const hovered = document.querySelector('input[type=range][data-setting][data-hovering="1"]');
      if(hovered){
        e.preventDefault();
        App.resetSingleControl(hovered);
      }
    });
  };
App.resetSingleControl = function resetSingleControl(input){
    const key = input.dataset.setting;
    const def = Number(App.defaultSettings[key]);
    App.settings[key] = def;
    input.value = def;
    const label = App.el('val-'+key);
    if(label) label.textContent = App.settingFormatters[key] ? App.settingFormatters[key](def) : def;
    if(App.settingSideEffects[key]) App.settingSideEffects[key]();
    App.saveSettings();
    input.classList.add('reset-flash');
    setTimeout(()=> input.classList.remove('reset-flash'), 260);
  };
App.initToggleControls = function initToggleControls(){
    document.querySelectorAll('.switch[data-setting]').forEach(sw=>{
      const key = sw.dataset.setting;
      const isOn = !!App.settings[key];
      sw.classList.toggle('on', isOn);
      sw.addEventListener('click', ()=>{
        sw.classList.toggle('on');
        App.settings[key] = sw.classList.contains('on');
        if(key.startsWith('viz'))App.refreshMusicVisualizer?.();
        if(key === 'timelineLoudnessWaveform') App.scheduleResponsiveLayout?.();
        App.saveSettings();
        if(key === 'normalize'){
          if(!App.settings.normalize){
            if(App.normGain && App.audioCtx) App.normGain.gain.setTargetAtTime(1, App.audioCtx.currentTime, 0.05);
            App.hideNormBadge();
          } else if(App.state.currentIndex !== -1){
            App.applyNormalizationForTrack(App.state.currentIndex);
          }
        }
        if(key === 'fxMirrorEnabled') App.el('fxMirrorDetail').style.display = App.settings[key] ? '' : 'none';
        if(key === 'fxMirror2Enabled') App.el('fxMirror2Detail').style.display = App.settings[key] ? '' : 'none';
        if(key === 'fxGlitchEnabled') App.el('fxGlitchDetail').style.display = App.settings[key] ? '' : 'none';
        if(key === 'sparklesEnabled') App.el('sparklesDetail').style.display = App.settings[key] ? '' : 'none';
        if(key === 'stageLikedOutlinePulse'){
          const detail = App.el('stageLikedOutlinePulseDetail');
          if(detail) detail.style.display = App.settings[key] ? '' : 'none';
          const chipEl = App.el('trackMetaChip');
          if(chipEl){
            chipEl.classList.toggle('liked-pulse-active', !!App.settings[key]);
            if(!App.settings[key]) chipEl.style.boxShadow = '';
          }
        }
        if(key === 'playerColorSync' || key === 'playerSyncThumbs' || key === 'playerSyncPlayBtn' || key === 'playerSyncGear' || key === 'playerSyncScanline') App.renderPlayerColorSwatches();
        if(key === 'specPlaylistOffset' || key === 'specInsideIsland' || key === 'specSymmetric' || key === 'specFillWidth' || key === 'specInsideIslandBothPanels'){
          App.Spectrogram._lastAlignT = undefined;
        }
        if(key === 'specFillWidth'){
          const row = App.el('specHistorySecRow');
          if(row) row.style.display = App.settings.specFillWidth ? 'none' : '';
        }
        if(key === 'specInsideIsland'){
          const bothPanelsRow = App.el('specBothPanelsRow');
          if(bothPanelsRow) bothPanelsRow.style.display = App.settings.specInsideIsland ? '' : 'none';
        }
        if(['ctrlChipsEnabled','hoverGlow','hoverClear','settingsGlass'].includes(key)) App.applyAppearanceSettings();
        if(key === 'timelineIslandMerged' || key === 'timelineWaveSymmetry'){
          App.applyAppearanceSettings();
          App.Spectrogram._lastAlignT = undefined;
          if(typeof App.tlResize === 'function') App.tlResize();
        }
        if(key === 'timelineTimeLabelEnabled' || key === 'ctrlBarTimeLabelEnabled' || key === 'liveStatsIslandEnabled' || key === 'ctrlBarTrackInfoEnabled' || key === 'ctrlBarLikedOutlineHoverOnly' || key === 'stageTrackInfoEnabled' || key === 'stageLikedOutlineHoverOnly') App.applyAppearanceSettings();
      });
    });
  };
  App.define("ui/settings-controls", function initialize(){
App.settingFormatters = {
    postPanoramaVertical:v=>Math.round(v*100)+'%',
    postMaskSoftness:v=>Math.round(v*100)+'%',postDistortFps:v=>Math.round(v)+' FPS',vizBoostAttack:v=>v+' ms',vizBoostRelease:v=>v+' ms',
    vizResponseThreshold:v=>Math.round(v*100)+'%',vizResponseBoost:v=>v.toFixed(1)+'×',
    vizRingSmooth:v=>Math.round(v*100)+'%',postCenterX:v=>Math.round(v*100)+'%',postCenterY:v=>Math.round(v*100)+'%',postRadius:v=>Math.round(v*100)+'%',postZoom:v=>v.toFixed(2)+'×',
    postPixel:v=>v<2?'Off':(Math.floor(v/2)*2+1)+' px',postChroma:v=>v+' px',postHue:v=>v+'°',postFish:v=>Math.round(v*100)+'%',postGray:v=>Math.round(v*100)+'%',postEdges:v=>Math.round(v*100)+'%',postVignette:v=>Math.round(v*100)+'%',postGlitch:v=>Math.round(v*100)+'%',
    vizEqBlur:v=>v+' px',vizWaveBlur:v=>v+' px',vizRingBlur:v=>v+' px',vizRingDeform:v=>Math.round(v*100)+'%',
    vizRingThickness:v=>v+' px',vizRingFade:v=>Math.round(v*100)+'%',vizRingPulse:v=>v.toFixed(1)+'×',vizEqThickness:v=>Math.round(v*100)+'%',vizEqFade:v=>Math.round(v*100)+'%',
    vizEqGlow:v=>Math.round(v*100)+'%',vizWaveGlow:v=>Math.round(v*100)+'%',vizRingGlow:v=>Math.round(v*100)+'%',
    vizEqTrail:v=>Math.round(v*100)+'%',vizWaveTrail:v=>Math.round(v*100)+'%',vizRingTrail:v=>Math.round(v*100)+'%',
    vizOpacity:v=>Math.round(v*100)+'%',vizFps:v=>Math.round(v)+' FPS',
    renderFps:v=>Math.round(v)+' FPS',
    vizEqPeakKnee:v=>Math.round(v*100)+'%',
    vizEqHeight:v=>Math.round(v*100)+'%',vizEqSmooth:v=>Math.round(v*100)+'%',
    vizWaveWidth:v=>Math.round(v*100)+'%',vizWaveSmooth:v=>Math.round(v*100)+'%',
    vizEqGain:v=>v.toFixed(1)+'×',vizWaveGain:v=>v.toFixed(1)+'×',vizRingGain:v=>v.toFixed(1)+'×',
    vizRingRadius:v=>Math.round(v*100)+'%',vizWaveLine:v=>v+' px',vizRingSpeed:v=>v.toFixed(2)+' rad/s',

    targetLufs: v => Math.round(v),
    loudFloorDb: v => Math.round(v) + ' dBFS',
    loudCeilDb: v => Math.round(v) + ' dBFS',
    sensBass: v => v.toFixed(2) + '×',
    sensMid: v => v.toFixed(2) + '×',
    sensHigh: v => v.toFixed(2) + '×',
    globalSens: v => v.toFixed(2) + '×',
    stageLikedOutlinePulseSensitivity: v => v.toFixed(2) + '×',
    stageLikedOutlinePulseFloor: v => Math.round(v) + '%',
    fftIdx: v => App.FFT_SIZES[Math.round(v)],
    smoothing: v => v.toFixed(2),
    bgBaseDrift: v => v.toFixed(2) + '×',
    bgSensDivisor: v => Math.round(v),
    bgFlashAttack: v => v.toFixed(2) + 's',
    bgFlashRelease: v => v.toFixed(2) + 's',
    trailFadeRate: v => Math.round(v*100) + '%',
    sparklesRate: v => Math.round(v*100) + '%',
    sparklesSize: v => Math.round(v*100) + '%',
    sparklesLife: v => v.toFixed(2) + 's',
    senseSmooth: v => v < 0.15 ? 'Pomalé' : v < 0.5 ? 'Střední' : v < 0.9 ? 'Rychlé' : 'Vypnuto (raw)',
    fxMirrorAmount: v => Math.round(v*100) + '%',
    fxMirror2Amount: v => Math.round(v*100) + '%',
    fxGlitchFreq: v => v < 0.2 ? 'Vzácně' : v < 0.5 ? 'Střední' : v < 0.8 ? 'Časté' : 'Nonstop',
    fxGlitchAmount: v => Math.round(v) + 'px',
    fxGlitchDuration: v => Math.round(v) + 'ms',
    fxVignette: v => Math.round(v*100) + '%',
    fxScanlines: v => Math.round(v*100) + '%',
    fxOverallOpacity: v => Math.round(v*100) + '%',
    fxBrightness: v => Math.round(v*100) + '%',
    fxContrast: v => Math.round(v*100) + '%',
    fxSaturation: v => Math.round(v*100) + '%',
    fxHue: v => Math.round(v) + '°',
    timelineWaveformHeight: v => v.toFixed(2) + '×',
    timelineWaveformOffset: v => Math.round(v) + 'px',
    timelineWaveformScale: v => v.toFixed(2) + '×',
    timelineWaveformSamplesPerSec: v => v.toFixed(1) + '/s',
    timelineWaveformSmooth: v => v <= 0.05 ? 'Vypnuto' : v.toFixed(2) + '×',
    timelineWavePeak: v => v <= 1 ? Math.round(v*100) + '%' : v.toFixed(2) + '×',
    timelineSigma: v => v.toFixed(3),
    playlistAlpha: v => Math.round(v*100)+'%',
    playlistBlur: v => v+'px',
    playlistRadius: v => v+'px',
    playlistOutlineOpacity: v => v+'%',
    playlistOutlineWidth: v => v+'px',
    hoverGlowStrength: v => Math.round(v*100)+'%',
    hoverRadius: v => v+'px',
    hoverIslandRadiusPercent: v => Math.round(v)+'%',
    hoverOutlineCoverage: v => Number(v)===0?'0%':Math.round(v)+'%',
    hoverFullOutlineStrength: v => Math.round(v)+'%',
    specHueOffset: v => Math.round(v)+'°',
    settingsAlpha: v => Math.round(v*100)+'%',
    settingsBlur: v => v+'px',
    settingsRadius: v => v+'px',
    settingsOutlineOpacity: v => v+'%',
    settingsOutlineWidth: v => v+'px',
    liveIdleSeconds: v => v+' s',
    panelAlpha: v => Math.round(v*100) + '%',
    ctrlChipAlpha: v => Math.round(v*100) + '%',
    ctrlChipBlur: v => Math.round(v) + 'px',
    ctrlChipRadius: v => Math.round(v) + 'px',
    timelineIslandHeight: v => Math.round(v) + 'px',
    timelineIslandGap: v => Math.round(v) + 'px',
    timelineIslandInset: v => Math.round(v) + 'px',
    timelineIslandOverlap: v => Math.round(v) + 'px',
    specHeight: v => Math.round(v) + 'px',
    specPxPerSec: v => Math.round(v),
    specHistorySec: v => Math.round(v),
    specFreqMin: v => Math.round(v) + ' Hz',
    specFreqMax: v => Math.round(v) + ' Hz',
    specGain: v => v.toFixed(2) + '×',
    specGamma: v => v.toFixed(2),
    specSmoothBlur: v => v.toFixed(1) + 'px',
    specEdgeFade: v => Math.round(v*100) + '%',
    specEdgeFadeVAmount: v => Math.round(v*100) + '%',
    specGlassAlpha: v => Math.round(v*100) + '%',
    specGlassBlur: v => Math.round(v) + 'px',
    specGlowStrength: v => Math.round(v*100) + '%',
    specIslandVisibility: v => Math.round(v*100) + '%',
  };
App.settingSideEffects = {
    fftIdx: App.applyAnalyserParams,
    smoothing: App.applyAnalyserParams,
    targetLufs: () => {
      if(App.settings.normalize && App.state.currentIndex !== -1){
        const track = App.state.tracks[App.state.currentIndex];
        if(track){
          const lufs = App.ProfileStore.get(App.trackKey(track));
          if(lufs !== undefined) App.setGainFromLufs(lufs);
        }
      }
    },
    playlistAlpha: App.applyAppearanceSettings,
    playlistBlur: App.applyAppearanceSettings,
    playlistRadius: App.applyAppearanceSettings,
    playlistOutlineOpacity: App.applyAppearanceSettings,
    playlistOutlineWidth: App.applyAppearanceSettings,
    hoverGlowStrength: App.applyAppearanceSettings,
    hoverRadius: App.applyAppearanceSettings,
    hoverIslandRadiusPercent: App.applyAppearanceSettings,
    hoverOutlineCoverage: App.applyAppearanceSettings,
    hoverFullOutlineStrength: App.applyAppearanceSettings,
    settingsAlpha: App.applyAppearanceSettings,
    settingsBlur: App.applyAppearanceSettings,
    settingsRadius: App.applyAppearanceSettings,
    settingsOutlineOpacity: App.applyAppearanceSettings,
    settingsOutlineWidth: App.applyAppearanceSettings,
    liveIdleSeconds: App.applyAppearanceSettings,
    panelAlpha: App.applyAppearanceSettings,
    ctrlChipAlpha: App.applyAppearanceSettings,
    ctrlChipBlur: App.applyAppearanceSettings,
    ctrlChipRadius: App.applyAppearanceSettings,
    timelineIslandHeight: () => {
      App.applyAppearanceSettings();
      App.Spectrogram._lastAlignT = undefined;
      if(typeof App.tlResize === 'function') App.tlResize();
    },
    timelineIslandGap: () => {
      App.applyAppearanceSettings();
      App.Spectrogram._lastAlignT = undefined;
    },
    timelineIslandInset: () => {
      App.applyAppearanceSettings();
      App.Spectrogram._lastAlignT = undefined;
      if(typeof App.tlResize === 'function') App.tlResize();
    },
    timelineIslandOverlap: () => {
      App.applyAppearanceSettings();
      App.Spectrogram._lastAlignT = undefined;
    },
    timelineLoudnessWaveform: () => App.scheduleResponsiveLayout?.(),
    timelineWaveformHeight: () => {
      App.scheduleResponsiveLayout?.();
      if(typeof App.tlResize === 'function') App.tlResize();
    },
    timelineWaveformOffset: () => {
      App.scheduleResponsiveLayout?.();
      if(typeof App.tlResize === 'function') App.tlResize();
    },
    specPxPerSec: () => {
      App.Spectrogram._lastAlignT = undefined;
    },
    specHistorySec: () => {
      App.Spectrogram._lastAlignT = undefined;
    },
  };
  }, ["settingFormatters","settingSideEffects","applySettingToUI","wireRangeControl","initRangeControls","resetSingleControl","initToggleControls"]);
})(window.Aurora);

// ── ui/appearance ──
(function(App){
App.applyAppearanceSettings = function applyAppearanceSettings(){
    App.scheduleResponsiveLayout?.();
    App.applyInteractionAppearance();
    const root = document.documentElement.style;
    root.setProperty('--playlistAlpha', Math.max(0,Math.min(1,Number(App.settings.playlistAlpha) || 0)) + '');
    root.setProperty('--playlistBlur', Math.max(0,Math.min(30,Number(App.settings.playlistBlur) || 0)) + 'px');
    root.setProperty('--playlistRadius', Math.max(0,Math.min(40,Number(App.settings.playlistRadius) || 0)) + 'px');
    root.setProperty('--playlistOutlineOpacity', Math.max(0,Math.min(100,Number(App.settings.playlistOutlineOpacity) || 0)) + '%');
    root.setProperty('--playlistOutlineWidth', Math.max(0,Math.min(4,Number(App.settings.playlistOutlineWidth) || 0)) + 'px');
    root.setProperty('--font-body', `'${App.settings.fontBody}', sans-serif`);
    root.setProperty('--font-display', `'${App.settings.fontDisplay}', sans-serif`);
    root.setProperty('--font-mono', `'${App.settings.fontMono}', monospace`);
    const pct = Math.round(Math.max(0.3, Math.min(1, App.settings.panelAlpha)) * 100);
    root.setProperty('--panel-alpha-pct', pct + '%');
    root.setProperty('--panel-bg-resolved', `rgba(18,20,28,${(Math.max(0.3, Math.min(1, App.settings.panelAlpha))).toFixed(3)})`);
    const playlistPct = Math.min(100, pct + 16);
    root.setProperty('--playlist-alpha-pct', playlistPct + '%');
    root.setProperty('--ctrl-chip-alpha', String(Math.max(0, Math.min(1, App.settings.ctrlChipAlpha))));
    root.setProperty('--ctrl-chip-blur', Math.max(0, App.settings.ctrlChipBlur) + 'px');
    root.setProperty('--ctrl-chip-radius', Math.max(0, App.settings.ctrlChipRadius) + 'px');
    document.body.classList.toggle('ctrl-chips-off', !App.settings.ctrlChipsEnabled);
    root.setProperty('--timeline-island-h', Math.max(20, App.settings.timelineIslandHeight) + 'px');
    root.setProperty('--timeline-island-gap', App.settings.timelineIslandMerged ? '0px' : (Math.max(0, App.settings.timelineIslandGap) + 'px'));
    root.setProperty('--timeline-island-inset', Math.max(0, App.settings.timelineIslandInset ?? 20) + 'px');
    root.setProperty('--timeline-island-overlap', App.settings.timelineIslandMerged ? (Math.max(0, App.settings.timelineIslandOverlap ?? 10) + 'px') : '0px');
    root.setProperty('--timeline-mask-cut', App.settings.timelineIslandMerged ? (Math.max(0, App.settings.timelineIslandOverlap ?? 10) + 'px') : '0px');
    const tlIslandEl = App.el('timelineIsland');
    if(tlIslandEl) tlIslandEl.classList.toggle('merged', !!App.settings.timelineIslandMerged);
    const tlExtEl = App.el('timelineIslandExtension');
    if(tlExtEl) tlExtEl.classList.toggle('show', !!App.settings.timelineIslandMerged && (App.settings.timelineIslandOverlap ?? 10) > 0);
    const gapRow = App.el('timelineIslandGapRow');
    if(gapRow) gapRow.style.display = App.settings.timelineIslandMerged ? 'none' : '';
    const insetRow = App.el('timelineIslandInsetRow');
    if(insetRow) insetRow.style.display = App.settings.timelineIslandMerged ? '' : 'none';
    const overlapRow = App.el('timelineIslandOverlapRow');
    if(overlapRow) overlapRow.style.display = App.settings.timelineIslandMerged ? '' : 'none';
    const tlLabel = App.el('timelineTimeLabel');
    if(tlLabel){
      const enabled = !!App.settings.timelineTimeLabelEnabled;
      const side = App.settings.timelineTimeLabelSide === 'left' ? 'left' : 'right';
      tlLabel.classList.toggle('show', enabled);
      tlLabel.classList.toggle('side-left', enabled && side === 'left');
      tlLabel.classList.toggle('side-right', enabled && side === 'right');
    }
    const sideRow = App.el('timelineTimeLabelSideRow');
    if(sideRow) sideRow.style.display = App.settings.timelineTimeLabelEnabled ? '' : 'none';
    const ctrlTimeLabel = App.el('timeLabel');
    if(ctrlTimeLabel) ctrlTimeLabel.style.display = App.settings.ctrlBarTimeLabelEnabled ? '' : 'none';
    const barTrackInfoEl = App.el('barTrackInfo');
    if(barTrackInfoEl){
      barTrackInfoEl.style.display = App.settings.ctrlBarTrackInfoEnabled ? '' : 'none';
      barTrackInfoEl.classList.toggle('liked-outline-hover-only', !!App.settings.ctrlBarLikedOutlineHoverOnly);
    }
    const trackMetaEl = App.el('trackMeta');
    if(trackMetaEl) trackMetaEl.classList.toggle('user-hidden', !App.settings.stageTrackInfoEnabled);
    const trackMetaChipEl = App.el('trackMetaChip');
    if(trackMetaChipEl) trackMetaChipEl.classList.toggle('liked-outline-hover-only', !!App.settings.stageLikedOutlineHoverOnly);
    const liveStatsLeftEl = App.el('liveStatsLeft');
    const liveStatsRightEl = App.el('liveStatsRight');
    if(liveStatsLeftEl) liveStatsLeftEl.classList.toggle('show', !!App.settings.liveStatsIslandEnabled);
    if(liveStatsRightEl) liveStatsRightEl.classList.toggle('show', !!App.settings.liveStatsIslandEnabled);
  };
App.initAppearanceControls = function initAppearanceControls(){
    const bodySel = App.el('ctl-fontBody');
    const displaySel = App.el('ctl-fontDisplay');
    const monoSel = App.el('ctl-fontMono');
    bodySel.value = App.settings.fontBody;
    displaySel.value = App.settings.fontDisplay;
    monoSel.value = App.settings.fontMono;
    bodySel.addEventListener('change', ()=>{
      App.settings.fontBody = bodySel.value;
      App.applyAppearanceSettings();
      App.saveSettings();
    });
    displaySel.addEventListener('change', ()=>{
      App.settings.fontDisplay = displaySel.value;
      App.applyAppearanceSettings();
      App.saveSettings();
    });
    monoSel.addEventListener('change', ()=>{
      App.settings.fontMono = monoSel.value;
      App.applyAppearanceSettings();
      App.saveSettings();
    });
    const tlTimeSideSel = App.el('ctl-timelineTimeLabelSide');
    if(tlTimeSideSel){
      tlTimeSideSel.value = App.settings.timelineTimeLabelSide;
      tlTimeSideSel.addEventListener('change', ()=>{
        App.settings.timelineTimeLabelSide = tlTimeSideSel.value;
        App.applyAppearanceSettings();
        App.saveSettings();
      });
    }
  };
App.refreshAppearanceControlsUI = function refreshAppearanceControlsUI(){
    const bodySel = App.el('ctl-fontBody');
    const displaySel = App.el('ctl-fontDisplay');
    const monoSel = App.el('ctl-fontMono');
    if(bodySel) bodySel.value = App.settings.fontBody;
    if(displaySel) displaySel.value = App.settings.fontDisplay;
    if(monoSel) monoSel.value = App.settings.fontMono;
    const tlTimeSideSel = App.el('ctl-timelineTimeLabelSide');
    if(tlTimeSideSel) tlTimeSideSel.value = App.settings.timelineTimeLabelSide;
    App.applyAppearanceSettings();
  };
  App.define("ui/appearance", function initialize(){
  }, ["applyAppearanceSettings","initAppearanceControls","refreshAppearanceControlsUI"]);
})(window.Aurora);

// ── ui/effect-controls ──
(function(App){
App.initFxControls = function initFxControls(){
    App.el('fxMirrorDetail').style.display = App.settings.fxMirrorEnabled ? '' : 'none';
    App.el('fxMirror2Detail').style.display = App.settings.fxMirror2Enabled ? '' : 'none';
    App.el('fxGlitchDetail').style.display = App.settings.fxGlitchEnabled ? '' : 'none';
    App.el('sparklesDetail').style.display = App.settings.sparklesEnabled ? '' : 'none';
    const axisSel = App.el('ctl-fxMirrorAxis');
    axisSel.value = App.settings.fxMirrorAxis;
    axisSel.onchange = ()=>{
      App.settings.fxMirrorAxis = axisSel.value;
      App.saveSettings();
    };
    const axisSel2 = App.el('ctl-fxMirror2Axis');
    axisSel2.value = App.settings.fxMirror2Axis;
    axisSel2.onchange = ()=>{
      App.settings.fxMirror2Axis = axisSel2.value;
      App.saveSettings();
    };
  };
App.initLikedOutlinePulseControls = function initLikedOutlinePulseControls(){
    const detail = App.el('stageLikedOutlinePulseDetail');
    if(detail) detail.style.display = App.settings.stageLikedOutlinePulse ? '' : 'none';
    const chipEl = App.el('trackMetaChip');
    if(chipEl) chipEl.classList.toggle('liked-pulse-active', !!App.settings.stageLikedOutlinePulse);
    const sourceSel = App.el('ctl-stageLikedOutlinePulseSource');
    if(sourceSel){
      sourceSel.value = App.settings.stageLikedOutlinePulseSource;
      sourceSel.onchange = ()=>{
        App.settings.stageLikedOutlinePulseSource = sourceSel.value;
        App.saveSettings();
      };
    }
  };
App.refreshSpectrogramControlsUI = function refreshSpectrogramControlsUI(){
    const sel = App.el('ctl-specPalette');
    if(sel) sel.value = App.settings.specPalette;
    const anchorSel = App.el('ctl-specAnchor');
    if(anchorSel) anchorSel.value = App.settings.specAnchor;
    const histRow = App.el('specHistorySecRow');
    if(histRow) histRow.style.display = App.settings.specFillWidth ? 'none' : '';
    const bothPanelsRow = App.el('specBothPanelsRow');
    if(bothPanelsRow) bothPanelsRow.style.display = App.settings.specInsideIsland ? '' : 'none';
  };
App.initSpectrogramControls = function initSpectrogramControls(){
    const paletteSel = App.el('ctl-specPalette');
    paletteSel.value = App.settings.specPalette;
    paletteSel.addEventListener('change', ()=>{
      App.settings.specPalette = paletteSel.value;
      App.saveSettings();
    });
    const anchorSel = App.el('ctl-specAnchor');
    anchorSel.value = App.settings.specAnchor;
    anchorSel.addEventListener('change', ()=>{
      App.settings.specAnchor = anchorSel.value;
      App.saveSettings();
      App.Spectrogram._lastAlignT = undefined;
    });
    const histRow = App.el('specHistorySecRow');
    if(histRow) histRow.style.display = App.settings.specFillWidth ? 'none' : '';
    const bothPanelsRow = App.el('specBothPanelsRow');
    if(bothPanelsRow) bothPanelsRow.style.display = App.settings.specInsideIsland ? '' : 'none';
  };
  App.define("ui/effect-controls", function initialize(){
  }, ["initFxControls","initLikedOutlinePulseControls","refreshSpectrogramControlsUI","initSpectrogramControls"]);
})(window.Aurora);

// ── ui/settings-reset ──
(function(App){
App.resetAllSettings = function resetAllSettings(){
    App.applyImportedSettings(App.defaultSettings);
  };
App.applySettingToUIFromKey = function applySettingToUIFromKey(input){
    App.applySettingToUI(input.dataset.setting);
  };
  App.define("ui/settings-reset", function initialize(){
App.el('btnResetAll').addEventListener('click', App.resetAllSettings);
App.el('btnExportProfiles').addEventListener('click', ()=>{
    const json = App.ProfileStore.exportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0,10);
    a.href = url;
    a.download = `musicviz-lufs-profily-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=> URL.revokeObjectURL(url), 1000);
  });
  }, ["resetAllSettings","applySettingToUIFromKey"]);
})(window.Aurora);

// ── storage/import-export ──
(function(App){
App.applyImportedSettings = function applyImportedSettings(incoming){
    if(!incoming||typeof incoming!=='object'||Array.isArray(incoming))throw new Error('Neplatný formát nastavení');
    const merged=App.mergeSettings(incoming);
    if(incoming.islandHover===undefined)merged.islandHover=incoming.hoverClear===false?'none':'clear';
    Object.assign(App.settings,merged);
    App.ensureTempoSyncDefaults(App.settings.bgMapSpeed);
    App.ensureTempoSyncDefaults(App.settings.bgMapColorSpeed);
    App.ensureSmoothDefaults(App.settings.bgMapSize);
    App.ensureSmoothDefaults(App.settings.bgMapSpeed);
    App.ensureSmoothDefaults(App.settings.bgMapFlash);
    App.ensureSmoothDefaults(App.settings.bgMapColorSpeed);
    App.ensureSmoothDefaults(App.settings.bgMapBlur);
    App.settings.bgLayers.forEach(layer=>{
      if(!layer.overrides) layer.overrides = {};
      if(layer.overrides.speed) App.ensureTempoSyncDefaults(layer.overrides.speed);
      if(layer.overrides.colorSpeed){
        App.ensureTempoSyncDefaults(layer.overrides.colorSpeed);
        App.ensureColorModeDefaults(layer.overrides.colorSpeed);
      }
      ['size','speed','flash','colorSpeed','blur'].forEach(k=>{
        if(layer.overrides[k]) App.ensureSmoothDefaults(layer.overrides[k]);
      });
    });
    App.saveSettings();
    document.querySelectorAll('input[type=range][data-setting]').forEach(App.applySettingToUIFromKey);
    document.querySelectorAll('.switch[data-setting]').forEach(sw=>{
      const key = sw.dataset.setting;
      sw.classList.toggle('on', !!App.settings[key]);
    });
    App.applyAnalyserParams();
    if(!App.settings.normalize&&App.normGain&&App.audioCtx)App.normGain.gain.setTargetAtTime(1,App.audioCtx.currentTime,.05);
    if(App.state.currentIndex !== -1){
      const track = App.state.tracks[App.state.currentIndex];
      if(track){
        const lufs = App.ProfileStore.get(App.trackKey(track));
        if(App.settings.normalize&&lufs !== undefined) App.setGainFromLufs(lufs);
      }
    }
    App.renderBgColorSwatches();
    App.renderPlayerColorSwatches();
    App.renderBgMappingRows();
    App.updateBgMapLiveValues();
    App.openLayerGear = -1;
    App.renderBgLayers();
    App.initFxControls();
    App.initLikedOutlinePulseControls();
    App.refreshSpectrogramControlsUI();
    App.refreshAppearanceControlsUI();
    App.BgReact._layerSignature = '';
    App.updatePlaybackModeButtons();
    App.refreshMusicVisualizer?.();
    App.refreshSelectMenus?.();
    App.SettingsUI?.accessibility?.();
  };
  App.define("storage/import-export", function initialize(){
App.profileImportInput = App.el('profileImportInput');
App.el('btnImportProfiles').addEventListener('click', ()=> App.profileImportInput.click());
App.profileImportInput.addEventListener('change', async e=>{
    const file = e.target.files[0];
    e.target.value = '';
    if(!file) return;
    try{
      const text = await file.text();
      const count = App.ProfileStore.importJson(text);
      App.updateProfileCount();
      App.renderTrackList();
      const status = App.el('bulkAnalyzeStatus');
      const progress = App.el('bulkAnalyzeProgress');
      progress.classList.add('show');
      status.textContent = `Importováno ${count} profilů`;
      App.el('bulkAnalyzeFill').style.width = '100%';
      setTimeout(()=>{ progress.classList.remove('show'); App.el('bulkAnalyzeFill').style.width='0%'; }, 2600);
    } catch(err){
      alert('Import se nezdařil: soubor není platný JSON export profilů.');
      console.warn(err);
    }
  });
App.el('btnExportAllSettings').addEventListener('click', ()=>{
    const payload = {
      musicvizSettingsExport: true,
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: App.settings
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0,10);
    a.href = url;
    a.download = `musicviz-nastaveni-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=> URL.revokeObjectURL(url), 1000);
  });
App.allSettingsImportInput = App.el('allSettingsImportInput');
App.el('btnImportAllSettings').addEventListener('click', ()=> App.allSettingsImportInput.click());
App.allSettingsImportInput.addEventListener('change', async e=>{
    const file = e.target.files[0];
    e.target.value = '';
    if(!file) return;
    try{
      const text = await file.text();
      const parsed = JSON.parse(text);
      const incoming = (parsed && typeof parsed === 'object' && parsed.settings && typeof parsed.settings === 'object')
        ? parsed.settings
        : parsed;
      if(!incoming || typeof incoming !== 'object') throw new Error('Neplatný formát souboru');
      App.applyImportedSettings(incoming);
      const status = App.el('bulkAnalyzeStatus');
      const progress = App.el('bulkAnalyzeProgress');
      progress.classList.add('show');
      status.textContent = 'Nastavení importováno';
      App.el('bulkAnalyzeFill').style.width = '100%';
      setTimeout(()=>{ progress.classList.remove('show'); App.el('bulkAnalyzeFill').style.width='0%'; }, 2600);
    } catch(err){
      alert('Import se nezdařil: soubor není platný JSON export nastavení.');
      console.warn(err);
    }
  });
App.initRangeControls();
App.initToggleControls();
App.syncMobileSceneSettingsUI?.();
App.initFxControls();
App.initLikedOutlinePulseControls();
App.initSpectrogramControls();
App.initAppearanceControls();
App.applyAppearanceSettings();
  }, ["profileImportInput","allSettingsImportInput","applyImportedSettings"]);
})(window.Aurora);

// ── ui/color-swatches ──
(function(App){


  App.define("ui/color-swatches", function initialize(){
App.bgPresets = [
    ['#ff2ec4','#7c3aed'],
    ['#22d3ee','#2563eb'],
    ['#f97316','#ef4444'],
    ['#22c55e','#0ea5e9'],
    ['#fbbf24','#ec4899'],
    ['#a3e635','#059669'],
  ];
App.el('bgCustomColor1').addEventListener('input', e=>{
    App.settings.bgColor1 = e.target.value; App.saveSettings(); App.renderBgColorSwatches();
  });
App.el('bgCustomColor2').addEventListener('input', e=>{
    App.settings.bgColor2 = e.target.value; App.saveSettings(); App.renderBgColorSwatches();
  });
App.el('playerCustomColor1').addEventListener('input', e=>{
    App.settings.playerColor1 = e.target.value; App.saveSettings(); App.renderPlayerColorSwatches();
  });
App.el('playerCustomColor2').addEventListener('input', e=>{
    App.settings.playerColor2 = e.target.value; App.saveSettings(); App.renderPlayerColorSwatches();
  });
App.renderPlayerColorSwatches();
  }, ["bgPresets","renderBgColorSwatches","renderPlayerColorSwatches"]);
})(window.Aurora);

// ── ui/background-layers ──
(function(App){
App.parseMapKey = function parseMapKey(key){
    if(typeof key === 'string' && key.indexOf('layer:') === 0){
      const parts = key.split(':');
      return { isOverride: true, layerIdx: parseInt(parts[1],10), overrideKey: parts[2] };
    }
    return { isOverride: false };
  };
App.getMapByKey = function getMapByKey(key){
    const p = App.parseMapKey(key);
    if(!p.isOverride) return App.settings[key];
    const layer = App.settings.bgLayers[p.layerIdx];
    return layer ? layer.overrides[p.overrideKey] : undefined;
  };
App.createLayerOverride = function createLayerOverride(target){
    const copy = JSON.parse(JSON.stringify(App.settings[target.settingKey]));
    if(target.overrideKey === 'speed' || target.overrideKey === 'colorSpeed') App.ensureTempoSyncDefaults(copy);
    if(target.overrideKey === 'colorSpeed') App.ensureColorModeDefaults(copy);
    return copy;
  };
App.computeLayerPercents = function computeLayerPercents(){
    const layers = App.settings.bgLayers;
    const total = layers.reduce((sum,l)=> sum + (l.enabled ? Math.max(0,l.count) : 0), 0);
    return layers.map(l => {
      if(!l.enabled || total <= 0) return 0;
      return (Math.max(0,l.count) / total) * 100;
    });
  };

  App.define("ui/background-layers", function initialize(){
App.BG_MAP_TARGETS = [
    { settingKey: 'bgMapSize',  overrideKey: 'size',       label: 'Velikost teček',   dotColor: 'var(--positive)' },
    { settingKey: 'bgMapSpeed', overrideKey: 'speed',      label: 'Rychlost pohybu',  dotColor: 'var(--accent3)'  },
    { settingKey: 'bgMapFlash', overrideKey: 'flash',      label: 'Flashování (jas)', dotColor: 'var(--warn)'     },
    { settingKey: 'bgMapColorSpeed', overrideKey: 'colorSpeed', label: 'Rychlost změny spektra', dotColor: 'var(--accent1)' },
    { settingKey: 'bgMapBlur', overrideKey: 'blur',        label: 'Rozostření', dotColor: 'var(--accent2)' },
  ];
App.openLayerGear = -1;
App.LAYER_BAR_COLORS = ['var(--accent1)','var(--accent3)','var(--positive)','var(--warn)'];
App.renderBgLayers();
  }, ["BG_MAP_TARGETS","parseMapKey","getMapByKey","createLayerOverride","openLayerGear","computeLayerPercents","LAYER_BAR_COLORS","renderBgLayers"]);
})(window.Aurora);

// ── ui/mapping-editor ──
(function(App){

App.renderBgMappingRows = function renderBgMappingRows(){
    App._liveValNodeCache?.clear();
    const container = App.el('bgMappingRows');
    const colors = App.el('colorMappingRows');
    App.rememberSettingsSections(container);
    if(colors)App.rememberSettingsSections(colors);
    container.innerHTML = '';
    if(colors)colors.innerHTML='';
    App.BG_MAP_TARGETS.forEach(target=>{
      (target.settingKey==='bgMapColorSpeed'&&colors?colors:container).appendChild(App.buildMapRowElement(target.settingKey, target));
    });
    App.SettingsUI?.accessibility?.();
    if(App.SettingsUI)App.SettingsUI.results=[];
    App.refreshPointerGlow?.();
  };
App.findMappingRowRefreshTargets = function findMappingRowRefreshTargets(key){
    const p = App.parseMapKey(key);
    if(p.isOverride){
      App.renderBgLayers();
    } else {
      App.renderBgMappingRows();
    }
    App.updateBgMapLiveValues();
  };
App.initMappingRowEvents = function initMappingRowEvents(){
    document.addEventListener('click', e=>{
      const clampSw = e.target.closest('.map-clamp-switch');
      if(clampSw){
        const key = clampSw.dataset.mapClamp;
        const map = App.getMapByKey(key);
        if(!map) return;
        map.clamp = !map.clamp;
        clampSw.classList.toggle('on', map.clamp);
        const rangeRow = clampSw.closest('.map-body').querySelector('.map-clamp-range-row');
        if(rangeRow) rangeRow.style.display = map.clamp ? '' : 'none';
        App.saveSettings();
        return;
      }
      const boostSw = e.target.closest('.map-boost-switch');
      if(boostSw){
        const key = boostSw.dataset.mapBoost;
        const map = App.getMapByKey(key);
        if(!map) return;
        map.boost = !map.boost;
        boostSw.classList.toggle('on', map.boost);
        const detail = boostSw.closest('.map-body').querySelector('.map-boost-detail');
        if(detail) detail.style.display = map.boost ? '' : 'none';
        App.saveSettings();
        App.redrawCurveEditor(key);
        return;
      }
      const tempoSw = e.target.closest('.map-tempo-sync-switch');
      if(tempoSw){
        const key = tempoSw.dataset.mapTempoSync;
        const map = App.getMapByKey(key);
        if(!map) return;
        App.ensureTempoSyncDefaults(map);
        map.tempoSync = !map.tempoSync;
        tempoSw.classList.toggle('on', map.tempoSync);
        const detail = tempoSw.closest('.map-body').querySelector('.map-tempo-sync-detail');
        if(detail) detail.style.display = map.tempoSync ? '' : 'none';
        App.saveSettings();
        App.updateTempoSyncLiveReadouts();
        return;
      }
      const enableSw = e.target.closest('.map-enable-switch');
      if(enableSw){
        const key = enableSw.dataset.mapEnable;
        const map = App.getMapByKey(key);
        if(!map) return;
        map.enabled = !map.enabled;
        App.saveSettings();
        App.findMappingRowRefreshTargets(key);
        return;
      }
      const curveResetBtn = e.target.closest('[data-curve-reset]');
      if(curveResetBtn){
        const key = curveResetBtn.dataset.curveReset;
        const map = App.getMapByKey(key);
        if(!map) return;
        map.curvePoints = [];
        App.saveSettings();
        App.redrawCurveEditor(key);
        return;
      }
      const curveCopyBtn = e.target.closest('[data-curve-copy]');
      if(curveCopyBtn){
        const key = curveCopyBtn.dataset.curveCopy;
        const map = App.getMapByKey(key);
        if(!map) return;
        const pts = map.curvePoints;
        App.curveClipboard = { points: JSON.parse(JSON.stringify(pts)) };
        try{
          navigator.clipboard && navigator.clipboard.writeText(JSON.stringify({ musicvizCurve: true, points: pts }));
        } catch(err){  }
        curveCopyBtn.classList.add('copied');
        const label = curveCopyBtn.querySelector('svg').nextSibling;
        if(label) label.textContent = ' Zkopírováno';
        setTimeout(()=>{
          curveCopyBtn.classList.remove('copied');
          if(label) label.textContent = ' Kopírovat';
        }, 1400);
        return;
      }
      const curvePasteBtn = e.target.closest('[data-curve-paste]');
      if(curvePasteBtn){
        const key = curvePasteBtn.dataset.curvePaste;
        (async ()=>{
          let pasted = null;
          try{
            if(navigator.clipboard && navigator.clipboard.readText){
              const text = await navigator.clipboard.readText();
              const parsed = JSON.parse(text);
              if(parsed && parsed.musicvizCurve && Array.isArray(parsed.points)){
                pasted = parsed.points;
              }
            }
          } catch(err){  }
          if(!pasted && App.curveClipboard) pasted = App.curveClipboard.points;
          if(!pasted){
            curvePasteBtn.classList.add('copied');
            const label = curvePasteBtn.querySelector('svg').nextSibling;
            if(label) label.textContent = ' Nic ke vložení';
            setTimeout(()=>{ curvePasteBtn.classList.remove('copied'); if(label) label.textContent=' Vložit'; }, 1400);
            return;
          }
          const cleaned = pasted
            .filter(p => p && typeof p.x === 'number' && typeof p.y === 'number' && isFinite(p.x) && isFinite(p.y))
            .slice(0, App.MAX_CURVE_POINTS)
            .map(p => ({ x: Math.max(0.04, Math.min(0.96, p.x)), y: Math.max(-0.15, Math.min(1.15, p.y)) }))
            .sort((a,b)=>a.x-b.x);
          const map = App.getMapByKey(key);
          if(!map) return;
          map.curvePoints = cleaned;
          App.saveSettings();
          App.redrawCurveEditor(key);
        })();
        return;
      }
    });
    document.addEventListener('change', e=>{
      const mapSel = e.target.closest('.map-select');
      if(mapSel && mapSel.dataset.map){
        const key = mapSel.dataset.map;
        const field = mapSel.dataset.field || 'source';
        const map = App.getMapByKey(key);
        if(!map) return;
        map[field] = mapSel.value;
        App.saveSettings();
        App.findMappingRowRefreshTargets(key);
        return;
      }
      const customColorInput = e.target.closest('.map-customcolor-input');
      if(customColorInput){
        const key = customColorInput.dataset.map;
        const map = App.getMapByKey(key);
        if(!map) return;
        map.customColor = customColorInput.value;
        App.saveSettings();
        return;
      }
      const clampInput = e.target.closest('.map-clamp-input');
      if(clampInput){
        const key = clampInput.dataset.map;
        const field = clampInput.dataset.field;
        const map = App.getMapByKey(key);
        const v = parseFloat(clampInput.value);
        if(map && isFinite(v)) map[field] = v/100;
        App.saveSettings();
        return;
      }
      const tempoInput = e.target.closest('.map-tempo-input');
      if(tempoInput){
        const key = tempoInput.dataset.map;
        const field = tempoInput.dataset.field;
        const map = App.getMapByKey(key);
        const v = parseFloat(tempoInput.value);
        if(map && isFinite(v)) map[field] = v;
        App.saveSettings();
        App.updateTempoSyncLiveReadouts();
        return;
      }
    });
    document.addEventListener('input', e=>{
      const customColorInputLive = e.target.closest('.map-customcolor-input');
      if(customColorInputLive){
        const key = customColorInputLive.dataset.map;
        const map = App.getMapByKey(key);
        if(!map) return;
        map.customColor = customColorInputLive.value;
        App.saveSettings();
        return;
      }
      const sensInput = e.target.closest('.map-sens-range');
      if(sensInput){
        const key = sensInput.dataset.map;
        const map = App.getMapByKey(key);
        if(!map) return;
        const v = parseFloat(sensInput.value);
        map.sensitivity = v;
        sensInput.closest('.map-row').querySelector('.map-sens-val').textContent = Math.round(v*100)+'%';
        App.saveSettings();
        return;
      }
      const boostThInput = e.target.closest('.map-boost-th-range');
      if(boostThInput){
        const key = boostThInput.dataset.map;
        const map = App.getMapByKey(key);
        if(!map) return;
        const v = parseFloat(boostThInput.value);
        map.boostThreshold = v;
        boostThInput.closest('.map-boost-detail').querySelector('.map-boost-th-val').textContent = Math.round(v*100)+'%';
        App.saveSettings();
        App.redrawCurveEditor(key);
        return;
      }
      const boostAmtInput = e.target.closest('.map-boost-amt-range');
      if(boostAmtInput){
        const key = boostAmtInput.dataset.map;
        const map = App.getMapByKey(key);
        if(!map) return;
        const v = parseFloat(boostAmtInput.value);
        map.boostAmount = v;
        boostAmtInput.closest('.map-boost-detail').querySelector('.map-boost-amt-val').textContent = '+'+Math.round(v*100)+'%';
        App.saveSettings();
        return;
      }
      const smoothInput = e.target.closest('.map-smooth-range');
      if(smoothInput){
        const key = smoothInput.dataset.map;
        const map = App.getMapByKey(key);
        if(!map) return;
        const v = parseFloat(smoothInput.value);
        map.smoothAmount = v;
        smoothInput.closest('.map-subrow').querySelector('.map-smooth-val').textContent = Math.round(v*100)+'%';
        App.saveSettings();
        return;
      }
      const tempoSensInput = e.target.closest('.map-tempo-sens-range');
      if(tempoSensInput){
        const key = tempoSensInput.dataset.map;
        const map = App.getMapByKey(key);
        if(!map) return;
        const v = parseFloat(tempoSensInput.value);
        map.tempoSens = v;
        tempoSensInput.closest('.map-tempo-sync-detail').querySelector('.map-tempo-sens-val').textContent = Math.round(v*100)+'%';
        App.saveSettings();
        App.updateTempoSyncLiveReadouts();
        return;
      }
    });
  };
  App.define("ui/mapping-editor", function initialize(){
App.initMappingRowEvents();
  }, ["buildMapRowElement","renderBgMappingRows","findMappingRowRefreshTargets","initMappingRowEvents"]);
})(window.Aurora);

// ── ui/curve-editor ──
(function(App){
App.initCurveEditor = function initCurveEditor(settingKey, root){
    const scope = root || document;
    const wrap = scope.querySelector(`.curve-editor-svg-wrap[data-curve-wrap="${settingKey}"]`);
    if(!wrap) return;
    if(wrap._auroraCurveEditor)return;
    wrap._auroraCurveEditor=true;
    App.redrawCurveEditor(settingKey, root);
    let dragIndex = -1;
    let pointerId=null,frame=0;
    const redraw=()=>App.redrawCurveEditor(settingKey,scope);
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;if(wrap.isConnected)redraw();});};
    function coordsFromEvent(e){
      const rect = wrap.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const px = Math.max(0, Math.min(1, (clientX - rect.left)/rect.width));
      const py = Math.max(0, Math.min(1, (clientY - rect.top)/rect.height));
      return { x: px, y: 1-py };
    }
    function pts(){ return App.getMapByKey(settingKey).curvePoints; }
    function hitTestPoint(pt){
      const rect = wrap.getBoundingClientRect();
      const dots = wrap.querySelectorAll('.curve-point-dot');
      for(let i=0;i<dots.length;i++){
        const dx = (parseFloat(dots[i].style.left)/100 - pt.x) * rect.width;
        const dy = (1 - parseFloat(dots[i].style.top)/100 - pt.y) * rect.height;
        if(Math.sqrt(dx*dx+dy*dy) < 16) return i;
      }
      return -1;
    }
    wrap.addEventListener('pointerdown', e=>{
      if(e.button!==0||pointerId!==null)return;
      const pt = coordsFromEvent(e);
      const hitIdx = hitTestPoint(pt);
      if(hitIdx >= 0){
        dragIndex = hitIdx;
        pointerId=e.pointerId;
        wrap.setPointerCapture(e.pointerId);
        wrap.querySelectorAll('.curve-point-dot')[hitIdx].classList.add('dragging');
        e.preventDefault();
        return;
      }
      const list = pts();
      if(list.length >= App.MAX_CURVE_POINTS) return;
      const clampedX = Math.max(0.04, Math.min(0.96, pt.x));
      list.push({ x: clampedX, y: Math.max(0, Math.min(1, pt.y)) });
      list.sort((a,b)=>a.x-b.x);
      App.saveSettings();
      redraw();
    });
    wrap.addEventListener('pointermove', e=>{
      if(dragIndex < 0||e.pointerId!==pointerId) return;
      const pt = coordsFromEvent(e);
      const list = pts();
      const p = list[dragIndex];
      if(!p) return;
      p.x = App.CurveMath.clampPointX(list, dragIndex, pt.x);
      p.y = Math.max(-0.15, Math.min(1.15, pt.y));
      schedule();
    });
    const finish=e=>{
      if(dragIndex < 0||e.pointerId!==pointerId) return;
      dragIndex = -1;
      pointerId=null;
      if(frame){cancelAnimationFrame(frame);frame=0;}
      App.saveSettings();
      redraw();
    };
    wrap.addEventListener('pointerup',finish);
    wrap.addEventListener('pointercancel',finish);
    wrap.addEventListener('lostpointercapture',finish);
    wrap.addEventListener('dblclick', e=>{
      const pt = coordsFromEvent(e);
      const hitIdx = hitTestPoint(pt);
      if(hitIdx < 0) return;
      pts().splice(hitIdx,1);
      App.saveSettings();
      redraw();
    });
  };

  App.define("ui/curve-editor", function initialize(){
App.MAX_CURVE_POINTS = 3;
App.curveClipboard = null;
App.renderBgColorSwatches();
App.renderBgMappingRows();
App.updateBgMapLiveValues();
App.el('btnPlaylistToggle').addEventListener('click', ()=>{
    App.setPlaylistOpen(App.app.classList.contains('playlist-closed'));
    App.Spectrogram._lastAlignT = undefined;
    App.markScrollActivity();
  });
  }, ["MAX_CURVE_POINTS","curveClipboard","initCurveEditor","redrawCurveEditor"]);
})(window.Aurora);

// ── ui/settings-navigation ──
(function(App){
  App.define("ui/settings-navigation", function initialize(){
App.SettingsUI = {
current:'playback',
searchTimer:0,
results:[],
groups:{
  "playback": {
    "cs": "Obecné",
    "en": "General",
    "description": [
      "Jazyk, přehrávání, rozhraní a výkon.",
      "Language, playback, interface and performance."
    ],
    "keys": [
      "autoplayOnImport",
      "randomFirstTrack",
      "smartTitleParsing"
    ],
    "pages": [
      {
        "key": "general",
        "cs": "Přehrávání",
        "en": "Playback"
      },
      {
        "key": "interface",
        "cs": "Rozhraní",
        "en": "Interface"
      },
      {
        "key": "rendering",
        "cs": "Výkon",
        "en": "Performance"
      },
      {
        "key": "settings",
        "cs": "Okno nastavení",
        "en": "Settings window",
        "id": "page-appearance-settings",
        "advanced": true
      }
    ]
  },
  "appearance": {
    "cs": "Přehrávač",
    "en": "Player",
    "description": [
      "Barvy, ovládací panel, kartičky a playlist.",
      "Colors, controls, track cards and playlist."
    ],
    "keys": [
      "playerColorSync",
      "stageTrackInfoEnabled",
      "ctrlBarTrackInfoEnabled",
      "liveStatsIslandEnabled"
    ],
    "pages": [
      {
        "key": "player",
        "cs": "Ovládání",
        "en": "Controls"
      },
      {
        "key": "colors",
        "cs": "Barvy",
        "en": "Colors"
      },
      {
        "key": "cards",
        "cs": "Kartičky skladeb",
        "en": "Track cards"
      },
      {
        "key": "playlist",
        "cs": "Playlist",
        "en": "Playlist"
      }
    ]
  },
  "live": {
    "cs": "Zvuk",
    "en": "Audio",
    "description": [
      "Hlasitost skladeb a zvukové vstupy vizuálních efektů.",
      "Track volume and audio input for visual effects."
    ],
    "keys": [
      "normalize",
      "targetLufs",
      "globalSens"
    ],
    "pages": [
      {
        "key": "volume",
        "cs": "Hlasitost",
        "en": "Volume"
      },
      {
        "key": "sensitivity",
        "cs": "Reakce efektů",
        "en": "Effect response"
      },
      {
        "key": "analysis",
        "cs": "Analýza",
        "en": "Analysis",
        "advanced": true
      },
      {
        "key": "values",
        "cs": "Živé hodnoty",
        "en": "Live values",
        "advanced": true
      }
    ]
  },
  "visualizers": {
    "cs": "Vizualizéry",
    "en": "Visualizers",
    "description": [
      "Typ vizualizace, její vzhled a efekty celé scény.",
      "Visualization, its appearance and scene-wide effects."
    ],
    "keys": [],
    "pages": [
      {
        "key": "general",
        "cs": "Základní",
        "en": "Basics"
      },
      {
        "key": "equalizer",
        "cs": "Equalizér",
        "en": "Equalizer"
      },
      {
        "key": "wave",
        "cs": "Vlna",
        "en": "Wave"
      },
      {
        "key": "ring",
        "cs": "Kruh",
        "en": "Ring"
      },
      {
        "key": "filters",
        "cs": "Efekty scény",
        "en": "Scene effects",
        "id": "page-appearance-filters",
        "advanced": true
      }
    ]
  },
  "background": {
    "cs": "Pozadí",
    "en": "Background",
    "description": [
      "Vrstvy a barvy pozadí, jejich pohyb a reakce na hudbu.",
      "Background layers, colors, motion and music response."
    ],
    "keys": [
      "bgEnabled",
      "fxOverallOpacity",
      "reduceFlashIntensity"
    ],
    "pages": [
      {
        "key": "background",
        "cs": "Vrstvy",
        "en": "Layers"
      },
      {
        "key": "colors",
        "cs": "Barvy",
        "en": "Colors"
      },
      {
        "key": "mapping",
        "cs": "Reakce na hudbu",
        "en": "Music response"
      },
      {
        "key": "effects",
        "cs": "Efekty",
        "en": "Effects",
        "advanced": true
      }
    ]
  },
  "island": {
    "cs": "Časová osa",
    "en": "Timeline",
    "description": [
      "Časová osa, křivka hlasitosti a spektrogram.",
      "Timeline, loudness waveform and spectrogram."
    ],
    "keys": [
      "timelineLoudnessWaveform",
      "timelineWaveformAlwaysVisible",
      "specEnabled",
      "specInsideIsland",
      "specIslandVisibility"
    ],
    "pages": [
      {
        "key": "timeline",
        "cs": "Ovládání a vzhled",
        "en": "Controls & layout"
      },
      {
        "key": "waveform",
        "cs": "Křivka hlasitosti",
        "en": "Loudness waveform"
      },
      {
        "key": "spectrum",
        "cs": "Spektrogram",
        "en": "Spectrogram"
      }
    ]
  },
  "data": {
    "cs": "Data",
    "en": "Data",
    "description": [
      "Záloha nastavení a uložené profily skladeb.",
      "Settings backups and saved track profiles."
    ],
    "keys": [],
    "pages": [
      {
        "key": "profiles",
        "cs": "Zálohy a profily",
        "en": "Backups & profiles"
      }
    ]
  }
},
advanced:false,
...App.parts["SettingsUI"]
};
App.SettingsUI.mount();
App.mountInteractionEffects();
App.mountSelectMenus();
  }, ["SettingsUI"]);
})(window.Aurora);
