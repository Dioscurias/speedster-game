import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import * as THREE from 'three';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {CharacterAnimation} from '../src/character-animation.js';import {poseHero} from '../src/hero-visuals.js';import {createWorld} from '../src/game.js';
test('actual Atlas hover rig keeps feet under hips and hands relaxed below elbows',async()=>{
 const bytes=await fs.readFile(new URL('../public/assets/human/Superhero.glb',import.meta.url));const a=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');const root=new THREE.Group();root.add(a.scene);const w={...createWorld(),status:'running',hero:'atlas',flying:true,grounded:false,y:20};const animator=new CharacterAnimation(a.scene,a.animations,w);
 for(let i=0;i<180;i++){w.worldTime+=1/60;animator.update(w,{},1/60);poseHero(animator,root,w);}
 const pos=name=>animator.bones[name].bone.getWorldPosition(new THREE.Vector3());root.updateMatrixWorld(true);
 const ankles=Math.abs(pos('LeftFoot').x-pos('RightFoot').x),hips=Math.abs(pos('LeftUpLeg').x-pos('RightUpLeg').x);
 assert.ok(ankles<hips*1.35,`feet ${ankles} vs hips ${hips}`);
 for(const side of ['Left','Right'])assert.ok(pos(side+'Hand').y<pos(side+'ForeArm').y-.1,'hover hands rest below elbows');
 for(const {bone} of Object.values(animator.bones))assert.ok(bone.quaternion.toArray().every(Number.isFinite));
});
