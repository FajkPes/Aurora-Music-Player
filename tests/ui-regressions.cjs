// Node-only regression checks; these do not replace browser rendering tests.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const modules = new Map(), styles = new Map(), templates = new Map(), parts = {}, workerParts = new Map();
const App = {
  parts,
  workerSources: {},
  define(name, fn) { assert(!modules.has(name), name); modules.set(name, fn); },
  addStyle(name, css) { assert(!styles.has(name), name); styles.set(name, css); },
  registerTemplate(name, html) { assert(!templates.has(name), name); templates.set(name, html); },
  addParts(name, values) { Object.assign(parts[name] ??= {}, values); },
  registerWorker() {}, registerWorkerPart(name, fn) { workerParts.set(name, fn); }
};
const storage = new Map();
const context = vm.createContext({
  window: { Aurora: App, addEventListener() {} }, console,
  localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
  setTimeout, clearTimeout, performance
});
const files = [...read('index.html').matchAll(/<script src="([^"]+)"/g)].map(match => match[1].split('?')[0]);
for (const file of files.filter(file => file !== 'app.js')) vm.runInContext(read(file), context, { filename: file });
modules.get('core/settings')();
App.ScrollActivity={lastAt:-Infinity,WINDOW_MS:180};
const factoryPreset=JSON.parse(read('tests/fixtures/factory-settings.json')).settings;
for(const [key,value] of Object.entries(factoryPreset))assert.deepEqual(JSON.parse(JSON.stringify(App.defaultSettings[key])),value,`Factory preset: ${key}`);
assert.equal(App.defaultSettings.vizMode,'equalizer','Factory preset enables its selected visualizer');
assert.equal(App.defaultSettings.vizOpacity,1);
for(const [saved,expected] of [[.65,1],[.3,.3],[0,0],[1,1]]){
  storage.set(App.STORAGE_KEY,JSON.stringify({vizOpacity:saved}));
  assert.equal(App.loadSettings().vizOpacity,expected,'Brightness migration preserves customized visibility');
}
storage.set(App.STORAGE_KEY,JSON.stringify({vizOpacity:.65,vizBrightnessVersion:1}));
assert.equal(App.loadSettings().vizOpacity,.65,'New visibility choices remain adjustable');
storage.delete(App.STORAGE_KEY);
// Initialize the real composition module, replacing only its DOM mount boundary.
// The previous regression test called parts.navigate directly and missed a missing export.
const mountSettings = parts.SettingsUI.mount;
const mountInteractions = App.mountInteractionEffects;
const mountSelectMenus = App.mountSelectMenus;
parts.SettingsUI.mount = () => {};
App.mountInteractionEffects = () => {};
App.mountSelectMenus = () => {};
modules.get('ui/settings-navigation')();
parts.SettingsUI.mount = mountSettings;
App.mountInteractionEffects = mountInteractions;
App.mountSelectMenus = mountSelectMenus;
App.SettingsUI.mount = mountSettings;
for (const [name, method] of Object.entries(parts.SettingsUI)) {
  assert.equal(App.SettingsUI[name], method, `SettingsUI.${name} must be connected to the running application`);
}
for (const html of templates.values()) {
  for (const match of html.matchAll(/@@AURORA:([^@]+)@@/g)) assert(templates.has(match[1]), match[1]);
}
for (const mode of ['clear', 'light', 'glow', 'none']) {
  storage.set(App.STORAGE_KEY, JSON.stringify({ islandHover: mode }));
  assert.equal(App.loadSettings().islandHover, mode);
}
storage.set(App.STORAGE_KEY, JSON.stringify({ vizRingCount:96, vizEqHeight:.45, vizWaveWidth:.6 }));
const migratedVisualizers=App.loadSettings();
assert.equal(migratedVisualizers.vizRingCount,App.defaultSettings.vizRingCount);
assert.equal(migratedVisualizers.vizEqHeight,.7);
assert.equal(migratedVisualizers.vizWaveWidth,.6,'Customized proportions are preserved');
for (const hoverClear of [true, false]) {
  storage.set(App.STORAGE_KEY, JSON.stringify({ hoverClear }));
  assert.equal(App.loadSettings().islandHover, hoverClear ? 'clear' : 'none');
}
for (const ctrlTrackAlign of ['left', 'right']) for (const ctrlTrackWidth of ['content', 'fill']) {
  storage.set(App.STORAGE_KEY, JSON.stringify({ ctrlTrackAlign, ctrlTrackWidth }));
  const loaded = App.loadSettings();
  assert.equal(loaded.ctrlTrackAlign, ctrlTrackAlign);
  assert.equal(loaded.ctrlTrackWidth, ctrlTrackWidth);
}
const bar = {
  classList: { contains: () => true },
  style: { value: '', getPropertyValue() { return this.value; }, setProperty(key, value) { this.value = value; } }
};
const chip = { classList: { contains: () => true }, style: {} };
App.el = id => id === 'barTrackInfo' ? bar : chip;
App.state = { isPlaying: true };
App.MusicSense = { data: { mid: 100 } };
App.settings = { ...App.defaultSettings };
App.updateLikedOutlinePulse();
assert.equal(bar.style.value, '1.00');
App.settings.stageLikedOutlinePulseSensitivity = 0;
App.updateLikedOutlinePulse();
assert.equal(bar.style.value, '0.50');
App.settings.stageLikedOutlinePulseSensitivity = 1;
App.state.isPlaying = false;
App.updateLikedOutlinePulse();
assert.equal(bar.style.value, '0.50');
console.log(`PASS: ${modules.size} module registrations, ${styles.size} styles, ${templates.size} template references; hover persistence/migration; favorite pulse.`);

