import * as THREE from 'three';
import {HERO_BONES} from './superhero.js';
import {createAnimationState,updateAnimation} from './animation.js';
export class CharacterAnimation{
 constructor(model,clips,world){
  this.mixer=new THREE.AnimationMixer(model);this.model=model;this.state=createAnimationState(world);
  this.actions={};for(const name of ['Idle','Walk','Run']){const clip=THREE.AnimationClip.findByName(clips,name);if(!clip)throw Error(`Missing character animation: ${name}`);this.actions[name]=this.mixer.clipAction(clip);this.actions[name].play();}
  this.bones={};model.traverse(o=>{if(o.isBone){const name=HERO_BONES[o.name]||o.name.replace(/^mixamorig[:_]?/,'');this.bones[name]={bone:o,base:o.quaternion.clone(),neutral:o.quaternion.clone()};}});
  this.rotation=new THREE.Quaternion();this.euler=new THREE.Euler();
  this.bodyAxis=new THREE.Vector3();this.parentRotation=new THREE.Quaternion();this.modelRotation=new THREE.Quaternion();
  this.applyWeights();this.mixer.update(0);for(const r of Object.values(this.bones))r.neutral.copy(r.bone.quaternion);this.capture();
 }
 reset(world){this.restore();this.state=createAnimationState(world);for(const action of Object.values(this.actions)){action.reset();action.play();}this.applyWeights();this.mixer.update(0);this.capture();}
 restore(){for(const {bone,base} of Object.values(this.bones))bone.quaternion.copy(base);}
 capture(){for(const record of Object.values(this.bones))record.base.copy(record.bone.quaternion);}
 applyWeights(){const s=this.state;this.actions.Idle.setEffectiveWeight(s.idle);this.actions.Walk.setEffectiveWeight(s.walk);this.actions.Run.setEffectiveWeight(s.run);this.actions.Walk.timeScale=Math.max(.5,Math.min(1.8,s.lastSpeed/2.2));this.actions.Run.timeScale=s.cadence;}
 offset(name,x=0,y=0,z=0){const record=this.bones[name];if(!record)return;this.euler.set(x,y,z);this.rotation.setFromEuler(this.euler);record.bone.quaternion.multiply(this.rotation);}
 bodyBend(name,angle,axis='x'){
  const record=this.bones[name];if(!record)return;
  // Joint-local axes differ between left and right limbs on this asset.
  // Express anatomical bends in the model frame, then in the parent frame.
  this.model.getWorldQuaternion(this.modelRotation);
  record.bone.parent.getWorldQuaternion(this.parentRotation).invert();
  this.bodyAxis.set(axis==='x'?1:0,axis==='y'?1:0,axis==='z'?1:0).applyQuaternion(this.modelRotation).applyQuaternion(this.parentRotation).normalize();
  this.rotation.setFromAxisAngle(this.bodyAxis,angle);
  record.bone.quaternion.premultiply(this.rotation);
 }
 update(world,input,dt){
  if(world.status==='paused'||dt<=0)return this.state;
  this.restore();updateAnimation(this.state,world,input,dt);this.applyWeights();this.mixer.update(dt);this.capture();
  const s=this.state;
  // Hold a sampled neutral pose in flight so idle sway cannot fight the jump.
  for(const r of Object.values(this.bones))r.bone.quaternion.slerp(r.neutral,s.air);
  // Additive poses use the fresh clip pose every frame, never last frame's
  // offsets. This also supports bones omitted by an animation track.
  this.offset('Spine',-s.lean*.45,0,s.bank*.5);
  this.offset('Spine1',-s.lean*.35-s.crouch*.12,0,s.bank*.3);
  this.offset('Spine2',-s.lean*.2,0,s.bank*.2);
  this.offset('Neck',s.lean*.3,0,-s.bank*.3);
  this.offset('Hips',-s.crouch*.18,0,s.bank*.12);
  for(const side of ['Left','Right']){
   this.bodyBend(`${side}UpLeg`,-.85*s.tuck-.3*s.crouch);
   this.bodyBend(`${side}Leg`,1.65*s.tuck+.6*s.crouch);
   this.bodyBend(`${side}Foot`,-.4*s.tuck+.12*s.reach);
   this.bodyBend(`${side}Arm`,-.32*s.air-.25*s.flinch+.18*s.reach);
   this.bodyBend(`${side}Arm`,(side==='Left'?-1:1)*(.12*s.air+.12*s.crouch),'z');
   this.bodyBend(`${side}ForeArm`,-.55*s.air-.25*s.tuck);
  }
  return s;
 }
 snapshot(){const {phase,idle,walk,run,cadence,lean,bank,crouch,air,tuck,reach,flinch}=this.state;return {phase,idle,walk,run,cadence,lean,bank,crouch,air,tuck,reach,flinch};}
}
