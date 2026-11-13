import * as THREE from 'three';
export {poseHero,flightPose} from './flight/flight-pose.js';

export function inspectHero(model,camera){
 model.updateMatrixWorld(true);camera?.updateMatrixWorld(true);
 let visibleMeshes=0,finite=true;model.traverse(o=>{finite&&=o.matrixWorld.elements.every(Number.isFinite);if(o.isMesh&&o.visible){const materials=Array.isArray(o.material)?o.material:[o.material];if(materials.some(m=>m.opacity>0))visibleMeshes++;}});
 const bounds=new THREE.Box3().setFromObject(model);
 return {visibleMeshes,finite:finite&&[...bounds.min.toArray(),...bounds.max.toArray()].every(Number.isFinite),height:bounds.max.y-bounds.min.y,inView:camera?new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse)).intersectsBox(bounds):true};
}

export {stabilizeFlightCamera,followHeroCamera} from './flight/flight-camera.js';
