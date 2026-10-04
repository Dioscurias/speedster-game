import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {nearestRoad,unproject} from './austin.js';
import {createCityDetails} from './city-details.js';
import {nearestSegment} from './game.js';
const mod=(n,m)=>((n%m)+m)%m;
function geo(positions,uv=[]){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv.length?uv:new Array(positions.length/3*2).fill(0),2));g.computeVertexNormals();return g;}
export function ribbon(a,b,width,y){const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),nx=-dz/length*width/2,nz=dx/length*width/2;const p=[[a[0]+nx,y,a[1]+nz],[a[0]-nx,y,a[1]-nz],[b[0]-nx,y,b[1]-nz],[b[0]+nx,y,b[1]+nz]];return geo([...p[0],...p[2],...p[1],...p[0],...p[3],...p[2]],[0,0,width/4,length/4,width/4,0,0,0,0,length/4,width/4,length/4]);}
function polygonShape(points){const shape=new THREE.Shape();points.forEach((p,i)=>i?shape.lineTo(p[0],-p[1]):shape.moveTo(p[0],-p[1]));shape.closePath();return shape;}
function combine(parts,material,parent){if(!parts.length)return;const g=mergeGeometries(parts.map(p=>p.index?p.toNonIndexed():p));if(!g)return;const mesh=new THREE.Mesh(g,material);mesh.receiveShadow=true;mesh.castShadow=true;parent.add(mesh);parts.forEach(p=>p.dispose());return mesh;}
export async function createCity(scene,map,carModel){
 const root=new THREE.Group();scene.add(root);const loader=new THREE.TextureLoader();
 const [asphalt,normal,concrete,brick,brickNormal,grass,grassNormal]=await Promise.all([loader.loadAsync('/assets/textures/asphalt.jpg'),loader.loadAsync('/assets/textures/asphalt-normal.jpg'),loader.loadAsync('/assets/textures/concrete.jpg'),loader.loadAsync('/assets/textures/brick.jpg'),loader.loadAsync('/assets/textures/brick-normal.jpg'),loader.loadAsync('/assets/textures/grass.jpg'),loader.loadAsync('/assets/textures/grass-normal.jpg')]);
 for(const t of [asphalt,normal,concrete,brick,brickNormal,grass,grassNormal]){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;}asphalt.colorSpace=concrete.colorSpace=brick.colorSpace=grass.colorSpace=THREE.SRGBColorSpace;
 const roadMat=new THREE.MeshStandardMaterial({map:asphalt,normalMap:normal,normalScale:new THREE.Vector2(.24,.24),roughness:.88,color:'#8d989e'});
 const concreteMat=new THREE.MeshStandardMaterial({map:concrete,roughness:.86,color:'#d8d2c5'}),greenMat=new THREE.MeshStandardMaterial({map:grass,normalMap:grassNormal,normalScale:new THREE.Vector2(.5,.5),color:'#a7bd89',roughness:1}),waterMat=new THREE.MeshStandardMaterial({color:'#397987',metalness:.5,roughness:.15});
 const neutralize=mat=>{mat.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb=mix(diffuseColor.rgb,vec3(dot(diffuseColor.rgb,vec3(.2126,.7152,.0722))),.8);');};mat.customProgramCacheKey=()=> 'neutral-texture';};neutralize(concreteMat);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(map.bounds.maxX-map.bounds.minX,map.bounds.maxZ-map.bounds.minZ),concreteMat.clone());ground.rotation.x=-Math.PI/2;ground.position.set((map.bounds.minX+map.bounds.maxX)/2,-.08,(map.bounds.minZ+map.bounds.maxZ)/2);ground.geometry.attributes.uv.array.forEach((_,i,a)=>a[i]*=300);ground.receiveShadow=true;root.add(ground);
 const areaParts={park:[],water:[]};for(const a of map.areas){const g=new THREE.ShapeGeometry(polygonShape(a.polygon));g.rotateX(-Math.PI/2);g.translate(0,a.kind==='water'?-.035:.006,0);const uv=g.attributes.uv;for(let i=0;i<uv.array.length;i++)uv.array[i]/=a.kind==='park'?12:30;areaParts[a.kind].push(g);}
 combine(areaParts.park,greenMat,root);combine(areaParts.water,waterMat,root);
 const roads=[],sidewalks=[],curbs=[],paths=[],lines=[];
 for(const s of map.lines){const centerX=(s.a[0]+s.b[0])/2,centerZ=(s.a[1]+s.b[1])/2;if(centerX<map.bounds.minX-50||centerX>map.bounds.maxX+50||centerZ<map.bounds.minZ-50||centerZ>map.bounds.maxZ+50)continue;
  if(s.road.width<=3||s.road.kind==='pedestrian'){paths.push(ribbon(s.a,s.b,s.road.width,.027));continue;}
  roads.push(ribbon(s.a,s.b,s.road.width,.035));
  if(!s.road.bridge){const ux=(s.b[0]-s.a[0])/s.length,uz=(s.b[1]-s.a[1])/s.length;
   for(let d=0;d<s.length;d+=4){const end=Math.min(d+4,s.length),mid=(d+end)/2;
    for(const side of [-1,1]){const offset=(s.road.width/2+1.2)*side,x=s.a[0]+ux*mid-uz*offset,z=s.a[1]+uz*mid+ux*offset;
     if(map.terrain(x,z).kind!=='sidewalk')continue;
     const a=[s.a[0]+ux*d-uz*offset,s.a[1]+uz*d+ux*offset],b=[s.a[0]+ux*end-uz*offset,s.a[1]+uz*end+ux*offset];sidewalks.push(ribbon(a,b,2.4,.16));
     const edge=(s.road.width/2+.08)*side,cx=s.a[0]+ux*mid-uz*edge,cz=s.a[1]+uz*mid+ux*edge;
     if(map.terrain(cx,cz).kind==='sidewalk'){const g=new THREE.BoxGeometry(.14,.16,end-d);g.rotateY(Math.atan2(ux,uz));g.translate(cx,.08,cz);curbs.push(g);}
    }
   }
  }
  if(s.road.width>=9&&s.length>8){for(let d=4;d<s.length-4;d+=12){const end=Math.min(d+4,s.length-3),a=[s.a[0]+(s.b[0]-s.a[0])*d/s.length,s.a[1]+(s.b[1]-s.a[1])*d/s.length],b=[s.a[0]+(s.b[0]-s.a[0])*end/s.length,s.a[1]+(s.b[1]-s.a[1])*end/s.length];lines.push(ribbon(a,b,.17,.054));}}
 }
 combine(curbs,new THREE.MeshStandardMaterial({color:'#c4bcaa',roughness:.9}),root);combine(sidewalks,concreteMat,root);combine(paths,concreteMat,root);combine(roads,roadMat,root);combine(lines,new THREE.MeshStandardMaterial({color:'#d8c592',roughness:.85}),root);
 const chunks=new Map();const getChunk=(x,z)=>{const key=`${Math.floor(x/220)},${Math.floor(z/220)}`;if(!chunks.has(key))chunks.set(key,{walls:Array.from({length:5},()=>[]),windows:[],roof:[],trim:[],x:Math.floor(x/220)*220+110,z:Math.floor(z/220)*220+110});return chunks.get(key);};
 const wallMats=[new THREE.MeshStandardMaterial({map:brick,normalMap:brickNormal,normalScale:new THREE.Vector2(.55,.55),color:'#c4ac9b',roughness:.87}),...['#dfd6c5','#d3d6d1','#b0c2cc','#dec8b2'].map(color=>new THREE.MeshStandardMaterial({map:concrete,color,roughness:.72}))];
 wallMats.slice(1).forEach(neutralize);
 const glass=new THREE.MeshPhysicalMaterial({color:'#527e93',metalness:.55,roughness:.16,clearcoat:1,clearcoatRoughness:.08,side:THREE.DoubleSide});
 const roofMat=new THREE.MeshStandardMaterial({color:'#6c7475',roughness:.92}),trimMat=new THREE.MeshStandardMaterial({color:'#ada796',roughness:.7});
 for(const b of map.buildings){const cx=b.polygon.reduce((v,p)=>v+p[0],0)/b.polygon.length,cz=b.polygon.reduce((v,p)=>v+p[1],0)/b.polygon.length,c=getChunk(cx,cz);
  const style=b.material==='brick'||b.height<18?0:1+Number(b.id)%4;
  const shape=polygonShape(b.polygon),g=new THREE.ExtrudeGeometry(shape,{depth:b.height,bevelEnabled:false,steps:1});g.rotateX(-Math.PI/2);const uv=g.attributes.uv;for(let i=0;i<uv.array.length;i++)uv.array[i]/=style===0?3:6;c.walls[style].push(g);
  const roof=new THREE.ShapeGeometry(shape);roof.rotateX(-Math.PI/2);roof.translate(0,b.height+.015,0);c.roof.push(roof);
  const positions=[];let signed=0;for(let i=0;i<b.polygon.length;i++){const a=b.polygon[i],e=b.polygon[(i+1)%b.polygon.length];signed+=a[0]*e[1]-e[0]*a[1];}
  for(let i=0;i<b.polygon.length;i++){const a=b.polygon[i],e=b.polygon[(i+1)%b.polygon.length],dx=e[0]-a[0],dz=e[1]-a[1],length=Math.hypot(dx,dz);if(length<4)continue;
   const ux=dx/length,uz=dz/length,nx=uz*(signed>0?1:-1)*.045,nz=-ux*(signed>0?1:-1)*.045,columns=Math.min(24,Math.floor(length/3.4)),floors=Math.min(36,Math.floor((b.height-2)/3.5));
   for(let floor=0;floor<floors;floor++)for(let col=0;col<columns;col++){const middle=(col+.5)*length/columns,half=Math.min(1.2,length/columns*.36),y=(floor===0?.65:1.5)+floor*(b.height-2)/Math.max(1,floors),h=floor===0?2.5:Math.min(2.25,(b.height-2)/Math.max(1,floors)*.64);const p1=[a[0]+ux*(middle-half)+nx,y,a[1]+uz*(middle-half)+nz],p2=[a[0]+ux*(middle+half)+nx,y,a[1]+uz*(middle+half)+nz],p3=[p2[0],y+h,p2[2]],p4=[p1[0],y+h,p1[2]];positions.push(...p1,...p2,...p3,...p1,...p3,...p4);}
  }
  for(let i=0;i<b.polygon.length;i++){const a=b.polygon[i],e=b.polygon[(i+1)%b.polygon.length],length=Math.hypot(e[0]-a[0],e[1]-a[1]);if(length<1)continue;const yaw=Math.atan2(e[0]-a[0],e[1]-a[1]);
   for(const y of [3.35,b.height]){if(y>b.height+.01)continue;const cornice=new THREE.BoxGeometry(.22,.22,length+.1);cornice.rotateY(yaw);cornice.translate((a[0]+e[0])/2,y,(a[1]+e[1])/2);c.trim.push(cornice);}
  }
  if(positions.length)c.windows.push(geo(positions));
 }
 const chunkGroups=[];for(const c of chunks.values()){const group=new THREE.Group();root.add(group);c.walls.forEach((parts,i)=>combine(parts,wallMats[i],group));combine(c.windows,glass,group);combine(c.roof,roofMat,group);combine(c.trim,trimMat,group);chunkGroups.push({...c,group,walls:null,windows:null});}
 // Warm granite and a smooth dome make the mapped Capitol recognizable; architecture remains generalized.
 const capitol=map.buildings.find(b=>b.name==='Texas State Capitol');if(capitol){const xs=capitol.polygon.map(p=>p[0]),zs=capitol.polygon.map(p=>p[1]),cx=(Math.min(...xs)+Math.max(...xs))/2,cz=(Math.min(...zs)+Math.max(...zs))/2;const stone=new THREE.MeshStandardMaterial({color:'#cfa78d',roughness:.7});const drum=new THREE.Mesh(new THREE.CylinderGeometry(9,10,9,40),stone);drum.position.set(cx,capitol.height+4,cz);root.add(drum);const dome=new THREE.Mesh(new THREE.SphereGeometry(9,40,24,0,Math.PI*2,0,Math.PI/2),stone);dome.scale.y=1.4;dome.position.set(cx,capitol.height+8,cz);root.add(dome);}
 const details=createCityDetails(root,map);
 const traffic=[];const routes=map.lines.filter(s=>s.road.width>=9&&s.length>65&&s.road.name&&Math.abs(s.a[0])<850&&Math.abs(s.a[1])<1400);
 for(let i=0;i<Math.min(18,routes.length);i++){const route=routes[Math.floor(i*routes.length/18)%routes.length],model=carModel.clone(true);model.traverse(o=>{if(o.isMesh){o.castShadow=true;if(o.material.name==='Body_Color'){o.material=o.material.clone();o.material.color.set(['#913131','#c8cace','#244b61','#c3a65f'][i%4]);}}});root.add(model);traffic.push({model,route,offset:i*43,x:0,z:0,vx:0,vz:0});}
 const pickups=[];const boltShape=new THREE.Shape();boltShape.moveTo(.22,.65);boltShape.lineTo(-.38,-.08);boltShape.lineTo(-.04,-.08);boltShape.lineTo(-.2,-.65);boltShape.lineTo(.4,.15);boltShape.lineTo(.08,.15);boltShape.closePath();const boltGeo=new THREE.ExtrudeGeometry(boltShape,{depth:.07,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:2,steps:1}),gold=new THREE.MeshBasicMaterial({color:'#fff59b'});
 const pickupRoutes=map.lines.filter(s=>s.road.width>=9&&s.length>25);
 for(let i=0;i<Math.min(140,pickupRoutes.length);i++){const r=pickupRoutes[Math.floor(i*pickupRoutes.length/140)%pickupRoutes.length],x=(r.a[0]+r.b[0])/2,z=(r.a[1]+r.b[1])/2;if(map.collider.blocked(x,z))continue;const model=new THREE.Mesh(boltGeo,gold);model.position.set(x,1.3,z);root.add(model);pickups.push({model,x,z,available:0});}
 function update(world){details.update(world);root.position.set(-world.x,0,-world.z);for(const c of chunkGroups)c.group.visible=Math.hypot(c.x-world.x,c.z-world.z)<950;
  for(const car of traffic){const {a,b,length}=car.route,phase=mod(world.worldTime*8+car.offset,length*2),d=phase<length?phase:2*length-phase,sign=phase<length?1:-1,ux=(b[0]-a[0])/length,uz=(b[1]-a[1])/length;car.x=a[0]+ux*d-uz*2.6;car.z=a[1]+uz*d+ux*2.6;car.vx=ux*8*sign;car.vz=uz*8*sign;car.model.position.set(car.x,.07,car.z);car.model.rotation.y=Math.atan2(car.vx,car.vz);car.model.visible=Math.hypot(car.x-world.x,car.z-world.z)<500;}
  for(const p of pickups){p.model.visible=p.available<=world.elapsed&&Math.hypot(p.x-world.x,p.z-world.z)<500;p.model.rotation.y=world.worldTime*1.4;}
 }
 function drawMap(canvas,world,viewYaw){const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,scale=.27;ctx.fillStyle='#17201c';ctx.fillRect(0,0,w,h);const project=p=>[w/2+(p[0]-world.x)*scale,h/2+(p[1]-world.z)*scale];
  for(const a of map.areas){ctx.fillStyle=a.kind==='water'?'#3d6269':'#2b402c';ctx.beginPath();a.polygon.forEach((p,i)=>{const q=project(p);i?ctx.lineTo(...q):ctx.moveTo(...q);});ctx.fill();}
  ctx.fillStyle='#303a33';for(const b of map.buildings){const p=b.polygon[0];if(Math.abs(p[0]-world.x)>550||Math.abs(p[1]-world.z)>350)continue;ctx.beginPath();b.polygon.forEach((p,i)=>{const q=project(p);i?ctx.lineTo(...q):ctx.moveTo(...q);});ctx.fill();}
  ctx.strokeStyle='#a8b9a188';for(const r of map.roads){if(r.width<5)continue;ctx.lineWidth=Math.max(1,r.width*scale*.65);ctx.beginPath();r.points.forEach((p,i)=>{const q=project(p);i?ctx.lineTo(...q):ctx.moveTo(...q);});ctx.stroke();}
  ctx.save();ctx.translate(w/2,h/2);ctx.rotate(viewYaw);ctx.fillStyle='#f2ff7830';ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,30,-Math.PI/2-.45,-Math.PI/2+.45);ctx.fill();ctx.rotate(world.heading-viewYaw);ctx.fillStyle='#efff8b';ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(4,5);ctx.lineTo(0,2);ctx.lineTo(-4,5);ctx.fill();ctx.restore();ctx.fillStyle='#e1e9d8';ctx.font='9px sans-serif';ctx.fillText('N ↑',8,13);ctx.fillText('100 m',w-37,h-7);ctx.fillRect(w-38,h-15,27,1);
 }
 return {root,traffic,pickups,detailStats:details.counts,update,drawMap,streetAt:(x,z)=>nearestRoad(x,z,map.lines)?.road.name||'Downtown Austin',coordinates:(x,z)=>unproject(x,z,map.origin)};
}
