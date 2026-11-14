import test from 'node:test';
import assert from 'node:assert/strict';
import {Scene} from 'three';
import {createBoostShockwave} from '../src/flight/boost-shockwave.js';

test('Atlas boost emits a single pressure ring, expands, and rearms after slowing',()=>{
 const scene=new Scene(),advance=createBoostShockwave(scene),ring=scene.children[0];
 const world={hero:'atlas',status:'running',flying:true,boosting:true,speed:100,x:0,y:20,z:0,vx:0,vy:0,vz:-150,worldTime:10};
 advance(world,.016,false);
 assert.equal(ring.visible,false);
 world.speed=150;
 advance(world,.016,false);
 assert.equal(ring.visible,true);
 const radius=ring.scale.x;
 world.z-=15;
 advance(world,.1,false);
 assert.ok(ring.scale.x>radius);
 assert.ok(ring.position.z<0);
 advance(world,.48,false);
 advance(world,.016,false);
 assert.equal(ring.visible,false);
 advance({...world,speed:90},.016,false);
 advance(world,.016,false);
 assert.equal(ring.visible,true);
 advance(world,.016,true);
 assert.equal(ring.visible,false);
});
