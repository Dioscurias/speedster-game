import * as THREE from 'three';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function flightPose(w){
 if(w.hero!=='atlas'||!w.flying)return {pitch:0,bank:0,armSpread:0};
 if(w.slamming)return {pitch:-2.7,bank:0,armSpread:.2};
 const horizontal=Math.hypot(w.vx||0,w.vz||0),travel=clamp(horizontal/55,0,1);
 const climb=Math.atan2(w.vy||0,Math.max(1,horizontal));
 return {pitch:travel*(-(w.airBraking?.35:w.boosting?1.48:1.2)+clamp(climb,-.6,.8)),bank:w.flightBank||0,armSpread:travel*(w.boosting?.18:1.05)};
}
export function poseHero(animator,model,w){
 if(w.hero!=='atlas')return;
 const atlas=true,pose=flightPose(w);model.scale.set(atlas?1.05:1,atlas?1.03:1,atlas?1.04:1);
 model.rotation.x=pose.pitch;model.rotation.z=pose.bank;
 if(atlas&&w.flying){
  animator.bodyBend('Spine',-.06);
  for(const side of ['Left','Right']){
   const sign=side==='Left'?-1:1;
   animator.bodyBend(side+'Arm',-.15);
   animator.bodyBend(side+'Arm',sign*pose.armSpread,'z');
   animator.bodyBend(side+'ForeArm',.38);
   animator.bodyBend(side+'UpLeg',.02);
   animator.bodyBend(side+'Leg',-.15);
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
