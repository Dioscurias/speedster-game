import {icon} from '../ui/components.js';
import {abilityReadouts,hudView} from './hud-model.js';
import {HudFeed} from './hud-overlay.js';
import './manta-hud.css';

const meter=(name,label)=>`<div class="instrument-meter" data-hud-${name}-meter role="progressbar" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i data-hud-${name}-fill></i></div>`;
const tool=(id,label,glyph)=>`<button type="button" id="hud-${id}" title="${label}" aria-label="${label}">${icon(glyph)}</button>`;

export function mountMantaHUD(parent,{parkour=false,drawRadar}={}){
 const root=document.createElement('div');
 root.className='manta-hud';
 root.setAttribute('aria-label','Game status');
 root.innerHTML=`
 <section class="instrument-location"><span class="instrument-label">${parkour?'The Last Household':'Austin'}</span><strong data-hud-street></strong><small data-hud-network></small></section>
 <section class="instrument-navigation" aria-label="Navigation">
  <div class="instrument-map"><button class="hud-radar" type="button" title="Expand map" aria-label="Expand map"><canvas data-hud-radar aria-label="Nearby points of interest"></canvas></button><span class="instrument-north" aria-hidden="true">N</span><span class="instrument-label" data-hud-heading>N 0°</span></div>
  <div class="instrument-tools">${tool('quality','Graphics quality','look')}${tool('pause','Pause game','pause')}${tool('fullscreen','Toggle fullscreen','expand')}${tool('guide','Guide','guide')}<a href="https://manta.bet/" target="_top" title="Back to manta.bet" aria-label="Back to manta.bet">${icon('home')}</a></div>
 </section>
 <section class="instrument-vitals">
  <div class="instrument-line" data-hud-health-row><span class="instrument-label">Health</span>${meter('health','Health')}<output data-hud-health>100</output></div>
  <div class="instrument-line"><span class="instrument-label">Energy</span>${meter('energy','Energy')}<output data-hud-energy>100</output></div>
 </section>
 <section class="instrument-speed" aria-label="Velocity">
  <span class="instrument-label">Speed</span>
  <div><output data-hud-speed>0</output> <span class="instrument-label">km/h</span></div>
  ${meter('speed','Speed relative to limit')}
  <div class="instrument-flight" data-hud-flight hidden><span data-hud-flight-state></span><span data-hud-altitude></span></div>
 </section>
 <div class="instrument-bottom"><p class="instrument-hint" data-hud-hint></p><div class="instrument-abilities" aria-label="Abilities"></div><p class="instrument-event" data-hud-event role="status"></p></div>`;
 parent.append(root);
 const get=name=>root.querySelector(`[data-hud-${name}]`);
 const nodes=Object.fromEntries(['street','network','heading','radar','health','energy','speed','flight','flight-state','altitude','hint','event','health-row'].map(name=>[name,get(name)]));
 const abilities=root.querySelector('.instrument-abilities');
 const meters=Object.fromEntries(['health','energy','speed'].map(name=>[name,{track:get(name+'-meter'),fill:get(name+'-fill')}]));
 const quality=root.querySelector('#hud-quality');
 quality.disabled=parkour;
 quality.setAttribute('aria-pressed',String(!parkour));
 if(parkour)quality.title='Graphics quality is fixed on this map';
 const feed=new HudFeed();
 let previousHealth=100,lastTick=-Infinity,flashUntil=0,lastHint='',hintUntil=0;
 const set=(node,value)=>{const next=String(value);if(node.textContent!==next)node.textContent=next;};
 const tools=new Map();
 for(const entry of abilityReadouts({},parkour,true)){
  const node=document.createElement('button');
  node.type='button';
  const key=entry.display==='Space'?' ':entry.display.toLowerCase();
  node.dataset.heroKey=key;
  const emit=type=>window.dispatchEvent(new KeyboardEvent(type,{key,bubbles:true}));
  node.onpointerdown=event=>{event.preventDefault();node.setPointerCapture(event.pointerId);emit('keydown');};
  for(const type of ['pointerup','pointercancel','lostpointercapture'])node.addEventListener(type,()=>emit('keyup'));
  node.onclick=event=>{if(event.detail!==0)return;emit('keydown');emit('keyup');};
  node.className='instrument-ability';
  node.innerHTML=`<i></i><kbd>${entry.display}</kbd><span>${entry.label}</span>`;
  abilities.append(node);
  tools.set(entry.label,{node,fill:node.firstElementChild});
 }
 return {
  element:root,
  update(values,time=performance.now()){
   const state=hudView(values,values.speedLimit);
   root.hidden=state.status==='ready';
   root.classList.toggle('is-paused',state.status==='paused');
   if(time-lastTick<50)return;
   lastTick=time;
   if(state.health<previousHealth)flashUntil=time+180;
   previousHealth=state.health;
   nodes['health-row'].classList.toggle('is-low',state.lowHealth);
   nodes['health-row'].classList.toggle('is-hit',time<flashUntil);
   for(const [name,ratio] of Object.entries({health:state.healthRatio,energy:state.energyRatio,speed:state.speedRatio})){
    const {track,fill}=meters[name];
    fill.style.transform=`scaleX(${ratio})`;
    track.setAttribute('aria-valuenow',String(Math.round(ratio*100)));
    set(nodes[name],Math.round(state[name]));
   }
   set(nodes.street,state.street||'');
   set(nodes.network,`${state.connection||'Connecting'} · ${state.players||1} ${state.players===1?'player':'players'}`);
   set(nodes.heading,state.headingText);
   root.style.setProperty('--north',`${-state.heading}rad`);
   nodes.flight.hidden=state.hero!=='atlas';
   set(nodes['flight-state'],state.flightLabel||'Grounded');
   set(nodes.altitude,state.flying?`${Math.round(state.altitude||0)} m AGL`:'');
   const visible=new Set();
   for(const entry of abilityReadouts(state,parkour)){
    const {node,fill}=tools.get(entry.label);
    visible.add(entry.label);
    node.dataset.state=entry.status;
    node.setAttribute('aria-label',`${entry.label} (${entry.status})`);
    fill.style.transform=`scaleX(${entry.ready})`;
   }
   for(const [label,{node}] of tools)node.hidden=!visible.has(label);
   abilities.inert=state.status!=='running';
   const hint=state.hero!=='atlas'?'':state.boostExhausted?'Release Shift to reset boost':state.flying?'Space climb · C descend · R exit flight':state.grounded?'R take off':'R engage flight';
   if(hint!==lastHint){lastHint=hint;hintUntil=time+4200;set(nodes.hint,hint);}
   nodes.hint.style.opacity=hint&&time<hintUntil?'1':'0';
   const message=feed.read(time).at(-1);
   set(nodes.event,message?.message||'');
   nodes.event.style.opacity=String(message?.opacity||0);
   drawRadar?.(nodes.radar,state);
  },
  event(message){feed.push(message,performance.now());},
  reset(){previousHealth=100;lastTick=-Infinity;flashUntil=0;lastHint='';feed.clear();},
  destroy(){root.remove();}
 };
}
