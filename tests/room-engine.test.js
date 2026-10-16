import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoomEngine} from '../src/room-engine.js';

const state=(x,vx=0)=>({x,z:0,y:0,vx,vz:0,heading:0,phasing:false});

test('joining a room returns the other live speedsters',()=>{
  const room=createRoomEngine();
  room.update('a',state(0),1_000);
  const result=room.update('b',state(20),1_010);
  assert.deepEqual(result.players.map(player=>player.id),['a']);
  assert.equal(result.online,2);
});
test('every active player receives a different stable suit color',()=>{
  const room=createRoomEngine();
  const first=room.update('a',state(0),1_000).self.colorIndex;
  const second=room.update('b',state(20),1_010).self.colorIndex;
  const repeated=room.update('a',state(1),1_020).self.colorIndex;
  assert.notEqual(first,second);
  assert.equal(first,repeated);
});

test('a fast head-on crash damages both players only once per cooldown',()=>{
  const room=createRoomEngine();
  room.update('a',state(0,30),1_000);
  const hit=room.update('b',state(1,-30),1_010);
  assert.equal(hit.self.health,28);
  assert.equal(hit.players[0].health,28);
  const duplicate=room.update('b',state(1,-30),1_100);
  assert.equal(duplicate.self.health,28);
});

test('dead players respawn with full health after three seconds',()=>{
  const room=createRoomEngine();
  room.update('a',state(0,100),1_000);
  const death=room.update('b',state(1,-100),1_010);
  assert.equal(death.self.health,0);
  assert.equal(room.update('b',state(1),4_009).self.health,0);
  assert.equal(room.update('b',state(1),4_011).self.health,100);
});

test('players disappear after the presence timeout',()=>{
  const room=createRoomEngine();
  room.update('a',state(0),1_000);
  const result=room.update('b',state(20),12_000);
  assert.equal(result.online,1);
});
