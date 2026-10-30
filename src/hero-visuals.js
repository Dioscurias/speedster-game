import * as THREE from 'three';
export function poseHero(animator,model,w){
 const atlas=w.hero==='atlas';model.scale.set(atlas?1.18:1,atlas?1.06:1,atlas?1.14:1);
 model.rotation.x=atlas&&w.flying?-Math.min(1.2,Math.hypot(w.vx,w.vz)/150):0;
 if(atlas&&w.flying){
  animator.bodyBend('Spine',w.boosting?-.8:-.18);
  for(const side of ['Left','Right']){animator.bodyBend(side+'Arm',w.boosting?-2.4:-.45);animator.bodyBend(side+'ForeArm',-.25);animator.bodyBend(side+'UpLeg',.15);}
 }
 if(atlas&&w.punchTime>0){const strike=Math.sin(Math.min(1,w.punchTime/.4)*Math.PI);animator.bodyBend('RightArm',-1.8*strike);animator.bodyBend('RightForeArm',-.5*strike);animator.bodyBend('Spine',.2*strike,'y');}
}

export function inspectHero(model,camera){
 model.updateMatrixWorld(true);camera?.updateMatrixWorld(true);
 let visibleMeshes=0,finite=true;model.traverse(o=>{finite&&=o.matrixWorld.elements.every(Number.isFinite);if(o.isMesh&&o.visible){const materials=Array.isArray(o.material)?o.material:[o.material];if(materials.some(m=>m.opacity>0))visibleMeshes++;}});
 const bounds=new THREE.Box3().setFromObject(model);
 return {visibleMeshes,finite:finite&&[...bounds.min.toArray(),...bounds.max.toArray()].every(Number.isFinite),height:bounds.max.y-bounds.min.y,inView:camera?new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse)).intersectsBox(bounds):true};
}
