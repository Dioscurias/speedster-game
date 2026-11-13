export {FLIGHT} from './flight/flight-config.js';
export {ATLAS_PHYSICS,stepHero,resetFlight,toggleFlight,flightTelemetry} from './flight/index.js';

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
