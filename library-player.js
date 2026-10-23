/* library-player.js — Import hudby, rozpoznání interpreta, playlist, přehrávání a hlasitost. */

// ── storage/favorites ──
(function(App){
  App.define("storage/favorites", function initialize(){
App.LikeStore = {
    has(filename){
      const entry = App.ProfileStore._load().get(filename);
      return !!(entry && entry.liked);
    },
    set(filename, liked){
      const map = App.ProfileStore._load();
      const existing = map.get(filename);
      if(liked){
        if(existing) existing.liked = true;
        else map.set(filename, { liked: true });
      } else if(existing){
        delete existing.liked;
      }
      App.ProfileStore._persist();
      App.favoritesVersion = (App.favoritesVersion || 0) + 1;
    },
    toggle(filename){
      const next = !this.has(filename);
      this.set(filename, next);
      return next;
    },
    count(){
      let n = 0;
      App.ProfileStore._load().forEach(entry=>{ if(entry && entry.liked) n++; });
      return n;
    }
  };
  }, ["LikeStore"]);
})(window.Aurora);

// ── storage/play-stats ──
(function(App){
  App.define("storage/play-stats", function initialize(){
App.PlayStatsStore = {
    get(filename){
      const entry = App.ProfileStore._load().get(filename);
      if(!entry) return { duration: undefined, playCount: 0, lastPlayedAt: undefined };
      return {
        duration: typeof entry.duration === 'number' ? entry.duration : undefined,
        playCount: typeof entry.playCount === 'number' ? entry.playCount : 0,
        lastPlayedAt: typeof entry.lastPlayedAt === 'number' ? entry.lastPlayedAt : undefined,
      };
    },
    setDuration(filename, durationSec){
      if(typeof durationSec !== 'number' || !isFinite(durationSec) || durationSec <= 0) return;
      const map = App.ProfileStore._load();
      const existing = map.get(filename);
      const rounded = Math.round(durationSec * 100) / 100;
      if(existing){
        if(existing.duration === rounded) return;
        existing.duration = rounded;
      } else {
        map.set(filename, { duration: rounded });
      }
      App.ProfileStore._persist();
    },
    recordPlay(filename){
      const map = App.ProfileStore._load();
      const existing = map.get(filename);
      const now = Date.now();
      if(existing){
        existing.playCount = (typeof existing.playCount === 'number' ? existing.playCount : 0) + 1;
        existing.lastPlayedAt = now;
      } else {
        map.set(filename, { playCount: 1, lastPlayedAt: now });
      }
      App.ProfileStore._persist();
    }
  };
  }, ["PlayStatsStore"]);
})(window.Aurora);

// ── library/file-picker ──
(function(App){
App.triggerFiles = function triggerFiles(){ App.fileInput.click(); };
App.triggerFolder = function triggerFolder(){ App.folderInput.click(); };
App.isAudioFile = function isAudioFile(file){
    const base = file.name.split('/').pop();
    if(!base || base.startsWith('.')) return false;
    if(/^(desktop\.ini|thumbs\.db)$/i.test(base)) return false;
    return App.AUDIO_EXTENSIONS.test(base);
  };
  App.define("library/file-picker", function initialize(){
App.fileInput = App.el('fileInput');
App.folderInput = App.el('folderInput');
App.el('btnImportFiles').addEventListener('click', App.triggerFiles);
App.el('btnImportFiles2').addEventListener('click', App.triggerFiles);
App.el('btnImportFolder').addEventListener('click', App.triggerFolder);
App.el('btnImportFolder2').addEventListener('click', App.triggerFolder);
for(const input of [App.fileInput,App.folderInput])input.addEventListener('change', e=>{
    App.addFiles(e.target.files);e.target.value='';
  });
App.AUDIO_EXTENSIONS = /\.(mp3|m4a|wav|ogg|flac|aac|wma|opus|aiff|aif)$/i;
  }, ["fileInput","folderInput","triggerFiles","triggerFolder","AUDIO_EXTENSIONS","isAudioFile"]);
})(window.Aurora);

