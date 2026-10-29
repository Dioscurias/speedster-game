import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,createCollider} from '../src/game.js';
import {stepHero,toggleFlight,findPunchTarget} from '../src/powerhouse.js';
import {sanitizeSnapshot,crashDamage} from '../src/multiplayer-rules.js';
import * as THREE from 'three';
import {createCourse} from '../src/parkour-course.js';
import {buildParkourMap} from '../src/parkour-map.js';

const world=()=>({...createWorld(),status:'running',hero:'atlas'});
const advance=(w,input,seconds,collider)=>{for(let t=0;t<seconds;t+=1/120)stepHero(w,input,1/120,collider);};
test('Atlas hovers, climbs and boosts faster than normal flight',()=>{
 const w=world();toggleFlight(w);const start=w.y;advance(w,{},1);assert.ok(w.y>=start-.01);advance(w,{ascend:true},1);assert.ok(w.y>10);
 advance(w,{forward:true},2);const normal=w.speed;advance(w,{forward:true,boost:true},2);assert.ok(w.speed>normal*1.5);assert.ok(w.energy<100);
});
test('flight cannot tunnel through a wall even at boost speed',()=>{
 const wall={height:100,polygon:[[-20,-20],[20,-20],[20,-19],[-20,-19]]};const c=createCollider([wall]);const w=world();toggleFlight(w);w.y=10;w.vz=-220;
 advance(w,{forward:true,boost:true},.5,c);assert.ok(w.z>-19);assert.equal(c.blocked(w.x,w.z,w.y),false);
});
test('a dive lands on the roof it crosses and leaves a heavy impact',()=>{
 const c=createCollider([{height:15,polygon:[[-10,-10],[10,-10],[10,10],[-10,10]]}]);const w=world();toggleFlight(w);w.y=50;
 for(let i=0;i<240&&!w.grounded;i++)stepHero(w,{slam:true},1/120,c);
 assert.equal(w.y,15);assert.equal(w.grounded,true);assert.equal(w.flying,false);assert.ok(w.landingImpact>.9);
});
test('punch targets a nearby forward wall, not a wall behind or across the street',()=>{
 const buildings=[{id:'wall',height:10,polygon:[[-5,-3],[5,-3],[5,-2],[-5,-2]]}];const w=world();const hit=findPunchTarget(w,buildings);
 assert.equal(hit.buildingId,'wall');assert.equal(hit.z,-2);assert.ok(hit.nz>.9);assert.equal(findPunchTarget({...w,heading:Math.PI},buildings),null);assert.equal(findPunchTarget({...w,z:20},buildings),null);
});
test('flight state travels to peers and vertically separated players do not collide',()=>{
 const s=sanitizeSnapshot({hero:'atlas',flying:true,boosting:true,vy:40,y:400});assert.equal(s.hero,'atlas');assert.equal(s.flying,true);assert.equal(s.vy,40);assert.equal(s.y,400);
 assert.equal(crashDamage({x:0,z:0,y:40,vx:100},{x:0,z:0,y:0,vx:-100}),0);
});
test('parkour flight respects monuments without inventing a floor across gaps',()=>{
 const c=createCourse(),map=buildParkourMap(new THREE.Scene(),c);map.update({x:0,z:0},0,0);
 assert.equal(map.flightCollider.surface(0,-10,0),-60);
 assert.equal(map.flightCollider.blocked(0,2,0),false);
 assert.equal(map.flightCollider.blocked(-95,-95,35),true);
 assert.equal(map.flightCollider.blocked(-95,-95,0),false,'space below the table stays open');
});
