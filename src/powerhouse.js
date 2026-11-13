import {stepWorld,PHYSICS,createCollider} from './game.js';

export const ATLAS_PHYSICS=Object.freeze({...PHYSICS,runSpeed:24,boostSpeed:65,jumpSpeed:28,jumpCutSpeed:20,airAcceleration:25,wallRunning:false});
const empty=createCollider();
export const FLIGHT=Object.freeze({
 cruiseSpeed:72,boostSpeed:220,launchSpeed:14,launchDuration:.18,
 boostDrain:24,energyRecovery:14,ceiling:600,ceilingBand:55,edgeBand:70,
 sweepDistance:.2,landingDuration:.14
});
const flightStates=new Set(['flying','boosting','braking']);
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const groundState=w=>w.grounded?'grounded':'airborne';
const support=(c,x,z,y)=>c.surface?.(x,z,y)??0;
const readState=w=>w.flightState??(w.flying?'flying':groundState(w));
function setFlightState(w,state){
 w.flightState=state;
 // Existing animation, effects and room snapshots consume these derived flags.
 w.flying=flightStates.has(state);
 w.airBraking=state==='braking';
 w.boosting=state==='boosting';
}
export function resetFlight(w){setFlightState(w,groundState(w));w.launchTime=w.landingTime=0;w.slamming=false;}
export function flightTelemetry(w,collider=empty){
 if(w.hero!=='atlas')return {};
 const state=readState(w);
 const flightLabel=state==='flying'?(w.speed>4?'Cruise':'Hover'):
  ({boosting:'Boost',braking:'Brake',landing:'Landing',airborne:'Airborne',grounded:'Grounded'})[state];
 return {flightState:state,flightLabel,altitude:Math.max(0,w.y-support(collider,w.x,w.z,w.y)),
  speedLimit:(flightStates.has(state)?FLIGHT.boostSpeed:ATLAS_PHYSICS.boostSpeed)*3.6};
}
export function toggleFlight(w,collider=empty){
 if(w.hero!=='atlas'||w.status!=='running')return false;
 if(flightStates.has(readState(w))){
  setFlightState(w,'airborne');w.slamming=false;w.launchTime=0;
  return false;
 }
 if(w.grounded){
  const clearance=FLIGHT.launchSpeed*FLIGHT.launchDuration;
  const checks=Math.ceil(clearance/FLIGHT.sweepDistance);
  for(let i=1;i<=checks;i++)if(collider.blocked?.(w.x,w.z,w.y+clearance*i/checks))return false;
 }
 const launch=w.grounded;
 setFlightState(w,'flying');w.slamming=false;w.wallRunning=false;w.wall=null;
 w.grounded=false;w.jumpBuffer=0;w.flightBank=0;w.landingTime=0;
 w.launchTime=launch?FLIGHT.launchDuration:0;
 if(launch)w.vy=FLIGHT.launchSpeed;
 return true;
}

function boundVelocity(position,velocity,min,max){
 const upper=max-position,lower=position-min;
 const cap=distance=>FLIGHT.boostSpeed*clamp(distance/FLIGHT.edgeBand,0,1);
 if(upper<FLIGHT.edgeBand)return Math.min(velocity,upper<8?(upper-8)*2:cap(upper));
 if(lower<FLIGHT.edgeBand)return Math.max(velocity,lower<8?(8-lower)*2:-cap(lower));
 return velocity;
}

