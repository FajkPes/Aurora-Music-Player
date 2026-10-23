/* Small playback state in localStorage; opt-in audio library in IndexedDB. */
(function(App){
  App.define('storage/library-session',function(){
    const SESSION_KEY='aurora-session-v1',LIBRARY_KEY='aurora-remember-library-v1';
    const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
    let saved=read(SESSION_KEY,{});if(!saved||typeof saved!=='object')saved={};
    let resume=typeof saved.key==='string'?saved:null,timer=0,warningShown=false,lastSavedAt=0;
    App.Session={
      schedule(){clearTimeout(timer);timer=setTimeout(()=>this.save(),500);},
      save(){
        clearTimeout(timer);timer=0;
        const track=App.state.tracks[App.state.currentIndex];
        // A newly assigned src has time 0 until metadata: don't overwrite its restore position.
        if(this.restoringPosition)return;
        saved={...(track?{key:App.fileIdentity(track.file),name:track.name,artist:track.artist,position:Number.isFinite(App.audio.currentTime)?App.audio.currentTime:0}:saved),
          volume:App.pendingVolume,lastNonZero:App.lastNonZeroVolume,queue:App.playNextQueue.map(t=>App.fileIdentity(t.file))};
        try{localStorage.setItem(SESSION_KEY,JSON.stringify(saved));}
        catch{if(!warningShown){warningShown=true;App.notify(App.text('Místo poslechu se nepodařilo uložit.','Could not save your listening position.'),{error:true});}}
        lastSavedAt=Date.now();
      },
      clear(){resume=null;saved={};this.restoringPosition=false;this.save();App.el('sessionResume')?.remove();},
      restoreTrack(){
        if(!resume)return false;
        const data=resume,index=App.state.tracks.findIndex(t=>App.fileIdentity(t.file)===data.key);resume=null;
        App.el('sessionResume')?.remove();if(index<0)return false;
        const byKey=new Map(App.state.tracks.map(t=>[App.fileIdentity(t.file),t]));
        App.playNextQueue=(Array.isArray(data.queue)?data.queue:[]).slice(0,100).map(key=>byKey.get(key)).filter(Boolean);App.LibraryTools.updateQueue();
        this.restoringPosition=true;
        App.loadTrack(index,false);const generation=App.playbackGeneration;
        const restore=()=>{
          App.audio.removeEventListener('loadedmetadata',restore);App.audio.removeEventListener('error',cancel);
          this.restoringPosition=false;
          if(App.playbackGeneration!==generation)return;
          const duration=App.audio.duration,time=Number.isFinite(data.position)?data.position:0;
          if(Number.isFinite(duration)&&time<duration-1)App.seekPlayback(time);
          this.save();
        };
        const cancel=()=>{this.restoringPosition=false;App.audio.removeEventListener('loadedmetadata',restore);App.audio.removeEventListener('error',cancel);};
        App.audio.addEventListener('loadedmetadata',restore);App.audio.addEventListener('error',cancel,{once:true});
        return true;
      }
    };
    if(Number.isFinite(saved.volume)){
      App.setVolume(Math.max(0,Math.min(1,saved.volume)));
      App.lastNonZeroVolume=Number.isFinite(saved.lastNonZero)&&saved.lastNonZero>0?Math.min(1,saved.lastNonZero):App.DEFAULT_VOLUME;
      App.isExplicitlyMuted=App.pendingVolume===0;
    }
    App.audio.addEventListener('timeupdate',()=>{if(Date.now()-lastSavedAt>5000&&App.state.currentIndex>=0)App.Session.save();});
    App.audio.addEventListener('pause',()=>App.Session.schedule());
    window.addEventListener('pagehide',()=>App.Session.save());
    document.addEventListener('visibilitychange',()=>{if(document.hidden)App.Session.save();});
    if(resume){
      const card=document.createElement('div');card.className='session-resume';card.id='sessionResume';
      const title=document.createElement('strong'),description=document.createElement('span'),button=document.createElement('button');
      title.textContent=resume.name||'';title.dataset.userMetadata='';
      description.textContent=App.text('Pokračovat od ','Continue from ')+App.formatTime(resume.position||0)+App.text(' · znovu vyberte stejnou hudbu.',' · select the same music again.');
      button.type='button';button.className='library-button';button.textContent=App.text('Vybrat hudbu a pokračovat','Select music and continue');button.onclick=App.triggerFiles;
      card.append(title,description,document.createElement('br'),button);App.el('emptyState').append(card);
    }
    let database=null,opening=null,saveTimer=0,chain=Promise.resolve(),storedIds=new Set();
    const open=()=>{
      if(database)return Promise.resolve(database);if(opening)return opening;
      opening=new Promise((resolve,reject)=>{
        if(!window.indexedDB){reject(new Error('IndexedDB unavailable'));return;}
        const request=indexedDB.open('aurora-library-v1',1);let rejected=false;
        request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains('tracks'))db.createObjectStore('tracks',{keyPath:'id'});if(!db.objectStoreNames.contains('meta'))db.createObjectStore('meta');};
        request.onerror=()=>reject(request.error);
        request.onblocked=()=>{rejected=true;reject(new Error('Database blocked'));};
        request.onsuccess=()=>{if(rejected){request.result.close();return;}database=request.result;database.onversionchange=()=>{database.close();database=null;opening=null;};resolve(database);};
      }).catch(error=>{opening=null;throw error;});return opening;
    };
    const transaction=(db,mode,work)=>new Promise((resolve,reject)=>{
      const tx=db.transaction(['tracks','meta'],mode);let result;
      tx.oncomplete=()=>resolve(typeof result==='function'?result():result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Transaction aborted'));
      try{result=work(tx.objectStore('tracks'),tx.objectStore('meta'));}catch(error){tx.abort();reject(error);}
    });
    App.LibraryStorage={
      enabled:read(LIBRARY_KEY,false)===true,restoring:false,busy:false,
      schedule(){if(!this.enabled||this.restoring||this.disabling)return;return this.save();},
      async save(){
        clearTimeout(saveTimer);
        chain=chain.catch(()=>{}).then(async()=>{
          if(!this.enabled)return;
          this.busy=true;this.updateStatus();
          try{
            const db=await open(),tracks=App.state.tracks.slice(),ids=new Set(tracks.map(t=>App.fileIdentity(t.file)));
            await transaction(db,'readwrite',(store,meta)=>{
              for(const track of tracks){const id=App.fileIdentity(track.file);if(!storedIds.has(id))store.put({id,file:track.file,relativePath:track.file.webkitRelativePath||''});}
              for(const id of storedIds)if(!ids.has(id))store.delete(id);
              meta.put([...ids],'order');
            });
            storedIds=ids;this.error=false;
          }catch(error){
            console.warn('Library persistence failed',error);this.error=true;
            App.notify(App.text('Knihovna se neuložila. Zkontrolujte volné místo nebo vypněte zapamatování. Původní hudební soubory zůstávají na disku.','The library could not be saved. Check free space or turn off remembering. Your original music files remain on disk.'),{error:true});
          }finally{this.busy=false;this.updateStatus();}
        });return chain;
      },
      async disable(){
        this.disabling=true;clearTimeout(saveTimer);
        try{
          await chain.catch(()=>{});
          const db=await open();await transaction(db,'readwrite',(store,meta)=>{store.clear();meta.clear();});storedIds.clear();
          localStorage.setItem(LIBRARY_KEY,'false');this.enabled=false;this.error=false;this.updateStatus();
        }finally{this.disabling=false;}
      },
      updateStatus(){
        const node=App.el('libraryPersistenceStatus');if(!node)return;
        node.textContent=this.busy?App.text('Ukládám knihovnu…','Saving library…'):this.error?App.text('Knihovna není uložená','Library not saved'):this.enabled?App.text('Knihovna se pamatuje v tomto prohlížeči','Library remembered in this browser'):App.text('Soubory se zpracovávají pouze v zařízení','Files stay on your device');
        node.classList.toggle('storage-error',!!this.error);
      },
      configure(){
        App.openDialog(App.text('Zapamatování knihovny','Remember library'),dialog=>{
          const p=document.createElement('p');p.textContent=App.text('Uloží kopii vybraných zvukových souborů do tohoto prohlížeče. Příště se knihovna načte automaticky a připraví poslední skladbu na místě, kde jste skončili. Přehrávání spustíte sami.','Stores a copy of your selected audio files in this browser. Next time your library and listening position are restored, ready for you to press Play.');
          const note=document.createElement('p');note.textContent=App.text('Zabere místo podle velikosti hudby. Vymazání dat prohlížeče odstraní uloženou kopii; originály na disku zůstanou. Nejde o zálohu souborů.','Uses storage according to your music size. Clearing browser data removes the stored copy; originals on disk remain. This is not a file backup.');
          const action=document.createElement('button');action.type='button';action.className='library-button';action.textContent=this.enabled?App.text('Vypnout a odstranit uložené kopie','Turn off and remove stored copies'):App.text('Zapnout zapamatování','Turn on remembering');
          action.onclick=async()=>{
            action.disabled=true;
            try{
              if(this.enabled)await this.disable();
              else{await open();localStorage.setItem(LIBRARY_KEY,'true');this.enabled=true;await this.save();}
              dialog.close();this.updateStatus();
            }catch(error){this.error=true;action.disabled=false;this.updateStatus();App.notify(App.text('Prohlížeč nepovolil změnu úložiště.','The browser did not allow this storage change.'),{error:true});}
          };
          dialog.append(p,note,action);
        });
      }
    };
    const status=document.createElement('button');status.id='libraryPersistenceStatus';status.type='button';status.className='library-storage-status';status.onclick=()=>App.LibraryStorage.configure();
    App.el('bulkAnalyzeBar').append(status);App.LibraryStorage.updateStatus();
    new MutationObserver(()=>App.LibraryStorage.updateStatus()).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    if(App.LibraryStorage.enabled){
      // Serialize with normal imports so a fast file selection cannot race restoration.
      App.importQueue=App.importQueue.then(async()=>{
        App.LibraryStorage.restoring=true;App.LibraryStorage.busy=true;App.LibraryStorage.updateStatus();
        try{
          const db=await open();
          const records=await transaction(db,'readonly',(tracks,meta)=>{
            const all=tracks.getAll(),order=meta.get('order');return ()=>({tracks:all.result,order:order.result});
          });
          const byId=new Map(records.tracks.map(record=>{
            if(record.relativePath&&!record.file.webkitRelativePath)Object.defineProperty(record.file,'webkitRelativePath',{value:record.relativePath});
            return [record.id,record.file];
          }));storedIds=new Set(byId.keys());
          const files=(Array.isArray(records.order)?records.order:[...byId.keys()]).map(id=>byId.get(id)).filter(file=>file instanceof File);
          if(files.length)await App.importFilesBatch(files);
        }catch(error){console.warn('Library restore failed',error);App.LibraryStorage.error=true;App.notify(App.text('Uloženou knihovnu nelze načíst. Vyberte původní soubory znovu.','Could not restore your library. Select your original files again.'),{error:true});}
        finally{App.LibraryStorage.restoring=false;App.LibraryStorage.busy=false;App.LibraryStorage.updateStatus();}
      });
    }
  });
})(window.Aurora);
window.Aurora.addStyle(62,`
.library-storage-status{display:block;width:100%;margin:10px 0 0;padding:0;border:0;background:transparent;color:var(--text-dim,#a3a6b6);font:10px/1.5 var(--font-body,Arial);cursor:pointer;}.library-storage-status:hover{color:var(--text);}.library-storage-status.storage-error{color:#ffacb9;}
`);
