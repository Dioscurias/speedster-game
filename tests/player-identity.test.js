import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {recolorSpeedsterSuit,speedsterColorForIndex} from '../src/superhero.js';
import {createRoomEngine} from '../src/room-engine.js';
import {Multiplayer} from '../src/multiplayer.js';

const state=x=>({x,z:0,y:0,vx:0,vz:0,heading:0,phasing:false});
function suit(){
 const model=new THREE.Group(),geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,1,0,0,0,1,0],3));
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(['#a41732','#edc475','#ad7053'].flatMap(color=>new THREE.Color(color).toArray()),3));
 model.add(new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true})));return model;
}
function colorAt(model,index=0){return new THREE.Color().fromBufferAttribute(model.children[0].geometry.attributes.color,index);}
const matches=(actual,expected)=>assert.ok(actual.toArray().every((value,index)=>Math.abs(value-new THREE.Color(expected).toArray()[index])<1e-6));

test('a remote clone gets its own assigned color after the local suit is recolored',()=>{
 const local=suit();recolorSpeedsterSuit(local,speedsterColorForIndex(1));
 const peer=clone(local);recolorSpeedsterSuit(peer,speedsterColorForIndex(2));
 matches(colorAt(local),speedsterColorForIndex(1));matches(colorAt(peer),speedsterColorForIndex(2));
 matches(colorAt(peer,1),'#edc475');matches(colorAt(peer,2),'#ad7053');
});
test('the local suit can change server assignment without losing its fabric mask',()=>{
 const local=suit();recolorSpeedsterSuit(local,speedsterColorForIndex(1));recolorSpeedsterSuit(local,speedsterColorForIndex(3));
 matches(colorAt(local),speedsterColorForIndex(3));matches(colorAt(local,1),'#edc475');
});
test('a multiplayer response applies the same authoritative color to the local runner',async t=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,'sessionStorage');
 Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{getItem:()=> 'local-player'}});
 t.after(()=>{if(original)Object.defineProperty(globalThis,'sessionStorage',original);else delete globalThis.sessionStorage;});
 let colorIndex=1,body;
 t.mock.method(globalThis,'fetch',async(url,options)=>{
  body=JSON.parse(options.body);return Response.json({self:{id:body.id,name:body.name,colorIndex,health:100,respawnAt:0},players:[],online:1});
 });
 const local=suit(),multiplayer=new Multiplayer({scene:new THREE.Scene(),template:local,getWorld:()=>({...state(0),status:'running'})});
 await multiplayer.poll(0);matches(colorAt(local),speedsterColorForIndex(1));assert.equal(multiplayer.connected,true);assert.equal(typeof body.name,'string');
 colorIndex=2;await multiplayer.poll(200);matches(colorAt(local),speedsterColorForIndex(2));
});
test('chosen names are returned consistently to their owner and every peer',()=>{
 const room=createRoomEngine();room.update('a',state(0),1000,{name:'Nico'});
 const joined=room.update('b',state(20),1010,{name:'Maya'});
 assert.equal(joined.self.name,'Maya');assert.equal(joined.players[0].name,'Nico');
 const owner=room.update('a',state(1),1020);assert.equal(owner.self.name,'Nico');assert.equal(owner.players[0].name,'Maya');
 const renamed=room.update('a',state(2),1030,{name:'Nico Ray'});
 assert.equal(renamed.self.colorIndex,owner.self.colorIndex);assert.equal(renamed.self.health,100);assert.equal(renamed.self.x,2);
 assert.equal(room.update('b',state(20),1040).players[0].name,'Nico Ray');
});
test('names are bounded and normalized on the server, with a readable fallback',()=>{
 const room=createRoomEngine();
 assert.equal(room.update('a',state(0),1000,{name:'  Ni\u0000co \n Ray\u202e  '}).self.name,'Nico Ray');
 assert.equal(room.update('b',state(20),1010,{name:'   '}).self.name,'Speedster');
 assert.equal(Array.from(room.update('a',state(0),1020,{name:'Å'.repeat(30)}).self.name).length,20);
});
test('room serialization preserves names and authoritative colors across updates',()=>{
 const room=createRoomEngine();const first=room.update('a',state(0),1000,{name:'Nico',colorIndex:99});
 room.update('b',state(20),1010,{name:'Maya',colorIndex:99});
 const restored=createRoomEngine(JSON.parse(JSON.stringify([...room.players.values()])));
 const result=restored.update('a',state(1),1020);
 assert.equal(result.self.name,'Nico');assert.equal(result.players[0].name,'Maya');assert.equal(result.self.colorIndex,first.self.colorIndex);assert.notEqual(result.self.colorIndex,99);
});
test('a chosen name is saved and restored from local storage',async()=>{
 const profile=await import('../src/player-profile.js?storage-test=saved'),values=new Map();
 const storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
 assert.equal(profile.readPlayerName(storage),'');assert.equal(profile.savePlayerName(' Nico ',storage),'Nico');
 const reloaded=await import('../src/player-profile.js?storage-test=reloaded');assert.equal(reloaded.readPlayerName(storage),'Nico');
});
test('renaming still works when storage is blocked or full',async()=>{
 const profile=await import('../src/player-profile.js?storage-test=blocked');
 const storage={getItem:()=> 'Old name',setItem:()=>{throw new Error('Storage full');}};
 profile.savePlayerName('New name',storage);assert.equal(profile.readPlayerName(storage),'New name');
});