function moveFlight(w,c,dt){
 const count=Math.max(1,Math.ceil(Math.hypot(w.vx,w.vy,w.vz)*dt/FLIGHT.sweepDistance)),h=dt/count;
 for(let i=0;i<count&&w.flying;i++){
  const ox=w.x,oy=w.y,oz=w.z;
  w.x+=w.vx*h;w.z+=w.vz*h;
  for(const contact of c.contacts(w.x,w.z,oy)){
   w.x+=contact.nx*(contact.depth+.001);w.z+=contact.nz*(contact.depth+.001);
   const inward=w.vx*contact.nx+w.vz*contact.nz;
   if(inward<0){w.vx-=inward*contact.nx;w.vz-=inward*contact.nz;w.impact=Math.max(w.impact,Math.min(1,-inward/100));}
  }
  const nextY=oy+w.vy*h,floor=support(c,w.x,w.z,oy);
  if(w.vy<=0&&nextY<=floor){
   w.y=floor;w.landingImpact=Math.min(1,Math.abs(w.vy)/35);w.vy=0;
   if(w.slamming)w.vx=w.vz=0;
   w.grounded=true;w.slamming=false;w.launchTime=0;w.landingTime=FLIGHT.landingDuration;setFlightState(w,'landing');
  }else if(w.vy!==0&&c.blocked(w.x,w.z,nextY)){
   w.impact=Math.max(w.impact,Math.min(1,Math.abs(w.vy)/100));w.vy=0;w.launchTime=0;
  }else w.y=nextY;
  w.distance+=Math.hypot(w.x-ox,w.y-oy,w.z-oz);
 }
}
function flightTick(w,input,dt,c){
 if(!input.boost)w.boostExhausted=false;
 if(w.energy<=2&&input.boost)w.boostExhausted=true;
 w.punchTime=Math.max(0,(w.punchTime||0)-dt);
 const slam=input.slam||w.slamRequested;w.slamRequested=false;
 if(slam&&!w.grounded){setFlightState(w,'flying');w.slamming=true;w.launchTime=0;}
 const state=readState(w);
 if(!flightStates.has(state)){
  stepWorld(w,{...input,boost:input.boost&&!w.boostExhausted,phase:false,slow:false},dt,c,ATLAS_PHYSICS);
  w.landingTime=Math.max(0,(w.landingTime||0)-dt);
  w.flightState=w.grounded&&w.landingTime>0?'landing':groundState(w);
  return;
 }
 w.elapsed+=dt;w.worldTime+=dt;w.phasing=false;w.wallRunning=false;w.impact=Math.max(0,w.impact-dt*3);w.landingImpact=0;
 const right=Number(!!input.right)-Number(!!input.left),forward=Number(!!input.forward)-Number(!!input.backward);
 const vertical=Number(!!input.ascend)-Number(!!input.descend),moving=!!(right||forward||vertical),yaw=input.viewYaw||0;
 const pitch=clamp(input.viewPitch||0,-1.48,1.48),planar=forward*Math.cos(pitch),climb=vertical-forward*Math.sin(pitch);
 const brake=input.brake&&!w.slamming;
 const boost=input.boost&&moving&&!w.slamming&&!brake&&!w.boostExhausted;
 setFlightState(w,brake?'braking':boost?'boosting':'flying');
 w.energy=clamp(w.energy+dt*(boost?-FLIGHT.boostDrain:FLIGHT.energyRecovery),0,100);
 const speed=w.slamming?0:brake?18:boost?FLIGHT.boostSpeed:FLIGHT.cruiseSpeed;
 const normal=Math.max(1,Math.hypot(right,planar,climb)),horizontal=brake?0:speed/normal;
 let tx=(right*Math.cos(yaw)+planar*Math.sin(yaw))*horizontal,tz=(right*Math.sin(yaw)-planar*Math.cos(yaw))*horizontal;
 let ty=w.slamming?-135:brake?vertical*18:climb*speed/normal;
 if(w.launchTime>0){if(!input.descend)ty=Math.max(ty,FLIGHT.launchSpeed);w.launchTime=Math.max(0,w.launchTime-dt);}
 if(c.bounds){
  tx=boundVelocity(w.x,tx,c.bounds.minX,c.bounds.maxX);
  tz=boundVelocity(w.z,tz,c.bounds.minZ,c.bounds.maxZ);
 }
 const headroom=FLIGHT.ceiling-w.y;
 if(headroom<FLIGHT.ceilingBand)ty=Math.min(ty,headroom<5?(headroom-5)*2:FLIGHT.boostSpeed*clamp(headroom/FLIGHT.ceilingBand,0,1));
 const approach=1-Math.exp(-dt*(brake?12:w.slamming?9:!moving?2.8:boost?4.5:6));
 w.vx+=(tx-w.vx)*approach;w.vz+=(tz-w.vz)*approach;w.vy+=(ty-w.vy)*(w.slamming?1-Math.exp(-dt*14):approach);
 const horizontalSpeed=Math.hypot(w.vx,w.vz),nextHeading=horizontalSpeed>.5?Math.atan2(w.vx,-w.vz):yaw;
 const turn=Math.atan2(Math.sin(nextHeading-w.heading),Math.cos(nextHeading-w.heading));
 w.flightBank=((w.flightBank||0)+(clamp(-right*.26-turn*5,-.48,.48)-(w.flightBank||0))*(1-Math.exp(-dt*5)));
 w.heading=nextHeading;
 moveFlight(w,c,dt);
 w.speed=Math.hypot(w.vx,w.vy,w.vz);w.topSpeed=Math.max(w.topSpeed,w.speed);
}
export function stepHero(w,input,dt,collider=empty,physics=PHYSICS){
 if(w.hero!=='atlas')return stepWorld(w,input,dt,collider,physics);
 if(w.status!=='running'||!(dt>0))return;
 const elapsed=Math.min(dt,.05),steps=Math.ceil(elapsed*120-1e-9);
 for(let i=0;i<steps;i++)flightTick(w,i===0?input:{...input,jump:false},elapsed/steps,collider);
}

export function findPunchTarget(w,buildings,reach=4.8){
 const dx=Math.sin(w.heading),dz=-Math.cos(w.heading),y=w.y+1.25;let closest=null;
 for(const b of buildings){
  if(y<(b.minY??0)||y>b.height)continue;
  for(let i=0;i<b.polygon.length;i++){
   const a=b.polygon[i],c=b.polygon[(i+1)%b.polygon.length],ex=c[0]-a[0],ez=c[1]-a[1],det=dx*ez-dz*ex;
   if(Math.abs(det)<1e-8)continue;
   const ax=a[0]-w.x,az=a[1]-w.z,t=(ax*ez-az*ex)/det,u=(ax*dz-az*dx)/det;
   if(t<0||t>reach||u<0||u>1||closest&&t>=closest.distance)continue;
   const len=Math.hypot(ex,ez);let nx=ez/len,nz=-ex/len;if(nx*dx+nz*dz>0){nx=-nx;nz=-nz;}
   closest={kind:'punch',buildingId:String(b.id),x:w.x+dx*t,y,z:w.z+dz*t,nx,ny:0,nz,distance:t,radius:1.35};
  }
 }
 return closest;
}

// A narrow assist cone makes close wall strikes reliable without hitting behind the player.
export function findPunchInCone(w,buildings,reach=4.8){
 const direct=findPunchTarget(w,buildings,reach);if(direct)return direct;
 let best=null;
 for(const offset of [-.18,-.09,.09,.18]){const hit=findPunchTarget({...w,heading:w.heading+offset},buildings,reach);if(hit&&(!best||hit.distance<best.distance))best=hit;}
 return best;
}