// Bounded geometry for every new visualizer, including silence and small screens.
for (const mode of ['equalizer','wave','ring']) for (const width of [320,1440]) for (const amplitude of [0,1]) {
  const geometry = [], drawCalls = [];
  const ctx = { createLinearGradient(){return {addColorStop(){}};},fillRect(){}, save() {}, restore() {}, beginPath() {}, moveTo(...v) { geometry.push(...v); }, lineTo(...v) { geometry.push(...v); },
    roundRect(...v) { assert(v[2]>0&&v[3]>0); geometry.push(...v); }, arc(...v) { assert(v[2]>0); geometry.push(...v); },
    fill() { drawCalls.push('fill'); }, stroke() { drawCalls.push('stroke'); } };
  App.drawMusicVisualizer(ctx,width,600,mode,new Float32Array(160).fill(amplitude),new Float32Array(256).fill(amplitude),App.defaultSettings,.5);
  assert(geometry.every(Number.isFinite), `${mode} must produce finite coordinates`);
  assert(drawCalls.length>0&&drawCalls.length<=128, `${mode} stays within its draw budget`);
  assert(templates.has('page-visualizers-'+mode));
}
assert.equal(App.SettingsUI.groups.visualizers.pages.map(page=>page.key).join(','),'general,equalizer,wave,ring,filters');
assert.equal(App.SettingsUI.groups.visualizers.pages.find(page=>page.key==='filters').advanced,true, 'Scene effects belong to advanced visualizer settings');
assert(read('app.js').includes('"stage/music-visualizers"'), 'Renderer must be initialized by the real boot sequence');
console.log('PASS: equalizer, wave and ring geometry at desktop/mobile widths and silent/full input; settings and boot wiring.');
for(const mode of ['equalizer','wave','ring']){
  const glows=[];
  const ctx={createLinearGradient(){return {addColorStop(){}};},fillRect(){},save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},roundRect(){},arc(){},fill(){glows.push(this.shadowBlur);},stroke(){glows.push(this.shadowBlur);}};
  const key={equalizer:'vizEqGlow',wave:'vizWaveGlow',ring:'vizRingGlow'}[mode];
  App.drawMusicVisualizer(ctx,1440,800,mode,new Float32Array(256),new Float32Array(260),{...App.defaultSettings,[key]:1},0);
  assert(glows.some(v=>v>0));
  glows.length=0;
  App.drawMusicVisualizer(ctx,1440,800,mode,new Float32Array(256),new Float32Array(260),{...App.defaultSettings,[key]:0},0);
  assert(glows.every(v=>v===0),'Each visualizer glow can be disabled independently');
}

// Verify the real timeline path is mirrored vertically, not just a no-op abs(dx).
const originalTimeline = { settings: App.settings, state: App.tlState, ctx: App.pCtx, canvas: App.progressCanvas, colors: App.PlayerColors };
for (const dpr of [1, 2]) {
  const paths = []; let points = [];
  App.pCtx = { clearRect() {}, save() {}, restore() {}, beginPath() { points = []; },
    moveTo(x,y) { points.push([x,y]); }, lineTo(x,y) { points.push([x,y]); }, closePath() {},
    fill() { paths.push(points.slice()); }, rect() {}, clip() {}, createLinearGradient: () => ({ addColorStop() {} }) };
  App.settings = { ...App.defaultSettings, timelineWaveSymmetry: true, timelineWave: true };
  App.CANVAS_HEIGHT_MULT = 4.2;
  App.progressCanvas = { width: 100*dpr, height: 29.6*dpr };
  App.PlayerColors = { _lastC1: '#ffffff', _lastC2: '#ffffff' };
  App.tlState = { dpr, cachedBoxH: 29.6, cachedTrackH: 4, mouseX: .5, waveAmp: 1, progress: .6 };
  App.tlDraw();
  const mainPath = JSON.stringify(paths[0]);
  const workerContext = vm.createContext({ progressCanvas: App.progressCanvas, pCtx: App.pCtx,
    settings: App.settings, tlState: { ...App.tlState, _lastDrawKey: null }, PlayerColors: App.PlayerColors, CANVAS_HEIGHT_MULT: 4.2 });
  const workerSource = workerParts.get('timeline/02-tl-draw').toString();
  vm.runInContext('(' + workerSource.slice(0,-1) + ';progressCanvas=globalThis.progressCanvas;pCtx=globalThis.pCtx;tlState=globalThis.tlState;globalThis.drawForTest=tlDraw;})()', workerContext);
  workerContext.drawForTest();
  assert.equal(JSON.stringify(paths[2]), mainPath, 'Worker and main thread generate identical mirrored paths');
  const pointsInPath = paths[0], count = pointsInPath.length/2;
  assert(count > 1);
  for(let i=0;i<count;i++) {
    const top = pointsInPath[i], bottom = pointsInPath[pointsInPath.length-1-i];
    assert.equal(top[0], bottom[0]);
    assert(Math.abs(top[1]+bottom[1]-29.6*dpr)<1e-8, 'Both sides share the exact track center');
  }
}
App.settings = originalTimeline.settings; App.tlState = originalTimeline.state;
App.pCtx = originalTimeline.ctx; App.progressCanvas = originalTimeline.canvas; App.PlayerColors = originalTimeline.colors;
console.log('PASS: symmetric hover wave mirrors every path point around the timeline center at DPR 1 and 2.');

