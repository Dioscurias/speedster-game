import {toggleFlight,findPunchTarget} from './powerhouse.js';
import {recolorSpeedsterSuit,speedsterColorForIndex} from './superhero.js';
export function selectedHero(){try{return localStorage.getItem('speedster-hero')==='atlas'?'atlas':'speedster';}catch{return 'speedster';}}
export function wireHeroControls({getWorld,getBuildings=()=>[],getMultiplayer,getRunner,effects,toast=()=>{}}){
 const emit=event=>{const mp=getMultiplayer(),nonce=crypto.randomUUID();effects.add({...event,id:(mp?.id||'local')+':'+nonce});if(mp?.connected)mp.transport.impact({...event,nonce});};
 window.addEventListener('speedster:hero',event=>{
  const w=getWorld();w.hero=event.detail==='atlas'?'atlas':'speedster';w.flying=false;w.slamming=false;w.punchTime=0;w.vy=0;
  const runner=getRunner();if(runner)recolorSpeedsterSuit(runner,w.hero==='atlas'?'#258cb7':speedsterColorForIndex(getMultiplayer()?.colorIndex||0));
  try{localStorage.setItem('speedster-hero',w.hero);}catch{}
  toast(w.hero==='atlas'?'Atlas · R to fly · V to punch':'Speedster selected');
 });
 window.addEventListener('keydown',event=>{
  if(event.repeat||event.target?.closest?.('input,select,textarea')||document.querySelector('dialog[open]'))return;
  const w=getWorld();if(w.status!=='running'||w.hero!=='atlas')return;
  const key=event.key.toLowerCase();
  if(key==='r'){toggleFlight(w);toast(w.flying?'Flight · Space up · C down · Shift boost':'Flight disengaged');}
  if(key==='v'&&!(w.punchTime>0)){
   w.punchTime=.4;const hit=findPunchTarget(w,getBuildings());
   if(hit){emit(hit);toast('Impact');}else toast('Punch · move within reach of a wall');
  }
 });
 return {emit};
}
