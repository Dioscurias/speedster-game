import test from 'node:test';
import assert from 'node:assert/strict';
import {createAbilities,ABILITY} from '../src/parkour-abilities.js';
test('only Atlas can spend blink charges or charge and release a blast',()=>{
 let hero='speedster';const a=createAbilities(ABILITY,()=>hero);
 assert.equal(a.spendTeleport(0),false);assert.equal(a.beginAim(0),false);assert.equal(a.release(2),null);
 assert.equal(a.teleports(2).available,3);
 hero='atlas';assert.equal(a.spendTeleport(2),true);assert.equal(a.beginAim(2),true);assert.ok(a.release(3.2));
});
test('switching to Speedster cancels an already charged blast',()=>{
 let hero='atlas';const a=createAbilities(ABILITY,()=>hero);a.beginAim(0);hero='speedster';assert.equal(a.release(2),null);assert.equal(a.status(2).aiming,false);
});
test('Speedster jumps do not create Atlas strength craters',async()=>{
 const {ImpactFX}=await import('../src/impact-fx.js');const events=[];const fx={wasGrounded:true};
 ImpactFX.prototype.observe.call(fx,{hero:'speedster',status:'running',grounded:false,vy:5},e=>events.push(e));
 ImpactFX.prototype.observe.call(fx,{hero:'speedster',status:'running',grounded:true,vy:0},e=>events.push(e));assert.equal(events.length,0);
 ImpactFX.prototype.observe.call(fx,{hero:'atlas',status:'running',grounded:false,vy:5},e=>events.push(e));assert.equal(events.length,1);
});
