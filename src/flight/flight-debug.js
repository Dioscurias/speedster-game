import * as THREE from 'three';
import {PLAYER_RADIUS} from '../game.js';
import {FLIGHT as C} from './flight-config.js';

export function createFlightDebug(scene,element){
 const panel=document.createElement('pre');
 panel.className='flight-debug';
 panel.hidden=true;
 element.append(panel);
 const capsule=new THREE.Mesh(new THREE.CapsuleGeometry(PLAYER_RADIUS,C.bodyHeight-2*PLAYER_RADIUS),new THREE.MeshBasicMaterial({color:0x89ffa4,wireframe:true,depthTest:false}));
 const arrow=new THREE.ArrowHelper(new THREE.Vector3(0,1,0),new THREE.Vector3(),1,0xffbf5c);
 const group=new THREE.Group();
 group.add(capsule,arrow);capsule.position.y=C.bodyHeight/2;arrow.position.y=C.bodyHeight/2;
 scene.add(group);group.visible=false;
 window.addEventListener('keydown',event=>{
  if(event.key!=='F3'||event.repeat)return;
  event.preventDefault();panel.hidden=!panel.hidden;
 });
 const vector=new THREE.Vector3();
 return (w,snapshot)=>{
  group.visible=!panel.hidden&&Boolean(snapshot);
  if(panel.hidden)return;
  if(!snapshot){panel.textContent='Select Atlas to inspect flight';return;}
  const {state,previous,velocity,speed,altitude,energy,collisionNormal,reason,transitions}=snapshot;
  panel.textContent=[
   `${state} ← ${previous??'—'}`,
   `Velocity ${velocity.map(n=>n.toFixed(2)).join(', ')} m/s`,
   `${(speed*3.6).toFixed(1)} km/h  |  ${altitude.toFixed(1)} m AGL  |  Energy ${energy.toFixed(1)}`,
   `Normal ${collisionNormal?.map(n=>n.toFixed(2)).join(', ')??'—'}`,
   reason,...transitions
  ].join('\n');
  group.position.set(0,w.y,0);
  arrow.visible=speed>C.hoverSpeed;
  if(arrow.visible){arrow.setDirection(vector.fromArray(velocity).normalize());arrow.setLength(Math.min(12,speed*.13));}
 };
}
