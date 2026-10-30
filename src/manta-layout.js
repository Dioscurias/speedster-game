import {trustedHostOrigin,isHostMessage} from './integration.js';
import './ui/tokens.css';
import './manta-layout.css';
import {icon,button,dialog,wireDialog} from './ui/components.js';
import {mountMantaHUD} from './hud/manta-hud.js';
import {minimapMetrics} from './minimap.js';
import {PLAYER_NAME_MAX,readPlayerName,savePlayerName} from './player-profile.js';
import {mountHeroPicker} from './hero-picker.js';
import {mountCourseOverview} from './course-overview.js';
import {speedsterColorForIndex} from './superhero.js';

export function mountGameLayout(parkour,autoplay){
 const hostOrigin=window.parent===window?location.origin:trustedHostOrigin(document.referrer,location.origin);
 document.body.classList.add('fps-game','manta-game');document.title='Speedster | '+(parkour?'The Last Household':'Austin');
 const originals=[...document.body.children],shell=document.createElement('div'),legacy=document.createElement('div');shell.className='manta-stage game-frame';legacy.className='manta-legacy';legacy.hidden=true;
 const move=selector=>{const node=document.querySelector(selector);if(node)shell.append(node);return node;};
 move(parkour?'#parkour-scene':'#scene');const menu=move(parkour?'#overlay':'#result');
 if(!parkour){move('#death');move('#impact');document.querySelector('main .game-frame')?.classList.remove('game-frame');}
 const touch=document.createElement('div');touch.className='manta-touch-controls';
 for(const selector of parkour?['#touch']:['.touch-controls','.view-buttons']){const node=document.querySelector(selector);if(node)touch.append(node);}
 for(const node of originals)if(node.parentElement===document.body&&node.id!=='info-dialog')legacy.append(node);
 document.body.append(legacy,shell);shell.append(touch);
 if(parkour){const abilities=document.getElementById('ability-hud');if(abilities)shell.append(abilities);}
 const hud=mountMantaHUD(shell,{parkour,drawRadar:parkour?drawCourseRadar:undefined});
 const $=id=>document.getElementById(id),root=hud.element,getState=()=>parkour?window.__parkour?.getState():window.__velocity?.getState();
 const pause=()=>{if(getState()?.status==='running')$('pause').click();};
 const resume=()=>{if(getState()?.status==='paused')$(parkour?'play':'resume').click();};
 const key=(name,down)=>window.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{key:name,bubbles:true}));
 const hold=(node,name)=>{
  node.addEventListener('pointerdown',event=>{if(getState()?.status!=='running')return;event.preventDefault();node.setPointerCapture(event.pointerId);key(name,true);});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])node.addEventListener(type,()=>key(name,false));
 };
 if(!parkour){
  const canvas=$('minimap');canvas.dataset.hudRadar='true';canvas.dataset.headingUp='true';const target=root.querySelector('[data-hud-radar]');target.replaceWith(canvas);
  root.querySelector('.hud-radar').onclick=()=>{pause();$('map-open').click();};
  const quality=$('quality'),qualityUI=$('hud-quality');qualityUI.onclick=()=>{quality.click();qualityUI.setAttribute('aria-checked',String(quality.textContent==='HQ'));};
  hold($('hud-phase'),'q');
  $('hud-phase').title='Hold to phase through buildings (Q)';
  for(const type of ['keydown','keyup'])$('hud-phase').addEventListener(type,event=>{if(![' ','Enter'].includes(event.key))return;event.preventDefault();event.stopPropagation();key('q',type==='keydown');});
 }else{
  root.querySelector('.hud-radar').onclick=()=>{pause();showCourseMap();};
  const arrows=document.createElement('div');arrows.className='touch-camera';
  for(const [k,label] of [['arrowleft','←'],['arrowup','↑'],['arrowdown','↓'],['arrowright','→']]){const node=document.createElement('button');node.textContent=label;node.setAttribute('aria-label','Look '+k.replace('arrow',''));hold(node,k);arrows.append(node);}touch.append(arrows);
 }
 $('hud-pause').onclick=()=>{$('pause').click();};
 $('hud-fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await shell.requestFullscreen();}catch{hud.event('Fullscreen is unavailable in this browser.');}};
 let guide=$('info-dialog');if(!guide){document.body.insertAdjacentHTML('beforeend',dialog('info-dialog','Guide','<h2 id="info-dialog-title">Guide</h2><div id="dialog-content"></div>'));guide=$('info-dialog');wireDialog(guide);}
 guide.className='mr-dialog';guide.setAttribute('aria-label','Guide');guide.setAttribute('data-lenis-prevent','');
 guide.addEventListener('close',()=>{guide.classList.remove('player-name-dialog');guide.setAttribute('aria-label','Guide');});
 if(!guide.querySelector('[data-close-dialog]')){const close=guide.querySelector('.close-dialog');close.className='mr-icon-btn mr-dialog-close';close.innerHTML=icon('close');}
 function showGuide(){pause();guide.setAttribute('aria-label','Guide');guide.classList.remove('player-name-dialog');$('dialog-content').innerHTML=controls(parkour);if(!guide.open)guide.showModal();}
 function showCourseMap(){guide.setAttribute('aria-label','Live course map');$('dialog-content').innerHTML='<h2>The Last Household · Live map</h2><p>Gold: you · colored dots: other players · blue: checkpoints</p><canvas id="course-overview" aria-label="Live parkour course map"></canvas>';if(!guide.open)guide.showModal();const dispose=mountCourseOverview($('course-overview'));guide.addEventListener('close',dispose,{once:true});}
 if(parkour)window.addEventListener('keydown',event=>{if(event.key.toLowerCase()==='m'&&!event.repeat&&!guide.open){pause();showCourseMap();}});
 $('hud-guide').onclick=showGuide;
 const menuCard=parkour?menu.querySelector('.card'):menu;menu.classList.add('manta-pause');menu.setAttribute('role','dialog');menu.setAttribute('aria-label','Pause menu');menu.setAttribute('aria-modal','true');
 const brandLine=document.createElement('div');brandLine.className='pause-brand';brandLine.innerHTML='<span class="speedster-wordmark">SPEEDSTER</span>';menuCard.prepend(brandLine);
 const resumeButton=$(parkour?'play':'resume'),restart=$('restart');resumeButton.classList.add('mr-btn');restart.classList.add('mr-menu-text');
 const restartGame=restart.onclick;restart.onclick=()=>{hud.reset();restartGame();};
 const menuActions=document.createElement('div');menuActions.className='manta-menu-actions';menuActions.innerHTML=button('Change map',{id:'hud-maps',ghost:true})+button('Leave game',{id:'hud-leave',ghost:true});menuCard.append(menuActions);
 $('hud-maps').onclick=()=>{pause();if(window.parent!==window&&hostOrigin)window.parent.postMessage({type:'speedster:maps'},hostOrigin);else window.dispatchEvent(new Event('speedster:maps'));};
 $('hud-leave').onclick=()=>{if(window.parent!==window&&hostOrigin)window.parent.postMessage({type:'manta:leave'},hostOrigin);else location.assign(location.pathname);};
 if(!parkour){
  const rename=document.createElement('button');rename.type='button';rename.id='hud-player-name';rename.className='mr-menu-text';rename.textContent='Player name';menuCard.insertBefore(rename,menuActions);
  rename.onclick=()=>{
   pause();guide.setAttribute('aria-label','Player name');guide.classList.add('player-name-dialog');
   $('dialog-content').innerHTML='<h2>Player name</h2><form class="player-name-form"><label for="edit-player-name">Player name</label><input id="edit-player-name" name="playerName" type="text" maxlength="'+PLAYER_NAME_MAX+'" autocomplete="nickname" spellcheck="false"><button type="submit" class="mr-btn">Save name</button></form>';
   const form=$('dialog-content').querySelector('form'),input=$('edit-player-name');input.value=readPlayerName();
   form.onsubmit=event=>{event.preventDefault();savePlayerName(input.value);guide.close();rename.focus();};
   guide.showModal();input.focus();input.select();
  };
  const credits=$('credits');credits.className='mr-menu-text';menuCard.append(credits);
 }
 const loader=document.createElement('div');loader.className='manta-loading';loader.setAttribute('role','status');loader.innerHTML=`<div class="loading-symbol"><svg class="loading-ring" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" pathLength="100"/></svg></div><span class="loading-wordmark">SPEEDSTER</span><p data-loading-label>Loading ${parkour?'The Last Household':'Austin'}…</p>${button('Play',{id:'manta-start'})}`;shell.append(loader);
 const savedName=readPlayerName();
 {
  const form=document.createElement('form');form.className='player-name-form';
  form.innerHTML='<label for="join-player-name">Player name</label><input id="join-player-name" name="playerName" type="text" maxlength="'+PLAYER_NAME_MAX+'" placeholder="Speedster" autocomplete="nickname" spellcheck="false">';
  loader.append(form);form.append($('manta-start'));$('manta-start').type='submit';$('join-player-name').value=savedName;
  form.onsubmit=event=>{event.preventDefault();if($(parkour?'play':'start').disabled)return;savePlayerName($('join-player-name').value);$(parkour?'play':'start').click();};
 }
 const heroPicker=mountHeroPicker({loader,menu:menuCard,shell,getState,parkour});
 const startButton=$(parkour?'play':'start');let previousStatus='ready',animation,autoStarted=false,cancelled=false;
 function frame(time){
  const raw=getState(),status=raw?.status||'ready';
  loader.hidden=status!=='ready';$('manta-start').disabled=!!startButton.disabled;
  const sourceLabel=parkour?startButton.textContent:$('start-label').textContent;
  loader.querySelector('[data-loading-label]').textContent=startButton.disabled?sourceLabel:'Ready when you are.';
  if(autoplay&&(parkour||savedName)&&!autoStarted&&!startButton.disabled){autoStarted=true;startButton.click();}
  if(raw){
   heroPicker.update();const network=parkour?window.__parkour?.getNetwork():window.__velocity?.getNetwork();
   hud.update({...raw,bolts:raw.collected,speed:raw.speed*3.6,topSpeed:raw.topSpeed*3.6,health:parkour?network?.health??100:parseFloat($('health-value').textContent),heading:raw.heading,braking:parkour?'—':parseFloat($('braking').textContent)||0,street:$(parkour?'zone':'street-name')?.textContent,players:network?.online||1,connection:network?.status||'Connecting'},time);
   if(status!==previousStatus){if(status==='paused'){document.activeElement?.blur();resumeButton.focus({preventScroll:true});}if(status==='running')shell.focus({preventScroll:true});previousStatus=status;}
  }
  if(!cancelled)animation=requestAnimationFrame(frame);
 }
 shell.tabIndex=-1;animation=requestAnimationFrame(frame);
 const onEvent=event=>hud.event(event.detail.text),onMessage=event=>{if(isHostMessage(event,window.parent,hostOrigin)&&event.data?.type==='manta:resume')resume();};
 window.addEventListener('speedster:event',onEvent);window.addEventListener('message',onMessage);
 // Native dialog Escape must close the dialog before the engine sees it.
 const onKey=event=>{
  if(guide.open&&event.key==='Escape'){event.stopImmediatePropagation();return;}
  if(event.target instanceof Element&&event.target.closest('input,select,textarea,[contenteditable="true"]')){event.stopImmediatePropagation();return;}
  if(event.type==='keyup')return;
  if(event.key!=='Tab'||getState()?.status!=='paused'||guide.open)return;
  const targets=[...menu.querySelectorAll('button,input,a[href]')].filter(node=>!node.disabled&&node.getClientRects().length),first=targets[0],last=targets.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
 };
 window.addEventListener('keydown',onKey,true);
 window.addEventListener('keyup',onKey,true);
 window.addEventListener('pagehide',()=>{cancelled=true;cancelAnimationFrame(animation);hud.destroy();window.removeEventListener('keydown',onKey,true);window.removeEventListener('keyup',onKey,true);window.removeEventListener('message',onMessage);window.removeEventListener('speedster:event',onEvent);},{once:true});
}

