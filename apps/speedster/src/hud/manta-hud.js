import {headingMarker,icon,keycap,minimap,segmented,speedRing} from '../../../../packages/ui/components.js';
import {controlHints,hudView} from './hud-model.js';
import {HudFeed} from './hud-overlay.js';
import './manta-hud.css';

export function mountMantaHUD(parent,{parkour=false,drawRadar}={}){
 const root=document.createElement('div');root.className='manta-hud speedster-hud';root.setAttribute('aria-label','Game status');
 root.innerHTML=`<div class="hud-scrim hud-scrim-top" aria-hidden="true"></div><div class="hud-scrim hud-scrim-bottom" aria-hidden="true"></div><div class="hud-speed-edges" aria-hidden="true"></div>
 <section class="hud-identity hud-surface" data-hud-region="identity" aria-label="Location and health"><div class="hud-location"><strong data-hud-map>${parkour?'The Last Household':'Austin'}</strong><span class="hud-location-separator">/</span><span data-hud-street>${parkour?'Salt Steps':'Congress Avenue'}</span></div><div class="hud-connection"><i data-hud-connection-dot></i><span data-hud-connection>Connecting</span><span class="hud-player-count"><b data-hud-players>1</b> <span data-hud-player-label>player</span></span></div><div class="hud-health-row" data-hud-health-row><span class="hud-label">Health</span><div class="hud-health-meter" data-hud-health-meter role="progressbar" aria-label="Health" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><i data-hud-health-fill></i></div><strong data-hud-health>100</strong></div></section>
 ${minimap(headingMarker())}
 <ol class="hud-events" data-hud-events role="log" aria-label="Game events" aria-live="polite"></ol>
 ${speedRing('SPEEDSTER / VELOCITY')}
 <dl class="hud-stats hud-surface" data-hud-region="stats"><div><dt>Distance</dt><dd><strong data-hud-distance>0</strong><span data-hud-distance-unit>m</span></dd></div><div><dt>Bolts</dt><dd><strong data-hud-bolts>0</strong></dd></div><div><dt>Braking</dt><dd><strong data-hud-braking>${parkour?'—':'0'}</strong><span data-hud-braking-unit>${parkour?'':'m'}</span></dd></div></dl>
 <div class="hud-keys" data-hud-region="keys" aria-label="Controls">${controlHints(parkour).map(hint=>`<span class="hud-key-hint">${keycap(hint.key,hint.display)}<span>${icon(hint.icon)}${hint.label}</span></span>`).join('')}</div>`;
 parent.append(root);const get=name=>root.querySelector(`[data-hud-${name}]`),feed=new HudFeed(),eventNodes=new Map(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 root.querySelector('.hud-tools').innerHTML=`<div class="hud-switches">${segmented('HQ','hud-quality',{active:true,disabled:parkour})}${segmented('Phase','hud-phase',{disabled:parkour})}</div><div class="hud-icon-tools"><button type="button" class="mr-icon-btn" id="hud-pause" aria-label="Pause game">${icon('pause')}</button><button type="button" class="mr-icon-btn" id="hud-fullscreen" aria-label="Toggle fullscreen">${icon('expand')}</button><button type="button" class="mr-icon-btn" id="hud-guide" aria-label="Guide">${icon('guide')}</button></div>`;
 if(parkour){get('connection').textContent='Single player';root.querySelector('#hud-quality').title='Graphics quality is fixed on this map';root.querySelector('#hud-phase').title='Phase is available in Austin';}
 const refs=Object.fromEntries(['health','health-row','health-fill','health-meter','energy','energy-row','energy-meter','speed','top-speed','distance','distance-unit','bolts','braking','braking-unit','street','players','player-label','connection','connection-dot','heading','radar','events'].map(name=>[name,get(name)]));
 let previous=null,reportedPeak=0,recordTime=-Infinity,startedAt=0,lastInput=0,lastTick=0,lastFrame=0,ringAngle=0,flashUntil=0,lastNumericAnimation=0;
 const setText=(name,value,roll=false)=>{const node=refs[name],text=String(value);if(!node||node.textContent===text)return;node.textContent=text;if(roll&&!reduced.matches&&performance.now()-lastNumericAnimation>110){node.animate([{transform:'translateY(5px)',opacity:.45},{transform:'translateY(0)',opacity:1}],{duration:140,easing:'ease-out'});lastNumericAnimation=performance.now();}};
 const clearPressed=()=>root.querySelectorAll('.is-pressed').forEach(node=>node.classList.remove('is-pressed'));
 const onKey=event=>{const key=event.key.toLowerCase(),group='wasd'.includes(key)&&key.length===1?'wasd':key.startsWith('arrow')?'arrows':key;lastInput=performance.now();root.querySelectorAll('[data-key-hint]').forEach(node=>{if(node.dataset.keyHint===group)node.classList.toggle('is-pressed',event.type==='keydown');});};
 const onPointer=()=>lastInput=performance.now();
 window.addEventListener('keydown',onKey);window.addEventListener('keyup',onKey);window.addEventListener('pointerdown',onPointer);window.addEventListener('blur',clearPressed);
 function renderFeed(time){
  const entries=feed.read(time),ids=new Set(entries.map(entry=>entry.id));for(const [id,node] of eventNodes)if(!ids.has(id)){node.remove();eventNodes.delete(id);}
  for(const entry of entries){let node=eventNodes.get(entry.id);if(!node){node=document.createElement('li');eventNodes.set(entry.id,node);refs.events.append(node);}node.textContent=entry.message;node.style.opacity=String(entry.opacity);}
 }
 return {
  element:root,radar:refs.radar,
  update(values,time=performance.now()){
   const state=hudView({...previous,...values},parkour?36:936),running=state.status==='running';
   if(running&&(!previous||previous.status==='ready')){startedAt=time;lastInput=time;}
   if(previous&&state.bolts>previous.bolts){feed.push(`Bolt collected +${state.bolts-previous.bolts}`,time,'bolts');flashUntil=time+450;}
   if(previous&&state.topSpeed<previous.topSpeed)reportedPeak=0;
   if(running&&state.topSpeed>reportedPeak+10&&time-recordTime>1600){feed.push(`New top speed / ${Math.round(state.topSpeed)} km/h`,time,'speed');reportedPeak=state.topSpeed;recordTime=time;}
   root.hidden=state.status==='ready';root.classList.toggle('is-paused',!running);root.classList.toggle('is-boosting',!!state.boosting);root.classList.toggle('is-fast',state.nearLimit);
   root.classList.toggle('is-pickup',time<flashUntil);root.classList.toggle('show-keys',time-startedAt<6000||time-lastInput>4000);
   refs['health-row'].classList.toggle('is-low',state.lowHealth);refs['energy-row'].classList.toggle('is-full',state.energy>=99.5);
   root.style.setProperty('--speed',state.speedRatio);root.style.setProperty('--energy',state.energyRatio);root.style.setProperty('--health',state.healthRatio);root.style.setProperty('--hud-radar-angle',`${-state.heading}rad`);root.style.setProperty('--spin-duration',`${state.spinSeconds}s`);
   const dt=Math.min(.1,(time-lastFrame)/1000);lastFrame=time;if(!reduced.matches&&running)ringAngle=(ringAngle+dt*(12+state.speedRatio*180))%360;root.style.setProperty('--ring-angle',`${ringAngle}deg`);
   if(time-lastTick>=80||!previous){
    lastTick=time;setText('speed',Math.round(state.speed),true);setText('top-speed',Math.round(state.topSpeed));setText('health',Math.round(state.health));setText('energy',Math.round(state.energy));setText('bolts',state.bolts,true);
    setText('distance',state.distance>=1000?(state.distance/1000).toFixed(2):Math.floor(state.distance));setText('distance-unit',state.distance>=1000?'km':'m');setText('braking',state.braking??'—');setText('street',state.street||'');setText('players',state.players??1);setText('player-label',(state.players??1)===1?'player':'players');setText('heading',state.headingText);
    if(!parkour)setText('connection',state.connection||'Connecting');refs['connection-dot'].classList.toggle('is-connected',parkour||state.connection==='Connected');
    for(const type of ['health','energy'])refs[`${type}-meter`].setAttribute('aria-valuenow',String(Math.round(state[type])));
    root.querySelector('#hud-phase').setAttribute('aria-checked',String(!!state.phasing));
    renderFeed(time);drawRadar?.(refs.radar,state);
   }
   if(!running)clearPressed();previous=state;
  },
  event(message,key){feed.push(String(message),performance.now(),key);},
  reset(){previous=null;reportedPeak=0;recordTime=-Infinity;startedAt=0;feed.clear();renderFeed(performance.now());clearPressed();},
  destroy(){window.removeEventListener('keydown',onKey);window.removeEventListener('keyup',onKey);window.removeEventListener('pointerdown',onPointer);window.removeEventListener('blur',clearPressed);root.remove();}
 };
}