// ── library/artist-detection ──
(function(App){
App._stripNoise = function _stripNoise(s){
    return s
      .replace(App._CJK_BRACKET_RE, ' ')
      .replace(App._NOISE_RE, '')
      .replace(/\s*[-–—]+\s*$/, '')
      .replace(/^\s*[-–—]+\s*/, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  };
App._stripTrackNum = function _stripTrackNum(s){
    return s.replace(App._TRACK_NUM_RE, '').trim();
  };
App.parseNameArtist = function parseNameArtist(filename){
    const raw = filename.replace(/\.[^/.]+$/, '');
    if(!App.settings.smartTitleParsing){
      const parts = raw.split(' - ');
      if(parts.length >= 2){
        return { artist: parts[0].trim(), title: parts.slice(1).join(' - ').trim() };
      }
      return { artist: 'Neznámý interpret', title: raw };
    }
    let work = App._stripTrackNum(raw);
    work = App._stripNoise(work);
    const dashParts = work.split(' - ');
    if(dashParts.length >= 2){
      const artist = dashParts[0].trim();
      const title  = dashParts.slice(1).join(' - ').trim();
      return { artist, title };
    }
    const quotedMatch = work.match(/^(.+?)\s*[''"](.+?)[''"](.*)$/);
    if(quotedMatch){
      const beforeQuote = quotedMatch[1].trim();
      const insideQuote = quotedMatch[2].trim();
      if(insideQuote.length >= 2){
        const artist = App._stripNoise(beforeQuote) || 'Neznámý interpret';
        const title  = insideQuote;
        return { artist, title };
      }
    }
    const quotedAtStart = work.match(/^[''"](.+?)[''"](.*)$/);
    if(quotedAtStart){
      const insideQuote = quotedAtStart[1].trim();
      if(insideQuote.length >= 2){
        return { artist: 'Neznámý interpret', title: insideQuote };
      }
    }
    const trailingBracket = work.match(/^(.+?)\s*[\[(]([^\][()]+)[\])][\s.]*$/);
    if(trailingBracket){
      const maybeName = trailingBracket[1].trim();
      const inBracket = trailingBracket[2].trim();
      if(!/^(?:feat|ft|featuring|\d{4}|remaster|remix|live|acoustic|cover)/i.test(inBracket)){
        return { artist: inBracket, title: maybeName };
      }
    }
    if(work.includes('_')){
      const uParts = work.split('_');
      if(uParts.length >= 2){
        return { artist: uParts[0].replace(/-/g,' ').trim(), title: uParts.slice(1).join(' ').trim() };
      }
    }
    const dashSplit = work.split(/\s[-–—]\s/);
    if(dashSplit.length >= 2){
      const tail = dashSplit[dashSplit.length-1].trim();
      const head = dashSplit.slice(0, -1).join(' - ').trim();
      const tailWordCount = tail.split(/\s+/).filter(Boolean).length;
      const looksLikeName = tail.length >= 2 && tailWordCount <= 4 && !/\d/.test(tail)
        && !/^(?:live|version|edit|mix|remix|cover|acoustic|instrumental|extended|radio|clean|explicit)\b/i.test(tail);
      if(looksLikeName && head.length >= 2){
        return { artist: tail, title: head };
      }
    }
    return { artist: 'Neznámý interpret', title: work || raw };
  };
  App.define("library/artist-detection", function initialize(){
App._NOISE_RE = /[\[(]?\s*(?:official\s+(?:music\s+)?(?:video|mv|audio|lyric(?:s)?(?:\s+video)?|visualizer|live(?:\s+video)?)|lyrics?\s*(?:video)?|hd|4k|8k|hq|explicit|clean\s+version|full\s+version|radio\s+edit|extended\s+mix|remaster(?:ed)?(?:\s+\d{4})?|(?:19|20)\d{2}\s+remaster)\s*[\])]?/gi;
App._TRACK_NUM_RE = /^(?:\d{1,3}[.\s-]+)+/;
App._CJK_BRACKET_RE = /[【「][^【】「」]*[】」]/g;
  }, ["_NOISE_RE","_TRACK_NUM_RE","_CJK_BRACKET_RE","_stripNoise","_stripTrackNum","parseNameArtist"]);
})(window.Aurora);

// ── library/import-tracks ──
(function(App){
App.addFiles = function addFiles(fileList){
    const snapshot=Array.from(fileList);
    App.importQueue=App.importQueue.then(()=>App.importFilesBatch(snapshot)).catch(e=>{
      console.warn('Import failed',e);App.notify?.('Import se nezdařil. Zkuste soubory vybrat znovu.',{error:true});
    });
    return App.importQueue;
  };
App.importFilesBatch = async function importFilesBatch(fileList){
    const files = Array.from(fileList).filter(App.isAudioFile);
    if(!files.length){App.notify?.('Výběr neobsahuje podporované zvukové soubory.');return;}
    const wasEmpty = App.state.tracks.length === 0;
    const before = App.state.tracks.length;
    const seen=new Set(App.state.tracks.map(t=>JSON.stringify([t.file.name,t.file.size])));
    const parsed=App.Threads?.library ? await App.Threads.parseFiles(files.map(f=>f.name)) : null;
    for(let fileIndex=0;fileIndex<files.length;fileIndex++){
      const file=files[fileIndex],identity=JSON.stringify([file.name,file.size]);
      if(seen.has(identity))continue;
      seen.add(identity);
      const {artist,title}=parsed?parsed[fileIndex]:App.parseNameArtist(file.name);
      const url = null; // Only the playing track needs a browser media resource.
      const knownDuration = App.PlayStatsStore.get(file.name).duration;
      App.state.tracks.push({ file, name: title, artist, url, duration: (typeof knownDuration === 'number' ? knownDuration : null) });
      if(fileIndex%64===63)await new Promise(resolve=>setTimeout(resolve,0));
    }
    if(App.state.tracks.length===before){App.LibraryTools?.afterImport(0,files.length);return;}
    App.libraryVersion++;
    App.invalidatePlaybackOrder?.();
    App.renderTrackList();
    App.updateProfileCount();
    App.LibraryTools?.afterImport(App.state.tracks.length-before,files.length);
    if(App.Session?.restoreTrack())return;
    if(wasEmpty && App.state.currentIndex === -1 && App.state.tracks.length){
      const firstIndex = App.settings.randomFirstTrack
        ? Math.floor(Math.random() * App.state.tracks.length)
        : App.sortPlaylistEntries(App.state.tracks.map((t,i)=>({t,i})))[0].i;
      App.loadTrack(firstIndex, App.LibraryStorage?.restoring ? false : App.settings.autoplayOnImport);
      if(App.settings.randomFirstTrack) App.scrollPlaylistToTrack(firstIndex, { smooth: false });
    }
  };
App.reparseAllTrackNames = async function reparseAllTrackNames(){
    const tracks=App.state.tracks.slice();
    const parsed=App.Threads?.library ? await App.Threads.parseFiles(tracks.map(t=>t.file.name)) : null;
    tracks.forEach((t,i)=>{
      const {artist,title}=parsed?parsed[i]:App.parseNameArtist(t.file.name);
      t.name   = title;
      t.artist = artist;
    });
    App.libraryVersion++;
    App.renderTrackList();
    if(App.state.currentIndex >= 0){
      const t = App.state.tracks[App.state.currentIndex];
      if(t){
        App.el('metaTitle').textContent  = t.name;
        App.el('metaArtist').textContent = t.artist;
        App.el('barTitle').removeAttribute('data-ui-placeholder');App.el('barArtist').removeAttribute('data-ui-placeholder');
        App.el('barTitle').textContent   = t.name;
        App.el('barArtist').textContent  = t.artist;
        if(App.el('trackInfoPopover').classList.contains('show'))  App.refreshTrackInfoPopoverContent();
        if(App.el('stageTrackInfoPopover').classList.contains('show')) App.refreshStageTrackInfoPopoverContent();
      }
    }
    const statusEl = App.el('reparseStatus');
    if(statusEl){
      statusEl.textContent = `Hotovo — ${App.state.tracks.length} skladeb přeparsováno.`;
      statusEl.style.display = 'block';
      setTimeout(()=>{ statusEl.style.display = 'none'; }, 2800);
    }
  };
  App.define("library/import-tracks", function initialize(){
App.libraryVersion = 0;
App.listSearchVersion = 0;
App.importQueue = Promise.resolve();
App.el('btnReparseTrackNames') && App.el('btnReparseTrackNames').addEventListener('click', ()=>{
    if(!App.state.tracks.length){
      const statusEl = App.el('reparseStatus');
      if(statusEl){ statusEl.textContent = 'Žádné skladby k přeparsování.'; statusEl.style.display = 'block'; setTimeout(()=>{ statusEl.style.display = 'none'; }, 2000); }
      return;
    }
    App.reparseAllTrackNames();
  });
(function(){
    const btn = App.el('btnReparseTrackNames');
    if(!btn) return;
    btn.addEventListener('mouseenter', ()=>{ btn.style.borderColor = 'var(--accent2)'; btn.style.background = 'rgba(124,58,237,0.08)'; });
    btn.addEventListener('mouseleave', ()=>{ btn.style.borderColor = 'var(--border)'; btn.style.background = 'rgba(255,255,255,0.04)'; });
  })();
  }, ["libraryVersion","listSearchVersion","importQueue","addFiles","importFilesBatch","reparseAllTrackNames"]);
})(window.Aurora);

// ── library/drag-drop ──
(function(App){
App.clearDropFeedback = function clearDropFeedback(){App.stage.classList.remove('dragover');App.importDropZone.classList.remove('dragover');clearTimeout(App.dropFeedbackTimer);};
  App.define("library/drag-drop", function initialize(){
App.importDropZone = App.el('importDropZone');
App.isFileDrag = e=>Array.from(e.dataTransfer?.types||[]).includes('Files');
App.dropFeedbackTimer = 0;
for(const target of [App.stage,App.importDropZone]){
    for(const type of ['dragenter','dragover'])target.addEventListener(type,e=>{
      if(!App.isFileDrag(e))return;
      e.preventDefault();e.stopPropagation();App.clearDropFeedback();target.classList.add('dragover');
      App.dropFeedbackTimer=setTimeout(App.clearDropFeedback,800);
    });
    target.addEventListener('dragleave',e=>{if(!target.contains(e.relatedTarget))App.clearDropFeedback();});
    target.addEventListener('drop',e=>{
      App.clearDropFeedback();if(!App.isFileDrag(e))return;
      e.preventDefault();e.stopPropagation();
      if(App.readDroppedFiles)App.readDroppedFiles(e.dataTransfer).then(files=>App.addFiles(files)).catch(()=>App.notify?.('Složku se nepodařilo načíst.',{error:true}));
      else if(e.dataTransfer.files?.length)App.addFiles(e.dataTransfer.files);
    });
  }
for(const type of ['drop','dragend','pointerdown','blur'])window.addEventListener(type,App.clearDropFeedback,{capture:true});
window.addEventListener('keydown',e=>{if(e.key==='Escape')App.clearDropFeedback();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)App.clearDropFeedback();});
  }, ["importDropZone","isFileDrag","dropFeedbackTimer","clearDropFeedback"]);
})(window.Aurora);

