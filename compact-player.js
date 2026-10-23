/* compact-player.js — Narrow-window playlist drawer and shared open state. */
(function(App){
  App.bindDrawerSwipe = function(target,direction,enabled,onSwipe){
    let gesture=null,suppressUntil=0;
    target.addEventListener('click',event=>{if(performance.now()<suppressUntil){event.preventDefault();event.stopImmediatePropagation();}},true);
    target.addEventListener('pointerdown',event=>{
      if(event.pointerType!=='touch'||!enabled()||event.target.closest('input,select'))return;
      gesture={id:event.pointerId,x:event.clientX,y:event.clientY};
      if(target.tagName==='BUTTON')target.setPointerCapture(event.pointerId);
    });
    target.addEventListener('pointerup',event=>{
      if(!gesture||gesture.id!==event.pointerId)return;
      const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;gesture=null;
      if(Math.abs(dy)<40&&dx*direction>45){suppressUntil=performance.now()+400;onSwipe();event.preventDefault();}
    });
    target.addEventListener('pointercancel',()=>{gesture=null;});
  };
  App.setPlaylistOpen = function(open){
    const panel=App.el('playlistPanel'),button=App.el('btnPlaylistToggle');
    App.app.classList.toggle('playlist-closed',!open);
    panel.inert=!open;
    button.setAttribute('aria-expanded',String(open));
    button.setAttribute('aria-controls',panel.id);
    if(!open&&panel.contains(document.activeElement))button.focus({preventScroll:true});
    if(App.playlistBackdrop)App.playlistBackdrop.hidden=!open||!App.compactPlayer;
    if(App.playlistEdgeHandle)App.playlistEdgeHandle.setAttribute('aria-expanded',String(open));
    if(App.Spectrogram)App.Spectrogram._lastAlignT=undefined;
    App.scheduleResponsiveLayout?.();
  };

  App.mountCompactPlayer = function(){
    const media=matchMedia('(max-width:1100px)'),panel=App.el('playlistPanel');
    let wideOpen=!App.app.classList.contains('playlist-closed'),hoverOpened=false,hoverTimer=0,closeTimer=0;
    const backdrop=document.createElement('button');backdrop.type='button';backdrop.id='playlistBackdrop';backdrop.hidden=true;backdrop.tabIndex=-1;
    const edge=document.createElement('button');edge.type='button';edge.id='playlistEdgeHandle';edge.textContent='‹';edge.setAttribute('aria-controls',panel.id);
    const close=document.createElement('button');close.type='button';close.className='playlist-drawer-close';close.textContent='×';
    App.app.append(backdrop,edge);panel.querySelector('.playlist-header-top').append(close);
    App.playlistBackdrop=backdrop;App.playlistEdgeHandle=edge;
    const translate=()=>{
      const cs=document.documentElement.lang==='cs';
      edge.title=edge.ariaLabel=cs?'Otevřít playlist':'Open playlist';
      backdrop.ariaLabel=close.ariaLabel=cs?'Zavřít playlist':'Close playlist';
    };
    translate();new MutationObserver(translate).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    const setOpen=(open,hover=false)=>{clearTimeout(hoverTimer);clearTimeout(closeTimer);hoverOpened=open&&hover;App.setPlaylistOpen(open);};
    const syncMode=()=>{
      const compact=media.matches;
      if(compact===App.compactPlayer)return;
      if(compact)wideOpen=!App.app.classList.contains('playlist-closed');
      App.compactPlayer=compact;App.app.classList.toggle('compact-player',compact);
      setOpen(compact?false:wideOpen);
    };
    syncMode();media.addEventListener('change',syncMode);
    edge.addEventListener('click',()=>setOpen(App.app.classList.contains('playlist-closed')));
    close.addEventListener('click',()=>setOpen(false));backdrop.addEventListener('click',()=>setOpen(false));
    App.el('btnPlaylistToggle').addEventListener('click',()=>{hoverOpened=false;clearTimeout(closeTimer);clearTimeout(hoverTimer);});
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&App.compactPlayer&&!App.SettingsUI?.isOpen&&!App.app.classList.contains('playlist-closed')){event.preventDefault();setOpen(false);}
    });
    // Only a mouse resting at the edge opens the drawer; moving across it does not.
    document.addEventListener('pointermove',event=>{
      if(event.pointerType!=='mouse'||!App.compactPlayer||App.SettingsUI?.isOpen)return;
      if(event.clientX>=innerWidth-12&&App.app.classList.contains('playlist-closed')){
        if(!hoverTimer)hoverTimer=setTimeout(()=>{hoverTimer=0;setOpen(true,true);},180);
      }else{clearTimeout(hoverTimer);hoverTimer=0;}
    },{passive:true});
    panel.addEventListener('pointerenter',()=>clearTimeout(closeTimer));
    panel.addEventListener('pointerleave',event=>{
      if(event.pointerType!=='mouse'||!hoverOpened)return;
      closeTimer=setTimeout(()=>{if(!panel.contains(document.activeElement))setOpen(false);},250);
    });
    App.bindDrawerSwipe(edge,-1,()=>App.compactPlayer,()=>setOpen(true));
    App.bindDrawerSwipe(panel,1,()=>App.compactPlayer,()=>setOpen(false));
    panel.addEventListener('click',event=>{
      if(App.compactPlayer&&event.target.closest('.track-row')&&!event.target.closest('.heart-btn'))setOpen(false);
    });
    App.mountVisualizerDrawer();
  };

  App.mountVisualizerDrawer = function(){
    const media=matchMedia('(max-width:600px)'),dock=App.el('visualizerDock');
    const handle=document.createElement('button');handle.type='button';handle.id='visualizerEdgeHandle';
    handle.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9v6M10 4v16M15 7v10M20 10v4"/></svg>';
    handle.setAttribute('aria-controls',dock.id);App.app.append(handle);
    const translate=()=>{handle.title=handle.ariaLabel=document.documentElement.lang==='cs'?'Vizualizéry':'Visualizers';};
    translate();new MutationObserver(translate).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    const setOpen=open=>{
      if(open&&App.compactPlayer)App.setPlaylistOpen(false);
      const visible=open;dock.classList.toggle('drawer-open',open);dock.inert=!visible;
      handle.setAttribute('aria-expanded',String(visible));
      if(!visible&&dock.contains(document.activeElement))handle.focus({preventScroll:true});
      App.refreshPointerGlow?.(App.SettingsUI?.motionDuration?.()||0);
    };
    const sync=()=>{App.app.classList.add('visualizer-drawer');App.app.classList.toggle('mobile-visualizer-drawer',media.matches);setOpen(false);};
    sync();media.addEventListener('change',sync);
    handle.addEventListener('click',()=>setOpen(!dock.classList.contains('drawer-open')));
    dock.addEventListener('click',event=>{if(event.target.closest('[data-viz-mode]'))setOpen(false);});
    document.addEventListener('pointerdown',event=>{if(!dock.contains(event.target)&&!handle.contains(event.target))setOpen(false);});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&dock.classList.contains('drawer-open')){event.preventDefault();setOpen(false);}});
    let hoverTimer=0,closeTimer=0;
    document.addEventListener('pointermove',event=>{
      if(event.pointerType!=='mouse'||App.SettingsUI?.isOpen)return;
      if(event.clientX<=12&&!dock.classList.contains('drawer-open')){
        if(!hoverTimer)hoverTimer=setTimeout(()=>{hoverTimer=0;setOpen(true);},180);
      }else{clearTimeout(hoverTimer);hoverTimer=0;}
    },{passive:true});
    handle.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse')setOpen(true);});
    dock.addEventListener('pointerenter',()=>clearTimeout(closeTimer));
    dock.addEventListener('pointerleave',event=>{
      if(event.pointerType!=='mouse')return;
      closeTimer=setTimeout(()=>{if(!dock.contains(document.activeElement))setOpen(false);},250);
    });
    App.bindDrawerSwipe(handle,1,()=>media.matches,()=>setOpen(true));
    App.bindDrawerSwipe(dock,-1,()=>media.matches,()=>setOpen(false));
  };
})(window.Aurora);
