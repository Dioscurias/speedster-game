import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';import {poseHero} from '../src/hero-visuals.js';
const hover={hero:'atlas',flying:true,vx:0,vz:0,vy:0};
const rig=()=>({bodyBend(){},aimLimb(){}});
test('Atlas eases into flight instead of snapping the whole body in one frame',()=>{
 const a=rig(),m=new THREE.Group();for(let i=0;i<60;i++)poseHero(a,m,hover,1/60);
 poseHero(a,m,{...hover,vz:-200,boosting:true},1/60);assert.ok(Math.abs(m.rotation.x)<.35);
 for(let i=0;i<120;i++)poseHero(a,m,{...hover,vz:-200,boosting:true},1/60);assert.ok(m.rotation.x< -1.3);
});
test('hover limbs have subtle secondary motion rather than one frozen target',()=>{
 const targets=[];const a={bodyBend(){},aimLimb(n,c,d){if(n==='LeftLeg')targets.push([...d]);}},m=new THREE.Group();for(let i=0;i<180;i++)poseHero(a,m,hover,1/60);
 assert.notDeepEqual(targets[90],targets[150]);
});
test('landing eases out of the flight orientation and preserves finite transforms',()=>{
 const a=rig(),m=new THREE.Group();for(let i=0;i<120;i++)poseHero(a,m,{...hover,vz:-100},1/60);const before=m.rotation.x;
 poseHero(a,m,{...hover,flying:false,grounded:true},1/60);assert.ok(m.rotation.x< -.3);assert.ok(Math.abs(m.rotation.x)<Math.abs(before));
 for(let i=0;i<180;i++)poseHero(a,m,{...hover,flying:false,grounded:true},1/60);assert.ok(Math.abs(m.rotation.x)<.01);assert.ok(m.quaternion.toArray().every(Number.isFinite));
});
test('pose easing is consistent at 30 and 120 frames per second and freezes on pause',()=>{
 const run=fps=>{const a=rig(),m=new THREE.Group();for(let i=0;i<fps*2;i++)poseHero(a,m,{...hover,vz:-100,boosting:true},1/fps);return {a,m};};const slow=run(30),fast=run(120);assert.ok(slow.m.quaternion.angleTo(fast.m.quaternion)<.001);
 const before=slow.m.quaternion.clone();poseHero(slow.a,slow.m,{...hover,status:'paused'},1);assert.ok(before.equals(slow.m.quaternion));
});

test('steady cruise and boost keep the arms and legs moving',()=>{
 for(const boosting of [false,true]){
  const targets={};const a={bodyBend(){},aimLimb(name,child,direction){targets[name]=direction;}};
  const m=new THREE.Group(),w={...hover,vz:boosting?-200:-72,boosting};
  for(let i=0;i<120;i++)poseHero(a,m,w,1/60);
  const before={...targets};
  const bones=['LeftArm','RightForeArm','LeftLeg','RightUpLeg'];
  const travel=new Map(bones.map(bone=>[bone,0]));
  for(let i=0;i<60;i++){
   poseHero(a,m,w,1/60);
   for(const bone of bones){
    const change=new THREE.Vector3(...targets[bone]).distanceTo(new THREE.Vector3(...before[bone]));
    travel.set(bone,Math.max(travel.get(bone),change));
   }
  }
  for(const [bone,change] of travel)assert.ok(change>.025,`${bone} moved only ${change}`);
 }
});

test('opposite steering inputs extend opposite arms at the same speed',()=>{
 const read=bank=>{
  const targets={};const a={bodyBend(){},aimLimb(name,child,direction){targets[name]=direction;}};
  const m=new THREE.Group();
  for(let i=0;i<120;i++)poseHero(a,m,{...hover,vz:-72,flightBank:bank},1/60);
  return targets;
 };
 const left=read(.32),right=read(-.32);
 assert.ok(left.LeftArm[1]>right.LeftArm[1]+.08);
 assert.ok(right.RightArm[1]>left.RightArm[1]+.08);
 assert.ok(left.LeftLeg[2]>right.LeftLeg[2]+.05);
});

test('hips follow the shoulders on a turn and retain counter-rotation briefly after reversal',()=>{
 const bends={};
 const animator={bodyBend(bone,angle,axis='x'){bends[bone+axis]=angle;}};
 const model=new THREE.Group(),w={...hover,vz:-72,flightBank:.42};
 for(let i=0;i<90;i++)poseHero(animator,model,w,1/60);
 assert.ok(bends.Spine2y>.2);
 assert.ok(bends.Hipsz<-.1);
 w.flightBank=-.42;
 for(let i=0;i<4;i++)poseHero(animator,model,w,1/60);
 assert.ok(bends.Spine2y<0);
 assert.ok(animator.atlasMotion.hipSteer>0);
 for(let i=0;i<45;i++)poseHero(animator,model,w,1/60);
 assert.ok(animator.atlasMotion.hipSteer<-.9);
});
