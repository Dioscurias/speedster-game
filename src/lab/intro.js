import {button} from '../ui/components.js';

const SEEN_KEY='manta-ray:intro-seen:v1';

export function IntroDialog(){
 return `<dialog id="site-intro" class="site-intro" aria-labelledby="site-intro-title" aria-describedby="site-intro-description"><video muted autoplay playsinline preload="none" data-intro-video data-desktop="/brand/manta-intro.mp4" data-mobile="/brand/manta-intro-mobile.mp4" data-poster="/brand/manta-intro-poster.jpg" aria-hidden="true"></video><header class="intro-header"><span id="site-intro-title" class="mr-wordmark">MANTA RAY</span></header><p id="site-intro-description" class="sr-only">A manta ray rises from the ocean and becomes a graphic mark.</p><div class="intro-actions"><button type="button" class="intro-sound" data-intro-sound aria-pressed="false" aria-label="Turn sound on">Sound off</button>${button('Skip intro',{id:'intro-skip',ghost:true,attrs:'data-intro-skip autofocus'})}</div></dialog>`;
}

export function mountIntro(motion){
 const dialog=document.getElementById('site-intro');if(!dialog)return ()=>{};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let seen=false;
 try{seen=sessionStorage.getItem(SEEN_KEY)==='1';}catch{}
 if(location.hash||seen||reduced.matches||navigator.connection?.saveData){dialog.remove();return ()=>{};}

 const video=dialog.querySelector('video'),sound=dialog.querySelector('[data-intro-sound]'),skip=dialog.querySelector('[data-intro-skip]'),previousFocus=document.activeElement,events=new AbortController();
 let closing=false,disposed=false,stallTimer,limitTimer,exitTimer;
 const listen=(node,type,handler)=>node.addEventListener(type,handler,{signal:events.signal});
 function dispose(restoreFocus=true){
  if(disposed)return;disposed=true;clearTimeout(stallTimer);clearTimeout(limitTimer);clearTimeout(exitTimer);events.abort();
  video.pause();video.removeAttribute('src');video.load();if(dialog.open)dialog.close();dialog.remove();
  document.documentElement.classList.remove('intro-active');document.body.classList.remove('intro-active');
  if(restoreFocus){motion.start();const target=previousFocus?.isConnected&&previousFocus!==document.body?previousFocus:document.getElementById('main-content');if(target){if(target.id==='main-content')target.tabIndex=-1;target.focus({preventScroll:true});}}
 }
 function finish(immediate=false){
  if(disposed)return;if(closing){if(immediate)dispose();return;}
  closing=true;clearTimeout(stallTimer);clearTimeout(limitTimer);video.pause();sound.disabled=true;skip.disabled=true;
  if(immediate||reduced.matches){dispose();return;}
  dialog.classList.add('is-closing');exitTimer=setTimeout(()=>dispose(),350);
 }
 const watchStall=()=>{clearTimeout(stallTimer);stallTimer=setTimeout(()=>finish(true),6000);};
 listen(skip,'click',()=>finish());
 listen(sound,'click',()=>{video.muted=!video.muted;sound.textContent=video.muted?'Sound off':'Sound on';sound.setAttribute('aria-pressed',String(!video.muted));sound.setAttribute('aria-label',video.muted?'Turn sound on':'Turn sound off');});
 listen(dialog,'cancel',event=>{event.preventDefault();finish();});
 listen(dialog,'close',()=>finish(true));
 listen(video,'ended',()=>finish());listen(video,'error',()=>finish(true));
 listen(video,'waiting',watchStall);listen(video,'stalled',watchStall);listen(video,'playing',()=>clearTimeout(stallTimer));
 listen(reduced,'change',()=>{if(reduced.matches)finish(true);});
 video.muted=true;video.defaultMuted=true;video.poster=video.dataset.poster;
 video.src=matchMedia('(max-width: 600px), (pointer: coarse)').matches?video.dataset.mobile:video.dataset.desktop;
 motion.stop();document.documentElement.classList.add('intro-active');document.body.classList.add('intro-active');
 try{dialog.showModal();sessionStorage.setItem(SEEN_KEY,'1');}catch{if(!dialog.open){dispose();return ()=>{};}}
 watchStall();limitTimer=setTimeout(()=>finish(true),20000);
 try{Promise.resolve(video.play()).catch(()=>finish(true));}catch{finish(true);}
 return ()=>dispose(false);
}