// Exercise the actual interaction handlers with a minimal DOM adapter.
class Element {
  constructor() {
    this.children = []; this.events = {}; this.attrs = {}; this.dataset = {};
    this.classes = new Set(); this.style = { setProperty() {} };
    this.classList = {
      add: name => this.classes.add(name), remove: name => this.classes.delete(name),
      contains: name => this.classes.has(name),
      toggle: (name, on = !this.classes.has(name)) => on ? this.classes.add(name) : this.classes.delete(name)
    };
    this.isConnected = true;
  }
  append(...nodes) { for (const n of nodes) { this.children.push(n); n.parentElement = this; } }
  after(node) { this.next = node; }
  replaceChildren(...nodes) { this.children = []; this.append(...nodes); }
  setAttribute(key, value) { this.attrs[key] = value; }
  getAttribute(key) { return this.attrs[key] ?? null; }
  addEventListener(name, fn) { (this.events[name] ??= []).push(fn); }
  dispatchEvent(event) { for (const fn of this.events[event.type] || []) fn(event); }
  closest(selector) { return selector === '.range-row' ? this.row : null; }
  contains(node) { return this === node || this.children.some(child => child.contains(node)); }
  querySelector(selector) {
    if (selector === 'span') return this.children.find(n => n.tagName === 'SPAN');
    if (selector.startsWith('[aria-selected="true"]')) return this.children.find(n => n.attrs['aria-selected'] === 'true' && !n.disabled);
    if (selector === 'button:not(:disabled)') return this.children.find(n => !n.disabled);
    if (selector.includes('range-label-row')) return this.label;
    if (selector === '[aria-checked="true"]') return this.children.find(n => n.attrs['aria-checked'] === 'true');
    return null;
  }
  querySelectorAll(selector) {
    if (selector === 'button:not(:disabled)') return this.children.filter(n => !n.disabled);
    return [];
  }
  focus() { doc.activeElement = this; }
  getClientRects() { return [this.getBoundingClientRect()]; }
  animate(frames, options) { this.lastMotion = { frames, options }; return { finished: Promise.resolve(), cancel() {}, finish() {} }; }
  getBoundingClientRect() { return this.rect || { left: 110, top: 90, right: 150, bottom: 120, width: 40, height: 30 }; }
}
const doc = new Element(); doc.elementFromPoint = () => null; doc.body = new Element(); doc.documentElement = new Element(); doc.documentElement.lang = 'en';
const sort = new Element(), direction = new Element();
const alignment = new Element(), sizing = new Element();
for (const [control, key] of [[sort, 'playlistSort'], [direction, 'playlistSortDirection'], [alignment, 'ctrlTrackAlign'], [sizing, 'ctrlTrackWidth']]) {
  control.id = 'ctl-' + key; control.dataset.extraSelect = key;
  control.row = new Element(); control.row.label = new Element(); control.row.label.textContent = key;
}
sort.options = [{ value: 'original', textContent: 'Import order' }, { value: 'title', textContent: 'Track title' }];
Object.defineProperty(sort, 'selectedOptions', { get: () => sort.options.filter(o => o.value === sort.value) });
let strokes = 0;
const strokeStyles = [],strokeProfiles=[];
const drawing = { clearRect() { strokes = 0; strokeStyles.length=0;strokeProfiles.length=0; }, createRadialGradient: (...args) => ({ radius: args[5], stops:[], addColorStop(at,color) {this.stops.push([at,color]);} }), createLinearGradient(){return {addColorStop(){}};},fillRect(){}, save() {}, restore() {}, beginPath() {}, rect() {}, clip() {}, roundRect() {}, stroke() { strokes++; strokeStyles.push(this.strokeStyle);strokeProfiles.push([this.globalAlpha,this.lineWidth]); } };
doc.createElement = tag => { const n = new Element(); n.tagName = tag.toUpperCase(); n.getContext = () => drawing; return n; };
const nearby = [new Element(), new Element(), new Element()];
nearby[1].rect = { left: 230, top: 90, right: 270, bottom: 120, width: 40, height: 30 };
nearby[2].rect = { left: 500, top: 90, right: 540, bottom: 120, width: 40, height: 30 };
doc.querySelectorAll = selector => selector === '[data-extra-select]' ? [sort, direction, alignment, sizing] : nearby;
const win = new Element(); win.Aurora = App;
const frames = [];
Object.assign(context, {
  window: win, document: doc, Event, innerWidth: 900, innerHeight: 600,
  MutationObserver: class { observe() {} },
  performance: { now: () => 1000 }, requestAnimationFrame: fn => { frames.push(fn); return frames.length; },
  matchMedia: () => ({ matches: false, addEventListener() {} }),
  getComputedStyle: () => ({ opacity: '1', visibility: 'visible', borderTopLeftRadius: '12px', overflowX: 'visible', overflowY: 'visible' })
});
const elements = { 'ctl-playlistSort': sort, 'ctl-playlistSortDirection': direction, playlistPanel: new Element(), btnPlaylistToggle: new Element(), controlBar: new Element(), barTrackInfo: new Element() };
App.el = id => elements[id]; App.app = new Element(); App.trackListEl = { scrollTop: 90 };
App.settings = { ...App.defaultSettings,playlistSort:'original',playlistSortDirection:'asc',hoverRadius:200,hoverFullOutlineStrength:85 }; App.saveSettings = () => {};
let renders = 0; App.renderTrackList = () => renders++;
App.mountInteractionEffects();
for (const value of ['left', 'right']) {
  alignment.value = value; alignment.dispatchEvent(new Event('change'));
  assert.equal(elements.barTrackInfo.dataset.textAlign, value);
  assert.equal(App.settings.ctrlTrackAlign, value);
}
for (const value of ['content', 'fill']) {
  sizing.value = value; sizing.dispatchEvent(new Event('change'));
  assert.equal(elements.barTrackInfo.dataset.widthMode, value);
  assert.equal(App.settings.ctrlTrackWidth, value);
}
const trigger = sort.row.children[0], menu = sort.row.children[1], arrow = direction.row.next;
assert.equal(sort.hidden, true); assert.equal(direction.row.hidden, true);
trigger.dispatchEvent({ type: 'click' });
assert.equal(menu.inert, false); assert.equal(doc.activeElement.attrs['aria-checked'], 'true');
menu.dispatchEvent({ type: 'keydown', key: 'ArrowDown', preventDefault() {} });
assert.equal(doc.activeElement, menu.children[1]);
doc.activeElement.dispatchEvent({ type: 'click' });
assert.equal(App.settings.playlistSort, 'title'); assert.equal(menu.inert, true);
assert.equal(App.trackListEl.scrollTop, 0); assert.equal(doc.activeElement, trigger);
arrow.dispatchEvent({ type: 'click' });
assert.equal(App.settings.playlistSortDirection, 'desc'); assert(arrow.classes.has('descending'));
arrow.dispatchEvent({ type: 'click' }); assert.equal(App.settings.playlistSortDirection, 'asc');
assert.equal(renders, 3);
win.dispatchEvent({ type: 'pointermove', clientX: 100, clientY: 100, pointerType: 'mouse' });
frames.shift()();
assert.equal(strokes, 6, 'Both nearby outlines receive three strokes; distant outline receives none');
App.settings.hoverOutlineCoverage = 100;
doc.elementFromPoint = () => ({ closest: () => nearby[0] });
win.dispatchEvent({ type: 'pointermove', clientX: 120, clientY: 100, pointerType: 'mouse' }); frames.shift()();
assert.equal(typeof strokeStyles[0], 'string', 'Hovered outline uses uniform color across its full perimeter');
assert(strokeStyles[0].endsWith(',0.85)'));
assert.equal(typeof strokeStyles[3], 'object', 'Neighbor retains its distance gradient');
App.settings.hoverOutlineCoverage = 80;
win.dispatchEvent({ type: 'pointermove', clientX: 120, clientY: 100, pointerType: 'mouse' }); frames.shift()();
assert.equal(typeof strokeStyles[0], 'object', '80% preserves distance falloff');
assert(strokeStyles[0].radius > strokeStyles[3].radius, 'Only hovered element receives a wider falloff');
assert.equal(strokeStyles[3].radius, App.settings.hoverRadius, 'Neighbor retains the original radius');

