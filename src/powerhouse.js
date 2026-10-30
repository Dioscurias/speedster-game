import {stepWorld,PHYSICS,createCollider} from './game.js';

export const ATLAS_PHYSICS=Object.freeze({...PHYSICS,runSpeed:24,boostSpeed:65,jumpSpeed:28,jumpCutSpeed:20,airAcceleration:25,wallRunning:false});
const empty=createCollider();
export function toggleFlight(w){
 if(w.hero!=='atlas'||w.status!=='running')return false;
 w.airBraking=false;w.flightBank=0;w.flying=!w.flying;w.slamming=false;w.wallRunning=false;w.wall=null;w.vy=0;
 if(w.flying){w.y+=w.grounded?1.5:0;w.grounded=false;}
 return w.flying;
}
export function stepHero(w,input,dt,collider=empty,physics=PHYSICS){
 if(w.hero!=='atlas')return stepWorld(w,input,dt,collider,physics);
 if(w.status!=='running'||dt<=0)return;
 if(!input.boost)w.boostExhausted=false;
 if(w.energy<=2&&input.boost)w.boostExhausted=true;
 w.punchTime=Math.max(0,(w.punchTime||0)-dt);
 const slam=!!(input.slam||w.slamRequested);w.slamRequested=false;
 if(slam&&!w.grounded){w.flying=true;w.slamming=true;}
 if(!w.flying)return stepWorld(w,{...input,boost:input.boost&&!w.boostExhausted,phase:false,slow:false},dt,collider,ATLAS_PHYSICS);
 w.elapsed+=dt;w.worldTime+=dt;w.phasing=false;w.wallRunning=false;w.impact=Math.max(0,w.impact-dt*3);w.landingImpact=0;
 const right=Number(!!input.right)-Number(!!input.left),forward=Number(!!input.forward)-Number(!!input.backward),yaw=input.viewYaw||0;
 w.flightBank=((w.flightBank||0)+(-right*.42-(w.flightBank||0))*(1-Math.exp(-dt*5)));
 const vertical=Number(!!input.ascend)-Number(!!input.descend),moving=!!(right||forward||vertical);
 w.airBraking=!!input.brake&&!w.slamming;
 w.boosting=!!input.boost&&moving&&w.energy>2&&!w.slamming&&!w.airBraking&&!w.boostExhausted;
 w.energy=Math.max(0,Math.min(100,w.energy+dt*(w.boosting?-24:14)));
 const speed=w.airBraking||w.slamming?0:w.boosting?220:72,normal=Math.max(1,Math.hypot(right,forward,vertical));
 const tx=(right*Math.cos(yaw)+forward*Math.sin(yaw))*speed/normal,tz=(right*Math.sin(yaw)-forward*Math.cos(yaw))*speed/normal,ty=vertical*speed/normal;
 const response=1-Math.exp(-dt*(w.airBraking?12:w.slamming?9:!moving?9:w.boosting?4.5:6));
 w.vx+=(tx-w.vx)*response;w.vz+=(tz-w.vz)*response;w.vy+=((w.slamming?-135:ty)-w.vy)*(w.slamming?Math.min(1,dt*14):response);
 const count=Math.max(1,Math.ceil(Math.hypot(w.vx,w.vy,w.vz)*dt/.2)),h=dt/count;
 for(let i=0;i<count&&w.flying;i++){
  const ox=w.x,oz=w.z,oy=w.y;w.x+=w.vx*h;w.z+=w.vz*h;
  // Resolve the character's feet and torso, including map bounds.
  for(const y of [w.y,w.y+1.6])for(const c of collider.contacts(w.x,w.z,y)){
   w.x+=c.nx*(c.depth+.001);w.z+=c.nz*(c.depth+.001);const inward=w.vx*c.nx+w.vz*c.nz;
   if(inward<0){w.vx-=inward*c.nx;w.vz-=inward*c.nz;w.impact=Math.min(1,-inward/100);}
  }
  w.y=Math.min(600,w.y+w.vy*h);if(w.y===600)w.vy=Math.min(0,w.vy);
  const floor=collider.surface?.(w.x,w.z,oy)??0;
  if(w.y<=floor&&w.vy<=0){w.y=floor;w.landingImpact=Math.min(1,Math.abs(w.vy)/35);w.vy=0;if(w.slamming){w.vx=w.vz=0;}w.flying=false;w.slamming=false;w.airBraking=false;w.grounded=true;}
  w.distance+=Math.hypot(w.x-ox,w.y-oy,w.z-oz);
 }
 w.speed=Math.hypot(w.vx,w.vy,w.vz);w.topSpeed=Math.max(w.topSpeed,w.speed);
 if(Math.hypot(w.vx,w.vz)>.5)w.heading=Math.atan2(w.vx,-w.vz);
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
