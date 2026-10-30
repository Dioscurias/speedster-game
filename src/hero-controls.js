import {toggleFlight,findPunchTarget} from './powerhouse.js';
import {recolorSpeedsterSuit,speedsterColorForIndex} from './superhero.js';
export function selectedHero(){try{return localStorage.getItem('speedster-hero')==='atlas'?'atlas':'speedster';}catch{return 'speedster';}}
export function wireHeroControls({getWorld,getBuildings=()=>[],getMultiplayer,getRunner,onChange=()=>{},effects,toast=()=>{}}){
 const emit=event=>{const mp=getMultiplayer(),nonce=crypto.randomUUID();effects.add({...event,id:(mp?.id||'local')+':'+nonce});if(mp?.connected)mp.transport.impact({...event,nonce});};
 window.addEventListener('speedster:hero',event=>{
  const w=getWorld();if(w.phasing&&w.phaseSafe)Object.assign(w,w.phaseSafe);w.phasing=false;w.phaseSafe=null;w.wallRunning=false;w.wall=null;w.boosting=false;w.slowing=false;w.vx=w.vz=0;w.speed=0;w.hero=event.detail==='atlas'?'atlas':'speedster';w.flying=false;w.slamming=false;w.punchTime=0;w.punchPending=false;w.slamRequested=false;w.flightBank=0;w.airBraking=false;w.boostExhausted=false;w.vy=0;
  const runner=getRunner();if(runner){runner.rotation.x=runner.rotation.z=0;runner.scale.setScalar(1);recolorSpeedsterSuit(runner,w.hero==='atlas'?'#258cb7':speedsterColorForIndex(getMultiplayer()?.colorIndex||0));}
  onChange();
  try{localStorage.setItem('speedster-hero',w.hero);}catch{}
  toast(w.hero==='atlas'?'Atlas · R to fly · V to punch':'Speedster selected');
 });
 window.addEventListener('keydown',event=>{
  if(event.repeat||event.target?.closest?.('input,select,textarea')||document.querySelector('dialog[open]'))return;
  const w=getWorld();if(w.status!=='running'||w.hero!=='atlas')return;
  const key=event.key.toLowerCase();
  if(key==='x'){w.slamRequested=true;}
  if(key==='r'){toggleFlight(w);toast(w.flying?'Flight · Space up · C down · Shift boost · B brake':'Flight disengaged');}
  if(key==='v'&&!(w.punchTime>0)){
   w.punchTime=.4;w.punchPending=true;
  }
 });
 return {emit,update(){const w=getWorld();if(!w.punchPending||w.status!=='running')return;if(w.hero!=='atlas'){w.punchPending=false;return;}if(w.punchTime>.22)return;w.punchPending=false;const hit=findPunchTarget(w,getBuildings());if(hit){emit(hit);toast('Impact');}else toast('Punch · move within reach of a wall');}};
}