// ── playlist/virtual-list ──
(function(App){
App.ensureVtDom = function ensureVtDom(){
    if(App.vt.spacer) return;
    App.trackListEl.innerHTML = '';
    App.trackListEl.style.position = 'relative';
    App.vt.spacer = document.createElement('div');
    App.vt.spacer.style.position = 'relative';
    App.vt.spacer.style.width = '100%';
    App.vt.viewport = document.createElement('div');
    App.vt.viewport.style.position = 'absolute';
    App.vt.viewport.style.left = '0';
    App.vt.viewport.style.right = '0';
    App.vt.viewport.style.top = '0';
    App.vt.spacer.appendChild(App.vt.viewport);
    App.trackListEl.appendChild(App.vt.spacer);
    App.trackListEl.addEventListener('scroll', App.scheduleVtRender, { passive: true });
  };
App.scrollPlaylistToTrack = function scrollPlaylistToTrack(trackIndex, opts){
    App.ensureVtDom();
    const smooth = !opts || opts.smooth !== false;
    const pos = App.vt.filtered.findIndex(entry => entry.i === trackIndex);
    if(pos < 0) return;
    const rowCenter = pos * App.ROW_H + App.ROW_H/2;
    const viewportH = App.trackListEl.clientHeight || 400;
    const target = Math.max(0, rowCenter - viewportH/2);
    App.trackListEl.scrollTo({ top: target, behavior: smooth ? 'smooth' : 'auto' });
  };
App.scheduleVtRender = function scheduleVtRender(){
    if(App.vt.rafPending) return;
    App.vt.rafPending = true;
    App.vt.rafId = requestAnimationFrame(()=>{
      App.vt.rafId = 0;
      App.vt.rafPending = false;
      App.renderVtWindow();
    });
  };
App.makePooledRow = function makePooledRow(){
    const row = document.createElement('div');
    row.className = 'track-row';
    row.style.position = 'absolute';
    row.style.left = '0';
    row.style.right = '0';
    row.style.top = '0';
    row.innerHTML = `
      <div class="track-num"></div>
      <div class="track-thumb"></div>
      <div class="track-info">
        <strong></strong>
        <div class="track-meta-row">
          <small></small>
          <span class="norm-badge"></span>
        </div>
      </div>
      <button type="button" class="heart-btn" title="Přidat mezi oblíbené">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
      </button>
      <div class="track-dur"></div>
      <div class="track-norm-progress"></div>
    `;
    row._numEl = row.querySelector('.track-num');
    row._thumbEl = row.querySelector('.track-thumb');
    row._titleEl = row.querySelector('.track-info strong');
    row._artistEl = row.querySelector('.track-info small');
    row._badgeEl = row.querySelector('.norm-badge');
    row._durEl = row.querySelector('.track-dur');
    row._progEl = row.querySelector('.track-norm-progress');
    row._heartEl = row.querySelector('.heart-btn');
    App.LibraryTools?.prepareRow(row);
    row.addEventListener('click', ()=>{
      if(typeof row._boundTrackIndex === 'number') App.loadTrack(row._boundTrackIndex, true);
    });
    row._heartEl.addEventListener('click', (e)=>{
      e.stopPropagation();
      if(typeof row._boundTrackIndex !== 'number') return;
      const t = App.state.tracks[row._boundTrackIndex];
      if(!t) return;
      const nowLiked = App.LikeStore.toggle(App.trackKey(t));
      App.syncLikedUI(row._boundTrackIndex, nowLiked);
      App.popHeart(row._heartEl);
    });
    return row;
  };
App.paintVtRow = function paintVtRow(row, entry, slotTop){
    const { t, i } = entry;
    App.LibraryTools?.paintRow(row,entry);
    if(row._boundTrackIndex !== i){
      row.dataset.index = i;
      row._boundTrackIndex = i;
    }
    if(row._lastSlotTop !== slotTop){
      row.style.transform = `translateY(${slotTop}px)`;
      row._lastSlotTop = slotTop;
    }
    const isPlaying = (i === App.state.currentIndex && App.state.isPlaying);
    const isCurrent = (i === App.state.currentIndex);
    const playingKey = isCurrent ? '1' : '0';
    if(row._lastPlayingKey !== playingKey){
      row.classList.toggle('playing', isCurrent);
      row._lastPlayingKey = playingKey;
    }
    const numText = isPlaying ? '' : String(Math.floor(slotTop/App.ROW_H)+1);
    if(row._lastNumText !== numText){
      row._numEl.textContent = numText;
      row._lastNumText = numText;
    }
    if(row._lastEqState !== isPlaying){
      row._thumbEl.innerHTML = isPlaying ? '<div class="eq-bars"><span></span><span></span><span></span></div>' : '';
      row._lastEqState = isPlaying;
    }
    if(row._lastTitle !== t.name){
      row._titleEl.textContent = t.name;
      row._lastTitle = t.name;
    }
    if(row._lastArtist !== t.artist){
      row._artistEl.textContent = t.artist;
      row._lastArtist = t.artist;
    }
    const lufsVal = App.ProfileStore.get(App.trackKey(t));
    const badgeText = lufsVal !== undefined ? `${lufsVal.toFixed(1)} LUFS` : '—';
    const badgeKey = badgeText + '|' + (lufsVal !== undefined ? '0' : '1');
    if(row._lastBadgeKey !== badgeKey){
      row._badgeEl.textContent = badgeText;
      row._badgeEl.classList.toggle('pending', lufsVal === undefined);
      row._lastBadgeKey = badgeKey;
    }
    const liked = App.LikeStore.has(App.trackKey(t));
    if(row._lastLikedKey !== liked){
      row._heartEl.classList.toggle('liked', liked);
      row._heartEl.title = liked ? 'Odebrat z oblíbených' : 'Přidat mezi oblíbené';
      row._lastLikedKey = liked;
    }
    const durText = t.duration ? App.formatTime(t.duration) : '';
    if(row._lastDur !== durText){
      row._durEl.textContent = durText;
      row._lastDur = durText;
    }
    const prog = App.vtProgressState.get(i);
    if(prog){
      row.classList.toggle('norm-loading', !!prog.active);
      row._progEl.style.left = prog.pct + '%';
      row._progEl.classList.toggle('active', !!prog.active);
      row._progEl.classList.toggle('finishing', !prog.active);
    } else if(row._lastHadProg){
      row.classList.remove('norm-loading');
      row._progEl.classList.remove('active');
      row._progEl.classList.remove('finishing');
    }
    row._lastHadProg = !!prog;
  };
App.renderVtWindow = function renderVtWindow(force){
    App.ensureVtDom();
    const total = App.vt.filtered.length;
    const scrollTop = App.trackListEl.scrollTop;
    const viewportH = App.trackListEl.clientHeight || 400;
    const newSpacerH = (total * App.ROW_H) + 'px';
    if(App.vt.spacer.style.height !== newSpacerH) App.vt.spacer.style.height = newSpacerH;
    if(!total){
      if(App.vt.viewport.style.display !== 'none') App.vt.viewport.style.display = 'none';
      App.vt.lastStartIdx = -1;
      App.vt.lastEndIdx = -1;
      return;
    }
    if(App.vt.viewport.style.display === 'none') App.vt.viewport.style.display = '';
    let startIdx = Math.floor(scrollTop / App.ROW_H) - App.VT_BUFFER_ROWS;
    let endIdx = Math.ceil((scrollTop + viewportH) / App.ROW_H) + App.VT_BUFFER_ROWS;
    startIdx = Math.max(0, startIdx);
    endIdx = Math.min(total - 1, endIdx);
    if(endIdx < startIdx) return;
    const needed = endIdx - startIdx + 1;
    while(App.vt.pool.length < needed){
      const row = App.makePooledRow();
      App.vt.viewport.appendChild(row);
      App.vt.pool.push(row);
    }
    if(App.vt.pool.length>needed+App.VT_BUFFER_ROWS*2){
      while(App.vt.pool.length>needed)App.vt.pool.pop().remove();
    }
    if(!force && startIdx === App.vt.lastStartIdx && endIdx === App.vt.lastEndIdx) return;
    const previousStart=App.vt.lastStartIdx;
    App.vt.lastStartIdx = startIdx;
    App.vt.lastEndIdx = endIdx;
    // Circular slots keep surviving rows attached to the same track while
    // scrolling. Only newly exposed rows need text/style/metadata updates.
    for(let idx=startIdx;idx<=endIdx;idx++){
      const row = App.vt.pool[idx%App.vt.pool.length];
      if(row.style.display === 'none') row.style.display = '';
      if(!force&&row._vtListIndex===idx)continue;
      row._vtListIndex=idx;
      const entry = App.vt.filtered[idx];
      App.paintVtRow(row, entry, idx * App.ROW_H);
    }
    for(const row of App.vt.pool){
      if(row._vtListIndex<startIdx||row._vtListIndex>endIdx||row._vtListIndex===undefined||App.vt.pool[row._vtListIndex%App.vt.pool.length]!==row){
        row.style.display='none';row.removeAttribute('data-index');row._boundTrackIndex=undefined;row._vtListIndex=undefined;
      }
    }
    // Preserve visual DOM/tab order without rebuilding the list.
    if(startIdx>=previousStart){
      let next=null;
      for(let idx=endIdx;idx>=startIdx;idx--){const row=App.vt.pool[idx%App.vt.pool.length];if(row.nextSibling!==next)App.vt.viewport.insertBefore(row,next);next=row;}
    }else{
      let next=App.vt.viewport.firstChild;
      for(let idx=startIdx;idx<=endIdx;idx++){const row=App.vt.pool[idx%App.vt.pool.length];if(row!==next)App.vt.viewport.insertBefore(row,next);next=row.nextSibling;}
    }
  };
App.renderTrackList = async function renderTrackList(filter){
    const searchVersion=++App.listSearchVersion;
    if(filter === undefined) filter = App.el('searchInput').value;
    App.ensureVtDom();
    App.el('playlistCount').textContent = `${App.state.tracks.length} skladeb`;
    const f = filter.trim().toLowerCase();
    const cacheKey=JSON.stringify([App.libraryVersion,f,App.settings.playlistSort,App.settings.playlistSortDirection,App.libraryFilter||'all',App.favoritesVersion||0,App.durationVersion||0]);
    if(App.vt.cacheKey===cacheKey){App.renderVtWindow(true);App.LibraryTools?.updateSummary();return;}
    if(App.Threads?.library){
      const indices=await App.Threads.findTracks(f,App.libraryVersion);
      if(searchVersion!==App.listSearchVersion)return;
      App.vt.filtered=indices.filter(i=>App.state.tracks[i]).map(i=>({t:App.state.tracks[i],i}));
    }else{
      const tokens=App.searchTokens(f);
      App.vt.filtered=App.state.tracks.map((t,i)=>({t,i})).filter(({t})=>App.matchesTrack(t,tokens));
    }
    if(App.libraryFilter==='favorites')App.vt.filtered=App.vt.filtered.filter(({t})=>App.LikeStore.has(App.trackKey(t)));
    App.sortPlaylistEntries(App.vt.filtered);
    App.vt.cacheKey=cacheKey;
    if(App.vt.lastFilter!==f+'|'+App.libraryFilter){App.trackListEl.scrollTop=0;App.vt.lastFilter=f+'|'+App.libraryFilter;}
    const maxScroll=Math.max(0,App.vt.filtered.length*App.ROW_H-App.trackListEl.clientHeight);
    if(App.trackListEl.scrollTop>maxScroll)App.trackListEl.scrollTop=maxScroll;
    App.LibraryTools?.updateSummary();
    if(!App.vt.filtered.length){
      App.vt.viewport.style.display = 'none';
      App.vt.spacer.style.height = '0px';
      let hint = App.trackListEl.querySelector('#dropHint');
      if(!hint){
        hint = document.createElement('div');
        hint.id = 'dropHint';
        App.trackListEl.appendChild(hint);
      }
      hint.textContent = App.state.tracks.length ? (App.libraryFilter==='favorites'?'Žádné odpovídající oblíbené skladby.':'Nic nenalezeno. Zkuste jiný název nebo interpreta.') : 'Zatím žádné skladby. Vyberte zvukové soubory nebo sem přetáhněte složku.';
      hint.style.display = '';
      return;
    }
    const hint = App.trackListEl.querySelector('#dropHint');
    if(hint) hint.style.display = 'none';
    App.renderVtWindow(true);
  };
App.updateSearchClearVisibility = function updateSearchClearVisibility(){
    App.searchClearBtn.classList.toggle('show', App.searchInputEl.value.length > 0);
  };
  App.define("playlist/virtual-list", function initialize(){
App.trackListEl = App.el('trackList');
App.ROW_H = 76;
App.VT_BUFFER_ROWS = 6;
App.vt = {
    filtered: [],
    spacer: null,
    viewport: null,
    pool: [],
    rafPending: false,
    rafId: 0,
    lastStartIdx: -1,
    lastEndIdx: -1,
  };
App.VisualRenderState.subscribe(active =>{
    if(!active && App.vt.rafId){
      cancelAnimationFrame(App.vt.rafId);
      App.vt.rafId = 0;
      App.vt.rafPending = false;
    } else if(active){
      App.scheduleVtRender();
    }
  });
App.vtProgressState = new Map();
App.searchInputEl = App.el('searchInput');
App.searchClearBtn = App.el('btnSearchClear');
App.searchInputEl.addEventListener('input', e=>{
    App.renderTrackList(e.target.value);
    App.updateSearchClearVisibility();
  });
App.searchClearBtn.addEventListener('click', ()=>{
    App.searchInputEl.value = '';
    App.renderTrackList('');
    App.updateSearchClearVisibility();
    App.searchInputEl.focus();
  });
App.updateSearchClearVisibility();
  }, ["trackListEl","ROW_H","VT_BUFFER_ROWS","vt","ensureVtDom","scrollPlaylistToTrack","scheduleVtRender","makePooledRow","paintVtRow","vtProgressState","renderVtWindow","renderTrackList","searchInputEl","searchClearBtn","updateSearchClearVisibility"]);
})(window.Aurora);

