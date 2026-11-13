import * as THREE from 'three';
import {cameraSweep} from './game.js';
const up=new THREE.Vector3(0,1,0);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function flightPose(w){
 if(w.hero!=='atlas'||!w.flying)return {pitch:0,bank:0,armSpread:0};
 if(w.slamming)return {pitch:-2.7,bank:0,armSpread:.2};
 const horizontal=Math.hypot(w.vx||0,w.vz||0),speed=Math.hypot(horizontal,w.vy||0);
 const travel=clamp((speed-4)/24,0,1);
 const climb=Math.atan2(w.vy||0,Math.max(.1,horizontal));
 if(w.airBraking)return {pitch:-.13,bank:(w.flightBank||0)*.35,armSpread:1,travel:0,flare:1};
 return {pitch:travel*clamp((w.boosting?-1.53:-1.41)+climb,-2.42,-.18),
  bank:(w.flightBank||0)*travel,armSpread:travel*(w.boosting?.18:1.05),travel,flare:0};
}
const blendDirection=(from,to,weight)=>from.map((value,index)=>value+(to[index]-value)*weight);
export function poseHero(animator,model,w,dt=1/60,heading=w.heading||0){
 if(w.hero!=='atlas'||w.status==='paused'||dt<=0)return;
 const pose=flightPose(w),step=clamp(dt,0,.1);
 const motion=animator.atlasMotion??={travel:0,boost:0,flare:0,blend:0,time:0,tilt:new THREE.Quaternion(),target:new THREE.Quaternion(),angles:new THREE.Euler(0,0,0,'YXZ')};
 motion.time+=step;
 // Reach 95% of the next pose in roughly 200 ms.
 const alpha=1-Math.exp(-step*15);
 const ease=(from,to)=>from+(to-from)*alpha;
 motion.travel=ease(motion.travel,pose.travel||0);
 motion.boost=ease(motion.boost,w.flying&&w.boosting?1:0);
 motion.flare=ease(motion.flare,pose.flare||0);
 motion.blend=ease(motion.blend,w.flying?1:0);
 model.scale.set(1.05,1.03,1.04);
 const {travel,boost,flare,blend}=motion,breathing=Math.sin(motion.time*2.1),hover=blend*(1-travel)*(1-flare);
 motion.target.setFromEuler(motion.angles.set(pose.pitch+breathing*.012*hover,0,pose.bank+Math.sin(motion.time*1.4)*.014*hover));
 motion.tilt.slerp(motion.target,alpha);
 model.quaternion.setFromAxisAngle(up,-heading).multiply(motion.tilt);
 if(blend>.01){
  // The asset faces +Z. Counter-rotate its neck and head against the dive so
  // the cowl clears the shoulders and faces down the flight path.
  const bodyPitch=motion.angles.setFromQuaternion(motion.tilt,'YXZ').x;
  const gaze=clamp(bodyPitch,-1.3,0);
  animator.bodyBend('Neck',gaze*.46+breathing*.012*hover);
  animator.bodyBend('Head',gaze*.44);
  for(const side of ['Left','Right']){
   const sign=side==='Left'?1:-1,lead=side==='Right';
   const drift=Math.sin(motion.time*2+sign*.7)*.035*(1-travel);
   const arm=blendDirection([sign*.12,-1,.08+drift],lead?[sign*.15,.97,.28]:[sign*.22,.3,.88],travel);
   const forearm=blendDirection([sign*.04,-1,.13-drift],lead?[sign*.08,.98,.18]:[sign*.12,.93,.34],travel);
   animator.aimLimb?.(side+'Arm',side+'ForeArm',blendDirection(blendDirection(arm,[sign*.11,1,.16],boost),[sign*.94,-.28,.34],flare),blend);
   animator.aimLimb?.(side+'ForeArm',side+'Hand',blendDirection(blendDirection(forearm,[sign*.06,1,.10],boost),[sign*.65,.56,.45],flare),blend);
   animator.aimLimb?.(side+'UpLeg',side+'Leg',blendDirection([-sign*.035,-1,-.06+drift],[sign*.36,-1,.28],flare),blend);
   animator.aimLimb?.(side+'Leg',side+'Foot',blendDirection([sign*.015,-1,-.10-drift],[sign*.11,-1,-.57],flare),blend);
  }
 }
 if(w.punchTime>0){
  const progress=1-Math.min(1,w.punchTime/.4),strike=progress<.3?-progress/.3*.45:Math.sin((progress-.3)/.7*Math.PI)*2.1;
  animator.bodyBend('RightArm',-strike);animator.bodyBend('RightForeArm',-.35*Math.max(0,strike));animator.bodyBend('Spine',-.22*strike,'y');
 }
}

export function inspectHero(model,camera){
 model.updateMatrixWorld(true);camera?.updateMatrixWorld(true);
 let visibleMeshes=0,finite=true;model.traverse(o=>{finite&&=o.matrixWorld.elements.every(Number.isFinite);if(o.isMesh&&o.visible){const materials=Array.isArray(o.material)?o.material:[o.material];if(materials.some(m=>m.opacity>0))visibleMeshes++;}});
 const bounds=new THREE.Box3().setFromObject(model);
 return {visibleMeshes,finite:finite&&[...bounds.min.toArray(),...bounds.max.toArray()].every(Number.isFinite),height:bounds.max.y-bounds.min.y,inView:camera?new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse)).intersectsBox(bounds):true};
}

export function stabilizeFlightCamera(camera,target,w){
 if(w.hero!=='atlas'||!w.flying)return;
 camera.position.y=clamp(camera.position.y,target.y-3,target.y+3);
}

export function followHeroCamera(camera,target,w,collider,dt){
 const anchor=w.y+1.4;
 camera.position.lerp(target,1-Math.exp(-dt*10));
 stabilizeFlightCamera(camera,target,w);
 if(w.phasing)return;
 const {x,y,z}=camera.position;
 const fraction=cameraSweep(w.x,w.z,anchor,x,y,z,collider);
 camera.position.set(x*fraction,anchor+(y-anchor)*fraction,z*fraction);
}
