import './fonts.css';
import './game-layout.css';
import './hud/hud-overlay.css';
import markup from './hud/hud-overlay.html?raw';
import {createSpeedsterHUD} from './hud/hud-overlay.js';
import {minimapMetrics,drawPlayerMarker} from './minimap.js';

export function mountGameLayout(parkour,autoplay){
 document.body.classList.add('fps-game');
 const originals=[...document.body.children],shell=document.createElement('div'),legacy=document.createElement('div');
 shell.className='fps-stage game-frame';legacy.className='fps-legacy';legacy.hidden=true;
 const move=selector=>{const node=document.querySelector(selector);if(node)shell.append(node);return node;};
 move(parkour?'#parkour-scene':'#scene');move(parkour?'#overlay':'#result');
 if(!parkour){move('.intro-card');move('#death');move('#impact');document.querySelector('main .game-frame')?.classList.remove('game-frame');}
 for(const node of originals)if(node.parentElement===document.body&&node.id!=='info-dialog')legacy.append(node);
 document.body.append(legacy,shell);shell.insertAdjacentHTML('beforeend',markup);
 const root=shell.querySelector('.speedster-hud'),radar=root.querySelector('.hud-radar');
 if(!parkour){
  const canvas=document.getElementById('minimap');root.querySelector('[data-hud-radar]').replaceWith(canvas);
  canvas.dataset.hudRadar='true';canvas.dataset.headingUp='true';radar.onclick=canvas.onclick;canvas.onclick=null;
 }else radar.setAttribute('aria-label','Parkour course radar');
 const hud=createSpeedsterHUD(root,{drawRadar:parkour?drawCourseRadar:undefined});
 const restart=document.getElementById('restart'),restartGame=restart.onclick;restart.onclick=()=>{hud.reset();restartGame();};
 const menu=document.getElementById(parkour?'overlay':'result'),menuCard=parkour?menu.querySelector('.card'):menu;
 menu.setAttribute('role','dialog');menu.setAttribute('aria-label','Pause menu');menu.setAttribute('aria-modal','true');
 const actions=document.createElement('div');actions.className='fps-menu-actions';
 if(!parkour){
  const quality=document.getElementById('quality'),toggle=quality.onclick;
  quality.textContent='High';quality.setAttribute('aria-label','Change graphics quality');
  quality.onclick=()=>{toggle();quality.textContent=quality.textContent==='HQ'?'High':'Low';};actions.append(quality);
  const guide=document.getElementById('how-to');guide.textContent='Controls';
  guide.onclick=()=>{document.getElementById('dialog-content').innerHTML=controls(false);document.getElementById('info-dialog').showModal();};actions.append(guide);
  const credits=document.getElementById('credits');actions.append(credits);
 }
 const fullscreen=document.createElement('button');fullscreen.id='hud-fullscreen';fullscreen.textContent='Full screen';
 fullscreen.onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await shell.requestFullscreen();}catch{hud.event('Full screen unavailable');}};
 const maps=document.createElement('button');maps.id='hud-maps';maps.textContent='Change map';
 maps.onclick=()=>{if(window.parent!==window)window.parent.postMessage({type:'speedster:maps'},location.origin);else location.href='/play';};
 actions.append(fullscreen,maps);menuCard.append(actions);
 if(parkour){const help=document.createElement('details');help.className='fps-menu-controls';help.innerHTML='<summary>Controls</summary>'+controls(true);menuCard.append(help);root.querySelector('[data-hud-hint]').textContent='WASD move · Space jump · Arrow keys look';}
 else{const connection=document.createElement('p');connection.className='fps-connection';const count=document.getElementById('online-count'),network=document.getElementById('network-state');connection.append('Players ',count,' · ',network);menuCard.append(connection);}
 let previousStatus='ready';
 window.addEventListener('speedster:hud',event=>{
  hud.update(event.detail);
  if(event.detail.status==='paused'&&previousStatus!=='paused')document.getElementById(parkour?'play':'resume')?.focus({preventScroll:true});
  previousStatus=event.detail.status;
 });
 window.addEventListener('speedster:event',event=>hud.event(event.detail.text));
 window.addEventListener('speedster:reset',()=>hud.reset());
 window.addEventListener('pagehide',()=>hud.destroy(),{once:true});
 window.addEventListener('keydown',event=>{
  if(event.key!=='Tab'||previousStatus!=='paused'||document.querySelector('dialog[open]'))return;
  const targets=[...menu.querySelectorAll('button,input,summary,a[href]')].filter(node=>!node.disabled&&node.getClientRects().length);
  const first=targets[0],last=targets.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
 });
 if(autoplay){const button=document.getElementById(parkour?'play':'start');const timer=setInterval(()=>{if(button&&!button.disabled){clearInterval(timer);button.click();}},50);setTimeout(()=>clearInterval(timer),90000);}
}

function controls(parkour){
 return '<h2>Controls</h2><dl class="fps-controls-list"><dt>Move</dt><dd>WASD</dd><dt>Jump</dt><dd>Space · hold for height</dd><dt>Look</dt><dd>Arrow keys</dd>'+(parkour?'<dt>Blink</dt><dd>E</dd><dt>Hand blast</dt><dd>Hold F, release to fire</dd>':'<dt>Boost</dt><dd>Hold Shift</dd><dt>Phase</dt><dd>Hold Q</dd><dt>Slow time</dt><dd>Hold E</dd>')+'<dt>Pause</dt><dd>Escape</dd></dl>';
}

function drawCourseRadar(canvas,state){
 const metrics=minimapMetrics(canvas.clientWidth||100,devicePixelRatio),size=metrics.cssSize,center=size/2,scale=size/160;
 if(canvas.width!==metrics.backingSize)canvas.width=canvas.height=metrics.backingSize;
 const ctx=canvas.getContext('2d');ctx.setTransform(metrics.backingSize/size,0,0,metrics.backingSize/size,0,0);ctx.clearRect(0,0,size,size);
 ctx.save();ctx.beginPath();ctx.arc(center,center,center,0,Math.PI*2);ctx.clip();
 ctx.save();ctx.translate(center,center);ctx.rotate(-state.heading);ctx.scale(scale,scale);ctx.translate(-state.x,-state.z);
 const platforms=window.__parkour?.getPlatforms()||[];ctx.strokeStyle='#ffffff50';ctx.lineWidth=1/scale;ctx.beginPath();
 platforms.forEach((p,i)=>i?ctx.lineTo(p.x||0,p.z):ctx.moveTo(p.x||0,p.z));ctx.stroke();
 for(const p of platforms){if(p.active===false)continue;ctx.save();ctx.translate(p.x||0,p.z);ctx.rotate(p.angle||0);ctx.fillStyle='#d4b06099';ctx.fillRect(-p.width/2,-p.depth/2,p.width,p.depth);ctx.restore();}
 ctx.restore();drawPlayerMarker(ctx,center,center,0,metrics.playerSize);ctx.restore();
}