App.settings.hoverOutlineCoverage = 0;
win.dispatchEvent({ type: 'pointermove', clientX: 120, clientY: 100, pointerType: 'mouse' }); frames.shift()();
assert.equal(typeof strokeStyles[0], 'object', 'Zero coverage retains the original falloff');
assert.equal(strokeStyles[0].radius, App.settings.hoverRadius);
App.settings.hoverFullOutlineStrength = 0;
App.settings.hoverOutlineCoverage = 100;
win.dispatchEvent({ type: 'pointermove', clientX: 120, clientY: 100, pointerType: 'mouse' }); frames.shift()();
assert.equal(typeof strokeStyles[0], 'object', 'Zero hover intensity restores original glow even at full coverage');
App.settings.hoverFullOutlineStrength = 85;
App.settings.hoverOutlineCoverage = 80;
doc.elementFromPoint = () => null;

nearby[1].closest = selector => selector.split(',').includes('#controlBar') ? elements.controlBar : null;
win.dispatchEvent({ type: 'pointermove', clientX: 100, clientY: 100, pointerType: 'mouse' }); frames.shift()();
assert.equal(strokes, 3, 'Default 50% Control Island radius excludes the control 130px away');
App.settings.hoverIslandRadiusPercent = 100;
win.dispatchEvent({ type: 'pointermove', clientX: 100, clientY: 100, pointerType: 'mouse' }); frames.shift()();
assert.equal(strokes, 6, '100% restores the global radius for Control Island');
// Information popovers are surfaces, so they retain the configured proximity
// strength rather than the stronger button-hover outline. The detached bottom
// popover must still use the Control Island range.
nearby[0].id='stageTrackInfoPopover';nearby[1].id='trackInfoPopover';nearby[1].closest=()=>null;
App.settings.hoverIslandRadiusPercent=50;App.settings.hoverGlowStrength=.2;
App.settings.hoverFullOutlineStrength=95;App.settings.hoverOutlineCoverage=100;
doc.elementFromPoint=()=>({closest:selector=>selector.includes('#stageTrackInfoPopover')?nearby[0]:null});
win.dispatchEvent({type:'pointermove',clientX:100,clientY:100,pointerType:'mouse'});frames.shift()();
assert.equal(strokes,3,'Detached bottom popover follows the reduced panel radius');
assert.equal(typeof strokeStyles[0],'object','Information surface retains proximity falloff');
assert.deepEqual(strokeProfiles.slice(0,3),[[.08,4],[.2,2],[.65,1]],'Information surface uses a thinner, gentler halo than controls');
assert(strokeStyles[0].stops[0][1].endsWith(',0.2)'),'Popover follows glow strength, not the 95% button hover strength');
nearby[0].id='';nearby[1].id='';
App.settings.hoverGlow = false;
doc.dispatchEvent({ type: 'change' }); frames.shift()();
assert.equal(strokes, 0, 'Disabling glow clears the overlay');
console.log('PASS: sort selection, keyboard navigation, focus return, direction toggling, multiple nearby glow outlines and radius cutoff.');

