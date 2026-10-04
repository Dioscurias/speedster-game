import * as THREE from 'three';
import {nearestSegment} from './game.js';

const hash=n=>{const v=Math.sin(Number(n)*12.9898+78.233)*43758.5453;return v-Math.floor(v);};
export function nearbyStreet(map,x,z){let best=null;for(const s of map.roadNear(x,z)){if(s.road.width<=5||s.road.kind==='pedestrian')continue;const p=nearestSegment(x,z,s.a,s.b),d=Math.hypot(p.x-x,p.z-z);if(!best||d<best.distance)best={...s,point:p,distance:d};}return best;}
export function createCityDetails(root,map){
 const groups=new Map(),labels=[],counts={trees:0,benches:0,lamps:0,crossings:0,signals:0,pointsOfInterest:0};
 const geometries={box:new THREE.BoxGeometry(1,1,1),cylinder:new THREE.CylinderGeometry(.5,.5,1,10),sphere:new THREE.SphereGeometry(1,14,10),cone:new THREE.ConeGeometry(1,1,10)};
 // An irregular canopy avoids repeating perfectly round foliage clusters.
 const canopy=geometries.sphere.clone(),v=new THREE.Vector3();for(let i=0;i<canopy.attributes.position.count;i++){v.fromBufferAttribute(canopy.attributes.position,i);const scale=1+.1*Math.sin(v.x*12+v.y*9)*Math.cos(v.z*11-v.y*4);v.multiplyScalar(scale);canopy.attributes.position.setXYZ(i,v.x,v.y,v.z);}canopy.computeVertexNormals();geometries.canopy=canopy;
 const mats={wood:new THREE.MeshStandardMaterial({color:'#66503a',roughness:.9}),metal:new THREE.MeshStandardMaterial({color:'#303d42',metalness:.65,roughness:.5}),leaf:new THREE.MeshStandardMaterial({color:'#3d6c41',roughness:.95}),leafLight:new THREE.MeshStandardMaterial({color:'#73945a',roughness:.95}),concrete:new THREE.MeshStandardMaterial({color:'#a99f89',roughness:.9}),white:new THREE.MeshStandardMaterial({color:'#e6e0c9',roughness:.85}),yellow:new THREE.MeshStandardMaterial({color:'#c39c3b',roughness:.75}),red:new THREE.MeshStandardMaterial({color:'#d75a3f',emissive:'#962810',emissiveIntensity:.5}),light:new THREE.MeshStandardMaterial({color:'#ffebbb',emissive:'#ffda91',emissiveIntensity:.5}),water:new THREE.MeshStandardMaterial({color:'#4a99a8',metalness:.35,roughness:.18})};
 const dummy=new THREE.Object3D();
 function add(type,mat,x,y,z,sx,sy,sz,yaw=0){const key=`${Math.floor(x/180)},${Math.floor(z/180)}`;if(!groups.has(key))groups.set(key,{x:Math.floor(x/180)*180+90,z:Math.floor(z/180)*180+90,parts:new Map()});const g=groups.get(key),k=type+':'+mat;if(!g.parts.has(k))g.parts.set(k,[]);dummy.position.set(x,y,z);dummy.rotation.set(0,yaw,0);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();g.parts.get(k).push(dummy.matrix.clone());}
 function label(text,x,y,z,yaw=0,{color='#244c43',width=3.6,height=.65,sprite=false}={}){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const c=canvas.getContext('2d');c.fillStyle=color;c.fillRect(0,0,512,96);c.strokeStyle='#e8e6cf';c.lineWidth=4;c.strokeRect(5,5,502,86);c.fillStyle='#fff8dc';c.font='bold 34px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text.slice(0,36),256,49,480);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const mesh=sprite?new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthWrite:false})):new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));if(sprite)mesh.scale.set(width,height,1);mesh.position.set(x,y,z);mesh.rotation.y=yaw;root.add(mesh);labels.push({mesh,x,z});return mesh;
 }
 const usedCrossings=new Set(),usedSigns=new Set();
 for(const f of map.features||[]){
  const x=f.x,z=f.z;if(x<map.bounds.minX||x>map.bounds.maxX||z<map.bounds.minZ||z>map.bounds.maxZ)continue;
  const street=nearbyStreet(map,x,z),yaw=street?Math.atan2(street.b[0]-street.a[0],street.b[1]-street.a[1]):hash(f.id)*Math.PI*2,y=map.terrain(x,z).height,r=hash(f.id);
  if(f.kind==='tree'){
   if(map.buildingCollider.blocked(x,z))continue;const height=4+r*4;add('cylinder','wood',x,y+height*.32,z,.36+r*.18,height*.64,.36+r*.18);for(let i=0;i<5;i++){const angle=i*Math.PI*.4+hash(Number(f.id)+i)*2,spread=i?1.05:0;add('canopy',i%2?'leaf':'leafLight',x+Math.cos(angle)*spread,y+height*.7+(i%2)*.5,z+Math.sin(angle)*spread,1.25+r*.6,1.4+r*.9,1.25+r*.6);}counts.trees++;
  }else if(f.kind==='bench'){
   for(const side of [-1,1]){const ox=Math.cos(yaw)*side*.62,oz=-Math.sin(yaw)*side*.62;add('box','metal',x+ox,y+.28,z+oz,.08,.56,.5,yaw);}
   for(let i=0;i<4;i++)add('box','wood',x+Math.sin(yaw)*(i-.5)*.11,y+.51,z+Math.cos(yaw)*(i-.5)*.11,1.7,.075,.09,yaw);
   for(let i=0;i<3;i++)add('box','wood',x-Math.sin(yaw)*.22,y+.68+i*.13,z-Math.cos(yaw)*.22,1.7,.095,.065,yaw);counts.benches++;
  }else if(f.kind==='street_lamp'||f.kind==='traffic_signals'){
   const signal=f.kind==='traffic_signals',h=signal?5.2:6.5;add('cylinder','metal',x,y+h/2,z,.14,h,.14);add('box','metal',x+Math.sin(yaw)*.7,y+h,z+Math.cos(yaw)*.7,.13,.12,1.6,yaw);
   if(signal){add('box','metal',x+Math.sin(yaw)*1.4,y+h-.48,z+Math.cos(yaw)*1.4,.37,1.15,.3,yaw);for(let i=0;i<3;i++)add('sphere',i===0?'red':'metal',x+Math.sin(yaw)*1.57,y+h-.12-i*.32,z+Math.cos(yaw)*1.57,.11,.11,.08,yaw);counts.signals++;}
   else{add('box','light',x+Math.sin(yaw)*1.35,y+h-.08,z+Math.cos(yaw)*1.35,.42,.12,.75,yaw);counts.lamps++;}
   if(street?.road.name){const key=street.road.name+Math.floor(x/100)+','+Math.floor(z/100);if(!usedSigns.has(key)){usedSigns.add(key);label(street.road.name,x,3.3,z,yaw,{width:3,height:.48});}}
  }else if(f.kind==='crossing'&&street&&street.distance<street.road.width/2+3){
   const ux=(street.b[0]-street.a[0])/street.length,uz=(street.b[1]-street.a[1])/street.length,cx=street.point.x,cz=street.point.z,key=`${Math.round(cx/9)},${Math.round(cz/9)},${Math.round(yaw*2)}`;if(usedCrossings.has(key))continue;usedCrossings.add(key);
   for(let d=-street.road.width/2+.65;d<street.road.width/2-.5;d+=1.05)add('box','white',cx-uz*d,.06,cz+ux*d,.52,.018,2.6,yaw);counts.crossings++;
  }else if(f.kind==='waste_basket'){add('cylinder','metal',x,y+.45,z,.5,.9,.5);add('cylinder','concrete',x,y+.92,z,.54,.1,.54);
  }else if(f.kind==='bicycle_parking'){for(let i=0;i<3;i++)add('box','metal',x+Math.cos(yaw)*i*.5,y+.35,z-Math.sin(yaw)*i*.5,.045,.7,.65,yaw);
  }else if(f.kind==='bus_stop'){add('cylinder','metal',x,y+1.7,z,.07,3.4,.07);label('BUS · CAPMETRO',x,y+3,z,yaw,{width:.85,height:.4,color:'#244f78'});
  }else if(f.kind==='fountain'){add('cylinder','concrete',x,y+.28,z,3,.56,3);add('cylinder','water',x,y+.57,z,2.7,.035,2.7);add('cylinder','water',x,y+1.05,z,.12,.95,.12);
  }else if(f.kind==='poi'&&f.name&&['attraction','artwork','museum','theatre','library','townhall'].includes(f.category)){
   label(f.name,x,3,z,0,{width:5,height:.7,color:'#254c57',sprite:true});counts.pointsOfInterest++;
  }
 }
 // Generalized bridge structure follows the mapped bridge corridors.
 for(const s of map.lines.filter(s=>s.road.bridge&&s.road.width>5&&s.length>15)){
  const yaw=Math.atan2(s.b[0]-s.a[0],s.b[1]-s.a[1]),ux=(s.b[0]-s.a[0])/s.length,uz=(s.b[1]-s.a[1])/s.length;
  for(const side of [-1,1]){const ox=-uz*(s.road.width/2-.2)*side,oz=ux*(s.road.width/2-.2)*side;add('box','concrete',(s.a[0]+s.b[0])/2+ox,.58,(s.a[1]+s.b[1])/2+oz,.22,1.1,s.length,yaw);}
 }
 const chunks=[];for(const group of groups.values()){const chunk=new THREE.Group();root.add(chunk);for(const [key,matrices] of group.parts){const [type,material]=key.split(':'),mesh=new THREE.InstancedMesh(geometries[type],mats[material],matrices.length);matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.castShadow=!['white','water'].includes(material);mesh.receiveShadow=true;mesh.computeBoundingSphere();chunk.add(mesh);}chunks.push({...group,parts:null,chunk});}
 return {counts,update(world){for(const c of chunks)c.chunk.visible=Math.hypot(c.x-world.x,c.z-world.z)<620;for(const l of labels)l.mesh.visible=Math.hypot(l.x-world.x,l.z-world.z)<150;}};
}
