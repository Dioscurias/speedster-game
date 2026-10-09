import './parkour.css';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createWorld,stepWorld,PARKOUR,updateView,cameraClearance} from './game.js';
import {CharacterAnimation} from './character-animation.js';
import {createCourse} from './parkour-course.js';
import {buildParkourMap} from './parkour-map.js';
import {JumpFX} from './jump-fx.js';

document.title='The Last Household — Speedster Parkour';
document.body.innerHTML=`<div id="parkour-scene"></div><header><strong>THE LAST HOUSEHOLD</strong><a href="/">← Austin</a><button id="pause">Pause</button></header><div id="progress"><span id="zone">Salt Steps</span><span id="score">0 / 15 orbs · Checkpoint 0 / 5</span></div><div id="hint">WASD move · Space jump (hold for height) · Arrow keys / drag to look · Esc pause</div><div id="touch"><button data-key="w">↑</button><button data-key="a">←</button><button data-key="s">↓</button><button data-key="d">→</button><button data-key=" ">Jump</button></div><div id="overlay"><div class="card"><small>A STANDALONE PARKOUR JOURNEY</small><h1 id="title">The Last Household</h1><p id="description">Cross the red canyon beneath impossible monuments. Follow the golden orbs through five zones to the light. Blue rings save your progress.</p><label><input id="reduced" type="checkbox"> Reduced motion</label><label><input id="apex" type="checkbox"> Slow-motion beat at jump apex</label><button id="play" disabled>Loading character…</button><button id="restart" hidden>Restart course</button></div></div>`;
const $=id=>document.getElementById(id),keys={};let jumpQueued=false,view={yaw:0,pitch:.34},accumulator=0,last=performance.now(),apexBeat=0;
const scene=new THREE.Scene();scene.background=new THREE.Color('#f5a16e');scene.fog=new THREE.FogExp2('#f5a16e',.0018);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;$('parkour-scene').appendChild(renderer.domElement);
const camera=new THREE.PerspectiveCamera(58,1,.08,2500);scene.add(new THREE.HemisphereLight('#ffcfaa','#402b43',2));
const sun=new THREE.DirectionalLight('#ffe0ad',3);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-24,right:24,top:24,bottom:-24,near:1,far:180});sun.shadow.normalBias=.03;scene.add(sun,sun.target);
let course=createCourse(),map=buildParkourMap(scene,course),world=createWorld(course.spawn),runner=new THREE.Group(),animator,fx;scene.add(runner);
$('reduced').checked=matchMedia('(prefers-reduced-motion: reduce)').matches;
function clearInput(){for(const k of Object.keys(keys))delete keys[k];jumpQueued=false;}
function overlay(title,description,button){$('title').textContent=title;$('description').textContent=description;$('play').textContent=button;$('overlay').hidden=false;}
function pause(){if(world.status==='running'){world.status='paused';clearInput();overlay('Take a breath.','Your checkpoint is saved for this run.','Resume');$('restart').hidden=false;}else if(world.status==='paused')start();}
function start(){if(world.status==='complete'){restart();return;}world.status='running';$('overlay').hidden=true;clearInput();last=performance.now();}
function restart(){const old=map.root;scene.remove(old);const materials=new Set(),geometries=new Set();old.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);materials.add(o.material);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());course=createCourse();map=buildParkourMap(scene,course);world=createWorld(course.spawn);world.status='running';view={yaw:0,pitch:.34};accumulator=apexBeat=0;animator.reset(world);fx.support=course.collider.surface;fx.reset(world);$('overlay').hidden=true;clearInput();}
$('pause').onclick=pause;$('play').onclick=start;$('restart').onclick=restart;
window.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement)return;const k=e.key.toLowerCase();if([' ','arrowleft','arrowright','arrowup','arrowdown'].includes(k))e.preventDefault();if(k==='escape'&&!e.repeat){pause();return;}if(world.status!=='running')return;if(k===' '&&!e.repeat)jumpQueued=true;keys[k]=true;});
window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);window.addEventListener('blur',()=>{clearInput();if(world.status==='running')pause();});
for(const button of document.querySelectorAll('[data-key]')){button.onpointerdown=e=>{e.preventDefault();if(world.status!=='running')return;button.setPointerCapture(e.pointerId);keys[button.dataset.key]=true;if(button.dataset.key===' ')jumpQueued=true;};for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,()=>keys[button.dataset.key]=false);}
let drag=null;renderer.domElement.style.touchAction='none';renderer.domElement.onpointerdown=e=>{if(world.status!=='running')return;drag={x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId);};renderer.domElement.onpointermove=e=>{if(!drag)return;view.yaw-=(e.clientX-drag.x)*.004;view.pitch=THREE.MathUtils.clamp(view.pitch+(e.clientY-drag.y)*.004,.08,1.15);drag={x:e.clientX,y:e.clientY};};renderer.domElement.onpointerup=renderer.domElement.onpointercancel=()=>drag=null;
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}window.addEventListener('resize',resize);resize();
try{
 const human=await new GLTFLoader().loadAsync('/assets/human/Superhero.glb');const model=human.scene;const bounds=new THREE.Box3().setFromObject(model);model.scale.multiplyScalar(1.86/bounds.getSize(new THREE.Vector3()).y);bounds.setFromObject(model);const center=bounds.getCenter(new THREE.Vector3());model.position.set(-center.x,-bounds.min.y,-center.z);
 model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.frustumCulled=false;o.material=new THREE.MeshStandardMaterial({color:'#147db8',emissive:'#36cfff',emissiveIntensity:1.1,roughness:.4});}});runner.add(model);animator=new CharacterAnimation(model,human.animations,world);fx=new JumpFX(scene,runner,course.collider.surface);$('play').disabled=false;$('play').textContent='Begin journey';
}catch(error){console.error(error);$('description').textContent='The character could not load. Reload to try again.';$('play').textContent='Reload';$('play').disabled=false;$('play').onclick=()=>location.reload();}
window.__parkour={getState:()=>({...world}),getProgress:()=>course.update(world),getPlatforms:()=>course.platforms.map(p=>({...p}))};
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;let simulationDelta=0;
 if(animator&&world.status==='running'){
  view=updateView(view,{left:keys.arrowleft,right:keys.arrowright,up:keys.arrowup,down:keys.arrowdown},dt);
  const scale=apexBeat>0?.65:1;apexBeat=Math.max(0,apexBeat-dt);accumulator+=dt*scale;
  while(accumulator>=1/120&&world.status==='running'){
   const vy=world.vy;stepWorld(world,{forward:keys.w,backward:keys.s,left:keys.a,right:keys.d,viewYaw:view.yaw,jump:jumpQueued,jumpHeld:!!keys[' ']},1/120,course.collider,PARKOUR);jumpQueued=false;simulationDelta+=1/120;accumulator-=1/120;
   if($('apex').checked&&!$('reduced').checked&&vy>0&&world.vy<=0&&!world.grounded)apexBeat=.06;
   const result=course.update(world);if(result.respawned){animator.reset(world);fx.reset(world);view.yaw=0;apexBeat=0;}
   if(result.complete){clearInput();overlay('You made it.',`${result.collected} / ${result.total} orbs · ${world.elapsed.toFixed(1)} seconds${result.collected===result.total?' · Perfect clear':''}`,'Play again');$('restart').hidden=true;}
  }
 }else accumulator=0;
 const progress=course.update(world);map.update(world,world.worldTime,progress.zone);$('zone').textContent=progress.name;$('score').textContent=`${progress.collected} / 15 orbs · Checkpoint ${progress.zone} / 5`;
 if(animator){const pose=animator.update(world,{forward:keys.w,backward:keys.s,left:keys.a,right:keys.d,viewYaw:view.yaw},simulationDelta);runner.position.set(0,world.y-pose.crouch*.04,0);runner.rotation.y=-world.heading;fx.update(world,simulationDelta,$('reduced').checked);}
 const response=fx?.camera($('reduced').checked)??{fov:0,dip:0,shake:0};const distance=7,horizontal=Math.cos(view.pitch)*distance;const target=new THREE.Vector3(-Math.sin(view.yaw)*horizontal+response.shake,world.y+1.25+Math.sin(view.pitch)*distance+response.dip,Math.cos(view.yaw)*horizontal);
 const clearance=cameraClearance(world.x,world.z,target.x,target.z,course.collider,target.y);target.x*=clearance;target.z*=clearance;camera.position.lerp(target,1-Math.exp(-dt*10));camera.lookAt(Math.sin(view.yaw)*1.7,world.y+1.35,-Math.cos(view.yaw)*1.7);camera.fov=THREE.MathUtils.lerp(camera.fov,58+response.fov,1-Math.exp(-dt*8));camera.updateProjectionMatrix();sun.position.set(-35,world.y+60,25);sun.target.position.set(0,world.y,0);renderer.render(scene,camera);
}
camera.position.set(0,3,7);requestAnimationFrame(frame);
