/* Library controls, bounded search cache, queue and reversible library edits. */
(function(App){
  App.normalizeSearch = value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  App.searchTokens = value=>App.normalizeSearch(value).trim().split(/\s+/).filter(Boolean);
  const searchCache=new WeakMap();
  App.matchesTrack = (track,tokens)=>{
    if(!tokens.length)return true;
    let cached=searchCache.get(track);
    if(!cached||cached.version!==App.libraryVersion){
      cached={version:App.libraryVersion,text:App.normalizeSearch(track.name+' '+track.artist+' '+track.file.name)};
      searchCache.set(track,cached);
    }
    return tokens.every(token=>cached.text.includes(token));
  };
  App.fileIdentity = file=>JSON.stringify([file.name,file.size]);
  App.text = (cs,en)=>document.documentElement.lang==='cs'?cs:en;
  App.readDroppedFiles = async transfer=>{
    // Snapshot entries synchronously: DataTransfer becomes protected after drop.
    const items=Array.from(transfer.items||[]),fallback=Array.from(transfer.files||[]);
    const entries=items.map(item=>item.webkitGetAsEntry?.()).filter(Boolean);
    if(!entries.length)return fallback;
    const files=[];
    const visit=async(entry,parent='')=>{
      if(entry.isFile){
        const file=await new Promise((resolve,reject)=>entry.file(resolve,reject));
        if(parent&&!file.webkitRelativePath)Object.defineProperty(file,'webkitRelativePath',{value:parent+file.name});
        files.push(file);
      }
      else if(entry.isDirectory){
        const reader=entry.createReader();
        while(true){
          const batch=await new Promise((resolve,reject)=>reader.readEntries(resolve,reject));
          if(!batch.length)break;
          for(const child of batch)await visit(child,parent+(entry.name?entry.name+'/':''));
        }
      }
    };
    for(const entry of entries)await visit(entry);
    return files;
  };
  App.define('ui/library-tools',function(){
    App.libraryFilter='all';App.playNextQueue=[];
    const create=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text)node.textContent=text;return node;};
    const button=(text,label)=>{const b=create('button','library-button',text);b.type='button';if(label)b.title=b.ariaLabel=label;return b;};
    const toast=create('div','aurora-notice');toast.hidden=true;toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');
    const message=create('span'),action=button(''),dismiss=button('×','Zavřít oznámení');toast.append(message,action,dismiss);document.body.append(toast);
    let toastTimer=0;
    const hide=()=>{toast.hidden=true;clearTimeout(toastTimer);action.onclick=null;};dismiss.onclick=hide;
    App.notify=(text,options={})=>{
      clearTimeout(toastTimer);message.textContent=text;toast.hidden=false;toast.classList.toggle('notice-error',!!options.error);
      action.hidden=!options.action;action.textContent=options.label||App.text('Zpět','Undo');
      action.onclick=()=>{hide();options.action?.();};
      toastTimer=setTimeout(hide,options.action?12000:options.error?10000:5500);
    };
    toast.addEventListener('mouseenter',()=>clearTimeout(toastTimer));
    toast.addEventListener('mouseleave',()=>{toastTimer=setTimeout(hide,6000);});
    toast.addEventListener('focusin',()=>clearTimeout(toastTimer));
    App.openDialog=(title,build)=>{
      App.closeLibraryMenu?.();
      const previous=document.activeElement,dialog=create('dialog','aurora-dialog'),heading=create('h2','',title),close=button('×','Zavřít');
      heading.id='auroraDialogTitle';dialog.setAttribute('aria-labelledby',heading.id);close.classList.add('dialog-close');
      close.onclick=()=>dialog.close();dialog.append(close,heading);build(dialog);document.body.append(dialog);
      dialog.addEventListener('close',()=>{dialog.remove();if(previous?.isConnected)previous.focus();},{once:true});
      dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
      dialog.showModal();return dialog;
    };
    let menu=null,menuAnchor=null;
    App.closeLibraryMenu=(restore=false)=>{menu?.remove();menu=null;if(restore&&menuAnchor?.isConnected)menuAnchor.focus();menuAnchor=null;};
    const openMenu=(anchor,items)=>{
      App.closeLibraryMenu();menuAnchor=anchor;menu=create('div','library-menu');menu.setAttribute('role','menu');
      for(const item of items){
        const b=button(item.label);b.setAttribute('role','menuitem');b.disabled=!!item.disabled;if(item.danger)b.classList.add('danger');
        b.onclick=()=>{App.closeLibraryMenu(true);item.run();};menu.append(b);
      }
      document.body.append(menu);const r=anchor.getBoundingClientRect();
      menu.style.left=Math.max(8,Math.min(innerWidth-menu.offsetWidth-8,r.right-menu.offsetWidth))+'px';
      menu.style.top=Math.max(8,Math.min(innerHeight-menu.offsetHeight-8,r.bottom+6))+'px';
      menu.querySelector('button:not(:disabled)')?.focus();
      menu.addEventListener('keydown',e=>{
        if(e.key==='Escape'){e.preventDefault();e.stopPropagation();App.closeLibraryMenu(true);}
        if(e.key==='Tab'){App.closeLibraryMenu();return;}
        if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;
        e.preventDefault();const buttons=[...menu.querySelectorAll('button:not(:disabled)')],index=buttons.indexOf(document.activeElement);
        buttons[e.key==='Home'?0:e.key==='End'?buttons.length-1:(index+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length]?.focus();
      });
    };
    document.addEventListener('pointerdown',e=>{if(menu&&!menu.contains(e.target)&&!menuAnchor?.contains(e.target))App.closeLibraryMenu();});
    window.addEventListener('resize',()=>App.closeLibraryMenu());
    App.trackListEl.addEventListener('scroll',()=>App.closeLibraryMenu(),{passive:true});
    const tabs=create('div','library-filters'),all=button('Vše'),liked=button('Oblíbené'),jump=button('◎','Zobrazit přehrávanou skladbu');
    all.setAttribute('aria-pressed','true');liked.setAttribute('aria-pressed','false');tabs.append(all,liked,jump);
    App.el('playlistPanel').querySelector('.playlist-header').append(tabs);
    const filter=kind=>{App.libraryFilter=kind;all.setAttribute('aria-pressed',String(kind==='all'));liked.setAttribute('aria-pressed',String(kind==='favorites'));App.renderTrackList();};
    all.onclick=()=>filter('all');liked.onclick=()=>filter('favorites');
    App.revealCurrentTrack=async()=>{
      if(App.state.currentIndex<0)return;
      App.setPlaylistOpen?.(true);App.searchInputEl.value='';App.updateSearchClearVisibility();filter('all');
      await App.renderTrackList('');App.scrollPlaylistToTrack(App.state.currentIndex,{smooth:false});App.renderVtWindow(true);
      App.trackListEl.querySelector(`[data-index="${App.state.currentIndex}"]`)?.focus();
    };jump.onclick=App.revealCurrentTrack;
    const toolsButton=button('•••','Správa knihovny');toolsButton.id='btnLibraryTools';
    App.el('playlistPanel').querySelector('.playlist-header-top').insertBefore(toolsButton,App.el('playlistCount'));
    const summary=create('div','library-summary');summary.id='librarySummary';
    App.el('playlistPanel').querySelector('.playlist-sort').after(summary);
    const queue=create('details','library-queue'),queueTitle=create('summary'),queueList=create('div','queue-items');queue.id='playNextQueue';queue.hidden=true;queue.append(queueTitle,queueList);summary.after(queue);
    queue.addEventListener('toggle',()=>App.LibraryTools.updateQueue());
    let undo=null;
    App.LibraryTools={
      prepareRow(row){
        row.tabIndex=0;row.setAttribute('role','group');
        const more=button('•••','Možnosti skladby');more.classList.add('track-more');row.append(more);
        row._moreEl=more;more.addEventListener('click',e=>{e.stopPropagation();this.openTrackMenu(row);});
        row.addEventListener('keydown',e=>{
          if(e.target!==row)return;
          if(e.key==='Enter'||e.key===' '){e.preventDefault();row.click();}
          if(e.key==='Delete'){e.preventDefault();this.remove([App.state.tracks[row._boundTrackIndex]]);}
          if(e.key==='ContextMenu'||(e.shiftKey&&e.key==='F10')){e.preventDefault();this.openTrackMenu(row);}
          if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;
          e.preventDefault();const entries=App.vt.filtered,index=entries.findIndex(t=>t.i===row._boundTrackIndex);
          const next=entries[e.key==='Home'?0:e.key==='End'?entries.length-1:Math.max(0,Math.min(entries.length-1,index+(e.key==='ArrowDown'?1:-1)))];
          if(next){App.scrollPlaylistToTrack(next.i,{smooth:false});App.renderVtWindow(true);App.trackListEl.querySelector(`[data-index="${next.i}"]`)?.focus();}
        });
      },
      paintRow(row,{t,i}){
        if(row._accessibleName!==t.name+' '+t.artist){row._accessibleName=t.name+' '+t.artist;row.setAttribute('aria-label',row._accessibleName);}
        const current=i===App.state.currentIndex;
        if(row.getAttribute('aria-current')!==String(current))row.setAttribute('aria-current',String(current));
        row._heartEl?.setAttribute('aria-pressed',String(App.LikeStore.has(App.trackKey(t))));
      },
      openTrackMenu(row){
        const track=App.state.tracks[row._boundTrackIndex];if(!track)return;
        openMenu(row._moreEl,[
          {label:App.text('Přehrát další','Play next'),run:()=>this.enqueue(track)},
          {label:App.text('Přehrát nyní','Play now'),run:()=>App.loadTrack(App.state.tracks.indexOf(track),true)},
          {label:App.text('Odebrat z knihovny','Remove from library'),danger:true,run:()=>this.remove([track])}
        ]);
      },
      enqueue(track){
        if(App.playNextQueue.length>=100){App.notify(App.text('Fronta může obsahovat nejvýše 100 skladeb.','The queue can hold up to 100 tracks.'));return;}
        App.playNextQueue.push(track);this.updateQueue();App.Session?.schedule();
        App.notify(App.text('Přidáno do fronty: ','Added to queue: ')+track.name);
      },
      updateQueue(){
        queue.hidden=!App.playNextQueue.length;
        queueTitle.textContent=App.text('Přehrát další','Up next')+' · '+App.playNextQueue.length;
        queueList.replaceChildren();if(!queue.open)return;
        App.playNextQueue.forEach((track,index)=>{
          const item=create('div','queue-item'),title=button((index+1)+'. '+track.name),remove=button('×',App.text('Odebrat z fronty','Remove from queue'));
          title.dataset.userMetadata='';
          title.onclick=()=>{App.playNextQueue.splice(index,1);App.loadTrack(App.state.tracks.indexOf(track),true);this.updateQueue();App.Session?.schedule();};
          remove.onclick=()=>{App.playNextQueue.splice(index,1);this.updateQueue();App.Session?.schedule();};item.append(title,remove);queueList.append(item);
        });
        const clear=button(App.text('Vyprázdnit frontu','Clear queue'));clear.onclick=()=>{App.playNextQueue=[];this.updateQueue();App.Session?.schedule();};queueList.append(clear);
      },
      updateSummary(){
        const key=JSON.stringify([App.libraryVersion,App.durationVersion,App.vt.cacheKey,document.documentElement.lang]);
        jump.disabled=App.state.currentIndex<0;
        if(this.summaryKey===key)return;this.summaryKey=key;
        let seconds=0,known=0;for(const {t} of App.vt.filtered){if(Number.isFinite(t.duration)&&t.duration>0){seconds+=t.duration;known++;}}
        const count=App.vt.filtered.length,total=App.state.tracks.length;
        const minutes=Math.floor(seconds/60),duration=minutes>=60?`${Math.floor(minutes/60)} h ${minutes%60} min`:minutes?`${minutes} min`:`${Math.floor(seconds)} s`;
        summary.textContent=(count===total?String(total):`${count} / ${total}`)+App.text(' skladeb',' tracks')+(known?' · '+(known<count?'≥ ':'')+duration:'');
        summary.title=known<count?App.text('Součet známých délek. Další délky se doplní při přehrávání.','Sum of known durations. More durations appear during playback.'):'';
      },
      afterImport(added,total){
        this.summaryKey=null;App.LibraryStorage?.schedule();App.Session?.schedule();
        if(!App.LibraryStorage?.restoring)App.notify(App.text(`Přidáno ${added} skladeb`,`${added} tracks added`)+(total>added?App.text(` · ${total-added} duplicit přeskočeno`,` · ${total-added} duplicates skipped`):''));
      },
      replaceTracks(tracks){
        App.BulkAnalyzer.stop();App.closeLibraryMenu();
        const old=App.state.tracks,current=old[App.state.currentIndex],oldIndex=App.state.currentIndex,pending=App.playbackPending;
        const history=App.playbackOrder.history.map(i=>old[i]),bag=App.playbackOrder.bag.map(i=>old[i]);
        const positions=new Map(tracks.map((track,index)=>[track,index]));
        App.state.tracks=tracks;App.state.currentIndex=positions.get(current)??-1;App.libraryVersion++;App.vtProgressState.clear();
        App.playbackOrder.history=history.map(t=>positions.get(t)??-1).filter(i=>i>=0);
        App.playbackOrder.cursor=Math.min(App.playbackOrder.cursor??0,App.playbackOrder.history.length-1);
        App.playbackOrder.bag=bag.map(t=>positions.get(t)??-1).filter(i=>i>=0);
        App.playNextQueue=App.playNextQueue.filter(t=>positions.has(t));this.updateQueue();
        if(current&&App.state.currentIndex<0){
          App.stopPlayback();
          if(tracks.length)App.loadTrack(Math.min(oldIndex,tracks.length-1),false);
        }else if(pending&&current)App.loadTrack(App.state.currentIndex,true);
        for(const t of old)if(!positions.has(t)&&t.url){URL.revokeObjectURL(t.url);t.url=null;}
        if(!tracks.length)App.Session?.clear();
        App.renderTrackList();App.updateMediaSession?.();App.Session?.save();App.LibraryStorage?.schedule();
      },
      remove(tracks){
        const removed=new Set(tracks.filter(Boolean));if(!removed.size)return;
        undo={entries:App.state.tracks.flatMap((track,index)=>removed.has(track)?[{track,index}]:[])};
        this.replaceTracks(App.state.tracks.filter(track=>!removed.has(track)));
        App.notify(App.text(`Odebráno ${undo.entries.length} skladeb.`,`Removed ${undo.entries.length} tracks.`),{action:()=>this.undo()});
      },
      undo(){
        if(!undo)return;const tracks=App.state.tracks.slice();
        const existing=new Set(tracks.map(t=>App.fileIdentity(t.file)));
        for(const {track,index} of undo.entries)if(!existing.has(App.fileIdentity(track.file))){tracks.splice(Math.min(index,tracks.length),0,track);existing.add(App.fileIdentity(track.file));}
        undo=null;this.replaceTracks(tracks);App.notify(App.text('Odebrané skladby byly obnoveny.','Removed tracks restored.'));
      },
      exportPlaylist(){
        const clean=s=>String(s).replace(/[\r\n]/g,' ');
        const entries=App.sortPlaylistEntries(App.state.tracks.map((t,i)=>({t,i})));
        const lines=['#EXTM3U',...entries.flatMap(({t})=>[`#EXTINF:${Number.isFinite(t.duration)?Math.round(t.duration):-1},${clean(t.artist)} - ${clean(t.name)}`,'./'+clean(t.file.webkitRelativePath||t.file.name)])];
        const url=URL.createObjectURL(new Blob([lines.join('\n')+'\n'],{type:'audio/x-mpegurl;charset=utf-8'}));
        const link=create('a');link.href=url;link.download='Aurora-playlist.m3u8';link.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
        App.notify(App.text('Playlist uložen. Umístěte jej vedle odpovídajících souborů nebo složek.','Playlist saved. Place it alongside the matching files or folders.'));
      }
    };
    toolsButton.onclick=()=>openMenu(toolsButton,[
      {label:App.LibraryStorage?.enabled?App.text('Zapamatování knihovny: zapnuto','Remember library: on'):App.text('Zapamatovat knihovnu…','Remember library…'),run:()=>App.LibraryStorage.configure()},
      {label:App.text('Exportovat playlist (.m3u8)','Export playlist (.m3u8)'),disabled:!App.state.tracks.length,run:()=>App.LibraryTools.exportPlaylist()},
      {label:App.text('Vrátit odebrání skladeb','Undo track removal'),disabled:!undo,run:()=>App.LibraryTools.undo()},
      {label:App.text('Klávesové zkratky','Keyboard shortcuts'),run:()=>App.showShortcuts()},
      {label:App.text('Vyprázdnit knihovnu…','Clear library…'),disabled:!App.state.tracks.length,danger:true,run:()=>App.openDialog(App.text('Vyprázdnit knihovnu?','Clear library?'),dialog=>{
        dialog.append(create('p','',App.text('Soubory na disku zůstanou zachované. Odebrání lze vrátit do dalšího načtení stránky.','Your files on disk stay intact. You can undo this until the page is reloaded.')));
        const confirm=button(App.text('Vyprázdnit knihovnu','Clear library'));confirm.classList.add('danger');confirm.onclick=()=>{App.LibraryTools.remove(App.state.tracks.slice());dialog.close();};dialog.append(confirm);
      })}
    ]);
    new MutationObserver(()=>{App.LibraryTools.summaryKey=null;App.LibraryTools.updateSummary();App.LibraryTools.updateQueue();}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    App.LibraryTools.updateSummary();
  });
})(window.Aurora);

