import {FLIGHT as C} from './flight-config.js';

export const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const length=v=>Math.hypot(...v);
const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0);
const unit=(v,n=length(v))=>n?v.map(x=>x/n):[0,0,0];
export const floorAt=(c,x,z,y)=>c.surface?.(x,z,y)??0;

export function thrust(input){
 const forward=Number(!!input.forward)-Number(!!input.backward);
 const right=Number(!!input.right)-Number(!!input.left);
 const lift=Number(!!input.ascend)-Number(!!input.descend);
 const yaw=input.viewYaw||0,pitch=clamp(input.viewPitch||0,-C.maxPitch,C.maxPitch);
 const planar=forward*Math.cos(pitch);
 return {lift,direction:[right*Math.cos(yaw)+planar*Math.sin(yaw),lift-forward*Math.sin(pitch),right*Math.sin(yaw)-planar*Math.cos(yaw)],planar:Boolean(forward||right),pitch};
}
function turnToward(from,to,limit){
 const cos=clamp(dot(from,to),-1,1),angle=Math.acos(cos);
 if(angle<=limit)return to;
 let tangent=to.map((v,i)=>v-from[i]*cos);
 if(length(tangent)<1e-6){
  const axis=Math.abs(from[1])<.9?[0,1,0]:[1,0,0];
  tangent=axis.map((v,i)=>v-from[i]*dot(axis,from));
 }
 return unit(tangent).map((v,i)=>from[i]*Math.cos(limit)+v*Math.sin(limit));
}
function softLimit(position,target,min,max,band,inset){
 const upper=max-position,lower=position-min;
 if(upper<band)return Math.min(target,C.boostSpeed*(upper-inset)/band);
 if(lower<band)return Math.max(target,C.boostSpeed*(inset-lower)/band);
 return target;
}
export function integrate(w,control,motion,c,dt){
 const {state,boostRamp,glideSpeed,slam}=motion,{direction,lift,planar}=control;
 const before=[w.vx,w.vy,w.vz];
 const cap=C.cruiseSpeed+(C.boostSpeed-C.cruiseSpeed)*boostRamp;
 let desired=unit(direction).map(value=>value*(state==='DIVE_SLAM'?Math.max(C.diveSpeed,Math.min(C.boostSpeed,length(before)),cap):cap));
 if(!planar&&boostRamp===0&&state!=='DIVE_SLAM')desired=[0,lift*C.verticalSpeed,0];
 if(state==='BRAKE')desired=[0,lift*C.verticalSpeed,0];
 if(slam)desired=[0,-C.slamSpeed,0];
 if(state==='TAKEOFF')desired=[0,C.launchSpeed,0];
 if(c.bounds){
  desired[0]=softLimit(w.x,desired[0],c.bounds.minX,c.bounds.maxX,C.edgeBand,C.edgeInset);
  desired[2]=softLimit(w.z,desired[2],c.bounds.minZ,c.bounds.maxZ,C.edgeBand,C.edgeInset);
 }
 const ground=c.terrain?.(w.x,w.z)?.height??0;
 desired[1]=softLimit(w.y,desired[1],-Infinity,ground+C.ceiling,C.ceilingBand,C.edgeInset);
 if(state==='WALL_CONTACT')desired=before.map(value=>value*(1-C.wallDrag*dt));
 const target=length(desired);
 // Limits have their own braking authority so a boosted hero can turn inside the buffer.
 const boundary=c.bounds&&(w.x<c.bounds.minX+C.edgeBand||w.x>c.bounds.maxX-C.edgeBand||
  w.z<c.bounds.minZ+C.edgeBand||w.z>c.bounds.maxZ-C.edgeBand);
 const ceiling=w.y>ground+C.ceiling-C.ceilingBand;
 if(boundary||ceiling){
  const limit=(v,target)=>v+clamp(target-v,-C.limitAcceleration*dt,C.limitAcceleration*dt);
  if(boundary){w.vx=limit(w.vx,desired[0]);w.vz=limit(w.vz,desired[2]);}
  if(ceiling)w.vy=limit(w.vy,desired[1]);
  before[0]=w.vx;before[1]=w.vy;before[2]=w.vz;
 }
 const currentSpeed=length(before);
 if(state==='BRAKE'||slam){
  const delta=desired.map((v,i)=>v-before[i]),n=length(delta);
  const factor=n?Math.min(1,(slam?C.slamAcceleration:C.brakeDeceleration)*dt/n):0;
  [w.vx,w.vy,w.vz]=before.map((v,i)=>v+delta[i]*factor);
  return;
 }
 const rate=target>currentSpeed?C.acceleration:state==='GLIDE'?Math.max(C.deceleration,glideSpeed/C.glideTime):C.deceleration;
 const verticalReverse=!planar&&Math.hypot(before[0],before[2])<C.hoverSpeed&&before[1]*desired[1]<0;
 const nextSpeed=verticalReverse?Math.max(0,currentSpeed-C.deceleration*dt):currentSpeed+clamp(target-currentSpeed,-rate*dt,rate*dt);
 const turn=C.cruiseTurn+(C.boostTurn-C.cruiseTurn)*boostRamp;
 const heading=verticalReverse?unit(before):currentSpeed&&target?turnToward(unit(before,currentSpeed),unit(desired,target),turn*dt):unit(target?desired:before);
 [w.vx,w.vy,w.vz]=heading.map(value=>value*nextSpeed);
}

// Sweep the upright collision volume in increments smaller than its radius.
// The map's polygon contacts supply the minimum horizontal separation.
export function sweep(w,c,dt){
 const steps=Math.max(1,Math.ceil(Math.hypot(w.vx,w.vy,w.vz)*dt/C.sweepDistance));
 const h=dt/steps;
 let hit=null;
 for(let i=0;i<steps;i++){
  const x=w.x,y=w.y,z=w.z;
  w.x+=w.vx*h;w.z+=w.vz*h;
  for(let pass=0;pass<3;pass++){
   const contacts=c.contacts(w.x,w.z,w.y);
   if(!contacts.length)break;
   const normal=contacts.reduce((a,b)=>a.depth<b.depth?a:b);
   const {nx,nz,depth}=normal;
   w.x+=nx*(depth+C.skin);w.z+=nz*(depth+C.skin);
   const inward=w.vx*nx+w.vz*nz;
   if(inward<0){w.vx-=nx*inward;w.vz-=nz*inward;}
   if(!hit||-inward>hit.speed)hit={normal:[nx,0,nz],speed:Math.max(0,-inward)};
  }
  const floor=floorAt(c,w.x,w.z,y),next=y+w.vy*h;
  if(w.vy<=0&&next<=floor){
   const speed=-w.vy;
   w.y=floor;w.vy=0;w.distance+=Math.hypot(w.x-x,w.y-y,w.z-z);
   return {landed:true,speed,normal:[0,1,0]};
  }
  if(w.vy&&c.blocked(w.x,w.z,next)){
   if(!hit||Math.abs(w.vy)>hit.speed)hit={normal:[0,-Math.sign(w.vy),0],speed:Math.abs(w.vy)};
   w.vy=0;
  }else w.y=next;
  w.distance+=Math.hypot(w.x-x,w.y-y,w.z-z);
 }
 return hit;
}
