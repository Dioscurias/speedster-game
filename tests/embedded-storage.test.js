import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
for(const mode of ['access denied','write denied'])test('embedded game initializes when session storage is '+mode,async t=>{
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'sessionStorage');
 const denied=()=>{throw new DOMException('Storage denied','SecurityError');};
 Object.defineProperty(globalThis,'sessionStorage',mode==='access denied'?{configurable:true,get:denied}:{configurable:true,value:{getItem:()=>null,setItem:denied}});
 t.after(()=>{if(descriptor)Object.defineProperty(globalThis,'sessionStorage',descriptor);else delete globalThis.sessionStorage;});
 const {Multiplayer}=await import('../src/multiplayer.js?blocked='+encodeURIComponent(mode));
 const create=()=>new Multiplayer({scene:new THREE.Scene(),template:new THREE.Group(),getWorld:()=>({status:'ready'})});
 const first=create(),second=create();assert.ok(first.id);assert.equal(first.id,second.id,'fallback identity is stable for this game document');
});
