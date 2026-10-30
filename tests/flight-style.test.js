import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {poseHero,flightPose} from '../src/hero-visuals.js';
test('Atlas glides horizontally, banks into turns and streamlines for boost',()=>{
 const glide=flightPose({hero:'atlas',flying:true,vx:0,vz:-72,vy:0,heading:0,flightBank:.35});
 assert.ok(glide.pitch<-.9);assert.ok(glide.armSpread>.7);assert.ok(glide.bank>.2);
 const boost=flightPose({hero:'atlas',flying:true,boosting:true,vx:0,vz:-200,vy:0,heading:0});
 assert.ok(boost.armSpread<glide.armSpread);assert.ok(boost.pitch<glide.pitch);
});
test('hover and speedster stay upright; Atlas retains an athletic scale',()=>{
 assert.equal(flightPose({hero:'speedster',flying:true,vx:0,vz:-200}).pitch,0);
 const m=new THREE.Group();poseHero({bodyBend(){}},m,{hero:'atlas',flying:true,vx:0,vz:0,vy:0});
 assert.ok(Math.abs(m.rotation.x)<.1);assert.ok(m.scale.x<1.1);
});
