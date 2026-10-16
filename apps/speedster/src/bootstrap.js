import '../../../packages/ui/tokens.css';
import '../../../packages/ui/loading.css';
import './manta-layout.css';
import gameShell from './game-shell.html?raw';
const params=new URLSearchParams(location.search);document.body.className='';document.body.innerHTML=gameShell;
const cover=document.createElement('div');cover.className='manta-loading';cover.setAttribute('role','status');cover.innerHTML='<span class="loading-wordmark">SPEEDSTER</span><p>Loading</p>';document.body.append(cover);
const observer=new MutationObserver(()=>{if(!cover.isConnected)document.body.append(cover);});observer.observe(document.body,{childList:true});
try{
 if(params.get('map')==='parkour')await import('./parkour.js');else await import('./main.js');observer.disconnect();cover.remove();
 if(params.get('preview')==='1'){const {mountGamePreview}=await import('./preview.js');mountGamePreview();}
 else{const {mountGameLayout}=await import('./manta-layout.js');mountGameLayout(params.get('map')==='parkour',params.get('autoplay')==='1');if(window.parent===window){const {mountStandaloneMenu}=await import('./standalone-menu.js');mountStandaloneMenu();}}
}catch(error){observer.disconnect();cover.querySelector('p').textContent='Could not load. Reload to try again.';console.error(error);}