// ── playlist/favorites-ui ──
(function(App){
App.syncLikedUI = function syncLikedUI(trackIndex, liked){
    App.renderTrackList();
    if(trackIndex === App.state.currentIndex){
      const heartEl = App.el('trackMetaHeart');
      if(heartEl){
        heartEl.classList.toggle('liked', liked);
        heartEl.title = liked ? 'Odebrat z oblíbených' : 'Přidat mezi oblíbené';
      }
      const chipEl = App.el('trackMetaChip');
      if(chipEl) chipEl.classList.toggle('liked', liked);
      const stageTipHeart = App.el('stageTipHeartBtn');
      if(stageTipHeart){
        stageTipHeart.classList.toggle('liked', liked);
        stageTipHeart.title = liked ? 'Odebrat z oblíbených' : 'Přidat mezi oblíbené';
      }
      const tipHeart = App.el('tipHeartBtn');
      if(tipHeart){
        tipHeart.classList.toggle('liked', liked);
        tipHeart.title = liked ? 'Odebrat z oblíbených' : 'Přidat mezi oblíbené';
      }
      const barInfo = App.el('barTrackInfo');
      if(barInfo) barInfo.classList.toggle('liked', liked);
      const badgeEl = App.el('barTrackInfoHeartBadge');
      if(badgeEl){
        badgeEl.classList.toggle('liked', liked);
        badgeEl.title = liked ? 'Odebrat z oblíbených' : 'Přidat mezi oblíbené';
      }
      App.updateLikedOutlinePulse();
    }
    const row = App.trackListEl.querySelector(`.track-row[data-index="${trackIndex}"]`);
    if(row && row._heartEl){
      row._heartEl.classList.toggle('liked', liked);
      row._lastLikedKey = liked;
    }
  };
App.popHeart = function popHeart(el){
    if(!el) return;
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
  };
App.updateTrackMetaHeart = function updateTrackMetaHeart(){
    const heartEl = App.el('trackMetaHeart');
    if(!heartEl) return;
    if(App.state.currentIndex < 0){
      heartEl.classList.remove('liked');
      const chipEl = App.el('trackMetaChip');
      if(chipEl) chipEl.classList.remove('liked');
      App.updateLikedOutlinePulse();
      return;
    }
    const t = App.state.tracks[App.state.currentIndex];
    const liked = t ? App.LikeStore.has(App.trackKey(t)) : false;
    heartEl.classList.toggle('liked', liked);
    heartEl.title = liked ? 'Odebrat z oblíbených' : 'Přidat mezi oblíbené';
    const chipEl = App.el('trackMetaChip');
    if(chipEl) chipEl.classList.toggle('liked', liked);
    const barInfo = App.el('barTrackInfo');
    if(barInfo) barInfo.classList.toggle('liked', liked);
    const badgeEl = App.el('barTrackInfoHeartBadge');
    if(badgeEl){
      badgeEl.classList.toggle('liked', liked);
      badgeEl.title = liked ? 'Odebrat z oblíbených' : 'Přidat mezi oblíbené';
    }
    App.updateLikedOutlinePulse();
  };
  App.define("playlist/favorites-ui", function initialize(){
App.el('trackMetaHeart').addEventListener('click', (e)=>{
    e.stopPropagation();
    if(App.state.currentIndex < 0) return;
    const t = App.state.tracks[App.state.currentIndex];
    if(!t) return;
    const nowLiked = App.LikeStore.toggle(App.trackKey(t));
    App.syncLikedUI(App.state.currentIndex, nowLiked);
    App.popHeart(App.el('trackMetaHeart'));
  });
App.el('barTrackInfoHeartBadge').addEventListener('click', (e)=>{
    e.stopPropagation();
    if(App.state.currentIndex < 0) return;
    const t = App.state.tracks[App.state.currentIndex];
    if(!t) return;
    const nowLiked = App.LikeStore.toggle(App.trackKey(t));
    App.syncLikedUI(App.state.currentIndex, nowLiked);
    App.popHeart(App.el('barTrackInfoHeartBadge'));
  });
  }, ["syncLikedUI","popHeart","updateTrackMetaHeart"]);
})(window.Aurora);

