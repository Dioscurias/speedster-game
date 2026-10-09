import * as THREE from 'three';
import {ABILITY} from './parkour-abilities.js';
export function applyBlast(target,shot,direction){
 if(target.broken)return;
 if(target.breakable){target.health-=shot.damage;if(target.health<=0)target.broken=true;}
 target.vx+=direction.x*shot.force;target.vz+=direction.z*shot.force;target.vy+=Math.max(2,direction.y*shot.force);
}
export class ParkourCombat {
 constructor(scene){
  this.root=new THREE.Group();scene.add(this.root);this.shots=[];this.effects=[];this.targets=[];this.ray=new THREE.Raycaster();this.geometry=new THREE.SphereGeometry(.22,10,8);this.kick=0;this.shake=0;
  this.line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),new THREE.LineBasicMaterial({color:'#65dcff',transparent:true,opacity:.6}));this.root.add(this.line);this.line.visible=false;
  this.orb=new THREE.Mesh(this.geometry,new THREE.MeshBasicMaterial({color:'#91ebff'}));this.root.add(this.orb);this.orb.visible=false;this.reset();
 }
 reset(){
  for(const item of [...this.shots,...this.effects,...this.targets]){this.root.remove(item.mesh);item.mesh.geometry!==this.geometry&&item.mesh.geometry.dispose();item.mesh.material.dispose();}
  this.shots=[];this.effects=[];this.targets=[];this.line.visible=this.orb.visible=false;this.kick=this.shake=0;
  for(const [x,z,breakable] of [[2.5,-4,true],[-2.5,-6,false],[2,-24,true]]){const mesh=new THREE.Mesh(new THREE.BoxGeometry(1.2,1.2,1.2),new THREE.MeshStandardMaterial({color:breakable?'#db9b66':'#499fbc',emissive:breakable?'#63301a':'#124353',emissiveIntensity:.4,roughness:.7}));mesh.position.set(x,.6,z);mesh.castShadow=true;this.root.add(mesh);this.targets.push({mesh,x,y:0,z,vx:0,vy:0,vz:0,health:60,breakable,broken:false});}
 }
 blockedVolume(x,y,z,r=.4,h=1.86){return this.targets.some(t=>!t.broken&&Math.abs(x-t.x)<.6+r&&Math.abs(z-t.z)<.6+r&&y<t.y+1.2&&y+h>t.y);}
 burst(point,count=15){for(let i=0;i<count;i++){const mesh=new THREE.Mesh(this.geometry,new THREE.MeshBasicMaterial({color:i%3?'#64dfff':'#efffff',transparent:true,depthWrite:false}));mesh.position.copy(point);mesh.scale.setScalar(.3+Math.random()*.6);this.root.add(mesh);const velocity=new THREE.Vector3(Math.random()-.5,Math.random()-.2,Math.random()-.5).multiplyScalar(7);this.effects.push({mesh,velocity,age:0,life:.35+Math.random()*.15});}}
 blink(from,to){this.burst(new THREE.Vector3(from.x,from.y+.8,from.z));this.burst(new THREE.Vector3(to.x,to.y+.8,to.z));const mesh=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(from.x,from.y+.9,from.z),new THREE.Vector3(to.x,to.y+.9,to.z)]),new THREE.LineBasicMaterial({color:'#7de6ff',transparent:true,depthWrite:false}));this.root.add(mesh);this.effects.push({mesh,velocity:new THREE.Vector3(),age:0,life:.22});this.kick=3;}
 solids(map){const list=[];map.root.traverse(o=>{if(o.isMesh&&o.userData.blastSolid!==false&&o.visible)list.push(o);});for(const t of this.targets)if(!t.broken)list.push(t.mesh);return list;}
 aim(camera,hand,w,map){camera.updateMatrixWorld();map.root.updateMatrixWorld(true);this.root.updateMatrixWorld(true);this.ray.setFromCamera(new THREE.Vector2(0,0),camera);this.ray.far=ABILITY.projectileRange;const hits=this.ray.intersectObjects(this.solids(map),false);const point=hits[0]?.point??this.ray.ray.at(ABILITY.projectileRange,new THREE.Vector3());return point.clone().add(new THREE.Vector3(w.x,0,w.z));}
 fire(hand,target,shot){const direction=target.clone().sub(hand).normalize();const mesh=new THREE.Mesh(this.geometry,new THREE.MeshBasicMaterial({color:'#b8faff'}));mesh.scale.setScalar(1+shot.power*1.7);mesh.position.copy(hand);this.root.add(mesh);this.shots.push({mesh,direction,shot,distance:0,trail:0});this.burst(hand,5);}
 update(dt,w,course,map,aiming,charge,hand,target,reduced){
  this.root.position.set(-w.x,0,-w.z);
  this.line.visible=this.orb.visible=aiming;
  if(aiming){this.line.geometry.setFromPoints([hand,target]);this.line.material.color.set(charge>=1?'#f1ffff':'#65dcff');this.orb.position.copy(hand);this.orb.scale.setScalar(.15+charge*.9);}
  if(dt<=0)return;this.kick*=Math.exp(-dt*12);this.shake*=Math.exp(-dt*15);
  for(const t of this.targets){if(t.broken){t.mesh.visible=false;continue;}const steps=Math.max(1,Math.ceil(dt*120)),h=dt/steps;for(let j=0;j<steps;j++){t.x+=t.vx*h;t.z+=t.vz*h;t.vy-=9.81*h;t.y+=t.vy*h;const floor=course.collider.surface(t.x,t.z,t.y+.3);if(t.y<floor){t.y=floor;t.vy=0;}t.vx*=Math.exp(-3*h);t.vz*=Math.exp(-3*h);}if(t.y< -20){t.broken=true;t.mesh.visible=false;}t.mesh.position.set(t.x,t.y+.6,t.z);}
  this.root.updateMatrixWorld(true);map.root.updateMatrixWorld(true);
  for(let i=this.shots.length-1;i>=0;i--){const s=this.shots[i],distance=ABILITY.projectileSpeed*dt,origin=s.mesh.position.clone().sub(new THREE.Vector3(w.x,0,w.z));this.ray.set(origin,s.direction);this.ray.far=distance;const hit=this.ray.intersectObjects(this.solids(map),false)[0];s.distance+=distance;
   if(hit||s.distance>ABILITY.projectileRange){if(hit){const point=hit.point.clone().add(new THREE.Vector3(w.x,0,w.z));this.burst(point,24);this.shake=reduced?0:.08;const t=this.targets.find(t=>t.mesh===hit.object);if(t)applyBlast(t,s.shot,s.direction);}this.root.remove(s.mesh);s.mesh.material.dispose();this.shots.splice(i,1);continue;}
   s.mesh.position.addScaledVector(s.direction,distance);s.trail+=dt;if(s.trail>.025){s.trail=0;this.burst(s.mesh.position,1);}
  }
  for(let i=this.effects.length-1;i>=0;i--){const e=this.effects[i];e.age+=dt;if(e.age>=e.life){this.root.remove(e.mesh);if(e.mesh.geometry!==this.geometry)e.mesh.geometry.dispose();e.mesh.material.dispose();this.effects.splice(i,1);continue;}e.mesh.position.addScaledVector(e.velocity,dt);e.mesh.material.opacity=1-e.age/e.life;}
 }
}
