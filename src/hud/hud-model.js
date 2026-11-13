import {BOOST_MIN_ENERGY} from '../game.js';

const number=(value,fallback=0)=>Number.isFinite(value)?value:fallback;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export function hudView(state={},maxSpeed=936){
 const speed=Math.max(0,number(state.speed)),health=clamp(number(state.health,100),0,100),energy=clamp(number(state.energy,100),0,100);
 const speedRatio=clamp(speed/Math.max(1,number(maxSpeed,936)),0,1),degrees=((number(state.heading)*180/Math.PI)%360+360)%360;
 const headingText=`${['N','NE','E','SE','S','SW','W','NW'][Math.round(degrees/45)%8]} ${Math.round(degrees)%360}°`;
 return {...state,speed,health,energy,topSpeed:Math.max(0,number(state.topSpeed)),distance:Math.max(0,number(state.distance)),bolts:Math.max(0,Math.floor(number(state.bolts))),heading:number(state.heading),headingText,speedRatio,energyRatio:energy/100,healthRatio:health/100,nearLimit:speedRatio>=.85,lowHealth:health<25,spinSeconds:24/(1+speedRatio*12)};
}
export function controlHints(parkour=false){
 const basic=[{key:'wasd',display:'W A S D',label:'Move',icon:'move'},{key:'arrows',display:'↑ ← ↓ →',label:'Look',icon:'look'},{key:' ',display:'SPACE',label:'Jump',icon:'jump'}];
 return basic.concat(parkour?[{key:'e',display:'E',label:'Blink',icon:'phase'},{key:'f',display:'F',label:'Hand blast',icon:'blast'}]:[{key:'shift',display:'SHIFT',label:'Boost',icon:'bolt'},{key:'q',display:'Q',label:'Phase',icon:'phase'},{key:'e',display:'E',label:'Slow time',icon:'slow'}]);
}

const atlasKeys=[['R','Flight'],['Shift','Boost'],['B','Air brake'],['Space','Super jump'],['V','Wall punch'],['X','Ground slam']];
const parkourKeys=[['E','Blink'],['F','Hand blast']];
const speedsterKeys=[['Space','Jump'],['Shift','Boost'],['Q','Phase'],['E','Slow time']];
export function abilityReadouts(state,parkour,all=false){
 const keys=all?[...atlasKeys,...speedsterKeys.filter(([,label])=>label!=='Boost'),...(parkour?parkourKeys:[])]:state.hero==='atlas'?[...atlasKeys,...(parkour?parkourKeys:[])]:speedsterKeys.slice(0,parkour?2:4);
 return keys.map(([display,label])=>{
  const blast=state.abilities?.blast,blink=state.abilities?.teleports;
  const energyLow=(state.energy??100)<=BOOST_MIN_ENERGY;
  const airborne=state.grounded===false;
  let status='ready',ready=1;
  switch(label){
   case 'Flight':
    if(state.flying)status='active';
    break;
   case 'Boost':
    if(state.boosting)status='active';
    else if(state.flying&&state.flight?!state.flight.canBoost:energyLow||state.boostExhausted){status='cooling';ready=0;}
    break;
   case 'Air brake':
    if(state.airBraking)status='active';
    else if(!state.flying||state.slamming)status='unavailable';
    break;
   case 'Jump':
   case 'Super jump':
    if(state.flying||airborne&&!(state.coyote>0)&&!state.wallRunning)status='unavailable';
    break;
   case 'Ground slam':
    if(state.slamming)status='active';
    else if(!airborne)status='unavailable';
    break;
   case 'Wall punch':
    if(state.punchTime>0){status=state.punchPending?'active':'cooling';ready=1-state.punchTime/.4;}
    break;
   case 'Phase':
    if(state.phasing)status='active';
    break;
   case 'Slow time':
    if(state.slowing)status='active';
    else if(energyLow){status='cooling';ready=(state.energy??0)/BOOST_MIN_ENERGY;}
    break;
   case 'Blink':
    if(blink&&!blink.available){status='cooling';ready=Math.max(0,...blink.pips);}
    break;
   case 'Hand blast':
    if(blast?.aiming){status='active';ready=blast.charge;}
    else if(blast?.cooldown){status='cooling';ready=1-blast.cooldown/state.blastCooldown;}
    break;
  }
  return {display,label,status,ready:status==='unavailable'?0:clamp(number(ready,1),0,1)};
 });
}