// ── player/playback ──
(function(App){
App.loadTrack = function loadTrack(index, autoplay){
    if(autoplay === undefined) autoplay = true;
    if(index < 0 || index >= App.state.tracks.length) return;
    const generation=App.playbackGeneration=(App.playbackGeneration||0)+1;
    App.playbackIntent=!!autoplay;
    App.playbackPending=!!autoplay;
    App.playRequestId=(App.playRequestId||0)+1;
    const isCurrent=()=>App.playbackGeneration===generation&&App.state.tracks[App.state.currentIndex]===t;
    App.cancelTrackScan?.();
    const previous=App.state.tracks[App.state.currentIndex];
    App.Session?.save();
    App.state.isPlaying=false;
    App.state.currentIndex = index;
    App.recordPlayedIndex(index);
    const t = App.state.tracks[index];
    if(!t.url)t.url=URL.createObjectURL(t.file);
    App.audio.src = t.url;
    if(previous&&previous!==t&&previous.url){URL.revokeObjectURL(previous.url);previous.url=null;}
    App.updatePlayIcon();
    App.updateMediaSession?.();
    App.el('metaTitle').textContent = t.name;
    App.el('metaArtist').textContent = t.artist;
    App.el('barTitle').removeAttribute('data-ui-placeholder');App.el('barArtist').removeAttribute('data-ui-placeholder');
    App.el('barTitle').textContent = t.name;
    App.el('barArtist').textContent = t.artist;
    App.el('trackMeta').classList.add('show');
    App.el('emptyState').style.display = 'none';
    App.updateTrackMetaHeart();
    if(App.el('trackInfoPopover').classList.contains('show')) App.refreshTrackInfoPopoverContent();
    App.TimelineWaveform.setTrack(t);
    App.initAudioGraph();
    if(autoplay)App.audioCtx.resume?.().catch(()=>{});
    App.MusicSense.stop?.();
    if(!autoplay)App.suspendIdleAudio?.();
    App.Spectrogram.resetForNewTrack();
    if(App.normGain) App.normGain.gain.setTargetAtTime(1, App.audioCtx.currentTime, 0.01);
    App.setTrackRowProgress(index, 0, false);
    App.showNormDetail(false);
    const alreadyCached = App.ProfileStore.has(App.trackKey(t));
    const startPlayback = ()=>{
      if(!autoplay||!isCurrent()||!App.playbackIntent) return;
      const request=++App.playRequestId;
      App.audio.play().then(()=>{
        if(!isCurrent()||request!==App.playRequestId)return;
        App.playbackPending=false;
        App.state.isPlaying = true; App.refreshMusicVisualizer?.();
        App.updatePlayIcon();
        if(App.countTrackPlay)App.countTrackPlay();else App.PlayStatsStore.recordPlay(App.trackKey(t));
        App.renderTrackList();
      }).catch(error=>{if(isCurrent()&&request===App.playRequestId)App.handlePlaybackError?.(error);});
    };
    const onProgress = (pct)=>{
      if(!isCurrent())return;
      App.setTrackRowProgress(App.state.currentIndex, pct, pct < 100);
      if(isCurrent()){
        App.showNormDetail(pct < 100);
        App.setNormDetailPct(pct);
      }
    };
    if(App.settings.normalize){
      if(!alreadyCached) App.showNormBadge('Analyzuji hlasitost…');
      if(!alreadyCached){
        const analysisPromise = App.applyNormalizationForTrack(index, onProgress);
        let timeout;
        const timeoutPromise = new Promise(res => {timeout=setTimeout(res,4000);});
        Promise.race([analysisPromise, timeoutPromise]).then(()=>{
          clearTimeout(timeout);
          if(!isCurrent())return;
          App.hideNormBadge();
          App.setTrackRowProgress(App.state.currentIndex, 100, false);
          App.showNormDetail(false);
          App.renderTrackList();
          startPlayback();
        });
        App.renderTrackList();
        return;
      } else {
        App.applyNormalizationForTrack(index, null).then(()=>{
          if(!isCurrent())return;
          App.setTrackRowProgress(App.state.currentIndex, 100, false);
          App.showNormDetail(false);
        });
      }
    }
    startPlayback();
    App.renderTrackList();
  };
App.setTrackRowProgress = function setTrackRowProgress(index, pct, active){
    App.vtProgressState.set(index, { pct, active: !!active });
    if(!active){
      setTimeout(()=>{
        const cur = App.vtProgressState.get(index);
        if(cur && !cur.active) App.vtProgressState.delete(index);
      }, 500);
    }
    const row = App.trackListEl.querySelector(`.track-row[data-index="${index}"]`);
    if(!row) return;
    row.classList.toggle('norm-loading', !!active);
    const bar = row.querySelector('.track-norm-progress');
    if(!bar) return;
    bar.style.left = pct + '%';
    if(active){
      bar.classList.remove('finishing');
      bar.classList.add('active');
    } else {
      bar.classList.add('finishing');
      bar.classList.remove('active');
    }
  };
App.updatePlayIcon = function updatePlayIcon(){
    App.el('playIcon').innerHTML = App.state.isPlaying
      ? '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>'
      : '<path d="M8 5v14l11-7z"/>';
    const button=App.el('btnPlay');
    if(button?.setAttribute){
      const label=App.state.isPlaying||App.playbackPending?'Pozastavit':'Přehrát';
      button.title=label;button.setAttribute('aria-label',label);
      button.classList.toggle('play-pending',!!App.playbackPending&&!App.state.isPlaying);
    }
  };
  App.define("player/playback", function initialize(){
App.el('btnPlay').addEventListener('click', ()=>App.togglePlayback());
  }, ["loadTrack","setTrackRowProgress","updatePlayIcon"]);
})(window.Aurora);