function controls(parkour){
 return '<p class="mr-caption">Speedster / '+(parkour?'Parkour':'Austin')+'</p><h2>Keep moving.</h2><dl class="mr-controls"><dt>Move / look</dt><dd>W A S D / Arrow keys</dd><dt>Jump</dt><dd>Space. Hold for height.</dd><dt>Atlas flight</dt><dd>R toggle · Space up · C down · Shift boost · B air brake</dd><dt>Superstrength</dt><dd>V punch nearby walls · X dive / slam</dd><dt>Map</dt><dd>M or tap radar. Live player markers.</dd>'+(parkour?'<dt>Atlas blink / blast</dt><dd>E blink · Hold F or right mouse, release to blast.</dd>':'<dt>Speedster</dt><dd>Shift boost · Q phase · E slow time</dd>')+'<dt>Pause / character</dt><dd>Escape. Switch character in the pause menu.</dd></dl><p class="dialog-note">Up to 20 players per map. Craters are shared surface damage; structures remain standing.</p>';
}
function drawCourseRadar(canvas,state){
 const metrics=minimapMetrics(canvas.clientWidth||150,devicePixelRatio),size=metrics.cssSize,center=size/2,scale=size/160;
 if(canvas.width!==metrics.backingSize)canvas.width=canvas.height=metrics.backingSize;
 const ctx=canvas.getContext('2d');ctx.setTransform(metrics.backingSize/size,0,0,metrics.backingSize/size,0,0);ctx.clearRect(0,0,size,size);ctx.save();ctx.beginPath();ctx.arc(center,center,center,0,Math.PI*2);ctx.clip();
 ctx.translate(center,center);ctx.rotate(-state.heading);ctx.scale(scale,scale);ctx.translate(-state.x,-state.z);
 const platforms=window.__parkour?.getPlatforms()||[];ctx.strokeStyle='#ffffff60';ctx.lineWidth=1/scale;ctx.beginPath();platforms.forEach((p,i)=>i?ctx.lineTo(p.x||0,p.z):ctx.moveTo(p.x||0,p.z));ctx.stroke();
 for(const p of platforms){if(p.active===false)continue;ctx.save();ctx.translate(p.x||0,p.z);ctx.rotate(p.angle||0);ctx.fillStyle='#ffffff80';ctx.fillRect(-p.width/2,-p.depth/2,p.width,p.depth);ctx.restore();}
 const peers=window.__parkour?.getPeers()||[];canvas.dataset.playerCount=String(peers.length+1);for(const p of peers){if(p.health<=0)continue;ctx.fillStyle=speedsterColorForIndex(p.colorIndex);ctx.beginPath();ctx.arc(p.x,p.z,4/scale,0,Math.PI*2);ctx.fill();}ctx.restore();
}
