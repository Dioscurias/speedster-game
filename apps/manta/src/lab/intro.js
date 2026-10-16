const SEEN_KEY='manta-ray:intro-film:v3';

export function IntroDialog(){return `<dialog id="site-intro" class="site-intro" aria-label="Manta Ray opening film"><video muted autoplay playsinline preload="none" data-intro-video data-desktop="/brand/manta-intro.mp4" data-mobile="/brand/manta-intro-mobile.mp4" aria-hidden="true"></video><span class="intro-wordmark mr-wordmark" aria-hidden="true">MANTA RAY</span><button type="button" class="intro-play mr-btn mr-btn--ghost" data-intro-play hidden>Play intro</button><button type="button" class="intro-skip" data-intro-skip autofocus>Skip intro</button></dialog>`;}

export function mountIntro(motion){
 const dialog=document.getElementById('site-intro');if(!dialog)return ()=>{};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),url=new URL(location.href),replay=url.searchParams.get('intro')==='1';let seen=false;
 try{seen=sessionStorage.getItem(SEEN_KEY)==='1';}catch{}
 if(!replay&&(location.hash||seen||reduced.matches||navigator.connection?.saveData)){dialog.remove();return ()=>{};}
 if(replay){url.searchParams.delete('intro');history.replaceState(history.state,'',url);}
 const video=dialog.querySelector('[data-intro-video]'),play=dialog.querySelector('[data-intro-play]'),skip=dialog.querySelector('[data-intro-skip]'),previous=document.activeElement,events=new AbortController();
 let disposed=false,closing=false,exitTimer,limitTimer,stallTimer;
 const remember=()=>{try{sessionStorage.setItem(SEEN_KEY,'1');}catch{}};
 const listen=(node,type,handler)=>node.addEventListener(type,handler,{signal:events.signal});
 function dispose(restore=true){
  if(disposed)return;disposed=true;clearTimeout(exitTimer);clearTimeout(limitTimer);clearTimeout(stallTimer);events.abort();video.pause();video.removeAttribute('src');video.load();if(dialog.open)dialog.close();dialog.remove();document.documentElement.classList.remove('intro-active');document.body.classList.remove('intro-active');
  if(restore){motion.start();const target=previous?.isConnected&&previous!==document.body?previous:document.getElementById('main-content');if(target){if(target.id==='main-content')target.tabIndex=-1;target.focus({preventScroll:true});}}
 }
 function finish(immediate=false){
  if(disposed||closing)return;closing=true;remember();clearTimeout(limitTimer);clearTimeout(stallTimer);video.pause();
  if(immediate||reduced.matches){dispose();return;}dialog.classList.add('is-closing');exitTimer=setTimeout(()=>dispose(),400);
 }
 function watchStall(){clearTimeout(stallTimer);stallTimer=setTimeout(()=>finish(true),6000);}
 function start(){
  if(disposed||closing)return;play.hidden=true;video.muted=true;video.defaultMuted=true;video.playsInline=true;
  if(!video.hasAttribute('src'))video.src=matchMedia('(max-width: 600px), (pointer: coarse)').matches?video.dataset.mobile:video.dataset.desktop;
  watchStall();
  Promise.resolve(video.play()).catch(error=>{if(disposed||closing)return;clearTimeout(stallTimer);if(error.name==='NotAllowedError'){play.hidden=false;}else finish(true);});
 }
 listen(play,'click',start);listen(skip,'click',()=>finish());listen(dialog,'cancel',event=>{event.preventDefault();finish();});listen(dialog,'close',()=>dispose());
 listen(video,'ended',()=>finish());listen(video,'error',()=>finish(true));listen(video,'waiting',watchStall);
 listen(video,'playing',()=>{clearTimeout(stallTimer);play.hidden=true;remember();});
 listen(video,'pause',()=>{if(!disposed&&!closing&&!video.ended&&!document.hidden)play.hidden=false;});
 listen(reduced,'change',()=>{if(reduced.matches)finish(true);});
 video.poster='/brand/manta-intro-poster.jpg';video.muted=true;video.defaultMuted=true;
 motion.stop();document.documentElement.classList.add('intro-active');document.body.classList.add('intro-active');
 try{dialog.showModal();}catch{dispose();return ()=>{};}
 // Let the supplied ten-second film finish. Skip and Escape remain available.
 limitTimer=setTimeout(()=>finish(true),30000);
 if(replay&&(reduced.matches||navigator.connection?.saveData))play.hidden=false;else start();
 return ()=>dispose(false);
}
