import './ui/tokens.css';
import './manta-layout.css';
import {brandSprite,manta} from './ui/components.js';
const cover=document.createElement('div');cover.className='manta-loading';cover.setAttribute('role','status');cover.innerHTML=brandSprite()+'<div class="loading-symbol"><svg class="loading-ring" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" pathLength="100"/></svg>'+manta('loading-manta')+'</div><span class="loading-wordmark">MANTA RAY</span><p>Loading…</p>';
document.body.append(cover);
// Parkour replaces body while loading assets. Keep this UI cover until it is ready.
const loadingObserver=new MutationObserver(()=>{if(!cover.isConnected)document.body.append(cover);});loadingObserver.observe(document.body,{childList:true});
const params=new URLSearchParams(location.search);
if(params.get('embed')==='1'){
 if(params.get('map')==='parkour')await import('./parkour.js');
 else await import('./main.js');
 const {mountGameLayout}=await import('./manta-layout.js');
 loadingObserver.disconnect();cover.remove();mountGameLayout(params.get('map')==='parkour',params.get('autoplay')==='1');
}else{await import('./site-page.js');loadingObserver.disconnect();cover.remove();}
