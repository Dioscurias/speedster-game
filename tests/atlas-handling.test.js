import test from 'node:test';import assert from 'node:assert/strict';import {createWorld} from '../src/game.js';import {stepHero} from '../src/powerhouse.js';
const world=()=>({...createWorld(),hero:'atlas',status:'running',flying:true,grounded:false,y:100});
function tick(w,input,seconds){for(let t=0;t<seconds;t+=1/120)stepHero(w,input,1/120);}
test('Atlas air brake stops boosted momentum quickly without draining energy',()=>{const w=world();w.vz=-220;w.energy=50;tick(w,{brake:true,forward:true,boost:true},.5);assert.ok(w.speed<2);assert.ok(w.energy>50);assert.equal(w.boosting,false);});
test('slam kills lateral drift and settles on landing',()=>{const w=world();w.y=15;w.vx=100;w.vz=-100;for(let i=0;i<240&&!w.grounded;i++)stepHero(w,{slam:true,forward:true},1/120);assert.equal(w.grounded,true);assert.ok(Math.hypot(w.vx,w.vz)<1);});
test('exhausted boost stays disengaged until the player releases boost',()=>{const w=world();w.energy=2;tick(w,{forward:true,boost:true},1);assert.equal(w.boosting,false);assert.ok(w.energy>2);tick(w,{forward:true},.1);tick(w,{forward:true,boost:true},.1);assert.equal(w.boosting,true);});
