import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {stabilizeFlightCamera} from '../src/hero-visuals.js';
import {findPunchInCone} from '../src/powerhouse.js';
test('Atlas camera cannot lag far below a fast climb or far above a dive',()=>{
 const c=new THREE.PerspectiveCamera();const w={hero:'atlas',flying:true};const t=new THREE.Vector3(0,105,5);c.position.y=70;stabilizeFlightCamera(c,t,w);assert.ok(c.position.y>=102);c.position.y=140;stabilizeFlightCamera(c,t,w);assert.ok(c.position.y<=108);
 c.position.y=20;stabilizeFlightCamera(c,t,{hero:'speedster'});assert.equal(c.position.y,20);
});
test('punch assistance finds a nearby slightly off-centre wall but never behind Atlas',()=>{
 const w={x:0,y:0,z:0,heading:0};const wall={id:'edge',height:8,polygon:[[.3,-3],[1,-3],[1,-2],[.3,-2]]};assert.equal(findPunchInCone(w,[wall]).buildingId,'edge');assert.equal(findPunchInCone({...w,heading:Math.PI},[wall]),null);assert.equal(findPunchInCone({...w,z:30},[wall]),null);
});
test('Atlas refuses takeoff when the lift would place his head inside a ceiling',async()=>{
 const {toggleFlight}=await import('../src/powerhouse.js');const w={hero:'atlas',status:'running',grounded:true,x:0,z:0,y:0};
 assert.equal(toggleFlight(w,{blocked:(x,z,y)=>y>=2.4}),false);assert.equal(w.y,0);assert.equal(w.grounded,true);
});
