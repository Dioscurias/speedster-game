import test from 'node:test';
import assert from 'node:assert/strict';

test('ring state is finite and clamped even while the game is loading',async()=>{
 const {hudView}=await import('../src/hud/hud-model.js');
 const view=hudView({speed:NaN,energy:Infinity,health:-10,topSpeed:0},936);
 assert.equal(view.speed,0);assert.equal(view.energy,100);assert.equal(view.health,0);
 assert.equal(view.speedRatio,0);assert.equal(view.energyRatio,1);assert.equal(view.lowHealth,true);
});
test('live speed drives the arc, spin and near-limit state without a first-run max-speed flash',async()=>{
 const {hudView}=await import('../src/hud/hud-model.js');
 const slow=hudView({speed:10,topSpeed:10},936),fast=hudView({speed:900,topSpeed:900,energy:25},936);
 assert.equal(slow.nearLimit,false);assert.equal(fast.nearLimit,true);
 assert.ok(fast.spinSeconds<slow.spinSeconds);assert.equal(fast.energyRatio,.25);
 assert.ok(fast.speedRatio>.9);assert.equal(hudView({speed:2000},936).speedRatio,1);
});
test('health threshold and compass wrap match actual values',async()=>{
 const {hudView}=await import('../src/hud/hud-model.js');
 assert.equal(hudView({health:25}).lowHealth,false);assert.equal(hudView({health:24}).lowHealth,true);
 assert.equal(hudView({heading:Math.PI/2}).headingText,'E 90°');
 assert.equal(hudView({heading:-Math.PI/2}).headingText,'W 270°');
});
test('key labels reflect city and parkour controls rather than inventing abilities',async()=>{
 const {controlHints}=await import('../src/hud/hud-model.js');
 const city=controlHints(false),parkour=controlHints(true);
 assert.equal(city.find(k=>k.key==='q').label,'Phase');assert.equal(city.find(k=>k.key==='e').label,'Slow time');
 assert.equal(city.find(k=>k.key==='shift').label,'Boost');
 assert.equal(parkour.find(k=>k.key==='e').label,'Blink');assert.equal(parkour.find(k=>k.key==='f').label,'Hand blast');
 assert.equal(parkour.some(k=>k.key==='q'||k.key==='shift'),false);
});

test('Atlas ability brightness reflects availability instead of the amount of energy spent',async()=>{
 const {abilityReadouts}=await import('../src/hud/hud-model.js');
 const get=(label,state)=>abilityReadouts({hero:'atlas',flying:true,grounded:false,energy:82,blastCooldown:2.5,...state},true).find(key=>key.label===label);
 assert.equal(get('Boost').status,'ready');
 assert.equal(get('Boost',{energy:2}).status,'cooling');
 assert.equal(get('Boost',{boostExhausted:true}).status,'cooling');
 assert.equal(get('Boost',{boosting:true}).status,'active');
 assert.equal(get('Air brake',{airBraking:true}).status,'active');
 assert.equal(get('Air brake',{flying:false,grounded:true}).status,'unavailable');
 assert.equal(get('Ground slam',{slamming:true}).status,'active');
 assert.equal(get('Blink',{abilities:{teleports:{available:1,pips:[1,.2,.4]}}}).status,'ready');
 assert.equal(get('Blink',{abilities:{teleports:{available:0,pips:[.3,.2,.4]}}}).ready,.4);
 assert.equal(get('Hand blast',{abilities:{blast:{aiming:true,charge:.4}}}).status,'active');
 assert.equal(get('Hand blast',{abilities:{blast:{cooldown:1.25}}}).ready,.5);
});
