import * as THREE from 'three';
import {FLIGHT as C} from './flight-config.js';

const forward=new THREE.Vector3(0,0,-1);
const up=new THREE.Vector3(0,1,0),rightAxis=new THREE.Vector3(1,0,0);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function flightPose(w){
 if(w.hero!=='atlas'||!w.flying)return {pitch:0,bank:0,armSpread:0};
 if(w.flightState==='TAKEOFF')return {pitch:.10,bank:0,armSpread:0};
 if(w.slamming)return {pitch:-2.7,bank:0,armSpread:.2};
 const horizontal=Math.hypot(w.vx||0,w.vz||0),speed=Math.hypot(horizontal,w.vy||0);
 const travel=clamp((speed-4)/24,0,1);
 const climb=Math.atan2(w.vy||0,Math.max(.1,horizontal));
 if(w.airBraking||w.flightState==='BRAKE')return {pitch:-.13,bank:(w.flightBank||0)*.35,armSpread:1,travel:0,flare:1};
 return {pitch:travel*clamp((w.boosting?-1.53:-1.41)+climb,-2.42,-.18),
  bank:(w.flightBank||0)*travel,armSpread:travel*(w.boosting?.18:1.05),travel,flare:0};
}
const blendDirection=(from,to,weight)=>from.map((value,index)=>value+(to[index]-value)*weight);
export function poseHero(animator,model,w,dt=1/60,heading=w.heading||0){
 if(w.hero!=='atlas'||w.status==='paused'||dt<=0)return;
 const pose=flightPose(w),step=clamp(dt,0,.1);
 const speed=Math.hypot(w.vx||0,w.vy||0,w.vz||0);
 const motion=animator.atlasMotion??={travel:0,boost:0,flare:0,blend:0,time:0,driftPhase:0,steer:0,hipSteer:0,climb:0,surge:0,speed,tilt:new THREE.Quaternion(),target:new THREE.Quaternion(),pitchRotation:new THREE.Quaternion(),bankRotation:new THREE.Quaternion(),aim:new THREE.Vector3()};
 motion.time+=step;
 // Reach 95% of the next pose in roughly 200 ms.
 const alpha=1-Math.exp(-step*C.poseBlend);
 const ease=(from,to)=>from+(to-from)*alpha;
 motion.travel=ease(motion.travel,pose.travel||0);
 motion.boost=ease(motion.boost,w.flying&&w.boosting?1:0);
 motion.glide=ease(motion.glide||0,w.flightState==='GLIDE'?1:0);
 motion.flare=ease(motion.flare,pose.flare||0);
 motion.blend=ease(motion.blend,w.flying?1:0);
 const maneuver=w.flying&&!w.slamming;
 motion.steer=ease(motion.steer,maneuver?clamp((w.flightBank||0)/.42,-1,1):0);
 // Let the hips follow the chest through a turn instead of rotating the rig as one piece.
 motion.hipSteer+=(motion.steer-motion.hipSteer)*(1-Math.exp(-step*C.poseBlend*.55));
 motion.climb=ease(motion.climb,maneuver?clamp((w.vy||0)/Math.max(16,speed),-1,1):0);
 motion.surge=ease(motion.surge,maneuver?clamp((speed-motion.speed)/(step*C.poseSurge),-1,1):0);
 motion.speed=speed;
 motion.driftPhase+=step*(3+motion.boost);
 model.scale.set(1.05,1.03,1.04);
 const {travel,boost,flare,blend,steer,climb,surge}=motion,breathing=Math.sin(motion.time*2.1),hover=blend*(1-travel)*(1-flare);
 const pitch=pose.pitch+breathing*.012*hover;
 const bank=pose.bank+Math.sin(motion.time*1.4)*.014*hover;
 motion.pitchRotation.setFromAxisAngle(rightAxis,pitch);
 motion.bankRotation.setFromAxisAngle(forward,-bank);
 motion.target.copy(motion.pitchRotation).multiply(motion.bankRotation);
 motion.tilt.slerp(motion.target,alpha);
 model.quaternion.setFromAxisAngle(up,-heading).multiply(motion.tilt);
 if(blend>.01){
  // The asset faces +Z. Counter-rotate its neck and head against the dive so
  // the cowl clears the shoulders and faces down the flight path.
  motion.aim.copy(up).applyQuaternion(motion.tilt);
  const bodyPitch=Math.atan2(motion.aim.z,motion.aim.y);
  const gaze=clamp(bodyPitch,-1.3,0);
  const maneuverWeight=blend*(1-flare)*(w.slamming?0:1);
  const hipTurn=motion.hipSteer;
  animator.bodyBend('Hips',maneuverWeight*(-hipTurn*.16+breathing*.045),'z');
  animator.bodyBend('Hips',maneuverWeight*(-surge*.13-climb*.10));
  animator.bodyBend('Spine',maneuverWeight*(surge*.20+climb*.12+breathing*.065));
  animator.bodyBend('Spine2',maneuverWeight*steer*.28,'y');
  animator.bodyBend('Spine2',maneuverWeight*(steer-hipTurn)*.24,'z');
  animator.bodyBend('Neck',gaze*.46+breathing*.012*hover);
  animator.bodyBend('Head',maneuverWeight*steer*.18,'y');
  animator.bodyBend('Head',gaze*.44);
  for(const side of ['Left','Right']){
   const sign=side==='Left'?1:-1,lead=side==='Right';
   // Offset the knee and ankle timing so the legs trail the torso and each other.
   const drift=Math.sin(motion.driftPhase+sign*.9)*(.13-.075*boost);
   const kneeLag=Math.sin(motion.driftPhase+sign*.9-.65)*(.16-.095*boost);
   const turn=sign*steer;
   const arm=blendDirection([sign*.12,-1,.08+drift],lead?[sign*.15,.97,.28]:[sign*.22,.3,.88],travel);
   const forearm=blendDirection([sign*.04,-1,.13-drift],lead?[sign*.08,.98,.18]:[sign*.12,.93,.34],travel);
   const upper=blendDirection(blendDirection(blendDirection(arm,[sign*.11,1,.16],boost),[sign*.86,-.18,.35],motion.glide),[sign*.94,-.28,.34],flare);
   const lower=blendDirection(blendDirection(blendDirection(forearm,[sign*.06,1,.10],boost),[sign*.84,.1,.24],motion.glide),[sign*.65,.56,.45],flare);
   // Extend into a turn and counterbalance with the other arm and leg.
   upper[0]+=sign*maneuverWeight*(Math.abs(steer)*.15-turn*.14+drift);
   upper[1]+=maneuverWeight*travel*(turn*.43+surge*.21);
   upper[2]+=maneuverWeight*travel*(climb*.34-turn*.32+drift);
   lower[0]+=sign*maneuverWeight*(-turn*.15+drift);
   lower[2]+=maneuverWeight*(climb*.32-turn*.31+drift*1.65);
   animator.aimLimb?.(side+'Arm',side+'ForeArm',upper,blend);
   animator.aimLimb?.(side+'ForeArm',side+'Hand',lower,blend);
   animator.aimLimb?.(side+'UpLeg',side+'Leg',blendDirection([-sign*.035+maneuverWeight*hipTurn*.14,-1,-.06+maneuverWeight*(drift+climb*.19+sign*hipTurn*.18)],[sign*.36,-1,.28],flare),blend);
   animator.aimLimb?.(side+'Leg',side+'Foot',blendDirection([sign*.015,-1,-.10+maneuverWeight*(sign*hipTurn*.32-kneeLag-climb*.27-surge*.20)],[sign*.11,-1,-.57],flare),blend);
  }
 }
 if(w.flightState==='TAKEOFF'){
  const crouch=Math.max(0,1-Math.abs((w.flight?.age||0)-C.crouchTime)/C.crouchTime);
  animator.bodyBend('Hips',-.24*crouch);
  for(const side of ['Left','Right']){animator.bodyBend(side+'UpLeg',-.55*crouch);animator.bodyBend(side+'Leg',.95*crouch);}
 }
 if(w.flightState==='LANDING'){
  const absorb=Math.sin(Math.PI*clamp((w.flight?.age||0)/C.landingDuration,0,1));
  for(const side of ['Left','Right']){animator.bodyBend(side+'UpLeg',-.38*absorb);animator.bodyBend(side+'Leg',.76*absorb);}
 }
 if(w.punchTime>0){
  const progress=1-Math.min(1,w.punchTime/.4),strike=progress<.3?-progress/.3*.45:Math.sin((progress-.3)/.7*Math.PI)*2.1;
  animator.bodyBend('RightArm',-strike);animator.bodyBend('RightForeArm',-.35*Math.max(0,strike));animator.bodyBend('Spine',-.22*strike,'y');
 }
}
