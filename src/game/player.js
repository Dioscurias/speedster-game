import {maps} from './maps.js';
import {GAME_PATH} from '../lab/project-model.js';
import {wireDialog} from '../ui/components.js';

export function mountPlayer(motion){
 const $=id=>document.getElementById(id),dialog=$('maps-dialog');wireDialog(dialog);
 let selected=maps.find(map=>map.id===new URLSearchParams(location.search).get('map'))||maps[0],returnToGame=false,launching=false;
 function select(id){selected=maps.find(map=>map.id===id)||maps[0];document.querySelector(`[name=map][value="${selected.id}"]`).checked=true;$('selection-status').textContent=`${selected.name} selected`;}
 select(selected.id);
 function launch(){
  launching=true;if(dialog.open)dialog.close();returnToGame=false;motion.stop();$('player').hidden=false;document.body.classList.add('playing-game');
  const frame=document.createElement('iframe');frame.id='game-window';frame.title=`Speedster / ${selected.name}`;frame.allow='fullscreen';frame.allowFullscreen=true;frame.src=`${GAME_PATH}?embed=1&map=${selected.id}&autoplay=1`;
  $('frame-slot').replaceChildren(frame);history.replaceState(null,'',`${GAME_PATH}?map=${selected.id}`);frame.onload=()=>frame.focus();launching=false;
 }
 async function openMaps(){if(document.fullscreenElement)await document.exitFullscreen();returnToGame=true;motion.stop();dialog.showModal();}
 document.querySelectorAll('[name=map]').forEach(input=>input.onchange=()=>select(input.value));$('launch-game').onclick=launch;$('start-speedster').onclick=launch;
 dialog.addEventListener('close',()=>{if(returnToGame&&!launching){const frame=$('game-window');frame?.contentWindow.postMessage({type:'manta:resume'},location.origin);frame?.focus();}returnToGame=false;});
 const onMessage=async event=>{
  if(event.origin!==location.origin||event.source!==$('game-window')?.contentWindow)return;
  if(event.data?.type==='speedster:maps')await openMaps();
  if(event.data?.type==='manta:leave'){if(document.fullscreenElement)await document.exitFullscreen();location.assign('/projects/speedster');}
 };
 window.addEventListener('message',onMessage);launch();return ()=>window.removeEventListener('message',onMessage);
}