// ── player/playback-order ──
(function(App){
App.shuffleArray = function shuffleArray(arr){
    for(let i=arr.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [arr[i],arr[j]] = [arr[j],arr[i]];
    }
    return arr;
  };
App.refillShuffleBag = function refillShuffleBag(excludeIdx){
    const indices = [];
    for(let i=0;i<App.state.tracks.length;i++){
      if(i !== excludeIdx) indices.push(i);
    }
    App.playbackOrder.bag = App.shuffleArray(indices);
  };
    // Keep a cursor in shuffle history, so repeated Previous walks backwards.
    App.invalidatePlaybackOrder=()=>{
      App.refillShuffleBag(App.state.currentIndex);App._orderedTracks=null;
    };
    App.recordPlayedIndex=index=>{
      const order=App.playbackOrder;
      if(order.navigationIndex===index){order.navigationIndex=null;return;}
      order.navigationIndex=null;
      if(order.history[order.cursor]!==index){
        order.history.splice(order.cursor+1);order.history.push(index);
        if(order.history.length>200)order.history.shift();order.cursor=order.history.length-1;
      }
      order.bag=order.bag.filter(i=>i!==index);
    };
    App.orderedPlaylistIndices=()=>{
      const key=JSON.stringify([App.libraryVersion,App.settings.playlistSort,App.settings.playlistSortDirection,App.settings.playlistSort==='duration'?App.durationVersion:0,App.settings.playlistSort==='favorites'?App.favoritesVersion:0]);
      if(App._orderedTracks?.key!==key)App._orderedTracks={key,indices:App.sortPlaylistEntries(App.state.tracks.map((t,i)=>({t,i}))).map(e=>e.i)};
      return App._orderedTracks.indices;
    };
    App.getNextIndex=automatic=>{
      const total=App.state.tracks.length;if(!total)return -1;
      if(automatic&&App.settings.repeatOne&&App.state.currentIndex>=0)return App.state.currentIndex;
      while(App.playNextQueue.length){
        const track=App.playNextQueue.shift(),index=App.state.tracks.indexOf(track);App.LibraryTools.updateQueue();App.Session?.schedule();if(index>=0)return index;
      }
      if(App.settings.shuffleEnabled){
        const order=App.playbackOrder;
        if(order.cursor<order.history.length-1){order.cursor++;return order.navigationIndex=order.history[order.cursor];}
        if(!order.bag.length){if(automatic&&!App.settings.repeatEnabled)return -1;App.refillShuffleBag(App.state.currentIndex);}
        return order.bag.length?order.bag.pop():(App.settings.repeatEnabled||!automatic?App.state.currentIndex:-1);
      }
      const indices=App.orderedPlaylistIndices(),position=indices.indexOf(App.state.currentIndex)+1;
      if(position>=total&&automatic&&!App.settings.repeatEnabled)return -1;
      return indices[position%total];
    };
    App.getPrevIndex=()=>{
      if(!App.state.tracks.length)return -1;
      if(App.settings.shuffleEnabled){
        const order=App.playbackOrder;if(order.cursor<=0)return App.state.currentIndex;
        order.cursor--;return order.navigationIndex=order.history[order.cursor];
      }
      const indices=App.orderedPlaylistIndices();return indices[(indices.indexOf(App.state.currentIndex)-1+indices.length)%indices.length];
    };
App.updatePlaybackModeButtons = function updatePlaybackModeButtons(){
    App.el('btnShuffle').classList.toggle('active', !!App.settings.shuffleEnabled);
    App.el('btnRepeat').classList.toggle('active', !!App.settings.repeatEnabled);
    App.refreshPlaybackLabels?.();
  };
App.formatTime = function formatTime(sec){
    if(!isFinite(sec)) return '0:00';
    const m = Math.floor(sec/60);
    const s = Math.floor(sec%60).toString().padStart(2,'0');
    return `${m}:${s}`;
  };
  App.define("player/playback-order", function initialize(){
App.playbackOrder = {
    bag: [],
    history: [],
    cursor: -1,
  };
App.el('btnNext').addEventListener('click', ()=>{
    const n=App.getNextIndex(false);
    if(n!==-1){
      App.loadTrack(n,true);
      if(App.settings.shuffleEnabled) App.scrollPlaylistToTrack(n);
    }
  });
App.el('btnPrev').addEventListener('click', ()=>{
    if(App.audio.currentTime > 3){ App.audio.currentTime = 0; return; }
    const p=App.getPrevIndex();
    if(p!==-1){
      App.loadTrack(p,true);
      if(App.settings.shuffleEnabled) App.scrollPlaylistToTrack(p);
    }
  });
App.audio.addEventListener('ended', ()=>{
    const n = App.getNextIndex(true);
    if(n === -1){
      App.state.isPlaying = false; App.refreshMusicVisualizer?.(); App.updatePlayIcon(); App.MusicSense.stop(); App.renderTrackList();
      return;
    }
    App.loadTrack(n, true);
    if(App.settings.shuffleEnabled) App.scrollPlaylistToTrack(n);
  });
App.el('btnShuffle').addEventListener('click', ()=>{
    App.settings.shuffleEnabled = !App.settings.shuffleEnabled;
    if(App.settings.shuffleEnabled){
      App.refillShuffleBag(App.state.currentIndex);
    }
    App.saveSettings();
    App.updatePlaybackModeButtons();
  });
App.el('btnRepeat').addEventListener('click', ()=>App.cycleRepeat());
App.updatePlaybackModeButtons();
App.audio.addEventListener('loadedmetadata', ()=>{
    if(App.state.currentIndex >= 0){
      App.state.tracks[App.state.currentIndex].duration = App.audio.duration;
      App.PlayStatsStore.setDuration(App.trackKey(App.state.tracks[App.state.currentIndex]), App.audio.duration);
      App.durationVersion=(App.durationVersion||0)+1;
      App.renderTrackList();
    }
  });
  }, ["playbackOrder","shuffleArray","refillShuffleBag","recordPlayedIndex","getNextIndex","getPrevIndex","updatePlaybackModeButtons","formatTime"]);
})(window.Aurora);

