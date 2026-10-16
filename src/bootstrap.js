import './ui/tokens.css';
import './manta-layout.css';
import './lab/lab.css';
import {brandSprite,manta} from './ui/components.js';
import gameShell from './game/game-shell.html?raw';
import {GAME_PATH} from './lab/project-model.js';

const params=new URLSearchParams(location.search);
const embedded=location.pathname.replace(/\/$/,'')===GAME_PATH&&params.get('embed')==='1';
if(embedded){document.body.className='';document.body.innerHTML=gameShell;}
const cover=document.createElement('div');cover.className='manta-loading';cover.setAttribute('role','status');
cover.innerHTML=(embedded?'':brandSprite())+'<div class="loading-symbol"><svg class="loading-ring" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" pathLength="100"/></svg>'+(embedded?'':manta('loading-manta'))+'</div><span class="loading-wordmark">'+(embedded?'SPEEDSTER':'MANTA RAY')+'</span><p>Loading…</p>';
document.body.append(cover);
const observer=new MutationObserver(()=>{if(!cover.isConnected)document.body.append(cover);});observer.observe(document.body,{childList:true});
try{
 if(embedded){
  if(params.get('map')==='parkour')await import('./parkour.js');else await import('./main.js');
  observer.disconnect();cover.remove();
  if(params.get('preview')==='1'){const {mountGamePreview}=await import('./game/preview.js');mountGamePreview();}
  else{const {mountGameLayout}=await import('./manta-layout.js');mountGameLayout(params.get('map')==='parkour',params.get('autoplay')==='1');}
 }else{await import('./lab/app.js');observer.disconnect();cover.remove();}
}catch(error){observer.disconnect();cover.querySelector('p').textContent='Could not load. Reload to try again.';console.error(error);}
