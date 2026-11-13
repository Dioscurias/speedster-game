import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraSweep,createCollider,createWorld} from '../src/game.js';
import {flightSnapshot,flightTelemetry,stepHero,toggleFlight,resetFlight} from '../src/flight/index.js';
import {createFlightState} from '../src/flight/flight-state.js';
import {FLIGHT} from '../src/flight/flight-config.js';

const square=(size)=>[[-size,-size],[size,-size],[size,size],[-size,size]];
const atlas=(values={})=>({...createWorld(),hero:'atlas',status:'running',...values});
function simulate(w,input,seconds,collider,fps=120){
 for(let frame=0;frame<Math.round(seconds*fps);frame++)stepHero(w,input,1/fps,collider);
}

test('rooftop takeoff preserves position on input and allows landing and immediate relaunch',()=>{
 const roof=createCollider([{height:20,polygon:square(25)}]);
 const w=atlas({y:20});
 assert.equal(toggleFlight(w,roof),true);
 assert.equal(w.y,20);
 simulate(w,{},.3,roof);
 assert.ok(w.y>22);
 for(let i=0;i<240&&w.flying;i++)stepHero(w,{descend:true},1/120,roof);
 assert.equal(flightSnapshot(w).state,'LANDING');
 assert.equal(w.y,20);
 assert.equal(flightTelemetry(w,roof).altitude,0);
 assert.equal(toggleFlight(w,roof),true);
});

test('pitch steers flight similarly at 30, 60 and 144 fps',()=>{
 const runs=[30,60,144].map(fps=>{
  const w=atlas({y:80,grounded:false});
  toggleFlight(w);
  simulate(w,{forward:true,viewPitch:-.55,boost:true},2,undefined,fps);
  assert.equal(flightSnapshot(w).state,'BOOST');
  assert.ok(w.y>110);
  return w;
 });
 for(const w of runs.slice(1)){
  assert.ok(Math.hypot(w.z-runs[0].z,w.y-runs[0].y)<1e-8);
  assert.ok(Math.abs(w.energy-runs[0].energy)<.01);
 }
});

test('upward boost cannot cross the underside of a thin rooftop',()=>{
 const roof=createCollider([{minY:12,height:12.2,polygon:square(8)}]);
 const w=atlas({y:2,vy:180,grounded:false});
 toggleFlight(w,roof);
 simulate(w,{ascend:true,boost:true},.5,roof);
 assert.ok(w.y<=12-1.86);
 assert.equal(roof.blocked(w.x,w.z,w.y),false);
 assert.equal(w.vy,0);
});

test('vertical camera sweep stops beneath an overhead surface',()=>{
 const roof=createCollider([{minY:8,height:10,polygon:square(10)}]);
 assert.ok(cameraSweep(0,0,4,1,12,3,roof)<.5);
 assert.equal(cameraSweep(0,0,4,1,6,3,roof),1);
});

test('braking keeps vertical control, then releasing movement eases to a hover',()=>{
 const w=atlas({y:80,vz:-30,grounded:false});
 toggleFlight(w);
 simulate(w,{brake:true,ascend:true},.5);
 assert.equal(flightSnapshot(w).state,'BRAKE');
 assert.ok(Math.abs(w.vz)<1e-8&&w.vy>4);
 const vy=w.vy;
 simulate(w,{},.1);
 assert.ok(w.vy>0&&w.vy<vy);
 simulate(w,{},2);
 assert.equal(flightTelemetry(w).flightLabel,'Hover');
});

test('roof launch settles into hover and rejects illegal state transitions',()=>{
 const machine=createFlightState();
 assert.equal(machine.transition('BOOST','invalid'),false);
 assert.equal(machine.state,'GROUNDED');
 const roof=createCollider([{height:20,polygon:square(25)}]);
 const w=atlas({y:20});
 toggleFlight(w,roof);simulate(w,{},1.5,roof);
 assert.equal(flightSnapshot(w).state,'HOVER');
 assert.ok(w.y>20);
});

test('boost reaches zero before switching to cruise and emits both boost events',()=>{
 const w=atlas({y:80,grounded:false,energy:FLIGHT.boostMinimum});
 resetFlight(w,'HOVER');
 const events=[];
 for(let i=0;i<120&&!(events.includes('boostEnd'));i++){
  stepHero(w,{forward:true,boost:true},1/120,undefined,undefined,type=>events.push(type));
 }
 assert.deepEqual(events,['boostStart','boostEnd']);
 assert.equal(w.energy,0);
 assert.equal(flightSnapshot(w).state,'CRUISE');
 assert.equal(flightSnapshot(w).canBoost,false);
});