// ── player/volume ──
(function(App){
App.updateVolTrackVisual = function updateVolTrackVisual(){
    App.el('volumeRange').style.setProperty('--vol-pct', App.el('volumeRange').value + '%');
  };
App.updateVolumeIcon = function updateVolumeIcon(v){
    const svg = App.el('volumeIcon');
    const btn = App.el('volumeIconBtn');
    if(!svg) return;
    let key;
    if(App.isExplicitlyMuted || v <= 0) key = App.isExplicitlyMuted ? 'muted' : 'zero';
    else if(v < 0.4) key = 'low';
    else key = 'full';
    svg.innerHTML = App.VOLUME_ICON_PATHS[key];
    if(btn) btn.title = (key === 'muted' || key === 'zero') ? 'Zapnout zvuk' : 'Ztlumit';
    btn && btn.classList.toggle('is-muted', key === 'muted' || key === 'zero');
  };
App.setVolume = function setVolume(v, fromMuteToggle){
    if(!Number.isFinite(v))return;
    v = Math.max(0, Math.min(1, v));
    App.el('volumeRange').value = Math.round(v*100);
    App.updateVolTrackVisual();
    if(App.volumeGain){
      App.volumeGain.gain.setTargetAtTime(v, App.audioCtx.currentTime, 0.01);
    } else {
      App.audio.volume = v;
    }
    App.pendingVolume = v;
    App.updateVolumeIcon(v);
    App.Session?.schedule();
  };
  App.define("player/volume", function initialize(){
App.el('volumeRange').addEventListener('input', e=>{
    App.updateVolTrackVisual();
    const v = e.target.value/100;
    if(App.volumeGain){
      App.volumeGain.gain.setTargetAtTime(v, App.audioCtx.currentTime, 0.01);
    } else {
      App.audio.volume = v;
    }
    App.pendingVolume = v;
    App.isExplicitlyMuted = false;
    App.lastNonZeroVolume = v > 0 ? v : App.lastNonZeroVolume;
    App.updateVolumeIcon(v);
    App.Session?.schedule();
  });
App.audio.volume = App.DEFAULT_VOLUME;
App.updateVolTrackVisual();
App.lastNonZeroVolume = App.pendingVolume > 0 ? App.pendingVolume : App.DEFAULT_VOLUME;
App.VOLUME_ICON_PATHS = {
    full: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>',
    low: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15 9.5a2.5 2.5 0 0 1 0 5"/>',
    zero: '<path d="M11 5 6 9H2v6h4l5 4z"/>',
    muted: '<path d="M11 5 6 9H2v6h4l5 4z"/><line x1="16" y1="9" x2="21" y2="14"/><line x1="21" y1="9" x2="16" y2="14"/>'
  };
App.isExplicitlyMuted = false;
App.el('volumeIconBtn').addEventListener('click', ()=>{
    if(App.isExplicitlyMuted || App.pendingVolume <= 0){
      App.isExplicitlyMuted = false;
      App.setVolume(App.lastNonZeroVolume > 0 ? App.lastNonZeroVolume : App.DEFAULT_VOLUME);
    } else {
      App.lastNonZeroVolume = App.pendingVolume;
      App.isExplicitlyMuted = true;
      App.setVolume(0);
    }
  });
App.updateVolumeIcon(App.pendingVolume);
App.updateProfileCount();
  }, ["updateVolTrackVisual","lastNonZeroVolume","VOLUME_ICON_PATHS","isExplicitlyMuted","updateVolumeIcon","setVolume"]);
})(window.Aurora);

// ── playlist/sorting ──
(function(App){
App.sortPlaylistEntries = function sortPlaylistEntries(entries){
    const key=App.settings.playlistSort||'original',dir=App.settings.playlistSortDirection==='desc'?-1:1;
    const collator=App.sortPlaylistEntries.collator ||= new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});
    const decorated=entries.map(e=>({e,value:key==='favorites'?(App.LikeStore.has(App.trackKey(e.t))?0:1):key==='title'?e.t.name:key==='artist'?e.t.artist:key==='duration'?e.t.duration:e.i}));
    decorated.sort((a,b)=>{
      if(key==='duration'){
        const missingA=!Number.isFinite(a.value),missingB=!Number.isFinite(b.value);
        if(missingA!==missingB)return missingA?1:-1;
        if(missingA)return a.e.i-b.e.i;
      }
      const cmp=key==='title'||key==='artist'?collator.compare(a.value||'',b.value||''):a.value-b.value;
      return cmp*dir||a.e.i-b.e.i;
    });
    for(let i=0;i<decorated.length;i++)entries[i]=decorated[i].e;
    return entries;
  };
  App.define("playlist/sorting", function initialize(){
  }, ["sortPlaylistEntries"]);
})(window.Aurora);