// Exercise the generic replacement used by settings and dynamically rendered selects.
for (const [select, values] of [[alignment, ['left', 'right']], [sizing, ['content', 'fill']]]) {
  select.options = values.map(value => ({ value, textContent: value, get selected() { return select.value === value; } }));
  Object.defineProperty(select, 'selectedOptions', { get: () => select.options.filter(o => o.selected) });
}
const queryBeforeMenus = doc.querySelectorAll;
doc.querySelectorAll = selector => selector === 'select' ? [alignment, sizing, sort, direction] : queryBeforeMenus(selector);
App.mountSelectMenus();
assert(alignment.classList.contains('aurora-select-source'));
assert(sizing.classList.contains('aurora-select-source'));
assert.equal(alignment.getAttribute('aria-hidden'), 'true');
assert.equal(alignment._auroraSelectButton.getAttribute('aria-haspopup'), 'listbox');
alignment._auroraSelectButton.dispatchEvent({ type: 'click' });
const styledMenu = doc.body.children.at(-1);
assert.equal(styledMenu.inert, false);
styledMenu.children[0].dispatchEvent({ type: 'click' });
assert.equal(App.settings.ctrlTrackAlign, 'left');
assert.equal(alignment._auroraSelectButton.querySelector('span').textContent, 'left');
assert.equal(styledMenu.inert, true);
assert.equal(styledMenu.children.length,0,'Closing the menu releases option handlers and their source controls');
assert.equal(doc.activeElement, alignment._auroraSelectButton);
console.log('PASS: shared rounded select menu, native control hiding, setting updates and focus return.');

