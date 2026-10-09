import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,stepWorld,PARKOUR} from '../src/game.js';
import {createCourse,platformPoint} from '../src/parkour-course.js';
test('every moving-course transition has a reachable launch window in its loop',()=>{for(let index=1;index<17;index++){let reachable=false;for(let phase=0;phase<12&&!reachable;phase++){const c=createCourse();c.advance(phase);const a=c.platforms[index-1],b=c.platforms[index];if(!a.active)continue;const start=platformPoint(a,0,-a.depth/2+1),w=createWorld(start);Object.assign(w,{status:'running',y:a.top,vz:-10,speed:10});for(let tick=0;tick<220;tick++){c.advance(1/120,w);stepWorld(w,{forward:true,jump:tick===0,jumpHeld:true},1/120,c.collider,PARKOUR);if(tick>5&&w.grounded){reachable=c.supportAt(w.x,w.z,w.y)?.id===b.id;break;}}}assert.ok(reachable,`transition ${index} has no launch window`);}});
