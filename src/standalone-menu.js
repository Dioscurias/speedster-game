import {MapsDialog} from './game-bridge/map-dialog.js';
import './game-bridge/map-dialog.css';
import {wireDialog} from './ui/components.js';
export function mountStandaloneMenu(){
 document.body.insertAdjacentHTML('beforeend',MapsDialog());const dialog=document.getElementById('maps-dialog');wireDialog(dialog);let changing=false;
 const selected=new URLSearchParams(location.search).get('map')==='parkour'?'parkour':'austin';dialog.querySelector(`[name=map][value="${selected}"]`).checked=true;
 const update=()=>{document.getElementById('selection-status').textContent=(dialog.querySelector('[name=map]:checked').value==='parkour'?'The Last Household':'Austin')+' selected';};update();dialog.querySelectorAll('[name=map]').forEach(input=>input.addEventListener('change',update));
 document.getElementById('launch-game').onclick=()=>{changing=true;const url=new URL(location.href);url.search='';url.searchParams.set('map',dialog.querySelector('[name=map]:checked').value);url.searchParams.set('autoplay','1');location.replace(url);};
 dialog.addEventListener('close',()=>{if(!changing)window.postMessage({type:'manta:resume'},location.origin);});
 const open=async()=>{if(document.fullscreenElement)await document.exitFullscreen();dialog.showModal();};window.addEventListener('speedster:maps',open);window.addEventListener('pagehide',()=>window.removeEventListener('speedster:maps',open),{once:true});
}
