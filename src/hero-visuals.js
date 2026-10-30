import * as THREE from 'three';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function flightPose(w){
 if(w.hero!=='atlas'||!w.flying)return {pitch:0,bank:0,armSpread:0};
 if(w.slamming)return {pitch:-2.7,bank:0,armSpread:.2};
 const horizontal=Math.hypot(w.vx||0,w.vz||0),travel=clamp(horizontal/55,0,1);
 const climb=Math.atan2(w.vy||0,Math.max(1,horizontal));
 return {pitch:travel*(-(w.airBraking?.35:w.boosting?1.48:1.2)+clamp(climb,-.6,.8)),bank:w.flightBank||0,armSpread:travel*(w.boosting?.18:1.05)};
}
export function poseHero(animator,model,w,dt=1/60){
 if(w.hero!=='atlas'||w.status==='paused'||dt<=0)return;
 const atlas=true,pose=flightPose(w),step=clamp(dt,0,.1);
 const motion=animator.atlasMotion??={pitch:0,bank:0,travel:0,boost:0,blend:0,time:0};motion.time+=step;
 const ease=(from,to,rate)=>from+(to-from)*(1-Math.exp(-step*rate));
 motion.pitch=ease(motion.pitch,pose.pitch,w.slamming?12:7);motion.bank=ease(motion.bank,pose.bank,5);
 motion.travel=ease(motion.travel,w.flying?clamp(Math.hypot(w.vx||0,w.vz||0)/55,0,1):0,5);
 motion.boost=ease(motion.boost,w.boosting?1:0,6);motion.blend=ease(motion.blend,w.flying?1:0,w.grounded?12:7);
 model.scale.set(1.05,1.03,1.04);
 const breathing=Math.sin(motion.time*2.1),hover=motion.blend*(1-motion.travel);
 model.rotation.x=motion.pitch+breathing*.012*hover;model.rotation.z=motion.bank+Math.sin(motion.time*1.4)*.014*hover;
 if(motion.blend>.01){
  animator.bodyBend('Spine',(-.06+breathing*.018)*motion.blend);
  animator.bodyBend('Neck',breathing*.012*hover);
  const travel=motion.travel,boost=motion.boost;
  const mix=(a,b)=>a.map((n,i)=>n+(b[i]-n)*boost);
  for(const side of ['Left','Right']){
   const sign=side==='Left'?1:-1;
   // Hips remain narrow; a slight knee bend avoids the airborne running stance.
   const requested=clamp(Math.hypot(w.vx||0,w.vz||0)/55,0,1);
   const drift=Math.sin(motion.time*1.8+sign*.7)*.025*(1-travel)+Math.sin(motion.time*3+sign)*.014*travel+(requested-travel)*.22;
   animator.aimLimb?.(side+'UpLeg',side+'Leg',[-sign*.035,-1,.045+drift],motion.blend);
   animator.aimLimb?.(side+'Leg',side+'Foot',[sign*.015,-1,-.09-drift],motion.blend);
   const upper=mix([sign*(.10+travel*.85),-1+travel*.85,.06+drift],[sign*.06,-1+travel*2,.07]);
   const lower=mix([sign*(.04+travel*.85),-1+travel*.85,.16-drift],[sign*.035,-1+travel*2,.10]);
   animator.aimLimb?.(side+'Arm',side+'ForeArm',upper,motion.blend);
   animator.aimLimb?.(side+'ForeArm',side+'Hand',lower,motion.blend);
  }
 }
 if(atlas&&w.punchTime>0){
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
