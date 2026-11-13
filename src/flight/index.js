import {createCollider,stepWorld,PHYSICS} from '../game.js';
import {FLIGHT as C} from './flight-config.js';
import {createFlightState,isFlight} from './flight-state.js';
import {clamp,floorAt,integrate,sweep,thrust} from './flight-physics.js';

const empty=createCollider(),step=1/C.hz;
export const ATLAS_PHYSICS=Object.freeze({...PHYSICS,runSpeed:24,boostSpeed:65,jumpSpeed:28,jumpCutSpeed:20,airAcceleration:25,wallRunning:false});
const contexts=new WeakMap();
const labels={DIVE_SLAM:'Dive',WALL_CONTACT:'Wall contact',TAKEOFF:'Takeoff',LANDING:'Landing'};
function context(w){
 if(!contexts.has(w))contexts.set(w,createFlightState(w.flying?'HOVER':'GROUNDED'));
 return contexts.get(w);
}
function publish(w,m){
 // Compatibility projections for the existing animation, effects and room transport.
 w.flying=isFlight(m.state);
 w.airBraking=m.state==='BRAKE';
 if(w.flying||m.state==='LANDING')w.boosting=m.state==='BOOST';
 w.slamming=m.state==='DIVE_SLAM'&&!!m.slam;
}
function transition(w,m,next,reason){
 if(!m.transition(next,reason))return;
 if(m.previous==='BOOST')m.events?.('boostEnd',reason);
 if(next==='BOOST')m.events?.('boostStart',reason);
 if(next==='TAKEOFF'||next==='HOVER'&&m.previous==='GROUNDED')m.events?.('takeoff',reason);
 if(next==='LANDING')m.events?.('landed',reason);
 publish(w,m);
}
export function resetFlight(w,initial='GROUNDED'){
 contexts.set(w,createFlightState(initial));
 w.boosting=false;w.flightBank=0;if(isFlight(initial))w.grounded=false;publish(w,context(w));
}
export function toggleFlight(w,c=empty){
 if(w.hero!=='atlas'||w.status!=='running')return false;
 const m=context(w);
 if(isFlight(m.state)){transition(w,m,'GROUNDED','R disengaged');w.boosting=false;m.slam=false;m.boostRamp=0;return false;}
 if(w.grounded){
  const checks=Math.ceil(C.clearance/C.sweepDistance);
  for(let i=1;i<=checks;i++)if(c.blocked?.(w.x,w.z,w.y+C.clearance*i/checks)){
   m.reason='R blocked by overhead clearance';return false;
  }
 }
 m.slam=false;
 transition(w,m,w.grounded?'TAKEOFF':'HOVER','R engaged');
 w.jumpBuffer=0;w.wallRunning=false;w.wall=null;
 return true;
}
export function flightSnapshot(w,c=empty){
 if(w.hero!=='atlas')return null;
 const m=context(w),state=m.state,flying=isFlight(state);
 return Object.freeze({
  state,previous:m.previous,age:m.age,flying,boosting:state==='BOOST',canBoost:state==='BOOST'||(!m.exhausted&&w.energy>=C.boostMinimum),
  velocity:Object.freeze([w.vx,w.vy,w.vz]),speed:w.speed,energy:w.energy,altitude:Math.max(0,w.y-floorAt(c,w.x,w.z,w.y)),
  collisionNormal:m.normal||null,reason:m.reason,transitions:Object.freeze([...m.transitions]),
 });
}
export function flightTelemetry(w,c=empty){
 const flight=flightSnapshot(w,c);
 if(!flight)return {};
 const {state,altitude,flying}=flight;
 return {flight,flightState:state,flightLabel:labels[state]||state[0]+state.slice(1).toLowerCase(),altitude,canBoost:flight.canBoost,
 speedLimit:(flying?C.boostSpeed:ATLAS_PHYSICS.boostSpeed)*3.6};
}
function tick(w,m,input,c){
 m.update(step);
 if(!input.boost&&!input.brake&&!input.descend&&!input.slam&&m.reason.startsWith('Shift'))m.reason='';
 if(!input.boost)m.exhausted=false;
 w.punchTime=Math.max(0,(w.punchTime||0)-step);
 const slam=input.slam||w.slamRequested;w.slamRequested=false;
 if(slam&&(!w.grounded||w.y>floorAt(c,w.x,w.z,w.y)+C.skin)){w.grounded=false;m.slam=true;transition(w,m,'DIVE_SLAM','X committed slam');}
 if(m.state==='LANDING'&&m.age<C.landingDuration&&!input.jump){
  w.worldTime+=step;w.elapsed+=step;
  w.vx=0;w.vz=0;w.speed=0;
  w.energy=clamp(w.energy+step*C.energyRecovery,0,C.energyMax);
  if(input.forward||input.backward||input.left||input.right)m.reason='Movement resumes when the landing settles';
  return;
 }
 if(m.state==='LANDING')transition(w,m,'GROUNDED','landing settled');
 if(!isFlight(m.state)){
  if(input.brake||input.descend||slam)m.reason='B, C and X require flight or an airborne Atlas';
  stepWorld(w,{...input,boost:input.boost,phase:false,slow:false},step,c,ATLAS_PHYSICS);
  return;
 }
 const control=thrust(input),moving=control.direction.some(Boolean);
 const speed=Math.hypot(w.vx,w.vy,w.vz);
 if(m.state==='TAKEOFF'){
  if(input.brake||input.descend||input.boost)m.reason='B, C and Shift become available after launch';
  if(m.age<C.crouchTime){w.elapsed+=step;w.worldTime+=step;return;}
  if(w.grounded){w.grounded=false;w.vy=C.launchSpeed;}
  if(m.age>=C.launchTime)transition(w,m,moving?'CRUISE':'GLIDE','launch complete');
 }
 if(m.state!=='TAKEOFF'&&!m.slam&&(m.state!=='WALL_CONTACT'||m.age>=C.wallDuration||input.brake)){
  if(input.boost&&w.energy<C.boostMinimum&&m.state!=='BOOST')m.exhausted=true;
  const canBoost=!m.exhausted&&(m.state==='BOOST'?w.energy>0:w.energy>=C.boostMinimum);
  const dive=input.descend&&control.pitch>C.downPitch&&(speed>=C.diveSpeed||m.state==='DIVE_SLAM');
  const next=input.brake?'BRAKE':dive?'DIVE_SLAM':moving&&input.boost&&canBoost?'BOOST':moving?(control.planar?'CRUISE':'HOVER'):speed>C.hoverSpeed?'GLIDE':'HOVER';
  if(next==='GLIDE'&&m.state!=='GLIDE')m.glideSpeed=speed;
  transition(w,m,next,'flight input and momentum');
  if(input.boost&&next!=='BOOST')m.reason=!canBoost?'Shift needs energy or a fresh press':'Shift needs thrust and a clear flight state';
 }
 const boost=m.state==='BOOST';
 m.boostRamp=clamp((m.boostRamp||0)+step*(boost?1/C.boostRise:-1/C.boostFall),0,1);
 w.energy=clamp(w.energy+step*(boost?-C.boostDrain:C.energyRecovery),0,C.energyMax);
 if(boost&&!w.energy){m.exhausted=true;transition(w,m,'CRUISE','boost energy exhausted');}
 w.elapsed+=step;w.worldTime+=step;w.phasing=false;w.wallRunning=false;w.landingImpact=0;
 w.impact=Math.max(0,w.impact-step*C.impactFade);
 integrate(w,control,{state:m.state,boostRamp:m.boostRamp,glideSpeed:m.glideSpeed||speed,slam:m.slam},c,step);
 const hit=sweep(w,c,step);
 if(hit)m.normal=Object.freeze(hit.normal);
 if(hit?.landed){
  if(m.slam)m.events?.('impact',{...hit,slam:true});
  if(m.slam)w.vx=w.vz=0;
  w.landingImpact=clamp(hit.speed/C.impactThreshold,0,1);
  w.grounded=true;m.slam=false;m.boostRamp=0;
  transition(w,m,'LANDING','surface reached');
 }else if(hit?.speed>0){
  if(hit.speed>=C.impactThreshold&&m.state!=='WALL_CONTACT'){
   w.energy=Math.max(0,w.energy-C.impactEnergy);
   w.impact=clamp(hit.speed/C.impactFull,0,1);
   m.events?.('impact',hit);
  }
  if(!m.slam&&m.state!=='WALL_CONTACT')transition(w,m,'WALL_CONTACT','surface contact');
 }
 const horizontal=Math.hypot(w.vx,w.vz);
 const heading=horizontal>C.hoverSpeed?Math.atan2(w.vx,-w.vz):w.heading;
 const turn=Math.atan2(Math.sin(heading-w.heading),Math.cos(heading-w.heading))/step;
 const bank=clamp(-turn*C.bankGain,-C.maxBank,C.maxBank);
 const oldBank=w.flightBank||0;
 w.flightBank=oldBank+(bank-oldBank)*(1-Math.exp(-step*C.poseBlend));
 w.heading=heading;
 w.speed=Math.hypot(w.vx,w.vy,w.vz);w.topSpeed=Math.max(w.topSpeed,w.speed);
}
export function update(dt,input,w,c=empty,physics=PHYSICS,onEvent){
 if(w.hero!=='atlas')return stepWorld(w,input,dt,c,physics);
 if(w.status!=='running'||dt<=0)return;
 const m=context(w);
 m.events=onEvent;
 m.accumulator=(m.accumulator||0)+Math.min(dt,C.maxDelta);
 m.jumpQueued=Boolean(m.jumpQueued||input.jump);
 m.slamQueued=Boolean(m.slamQueued||input.slam);
 while(m.accumulator+1e-10>=step){
  m.previousPosition=[w.x,w.y,w.z];
  tick(w,m,{...input,jump:m.jumpQueued,slam:m.slamQueued},c);
  m.jumpQueued=m.slamQueued=false;
  m.accumulator-=step;
 }
}
export function stepHero(w,input,dt,c,physics,onEvent){return update(dt,input,w,c,physics,onEvent);}
export function renderPosition(w,frameRemainder){
 const previous=contexts.get(w)?.previousPosition;
 if(w.hero!=='atlas'||w.status!=='running'||!w.flying||!previous)return {x:w.x,y:w.y,z:w.z};
 const alpha=clamp(frameRemainder/step,0,1);
 return {x:previous[0]+(w.x-previous[0])*alpha,y:previous[1]+(w.y-previous[1])*alpha,z:previous[2]+(w.z-previous[2])*alpha};
}
