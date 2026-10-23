// Repeatable library CPU benchmark, without audio/GPU performance claims.
const {chromium}=require(process.env.AURORA_PLAYWRIGHT||'playwright');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.AURORA_CHROME,headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    await page.goto(pathToFileURL(path.resolve('index.html')).href);
    const results=await page.evaluate(async()=>{
      const a=Aurora; a.settings.playlistSort='title';a.settings.playlistSortDirection='asc';
      const out=[];
      for(const size of [1000,20000]){
        a.state.tracks=Array.from({length:size},(_,i)=>({file:new File([],`Artist ${i%100} - Song ${size-i}.mp3`),name:`Song ${size-i}`,artist:`Artist ${i%100}`,duration:180,url:null}));
        a.libraryVersion++;await a.renderTrackList('');
        let requests=0,sorts=0;
        const request=a.Threads.libraryRequest.bind(a.Threads),sort=a.sortPlaylistEntries;
        a.Threads.libraryRequest=(...args)=>{requests++;return request(...args);};
        a.sortPlaylistEntries=(...args)=>{sorts++;return sort(...args);};
        const samples=[];
        for(let i=0;i<50;i++){
          a.state.currentIndex=i;a.state.isPlaying=!!(i%2);
          const t=performance.now();await a.renderTrackList('');samples.push(performance.now()-t);
        }
        a.Threads.libraryRequest=request;a.sortPlaylistEntries=sort;
        samples.sort((x,y)=>x-y);
        out.push({tracks:size,refreshes:50,medianMs:+samples[25].toFixed(3),p95Ms:+samples[47].toFixed(3),searchRequests:requests,fullSorts:sorts,domRows:document.querySelectorAll('.track-row').length});
      }
      return out;
    });
    console.log(JSON.stringify(results,null,2));
    if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify({environment:'Chrome headless, 1440x1000, synthetic library, no audio playback',results},null,2));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
