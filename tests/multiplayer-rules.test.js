import test from 'node:test';
import assert from 'node:assert/strict';
import {crashDamage, resolvePlayerUpdate, sanitizeSnapshot, RESPAWN_MS} from '../src/multiplayer-rules.js';

test('crash damage rises with closing speed',()=>{
  assert.equal(crashDamage({x:0,z:0,vx:20,vz:0},{x:1,z:0,vx:-20,vz:0}),44);
  assert.equal(crashDamage({x:0,z:0,vx:3,vz:0},{x:1,z:0,vx:-3,vz:0}),0);
});

test('phasing players do not collide',()=>{
  assert.equal(crashDamage({x:0,z:0,vx:90,vz:0,phasing:true},{x:1,z:0,vx:-90,vz:0}),0);
});

test('snapshots discard untrusted fields and clamp movement values',()=>{
  const snapshot=sanitizeSnapshot({x:Infinity,z:-9,y:999,vx:1e5,vz:-1e5,heading:20,phasing:1,admin:true});
  assert.equal(snapshot.x,0);assert.equal(snapshot.y,600);assert.equal(snapshot.vx,300);assert.equal(snapshot.vz,-300);assert.equal(snapshot.admin,undefined);assert.equal(snapshot.hero,'speedster');assert.ok(Math.abs(snapshot.heading)<=Math.PI*2);
});

test('lethal damage starts a three second respawn',()=>{
  const now=1_000;
  const next=resolvePlayerUpdate({health:20,respawnAt:0,lastHitAt:0},{damage:25,now});
  assert.equal(next.health,0);
  assert.equal(next.respawnAt,now+RESPAWN_MS);
});

test('expired respawn restores full health',()=>{
  const next=resolvePlayerUpdate({health:0,respawnAt:4_000,lastHitAt:1_000},{damage:0,now:4_001});
  assert.equal(next.health,100);
  assert.equal(next.respawnAt,0);
});
