import {createTerrain,fixtureObstacles} from './terrain.js';
import {createCollider,nearestSegment,PLAYER_RADIUS} from './game.js';
export function project(lon,lat,origin){return {x:(lon-origin.lon)*111320*Math.cos(origin.lat*Math.PI/180),z:-(lat-origin.lat)*111320};}
export function unproject(x,z,origin){return {lon:origin.lon+x/(111320*Math.cos(origin.lat*Math.PI/180)),lat:origin.lat-z/111320};}
export function clipPolygon(polygon,bounds){let p=polygon;for(const [axis,value,sign] of [[0,bounds.minX,1],[0,bounds.maxX,-1],[1,bounds.minZ,1],[1,bounds.maxZ,-1]]){const out=[];for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],ain=(a[axis]-value)*sign>=0,bin=(b[axis]-value)*sign>=0;if(ain)out.push(a);if(ain!==bin){const f=(value-a[axis])/(b[axis]-a[axis]);out.push([a[0]+f*(b[0]-a[0]),a[1]+f*(b[1]-a[1])]);}}p=out;}return p;}
export function segments(roads){const result=[];for(const road of roads)for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);if(length>.1)result.push({a,b,length,road});}return result;}
export function nearestRoad(x,z,lines,namedOnly=true){let best=null,distance=Infinity;for(const line of lines){if(namedOnly&&!line.road.name)continue;const p=nearestSegment(x,z,line.a,line.b),d=Math.hypot(p.x-x,p.z-z);if(d<distance){best={...line,point:p,distance:d};distance=d;}}return best;}
export function prepareMap(data){
 const bounds=data.bounds;
 data.buildings=data.buildings.map(b=>({...b,polygon:clipPolygon(b.polygon,bounds)})).filter(b=>b.polygon.length>2);
 data.areas=data.areas.map(a=>({...a,polygon:clipPolygon(a.polygon,bounds)})).filter(a=>a.polygon.length>2);
 const lines=segments(data.roads),buildings=createCollider(data.buildings,bounds),waters=data.areas.filter(a=>a.kind==='water').map(a=>({...a,height:Infinity})),water=createCollider(waters),bridges=lines.filter(s=>s.road.bridge);
 function waterContacts(x,z){
  const bankContacts=water.contacts(x,z,0);if(!bankContacts.length)return [];
  let bridgeContact=null;
  for(const bridge of bridges){const p=nearestSegment(x,z,bridge.a,bridge.b),dx=p.x-x,dz=p.z-z,distance=Math.hypot(dx,dz),halfWidth=Math.max(.5,bridge.road.width/2-PLAYER_RADIUS);
   if(distance<=halfWidth)return [];
   const depth=distance-halfWidth;if(!bridgeContact||depth<bridgeContact.depth)bridgeContact={nx:dx/distance,nz:dz/distance,depth};
  }
  // Water is solid except for bridge corridors. Resolve to the nearest valid
  // edge, which may be the bridge directly beside us rather than the riverbank.
  return bankContacts.map(c=>bridgeContact&&bridgeContact.depth<c.depth?bridgeContact:c);
 }
 const {terrain,roadNear}=createTerrain(lines,data.areas);
 // Fill sparse boulevard stretches with explicitly generated streetscape,
 // keeping surveyed features and inferred detail separate in the data.
 const features=[...(data.features||[])],mappedFeatureCount=features.length,occupied=new Set(features.filter(f=>f.kind==='tree').map(f=>`${Math.round(f.x/10)},${Math.round(f.z/10)}`));
 for(const line of lines){if(line.road.width<13||line.road.bridge||!line.road.name||line.length<35)continue;
  const ux=(line.b[0]-line.a[0])/line.length,uz=(line.b[1]-line.a[1])/line.length;
  for(let d=16;d<line.length-12;d+=32)for(const side of [-1,1]){const offset=(line.road.width/2+1.5)*side,x=line.a[0]+ux*d-uz*offset,z=line.a[1]+uz*d+ux*offset,key=`${Math.round(x/10)},${Math.round(z/10)}`;
   if(x<bounds.minX||x>bounds.maxX||z<bounds.minZ||z>bounds.maxZ||occupied.has(key)||buildings.blocked(x,z)||waterContacts(x,z).length||terrain(x,z).kind!=='sidewalk')continue;
   occupied.add(key);features.push({id:String(9000000000+features.length),kind:'tree',name:'',x,z,generated:true});
  }
 }
 const fixtures=createCollider(fixtureObstacles(features.filter(f=>!buildings.blocked(f.x,f.z))));
 const collider={terrain,surface:(x,z,y)=>Math.max(terrain(x,z).height,buildings.surface(x,z,y)),contacts:(x,z,y=0)=>[...buildings.contacts(x,z,y),...fixtures.contacts(x,z,y),...waterContacts(x,z)],blocked:(x,z,y=0)=>buildings.blocked(x,z,y)||fixtures.blocked(x,z,y)||waterContacts(x,z).length>0};
 const congress=lines.filter(s=>s.road.name==='Congress Avenue'),start=nearestRoad(0,0,congress);let spawn=start?start.point:{x:0,z:0};
 if(collider.blocked(spawn.x,spawn.z)){for(const line of congress){const p={x:(line.a[0]+line.b[0])/2,z:(line.a[1]+line.b[1])/2};if(!collider.blocked(p.x,p.z)){spawn=p;break;}}}
 const yaw=start?Math.atan2(start.b[0]-start.a[0],-(start.b[1]-start.a[1])):.3;
 return {...data,features,mappedFeatureCount,lines,terrain,roadNear,buildingCollider:buildings,collider,spawn,spawnYaw:Math.cos(yaw)<0?yaw+Math.PI:yaw};
}
