import {insidePolygon,nearestSegment} from './game.js';
// Shared surface heights and grip keep visuals and movement in agreement.
export const SURFACES=Object.freeze({asphalt:{height:0,grip:1,kind:'asphalt'},sidewalk:{height:.16,grip:.95,kind:'sidewalk'},paved:{height:.02,grip:.95,kind:'paved'},gravel:{height:.02,grip:.7,kind:'gravel'},grass:{height:0,grip:.65,kind:'grass'},plaza:{height:0,grip:.9,kind:'plaza'}});
export function spatialIndex(items,boundsFor,size=64){
 const cells=new Map();for(const item of items){const b=boundsFor(item);for(let x=Math.floor(b.minX/size);x<=Math.floor(b.maxX/size);x++)for(let z=Math.floor(b.minZ/size);z<=Math.floor(b.maxZ/size);z++){const key=`${x},${z}`;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(item);}}
 return (x,z)=>cells.get(`${Math.floor(x/size)},${Math.floor(z/size)}`)||[];
}
export function createTerrain(lines,areas){
 const roadNear=spatialIndex(lines,s=>{const r=s.road.width/2+2.5;return {minX:Math.min(s.a[0],s.b[0])-r,maxX:Math.max(s.a[0],s.b[0])+r,minZ:Math.min(s.a[1],s.b[1])-r,maxZ:Math.max(s.a[1],s.b[1])+r};});
 const parkNear=spatialIndex(areas.filter(a=>a.kind==='park'),a=>({minX:Math.min(...a.polygon.map(p=>p[0])),maxX:Math.max(...a.polygon.map(p=>p[0])),minZ:Math.min(...a.polygon.map(p=>p[1])),maxZ:Math.max(...a.polygon.map(p=>p[1]))}));
 function terrain(x,z){let sidewalk=false,path=null;
  for(const s of roadNear(x,z)){const p=nearestSegment(x,z,s.a,s.b),d=Math.hypot(p.x-x,p.z-z),drive=s.road.width>5&&s.road.kind!=='pedestrian';
   if(d<=s.road.width/2){if(drive)return SURFACES.asphalt;path=['gravel','fine_gravel','compacted','dirt','ground'].includes(s.road.surface)?SURFACES.gravel:SURFACES.paved;}
   if(drive&&d>s.road.width/2&&d<=s.road.width/2+2.4&&!s.road.bridge)sidewalk=true;
  }
  if(sidewalk)return SURFACES.sidewalk;if(path)return path;
  if(parkNear(x,z).some(a=>insidePolygon(x,z,a.polygon)))return SURFACES.grass;
  return SURFACES.plaza;
 }
 return {terrain,roadNear};
}

export function fixtureObstacles(features){return features.filter(f=>['tree','bench','fountain','street_lamp'].includes(f.kind)).map(f=>{
 const r=f.kind==='tree'?.24:f.kind==='fountain'?1.5:f.kind==='bench'?.42:.12;
 return {kind:'fixture',wallRunnable:false,phaseable:true,height:f.kind==='bench'?.8:f.kind==='fountain'?.7:3,polygon:Array.from({length:8},(_,i)=>[f.x+Math.cos(i*Math.PI/4)*r,f.z+Math.sin(i*Math.PI/4)*r])};});}
