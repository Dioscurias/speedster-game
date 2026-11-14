import * as THREE from 'three';
import {FLIGHT as C} from './flight-config.js';
import {createBoostShockwave} from './boost-shockwave.js';

export function createFlightView(sceneElement,scene){
 const shockwave=createBoostShockwave(scene);
 const wind=document.createElement('div');
 wind.className='flight-wind';
 wind.setAttribute('aria-hidden','true');
 for(const side of [-1,1])for(let i=0;i<7;i++){
  const line=document.createElement('i');
  line.style.setProperty('--angle',`${side*(i-3)*8}deg`);
  line.style.setProperty('--edge',`${7+(i*7%13)}%`);
  line.style.setProperty('--height',`${13+i*12}%`);
  line.style.setProperty('--delay',`${-i*.137-side*.09}s`);
  wind.append(line);
 }
 sceneElement.append(wind);
 const trail=new THREE.LineSegments(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0xcbeaff,transparent:true,depthWrite:false}));
 const vertices=new THREE.Float32BufferAttribute(new Float32Array(24),3);
 trail.geometry.setAttribute('position',vertices);trail.frustumCulled=false;trail.visible=false;scene.add(trail);
 const bonePosition=new THREE.Vector3(),offset=new THREE.Vector3();
 const limbs=['LeftHand','RightHand','LeftFoot','RightFoot'];
 let speedFov=0,movement=0,lag=0,vapor=0;

 return (world,dt,reducedMotion,animator)=>{
  shockwave(world,dt,reducedMotion);
  const flying=world.hero==='atlas'&&world.flying;
  const speed=flying?THREE.MathUtils.smoothstep(world.speed,C.hoverSpeed,C.boostSpeed):0;
  const ease=1-Math.exp(-dt*7);
  speedFov+=((reducedMotion?0:speed*(C.boostFov-C.cameraFov))-speedFov)*ease;
  movement+=((reducedMotion?0:speed*(world.boosting?1:.62))-movement)*ease;
  lag+=((flying&&world.boosting&&!reducedMotion?speed*C.cameraLag:0)-lag)*ease;
  wind.style.visibility=movement<.005?'hidden':'visible';
  wind.style.opacity=movement<.005?'0':String(Math.sqrt(movement)*.78);
  wind.style.setProperty('--wind-size',.45+movement*.8);
  wind.style.setProperty('--wind-time',`${1.25-movement*.74}s`);
  vapor+=((flying&&world.boosting&&!reducedMotion?speed:0)-vapor)*ease;
  trail.visible=vapor>.005&&Boolean(animator);
  if(trail.visible){
   offset.set(world.vx,world.vy,world.vz).normalize().multiplyScalar(-C.vaporLength*vapor);
   for(const [i,name] of limbs.entries()){
    animator.bones[name]?.bone.getWorldPosition(bonePosition);
    vertices.setXYZ(i*2,bonePosition.x,bonePosition.y,bonePosition.z);
    bonePosition.add(offset);vertices.setXYZ(i*2+1,bonePosition.x,bonePosition.y,bonePosition.z);
   }
   vertices.needsUpdate=true;trail.material.opacity=vapor*C.vaporOpacity;
  }
  wind.classList.toggle('has-boost',flying&&world.boosting);
  return {fov:speedFov,lag};

 };
}
