import './parkour-hud.css';
import {ABILITY} from './parkour-abilities.js';
export function createAbilityHUD(){
 const panel=document.createElement('section');panel.id='ability-hud';panel.setAttribute('aria-label','Speed and abilities');panel.innerHTML=`<div class="ability-block"><span class="ability-label">Speed <output id="live-speed">0.0 m/s</output></span><div class="ability-track"><i id="speed-fill"></i></div></div><div class="ability-block"><span class="ability-label">Blink <span>E</span></span><div id="teleport-pips">${Array.from({length:ABILITY.teleportCharges},(_,i)=>`<span class="teleport-pip"><i></i><small>${i+1}</small></span>`).join('')}</div><span id="teleport-status">3 ready</span></div><div class="ability-block"><span class="ability-label">Hand blast <span>Hold F / RMB</span></span><div class="ability-track"><i id="blast-fill"></i></div><span id="blast-status">Ready to aim</span></div><p id="ability-message" role="status"></p>`;document.body.append(panel);
 const reticle=document.createElement('div');reticle.id='aim-reticle';reticle.hidden=true;reticle.setAttribute('aria-hidden','true');document.getElementById('parkour-scene').append(reticle);
 const lines=document.createElement('div');lines.id='speed-lines';lines.setAttribute('aria-hidden','true');document.getElementById('parkour-scene').append(lines);
 let messageUntil=0;
 return {message(text,time){document.getElementById('ability-message').textContent=text;messageUntil=time+2;},update(w,abilities,time,reduced){
  const speed=Math.min(1,w.speed/10),color=speed>.85?'#88edff':speed>.5?'#e8c47f':'#c9aa88';document.getElementById('live-speed').textContent=`${w.speed.toFixed(1)} m/s`;const fill=document.getElementById('speed-fill');fill.style.width=`${speed*100}%`;fill.style.background=color;
  lines.style.opacity=reduced?'0':String(Math.max(0,(speed-.75)*1.2));
  const charges=abilities.teleports(time);document.querySelectorAll('.teleport-pip').forEach((pip,i)=>{pip.querySelector('i').style.transform=`scaleX(${charges.pips[i]})`;pip.classList.toggle('ready',charges.pips[i]===1);pip.setAttribute('aria-label',charges.pips[i]===1?'Teleport ready':`Refills in ${Math.ceil((1-charges.pips[i])*ABILITY.teleportWindow)} seconds`);});document.getElementById('teleport-status').textContent=`${charges.available} / ${ABILITY.teleportCharges} ready`;
  const state=abilities.status(time);document.getElementById('blast-fill').style.width=`${100*(state.aiming?state.charge:state.cooldown?1-state.cooldown/ABILITY.cooldown:1)}%`;document.getElementById('blast-status').textContent=state.aiming?(state.ready?'Fully charged · release to fire':`Charging ${Math.round(state.charge*100)}%`):state.cooldown?`Cooldown ${state.cooldown.toFixed(1)}s`:'Ready · hold to aim';reticle.hidden=!state.aiming;reticle.classList.toggle('ready',state.ready);
  if(time>messageUntil)document.getElementById('ability-message').textContent='';
 }};
}
