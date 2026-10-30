import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {poseHero} from '../src/hero-visuals.js';
import {createWorld,createCollider} from '../src/game.js';
import {stepHero} from '../src/powerhouse.js';
import {sanitizeSnapshot} from '../src/multiplayer-rules.js';
import {sanitizeImpact} from '../src/presence-protocol.js';
test('Atlas renderer never overwrites Speedster wall-run rotation or jump squash',()=>{
 const model=new THREE.Group();model.rotation.set(.2,.3,1.4);model.scale.set(.9,1.1,.9);const q=model.quaternion.clone(),s=model.scale.clone();poseHero({bodyBend(){}},model,{hero:'speedster'});assert.ok(model.quaternion.equals(q));assert.ok(model.scale.equals(s));
});
test('a tapped Atlas slam survives until the next physics tick',()=>{
 const w={...createWorld(),status:'running',hero:'atlas',flying:true,grounded:false,y:50,slamRequested:true};stepHero(w,{},1/120);assert.equal(w.slamming,true);assert.ok(w.vy<0);assert.equal(w.slamRequested,false);
});
test('Atlas does not inherit wall running from the shared ground controller',()=>{
 const wall={height:60,polygon:[[-10,-3],[10,-3],[10,-2],[-10,-2]]};const w={...createWorld(),status:'running',hero:'atlas',grounded:false,y:2,vz:-60};for(let i=0;i<12;i++)stepHero(w,{forward:true},1/120,createCollider([wall]));assert.equal(w.wallRunning,false);
});
test('peer snapshots remove wrong-character powers and keep flight pose state',()=>{
 const s=sanitizeSnapshot({hero:'speedster',flying:true,phasing:true,punchTime:.4,slamming:true});assert.equal(s.flying,false);assert.equal(s.punchTime,0);assert.equal(s.slamming,false);
 const a=sanitizeSnapshot({hero:'atlas',phasing:true,flying:true,slamming:true,flightBank:.3,y:-20});assert.equal(a.phasing,false);assert.equal(a.slamming,true);assert.equal(a.flightBank,.3);assert.equal(a.y,-20);
});
test('Speedster cannot submit strength launch/landing impact events',()=>{
 const player={id:'s',hero:'speedster',x:0,y:0,z:0};assert.equal(sanitizeImpact({kind:'land',x:0,y:0,z:0,nx:0,ny:1,nz:0,radius:5},player),null);
});
