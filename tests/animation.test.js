import {test} from 'node:test';import assert from 'node:assert/strict';
import {createAnimationState,updateAnimation} from '../src/animation.js';
import {createWorld} from '../src/game.js';
const setup=()=>{const world=createWorld();world.status='running';return {world,state:createAnimationState(world)};};
const tick=(state,world,input={},dt=1/60)=>{world.worldTime+=dt;return updateAnimation(state,world,input,dt);};
test('movement input reacts immediately before significant speed builds',()=>{const {world,state}=setup();tick(state,world,{forward:true});assert.equal(state.phase,'launch');assert.ok(state.lean>0);});
test('walk and run blend according to speed with normalized weights',()=>{const {world,state}=setup();world.speed=2;world.vz=-2;for(let i=0;i<30;i++)tick(state,world,{forward:true});assert.ok(state.walk>state.run);world.speed=25;world.vz=-25;for(let i=0;i<30;i++)tick(state,world,{forward:true});assert.ok(state.run>.95);assert.ok(Math.abs(state.idle+state.walk+state.run-1)<1e-6);});
test('boost leans further and has faster cadence than normal running',()=>{const a=setup(),b=setup();for(const x of [a,b]){x.world.speed=80;x.world.vz=-80;}b.world.boosting=true;for(let i=0;i<30;i++){tick(a.state,a.world,{forward:true});tick(b.state,b.world,{forward:true,boost:true});}assert.equal(b.state.phase,'boost');assert.ok(b.state.lean>a.state.lean);assert.ok(b.state.cadence>a.state.cadence);});
test('releasing movement and reversing produce braking poses',()=>{const {world,state}=setup();world.speed=30;world.vz=-30;tick(state,world,{});assert.equal(state.phase,'brake');assert.ok(state.lean<0);tick(state,world,{backward:true});assert.equal(state.phase,'brake');});
test('opposite turns produce opposite banking',()=>{const a=setup(),b=setup();for(const x of [a,b]){x.world.speed=30;x.world.vz=-30;}tick(a.state,a.world,{right:true});tick(b.state,b.world,{left:true});assert.ok(a.state.bank*b.state.bank<0);});
test('jump stops the run cycle and landing compresses then recovers',()=>{const {world,state}=setup();world.grounded=false;world.y=.2;world.vy=6;tick(state,world,{forward:true});assert.equal(state.phase,'takeoff');for(let i=0;i<15;i++)tick(state,world,{});assert.equal(state.phase,'air');assert.ok(state.run<.02);world.grounded=true;world.y=0;world.vy=0;tick(state,world,{});assert.equal(state.phase,'land');assert.ok(state.crouch>0);for(let i=0;i<60;i++)tick(state,world,{});assert.equal(state.phase,'idle');assert.ok(state.crouch<.001);});
test('impact flinches once and pause freezes the animation',()=>{const {world,state}=setup();world.impact=1;tick(state,world);assert.equal(state.phase,'stagger');world.status='paused';const before=structuredClone(state);updateAnimation(state,world,{forward:true},1);assert.deepEqual(state,before);});
test('animation timing follows simulation time in slow motion',()=>{const a=setup(),b=setup();for(const x of [a,b]){x.world.grounded=false;x.world.vy=6;}tick(a.state,a.world,{},.02);tick(b.state,b.world,{},.02);for(let i=0;i<10;i++){tick(a.state,a.world,{},.02);tick(b.state,b.world,{},.007);}assert.equal(a.state.phase,'air');assert.equal(b.state.phase,'takeoff');});

test('jump tuck is continuous through the apex and extends before contact',()=>{
 const world=createWorld();world.status='running';world.grounded=false;
 const a=createAnimationState(world),b=createAnimationState(world);
 world.vy=.001;updateAnimation(a,world,{},1/60);
 world.vy=-.001;updateAnimation(b,world,{},1/60);
 assert.ok(Math.abs(a.tuck-b.tuck)<.001,'apex must not switch poses');
 world.vy=-6.5;for(let i=0;i<30;i++)updateAnimation(b,world,{},1/60);
 assert.ok(b.tuck<.1,'legs extend for landing');
});

test('wall run plays the running cycle instead of the jump pose',()=>{const w=createWorld();w.status='running';w.grounded=false;w.wallRunning=true;w.speed=30;w.vy=30;const s=createAnimationState(w);for(let i=0;i<30;i++)updateAnimation(s,w,{forward:true},1/60);assert.equal(s.phase,'wallrun');assert.ok(s.run>.95);assert.ok(s.air<.01);assert.ok(s.tuck<.01);});
