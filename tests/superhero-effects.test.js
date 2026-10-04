import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import * as THREE from 'three';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {CharacterAnimation} from '../src/character-animation.js';import {styleSuperhero} from '../src/superhero.js';import {SpeedLightning} from '../src/lightning.js';import {createWorld} from '../src/game.js';
async function hero(){const bytes=await fs.readFile(new URL('../public/assets/human/Superhero.glb',import.meta.url));const asset=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');styleSuperhero(asset.scene);const world=createWorld();world.status='running';const animation=new CharacterAnimation(asset.scene,asset.animations,world);return {asset,world,animation};}
test('jump folds both superhero knees backward without spreading the ankles sideways',async()=>{
 const {asset,world,animation}=await hero();
 const localPosition=name=>{asset.scene.updateMatrixWorld(true);return asset.scene.worldToLocal(animation.bones[name].bone.getWorldPosition(new THREE.Vector3()));};
 const leftBefore=localPosition('LeftFoot'),rightBefore=localPosition('RightFoot');
 world.grounded=false;world.vy=0;world.y=2;
 for(let i=0;i<30;i++)animation.update(world,{},1/60);
 const left=localPosition('LeftFoot'),right=localPosition('RightFoot');
 assert.ok(left.y>leftBefore.y+.12,'left knee visibly folds');
 assert.ok(right.y>rightBefore.y+.12,'right knee visibly folds');
 assert.ok(Math.abs(left.x-leftBefore.x)<.12,'left ankle stays under its hip');
 assert.ok(Math.abs(right.x-rightBefore.x)<.12,'right ankle stays under its hip');
});
test('downloaded superhero binds locomotion clips and limb effect anchors',async()=>{const {asset,world,animation}=await hero();for(const name of ['Head','Hips','Spine2','LeftHand','RightHand','LeftFoot','RightFoot'])assert.ok(animation.bones[name],name);const start=animation.bones.LeftUpLeg.bone.quaternion.clone();world.speed=40;for(let i=0;i<20;i++)animation.update(world,{forward:true},1/60);assert.ok(start.angleTo(animation.bones.LeftUpLeg.bone.quaternion)>.1);asset.scene.updateMatrixWorld(true);for(const {bone} of Object.values(animation.bones)){const p=bone.getWorldPosition(new THREE.Vector3());assert.ok(p.toArray().every(Number.isFinite));assert.ok(p.length()<3,'rig retains human proportions');}});
test('lightning grows its trail without replacing GPU buffers and freezes while paused',async()=>{const {asset,world,animation}=await hero();const effect=new SpeedLightning(new THREE.Scene(),animation);world.speed=50;const initialBuffer=effect.layers[0].geometry.attributes.instanceStart.data;for(let i=1;i<=20;i++){world.worldTime=i/60;world.z=-i;animation.update(world,{forward:true},1/60);effect.update(world,asset.scene);}assert.equal(effect.layers[0].geometry.attributes.instanceStart.data,initialBuffer);assert.ok(effect.snapshot().segments>100);assert.ok(effect.snapshot().segments<800);const before=effect.snapshot();world.status='paused';world.worldTime++;effect.update(world,asset.scene);assert.deepEqual(effect.snapshot(),before);effect.reset();assert.equal(effect.snapshot().visible,false);assert.equal(effect.snapshot().samples,0);});
