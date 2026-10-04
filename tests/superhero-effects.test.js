import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import * as THREE from 'three';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {CharacterAnimation} from '../src/character-animation.js';import {styleSuperhero,recolorSpeedsterSuit,speedsterColorForId} from '../src/superhero.js';import {SpeedLightning} from '../src/lightning.js';import {createWorld} from '../src/game.js';
async function hero(){const bytes=await fs.readFile(new URL('../public/assets/human/Superhero.glb',import.meta.url));const asset=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');styleSuperhero(asset.scene);const world=createWorld();world.status='running';const animation=new CharacterAnimation(asset.scene,asset.animations,world);return {asset,world,animation};}
test('multiplayer palette recolors only suit fabric and is stable per player',async()=>{
 const {asset}=await hero();const before=[];asset.scene.traverse(o=>{if(o.isMesh&&o.geometry.attributes.color){const colors=o.geometry.attributes.color;for(let i=0;i<colors.count;i++)before.push([colors.getX(i),colors.getY(i),colors.getZ(i)]);}});
 const color=speedsterColorForId('player-42');assert.equal(color,speedsterColorForId('player-42'));
 recolorSpeedsterSuit(asset.scene,color);const after=[];asset.scene.traverse(o=>{if(o.isMesh&&o.geometry.attributes.color){const colors=o.geometry.attributes.color;for(let i=0;i<colors.count;i++)after.push([colors.getX(i),colors.getY(i),colors.getZ(i)]);}});
 let suitChanged=false,skinPreserved=false,goldPreserved=false;const suit=new THREE.Color('#a41732'),skin=new THREE.Color('#ad7053'),gold=new THREE.Color('#edc475');
 const near=(r,g,b,target)=>Math.hypot(r-target.r,g-target.g,b-target.b)<.04;
 for(let i=0;i<before.length;i++){const [r,g,b]=before[i],changed=Math.abs(r-after[i][0])+Math.abs(g-after[i][1])+Math.abs(b-after[i][2])>.02;if(near(r,g,b,suit))suitChanged||=changed;if(near(r,g,b,skin))skinPreserved||=!changed;if(near(r,g,b,gold))goldPreserved||=!changed;}
 assert.ok(suitChanged);assert.ok(skinPreserved);assert.ok(goldPreserved);
});
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