(async () => {
  // Use the assembled application's real select/navigate methods and every group.
  elements.settingsSearch = new Element();
  elements.btnSettings = new Element();
  const realNavigation = { ...App.SettingsUI, uiPrefs: { motion: true, duration: 100 },
    groups: {}, content: new Element(), searchResults: new Element(), panel: new Element() };
  for (const [key, group] of Object.entries(App.SettingsUI.groups)) {
    realNavigation.groups[key] = { ...group, selected: group.pages[0].key,
      panel: new Element(), button: new Element(), subnav: new Element(),
      pages: group.pages.map(page => ({ ...page, panel: new Element(), button: new Element() })) };
  }
  realNavigation.select('appearance');
  realNavigation.advanced = true;
  await realNavigation.navigate('live', 'values');
  assert.equal(realNavigation.current, 'live');
  assert.equal(realNavigation.groups.live.selected, 'values');
  assert.equal(realNavigation.groups.live.panel.classList.contains('active'), true);
  assert.equal(realNavigation.groups.appearance.panel.classList.contains('active'), false);
  for (const page of realNavigation.groups.live.pages) assert.equal(page.panel.hidden, page.key !== 'values');
  realNavigation.advanced = false;
  realNavigation.select('appearance');
  await realNavigation.navigate('live', 'values');
  assert.equal(realNavigation.groups.live.selected, 'volume', 'Basic mode redirects away from advanced-only pages');
  await realNavigation.navigate('appearance', 'player');
  assert.equal(realNavigation.groups.appearance.selected, 'player');
  // Opening during a pending close must win over the old close completion callback.
  realNavigation.restoreWindowGeometry = realNavigation.translate = realNavigation.index = realNavigation.accessibility = () => {};
  realNavigation.open(true); realNavigation.open(false); realNavigation.open(true);
  assert.match(realNavigation.panel.lastMotion.frames[0].transform, /scale\(\.72\)/);
  assert.equal(realNavigation.panel.lastMotion.frames[0].opacity, 0);
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(realNavigation.isOpen, true);
  assert(realNavigation.panel.classList.contains('open'));
  realNavigation.uiPrefs.motion = false;
  realNavigation.open(false);
  assert.equal(realNavigation.panel.classList.contains('open'), false);
  realNavigation.uiPrefs.motion = true;
  realNavigation.uiPrefs.settingsMotion = false;
  assert.equal(realNavigation.motionDuration('settingsMotion'), 0);
  assert.equal(realNavigation.motionDuration('playlistMotion'), 100);
  const originalMedia = context.matchMedia;
  context.matchMedia = () => ({ matches: true });
  realNavigation.uiPrefs.respectSystemMotion = false;
  assert.equal(realNavigation.motionDuration('playlistMotion'), 100);
  realNavigation.uiPrefs.respectSystemMotion = true;
  assert.equal(realNavigation.motionDuration('playlistMotion'), 0);
  context.matchMedia = originalMedia;
  console.log('PASS: assembled SettingsUI switches categories/subtabs, reverses closing, and applies both track-card controls.');
  const animations = [], selected = [];
  const panel = { animate() {
    let resolve, reject;
    const animation = { finished: new Promise((ok, fail) => { resolve = ok; reject = fail; }),
      cancel() { reject(new Error('cancelled')); }, finish() { resolve(); } };
    animations.push(animation); return animation;
  } };
  const navigation = {
    current: 'appearance', groups: { appearance: { selected: 'cards', pages: [{ key: 'cards', panel }] } },
    motionDuration: () => 220,
    select(key, clear, page) { selected.push([key, page]); },
    navigate: App.SettingsUI.navigate,
    finishMotion: App.SettingsUI.finishMotion
  };
  const first = navigation.navigate('audio', 'values');
  const second = navigation.navigate('island', 'timeline');
  animations.at(-1).finish();
  await Promise.all([first, second]);
  assert.deepEqual(selected, [['island', 'timeline']], 'A cancelled navigation cannot replace the newest selection');
  navigation.motionDuration = () => 0;
  await navigation.navigate('audio', 'values');
  assert.deepEqual(selected.at(-1), ['audio', 'values']);
  const stuck = { finished: new Promise(() => {}), cancel() { this.cancelled = true; } };
  await App.SettingsUI.finishMotion(stuck, 0);
  assert.equal(stuck.cancelled, true, 'Paused animations cannot block navigation forever');
  console.log('PASS: rapid navigation cancellation and immediate navigation when motion is disabled.');
})().catch(error => { console.error(error); process.exitCode = 1; });

