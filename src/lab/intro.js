import {manta} from '../ui/components.js';
const SEEN_KEY='manta-ray:intro-seen:v2';
export function IntroDialog(){return `<dialog id="site-intro" class="site-intro" aria-label="Manta Ray intro"><div class="intro-mark">${manta()}</div><button type="button" class="intro-skip" data-intro-skip autofocus>Skip intro</button></dialog>`;}
export function mountIntro(motion){
 const dialog=document.getElementById('site-intro');if(!dialog)return ()=>{};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let seen=false;try{seen=sessionStorage.getItem(SEEN_KEY)==='1';}catch{}
 if(location.hash||seen||reduced.matches||navigator.connection?.saveData){dialog.remove();return ()=>{};}
 const previous=document.activeElement,events=new AbortController();let disposed=false,closing=false,exitTimer,limitTimer;
 function dispose(restore=true){if(disposed)return;disposed=true;clearTimeout(exitTimer);clearTimeout(limitTimer);events.abort();if(dialog.open)dialog.close();dialog.remove();document.documentElement.classList.remove('intro-active');document.body.classList.remove('intro-active');if(restore){motion.start();const target=previous?.isConnected&&previous!==document.body?previous:document.getElementById('main-content');if(target){if(target.id==='main-content')target.tabIndex=-1;target.focus({preventScroll:true});}}}
 function finish(immediate=false){if(disposed||closing)return;closing=true;clearTimeout(limitTimer);if(immediate||reduced.matches){dispose();return;}dialog.classList.add('is-closing');exitTimer=setTimeout(()=>dispose(),400);}
 dialog.querySelector('[data-intro-skip]').addEventListener('click',()=>finish(),{signal:events.signal});
 dialog.addEventListener('cancel',event=>{event.preventDefault();finish();},{signal:events.signal});
 dialog.addEventListener('close',()=>dispose(),{signal:events.signal});
 reduced.addEventListener('change',()=>{if(reduced.matches)dispose();},{signal:events.signal});
 motion.stop();document.documentElement.classList.add('intro-active');document.body.classList.add('intro-active');
 try{dialog.showModal();sessionStorage.setItem(SEEN_KEY,'1');}catch{dispose();return ()=>{};}
 // 1.8 seconds plus a 400 ms exit, always below 2.5 seconds.
 limitTimer=setTimeout(()=>finish(),1800);return ()=>dispose(false);
}