window.Aurora.addStyle(60,`
.library-button{border:1px solid #ffffff1b;background:#ffffff05;color:var(--text,#e9e9ef);border-radius:10px;padding:8px 11px;font:500 12px var(--font-body,Arial);cursor:pointer;line-height:1.4;}
.library-button:hover{background:#ffffff10;border-color:#ffffff42;}.library-button:disabled{opacity:.4;cursor:default;}
.library-button:focus-visible,.track-row:focus-visible,.library-queue summary:focus-visible,#progressWrap:focus-visible{outline:2px solid var(--player-c1,#d75bea);outline-offset:2px;}
.library-filters{display:flex;gap:6px;align-items:center;}.library-filters .library-button{min-height:34px;border-radius:9px;}
.library-filters .library-button[aria-pressed=true]{background:#b969df20;border-color:#c68be74f;color:#f2dcff;}.library-filters .library-button:last-child{margin-left:auto;font-size:19px;padding:2px 11px;}
#btnLibraryTools{margin-left:auto;letter-spacing:2px;padding:4px 9px;min-width:34px;}.playlist-header-top .playlist-count{margin-left:0;}
.library-summary{padding:0 22px 12px;font-size:11px;color:var(--text-dim,#a3a6b6);flex-shrink:0;}
#playlistPanel .playlist-sort{padding-top:12px;padding-bottom:10px;}.playlist-header{gap:12px;}
#trackList .track-row{padding-right:8px;gap:8px;}#trackList .track-more{flex:0 0 28px;width:28px;height:30px;padding:3px;font-size:13px;letter-spacing:1px;border-color:transparent;background:transparent;}
#trackList .track-more:hover,#trackList .track-more:focus-visible{border-color:#ffffff24;background:#ffffff0a;}
#trackList .track-dur{font-size:10px;min-width:30px;}#trackList .track-info{min-width:0;}#trackList .track-info strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.library-menu{position:fixed;z-index:100020;width:240px;max-width:calc(100vw - 16px);padding:6px;border:1px solid #ffffff28;background:#171821;box-shadow:0 14px 50px #0009;border-radius:14px;display:flex;flex-direction:column;gap:3px;}
.library-menu .library-button{text-align:left;border-color:transparent;padding:11px;}.library-menu .library-button:focus-visible{outline-offset:-2px;}.library-button.danger{color:#ffacb9;}
.aurora-notice{position:fixed;z-index:100030;left:50%;bottom:calc(var(--control-bar-h,110px) + 50px);transform:translateX(-50%);max-width:min(640px,calc(100vw - 28px));box-sizing:border-box;display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid #ad83d95c;border-radius:14px;background:#20202c;box-shadow:0 10px 36px #0006;font:13px/1.5 var(--font-body,Arial);color:#f3eefb;}
.aurora-notice[hidden],.library-queue[hidden],.aurora-notice button[hidden]{display:none;}.aurora-notice span{min-width:0;overflow-wrap:anywhere;}.aurora-notice button{flex-shrink:0;}.notice-error{border-color:#ed899988;}
.aurora-dialog{box-sizing:border-box;width:min(480px,calc(100vw - 32px));max-height:85dvh;overflow:auto;padding:28px;color:#e9e9ef;background:#14151e;border:1px solid #ffffff2b;border-radius:22px;box-shadow:0 30px 100px #0009;font:14px/1.65 var(--font-body,Arial);}
.aurora-dialog::backdrop{background:#050610aa;backdrop-filter:blur(7px);}.aurora-dialog h2{font-size:21px;line-height:1.3;margin:0 36px 16px 0;}.aurora-dialog p{color:#b1b3c5;}.dialog-close{position:absolute;right:14px;top:14px;}.aurora-dialog .library-button{min-height:36px;}
.shortcut-row{display:flex;justify-content:space-between;gap:16px;padding:9px 0;border-bottom:1px solid #ffffff0d;}.shortcut-row kbd{color:#dfc2ff;white-space:nowrap;}
.library-queue{margin:0 18px 10px;border:1px solid #ffffff19;border-radius:12px;background:#a972d708;flex-shrink:0;}.library-queue summary{padding:10px 12px;cursor:pointer;font-size:12px;color:#d4c2eb;}.queue-items{padding:0 7px 7px;max-height:180px;overflow:auto;}.queue-item{display:flex;gap:5px;}.queue-item .library-button:first-child{flex:1;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}.queue-item .library-button{border-color:transparent;min-width:0;background:transparent;}
.session-resume{margin:18px auto 0;max-width:400px;padding:14px;border:1px solid #bc76e030;border-radius:14px;background:#100d1880;font-size:12px;color:#cbbbdc;}.session-resume strong{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:4px;}.session-resume .library-button{margin-top:10px;}
.play-pending{opacity:.65;}#emptyState .local-note{margin:17px 0 0;font-size:11px;color:var(--text-dim);letter-spacing:.04em;}#emptyState h1{letter-spacing:-.055em;font-size:clamp(36px,5vw,60px);font-weight:600;}
@media(max-width:600px){.aurora-notice{bottom:calc(var(--control-bar-h,130px) + 38px);font-size:12px;gap:6px;padding:9px 10px;}.library-summary{padding-left:16px;}.library-queue{margin-left:12px;margin-right:12px;}#trackList .track-row{gap:6px;}#trackList .track-dur{display:none;}}
@media(prefers-reduced-motion:reduce){.play-pending{animation:none;}}
`);