// Every ring style supports bounded geometry and genuinely removable layers.
for(const style of ['rays','pulse','particles'])for(const count of [32,256]){
  let calls=0,dots=0;const widths=[],alpha=[];
  const ctx={createLinearGradient(){return {addColorStop(){}};},fillRect(){},save(){},restore(){},beginPath(){},moveTo(...v){assert(v.every(Number.isFinite));},lineTo(...v){assert(v.every(Number.isFinite));},arc(x,y,r){assert(Number.isFinite(x+y+r)&&r>0);dots++;},fill(){calls++;alpha.push(this.globalAlpha);},stroke(){calls++;widths.push(this.lineWidth);alpha.push(this.globalAlpha);}};
  const prefs={...App.defaultSettings,vizRingContour:true,vizRingStyle:style,vizRingCount:count,vizRingThickness:7,vizRingFade:1};
  App.drawMusicVisualizer(ctx,600,500,'ring',new Float32Array(256).fill(1),new Float32Array(260),prefs,1);
  assert(calls<=21&&dots<=1536,'Ring rendering stays within its batch/particle budget');
  assert(alpha.every(a=>a>=0&&a<=1));assert(widths.includes(7),'Thickness affects actual contour');
  calls=0;App.drawMusicVisualizer(ctx,600,500,'ring',new Float32Array(256),new Float32Array(260),{...prefs,vizRingRays:false,vizRingParticles:false,vizRingContour:false,vizRingInner:false},0);
  assert.equal(calls,0,'Disabling every layer removes all ring geometry');
}
console.log('PASS: ring styles, layer switches, thickness, opacity bounds and particle budget.');
// Equalizer: one centered shape per bar, continuous mask, optional independent tips.
for(const fade of [0,1]){
 const bars=[],stops=[];let dots=0,masks=0;
 const ctx={save(){},restore(){},beginPath(){},fill(){},moveTo(){},arc(){dots++;},roundRect(...args){bars.push(args);},createLinearGradient(){return {addColorStop(at,color){stops.push([at,color]);}};},fillRect(){masks++;}};
 const prefs={...App.defaultSettings,vizEqCount:16,vizEqFade:fade,vizEqTips:false};
 App.drawMusicVisualizer(ctx,800,500,'equalizer',new Float32Array(256).fill(.8),new Float32Array(260),prefs,0);
 assert.equal(bars.length,16);assert.equal(dots,0);
 for(const [,y,,height] of bars)assert(Math.abs(y+height/2-250)<1e-6,'Bars have no center seam');
 assert.equal(masks,fade?1:0);assert.equal(stops.length,fade?3:0);
 App.drawMusicVisualizer(ctx,800,500,'equalizer',new Float32Array(256).fill(.8),new Float32Array(260),{...prefs,vizEqTips:true},0);
 assert.equal(dots,32);
}
console.log('PASS: connected equalizer bars, continuous fade and optional tip dots.');
// Scene filters are chained from the composed source, without touching UI nodes.
assert.equal(App.buildSceneFilter({},'',1200,800),'');
const graph=App.buildSceneFilter({postPixel:8,postFish:.3,postChroma:4,postEdges:.5,postGray:.3,postHue:60,postGlitch:.5},'data:image/png;base64,AA==',1200,800);
for(const primitive of ['feImage','feDisplacementMap','feOffset','feMorphology','feBlend'])assert(graph.includes(primitive));
assert(graph.indexOf('hueRotate')>graph.indexOf('saturate'),'Hue is the last color operation');
assert(!/NaN|Infinity|undefined/.test(graph));
const stage=templates.get('stage');
assert(stage.indexOf('id="sceneContent"')<stage.indexOf('id="musicVisualizerCanvas"'));
assert(stage.indexOf('id="sceneFinalOverlay"')<stage.indexOf('id="visualizerDock"'));
assert(read('background.js').includes("scanlineTarget==='background'?'sceneBackground':'sceneFinalOverlay'"),'Scanlines live outside the filtered scene');
assert.equal(App.defaultSettings.vizColorMode,'theme');
console.log('PASS: scene filter chain, default bypass, final hue and post-filter scanline wiring.');
for(const type of ['fisheye','bubble','twist','pinch','waves'])for(const amount of [-1,0,1])for(const zoom of [.5,1,2]){
 for(const [u,v] of [[0,0],[.5,.5],[1,1],[.2,.8]]){
  const point=App.sceneWarpPoint({postFish:amount,postWarpType:type,postZoom:zoom},u,v);
  assert(point.every(Number.isFinite),'Every deformation stays finite at limits');
  if(!amount&&zoom===1){assert(Math.abs(point[0]-u)<1e-9);assert(Math.abs(point[1]-v)<1e-9);}
 }
}
const positive=App.sceneWarpPoint({postFish:.5},.75,.5),negative=App.sceneWarpPoint({postFish:-.5},.75,.5);
assert(positive[0]>.75&&negative[0]<.75,'Negative distortion reverses the spatial mapping');
const pixelGraph=App.buildSceneFilter({postPixel:12},'',800,600);
assert(pixelGraph.includes('feTile')&&pixelGraph.includes('feMorphology')&&!pixelGraph.includes('feComponentTransfer'));
assert(!pixelGraph.includes('feDisplacementMap'),'Pixel cells do not use interpolated displacement');
assert(App.buildSceneFilter({postEdges:1},'',800,600).includes('edgeMode="duplicate"'),'Edge sampling extends the border');
assert.equal(App.scenePixelSize({postRaster:1,postRasterMode:'pixels',postRasterCell:12}),0);
// Surface style does not affect ring geometry or opacity.
const snapshots=[];
for(const surface of ['solid','glass','outline']){
 const commands=[];const ctx={save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},arc(){},fill(){commands.push(['fill',this.globalAlpha]);},stroke(){commands.push(['stroke',this.globalAlpha]);}};
 App.drawMusicVisualizer(ctx,800,600,'ring',new Float32Array(256).fill(.5),new Float32Array(260),{...App.defaultSettings,vizSurface:surface},0);
 snapshots.push(JSON.stringify(commands));
}
assert.equal(snapshots[0],snapshots[1]);assert.equal(snapshots[0],snapshots[2]);
console.log('PASS: signed deformation controls, pixel grid, cheaper edge pipeline and ring-only solid surfaces.');
// Threshold boost is local to each band and releases smoothly without suppressing quiet bands.
{
 let scheduled,values=[];
 const ctx={setTransform(){},clearRect(){},save(){},restore(){},translate(){},createLinearGradient(){return {addColorStop(){}};}};
 const receive=App.musicVisualizerRuntime((ctx,w,h,mode,levels)=>{values=Array.from(levels);},fn=>{scheduled=fn;return 1;},()=>{});
 receive({type:'init',canvas:{width:800,height:600,getContext:()=>ctx}});
 const settings={...App.defaultSettings,vizMode:'equalizer',vizEqCount:16,vizEqSmooth:0,vizEqTrail:0,vizResponseEnabled:true,vizResponseThreshold:.8,vizResponsePower:1,vizResponseBoost:4,vizBoostAttack:50,vizBoostRelease:300};
 receive({type:'state',settings,active:true,playing:true});
 const freq=new Uint8Array(512).fill(128);freq.fill(255,0,4);
 receive({type:'audio',freq,sampleRate:44100,loudness:0});scheduled(100);
 assert(values[0]>1&&values[0]<4,'Attack approaches boost without a jump');
 assert(Math.abs(values[15]-128/255)<1e-6,'Quiet high bands keep their original amplitude');
 scheduled(200);const boosted=values[0];assert(boosted>1);
 freq.fill(128);receive({type:'audio',freq,sampleRate:44100,loudness:1});scheduled(300);
 const releaseStart=values[0];assert(releaseStart>128/255,'Release retains a fading boost');
 scheduled(400);assert(values[0]<releaseStart&&values[0]>128/255);
 for(let t=500;t<=4000;t+=100)scheduled(t);
 assert(Math.abs(values[0]-128/255)<.001,'Release returns to the original level');
 receive({type:'state',settings:{...settings,vizResponseEnabled:false},active:true,playing:true});scheduled(4100);
 assert(Math.abs(values[0]-128/255)<1e-6);
}
assert(!templates.get('page-appearance-filters').includes('postRaster'));
assert(!templates.get('page-appearance-filters').includes('postPalette'));
assert(templates.get('page-appearance-filters').includes('postDistortTarget'));
console.log('PASS: threshold response curve, distortion targeting controls and removed raster/posterization settings.');
// Removing a filter must not consume neighboring controls in the template.
{
 const page=templates.get('page-appearance-filters');
 const expected=['postPixel','postChroma','postPanoramaVertical','postMaskShape','postMaskSoftness','postInvertMask','postEdgeMode','postDistortFps','postDistortTarget','postWarpType','postFish','postCenterX','postCenterY','postRadius','postZoom','scanlineTarget','postHue','postGray','postEdges','postVignette','postGlitch'];
 const actual=[...page.matchAll(/data-(?:setting|extra-select)="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(actual,expected,'All supported filter controls appear exactly once');
 for(const key of expected)assert(Object.hasOwn(App.defaultSettings,key),key+' has a stored default');
 assert(page.includes('data-setting="postFish" min="-1"'),'Reverse distortion stays adjustable');
}
console.log('PASS: complete Effects / Filters controls survive raster removal.');
// Inner and outer ring contours deform together and retain their offset.
{
 const paths=[];let path=[];
 const ctx={save(){},restore(){},beginPath(){path=[];},moveTo(x,y){path.push([x,y]);},lineTo(x,y){path.push([x,y]);},stroke(){paths.push(path);},arc(){},fill(){}};
 const levels=new Float32Array(256);for(let i=0;i<256;i++)levels[i]=.15+(i%19)/19;
 const prefs={...App.defaultSettings,vizRingCount:64,vizRingStyle:'pulse',vizRingRays:false,vizRingParticles:false,vizRingContour:true,vizRingInner:true,vizRingDeform:.2};
 App.drawMusicVisualizer(ctx,800,600,'ring',levels,new Float32Array(260),prefs,0);
 assert.equal(paths.length,2);
 const radii=paths.map(points=>points.map(([x,y])=>Math.hypot(x-400,y-300)));
 assert(Math.max(...radii[0])-Math.min(...radii[0])>5,'Twenty percent deformation still responds visibly to changing bands');
 for(let i=0;i<radii[0].length;i++)assert(Math.abs(radii[0][i]-radii[1][i]-9)<1e-5,'Inner contour follows the same shape');
}
assert(!templates.get('page-visualizers-general').includes('vizResponseQuiet'));
assert(!templates.get('page-visualizers-general').includes('vizResponsePower'));
assert(!read('scene-effects.js').includes('toDataURL'),'Distortion no longer generates PNG maps');
assert(read('index.html').includes('distortion-gpu.js'));
console.log('PASS: coherent reactive ring contours and simplified threshold controls.');
