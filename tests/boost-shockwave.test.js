import test from 'node:test';
import assert from 'node:assert/strict';
import {Scene,Vector3} from 'three';
import {createBoostShockwave} from '../src/flight/boost-shockwave.js';
import {resetFlight,update} from '../src/flight/index.js';
import {createWorld} from '../src/game.js';

test('each Atlas boost triggers a pressure ring without a speed threshold or rearm delay',()=>{
 const scene=new Scene(),wave=createBoostShockwave(scene),ring=scene.children[0];
 const world={...createWorld(),hero:'atlas',status:'running',y:200};
 resetFlight(world,'HOVER');
 const step=input=>update(1/120,input,world,undefined,undefined,type=>{
  if(type==='boostStart')wave.start(world,0,false);
 });
 wave.update(world,1/60,false);
 assert.equal(ring.visible,false);

 step({forward:true,boost:true});
 wave.update(world,1/60,false);
 assert.equal(ring.visible,true);
 assert.ok(new Vector3(0,0,1).applyQuaternion(ring.quaternion).z<-.99);
 const initialSize=ring.scale.x;

 step({forward:true,boost:true});
 wave.update(world,.1,false);
 assert.ok(ring.scale.x>initialSize);
 step({});
 step({forward:true,boost:true});
 wave.update(world,1/60,false);
 assert.equal(ring.visible,true);
 assert.equal(ring.scale.x,initialSize);

 wave.update(world,.5,false);
 wave.update(world,1/60,false);
 assert.equal(ring.visible,false);
 wave.start(world,0,true);
 wave.update(world,1/60,true);
 assert.equal(ring.visible,false);
});
