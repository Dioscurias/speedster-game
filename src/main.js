import './style.css';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {createWorld,stepWorld,hitTraffic,collectEnergy,cameraClearance,updateView,BOOST_SPEED,PHYSICS} from './game.js';
import {prepareMap} from './austin.js';
import {createCity} from './city.js';
import {CharacterAnimation} from './character-animation.js';
import {phaseVibration} from './speed-effects.js';
import {SpeedLightning} from './lightning.js';
import {mountMapOverview} from './map-overview.js';
import {styleSuperhero,speedsterColorForIndex} from './superhero.js';
import {Multiplayer} from './multiplayer.js';

const $=id=>document.getElementById(id),keys={};
let world=createWorld(),view={yaw:0,pitch:.34},map,city,loaded=false,quality=true,runner,animator,lightning,multiplayer,jumpQueued=false,toastUntil=0,dead=false,lastHealth=100;
const scene=new THREE.Scene();scene.background=new THREE.Color('#b9d4e7');scene.fog=new THREE.FogExp2('#b9d4e7',.00165);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;$('scene').appendChild(renderer.domElement);
const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(new RoomEnvironment(),.04);scene.environment=environment.texture;scene.environmentIntensity=.65;pmrem.dispose();
const camera=new THREE.PerspectiveCamera(58,1,.08,1800);camera.position.set(3,3,7);
scene.add(new THREE.HemisphereLight('#dcecff','#665e53',1.65));
const sun=new THREE.DirectionalLight('#ffe3b5',3.1);sun.position.set(-45,70,40);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-45,right:45,top:45,bottom:-45,near:1,far:260});sun.shadow.bias=-.0003;sun.shadow.normalBias=.035;sun.shadow.radius=3;scene.add(sun,sun.target);
const loader=new GLTFLoader(),draco=new DRACOLoader();draco.setDecoderPath('/assets/draco/');loader.setDRACOLoader(draco);
function fitted(model,height){const wrapper=new THREE.Group();wrapper.add(model);const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3());model.scale.multiplyScalar(height/size.y);const b=new THREE.Box3().setFromObject(model),c=b.getCenter(new THREE.Vector3());model.position.x-=c.x;model.position.z-=c.z;model.position.y-=b.min.y;return wrapper;}
async function init(){try{
 $('start-label').textContent='Loading Austin…';const response=await fetch('/assets/austin/map.json');if(!response.ok)throw Error('Austin map is unavailable');map=prepareMap(await response.json());
 const [human,vehicle]=await Promise.all([loader.loadAsync('/assets/human/Superhero.glb'),loader.loadAsync('/assets/vehicle/ferrari.glb')]);
 const suitNormal=await new THREE.TextureLoader().loadAsync('/assets/human/suit-normal.png');suitNormal.flipY=false;
 styleSuperhero(human.scene,{normalMap:suitNormal});
 runner=fitted(human.scene,1.86);scene.add(runner);animator=new CharacterAnimation(human.scene,human.animations,world);
 const car=fitted(vehicle.scene,1.3);city=await createCity(scene,map,car);
 world=createWorld(map.spawn);world.heading=map.spawnYaw;view={yaw:map.spawnYaw,pitch:.34};animator.reset(world);shownHeading=world.heading;
 lightning=new SpeedLightning(scene,animator);
 multiplayer=new Multiplayer({scene,template:runner,getWorld:()=>world,onState:handleMultiplayerState});
 loaded=true;city.update(world);$('start').disabled=false;$('start-label').textContent='Play';
 window.__velocity={getState:()=>({...world,viewYaw:view.yaw,viewPitch:view.pitch}),getAnimation:()=>animator.snapshot(),getEffects:()=>({vibration:phaseVibration(world.worldTime,world.phasing),lightning:lightning.snapshot()}),assetsLoaded:true,mapName:map.name,model:'Quaternius Superhero',mapStats:{roads:map.roads.length,buildings:map.buildings.length,features:map.mappedFeatureCount,generatedFeatures:map.features.length-map.mappedFeatureCount,...city.detailStats},cameraInsideBuilding:()=>map.collider.blocked(world.x+camera.position.x,world.z+camera.position.z,camera.position.y)};
}catch(error){console.error(error);$('start-label').textContent='Reload to retry';$('start').disabled=false;$('start').onclick=()=>location.reload();showToast('An asset could not load. Reload to try again.',30000);}}
function keysClear(){Object.keys(keys).forEach(k=>keys[k]=false);jumpQueued=false;}
function readRecords(){try{const d=JSON.parse(localStorage.getItem('velocity-austin'));if(d&&Number.isFinite(d.distance)&&Number.isFinite(d.topSpeed)&&Number.isFinite(d.pickups))return d;}catch{}return {distance:0,topSpeed:0,pickups:0};}
function saveRecords(){const r=readRecords();r.distance=Math.max(r.distance,world.distance);r.topSpeed=Math.max(r.topSpeed,world.topSpeed);r.pickups=Math.max(r.pickups,world.collected);try{localStorage.setItem('velocity-austin',JSON.stringify(r));}catch{}}
function reset(){saveRecords();lightning.reset();world=createWorld(map.spawn);world.status='running';world.heading=map.spawnYaw;view={yaw:map.spawnYaw,pitch:.34};animator.reset(world);shownHeading=world.heading;city.pickups.forEach(p=>p.available=0);keysClear();$('result').classList.add('hidden');$('death').classList.add('hidden');document.body.classList.add('running');$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','Pause game');}
function pause(){if(world.status==='running'){world.status='paused';saveRecords();$('result').classList.remove('hidden');$('pause').textContent='▶';$('pause').setAttribute('aria-label','Resume game');}else if(world.status==='paused'){world.status='running';$('result').classList.add('hidden');$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','Pause game');}keysClear();}
function showToast(text,duration=2400){$('toast').textContent=text;$('toast').style.opacity='1';toastUntil=performance.now()+duration;}
function handleMultiplayerState(data){
 const health=data.self.health;$('health-value').innerHTML=`${health}<span>%</span>`;$('health-fill').style.width=`${health}%`;$('online-count').textContent=String(data.online);$('network-state').textContent='Connected';
 if(health<lastHealth&&health>0)showToast(`${lastHealth-health} damage`,1100);
 if(health<=0&&!dead){dead=true;world.status='dead';keysClear();$('death').classList.remove('hidden');$('result').classList.add('hidden');}
 if(dead&&health>0){dead=false;world=createWorld(map.spawn);world.status='running';world.heading=map.spawnYaw;view={yaw:map.spawnYaw,pitch:.34};animator.reset(world);shownHeading=world.heading;$('death').classList.add('hidden');showToast('Respawned');}
 if(dead)$('respawn-count').textContent=String(Math.max(0,Math.ceil((data.self.respawnAt-data.serverTime)/1000)));
 lastHealth=health;
}
function contacts(){for(const car of city.traffic){const dx=world.x-car.x,dz=world.z-car.z,heading=Math.atan2(car.vx,car.vz),lateral=dx*Math.cos(heading)-dz*Math.sin(heading),longitudinal=dx*Math.sin(heading)+dz*Math.cos(heading);if(Math.abs(lateral)<1.25&&Math.abs(longitudinal)<2.6&&world.y<1.3&&hitTraffic(world,car))showToast('IMPACT · momentum absorbed',900);}
 for(const p of city.pickups)if(p.available<=world.elapsed&&Math.hypot(p.x-world.x,p.z-world.z)<1.7&&world.y<2){p.available=world.elapsed+25;collectEnergy(world);showToast('ϟ +25 SPEED FORCE',700);}}
function updateHUD(){
 $('speed').textContent=String(Math.round(world.speed*3.6)).padStart(3,'0');$('speed-mode').textContent=world.status==='ready'?'Ready':world.phasing?'Phasing':world.wallRunning?'Wall run':!world.grounded?'Airborne':world.slowing?'Slow time':world.boosting?'Boost':world.speed<.3?'Stopped':'Running';
 $('peak-speed').innerHTML=`${Math.round(world.topSpeed*3.6)}<span> KM/H</span>`;$('energy-label').innerHTML=`${Math.round(world.energy)}<span>%</span>`;$('energy-fill').style.width=`${world.energy}%`;
 $('distance').innerHTML=world.distance>=1000?`${(world.distance/1000).toFixed(2)} <small>km</small>`:`${Math.floor(world.distance)} <small>m</small>`;$('collected').textContent=String(world.collected).padStart(2,'0');
 document.querySelectorAll('#speed-bars i').forEach((b,i)=>b.classList.toggle('on',i<world.speed/BOOST_SPEED*20));document.body.classList.toggle('boosting',world.boosting);document.body.classList.toggle('slowing',world.slowing);
 const heading=((view.yaw*180/Math.PI)%360+360)%360,compass=['N','NE','E','SE','S','SW','W','NW'][Math.round(heading/45)%8];$('compass').textContent=`${compass} · ${Math.round(heading)}°`;
 const ll=city.coordinates(world.x,world.z);$('coords').textContent=`${ll.lat.toFixed(4)}° N / ${Math.abs(ll.lon).toFixed(4)}° W`;
 const edge=Math.min(world.x-map.bounds.minX,map.bounds.maxX-world.x,world.z-map.bounds.minZ,map.bounds.maxZ-world.z);
 $('scene-state').textContent=edge<25?'Map boundary':city.streetAt(world.x,world.z);$('street-name').textContent=city.streetAt(world.x,world.z);$('impact').style.opacity=world.impact>.25?String(world.impact):'0';
 const mapPlayers=multiplayer?Array.from(multiplayer.avatars.values(),avatar=>avatar.state).filter(Boolean).map(player=>({...player,color:speedsterColorForIndex(player.colorIndex)})):[];
 city.drawMap($('minimap'),world,{players:mapPlayers,pickups:city.pickups});
 $('braking').textContent=`${Math.round(world.speed*world.speed/(2*PHYSICS.braking*world.grip))} m`;
 if(multiplayer){$('online-count').textContent=String(multiplayer.online);$('network-state').textContent=multiplayer.connected?'Connected':'Reconnecting';}
}
let shownHeading=0;
function updateScene(dt){
 city.update(world);const active=world.status==='running',preview=world.status==='ready',moving=world.speed>.4;
 const animationDt=active?Math.max(0,world.worldTime-animator.state.worldTime):preview?dt:0;
 const pose=animator.update(world,{left:keys.a,right:keys.d,forward:keys.w,backward:keys.s,boost:keys.shift,viewYaw:view.yaw},animationDt);
 const diff=Math.atan2(Math.sin(world.heading-shownHeading),Math.cos(world.heading-shownHeading));
 if(world.status!=='paused')shownHeading+=diff*(1-Math.exp(-animationDt*32));
 const vibration=phaseVibration(world.worldTime,world.phasing);
 runner.position.set(vibration.x,world.y-pose.crouch*.14+vibration.y,vibration.z);
 const rotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(-pose.lean*.18,-shownHeading,pose.bank*.2,'YXZ'));
 if(world.wallRunning){const {nx,nz}=world.wall;rotation.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(nz,0,-nx),new THREE.Vector3(nx,0,nz),new THREE.Vector3(0,-1,0)));}
 if(world.status!=='paused')runner.quaternion.slerp(rotation,1-Math.exp(-animationDt*26));
 runner.traverse(o=>{if(o.isMesh){o.material.transparent=world.phasing;o.material.opacity=world.phasing?.48+.12*Math.sin(world.worldTime*137):1;o.material.depthWrite=!world.phasing;}});
 $('phase').classList.toggle('active',world.phasing);$('phase').setAttribute('aria-pressed',String(world.phasing));
 lightning.update(world,runner);
 multiplayer?.update(dt);
 const yaw=preview?view.yaw-.3:view.yaw,pitch=preview?.3:view.pitch,distance=world.boosting?10:7,horizontal=Math.cos(pitch)*distance;
 const target=new THREE.Vector3(-Math.sin(yaw)*horizontal,world.y+1.25+Math.sin(pitch)*distance,Math.cos(yaw)*horizontal);
 const clear=world.phasing?1:cameraClearance(world.x,world.z,target.x,target.z,map.collider,world.y+1.4);target.x*=clear;target.z*=clear;
 camera.position.lerp(target,1-Math.exp(-dt*10));const safe=world.phasing?1:cameraClearance(world.x,world.z,camera.position.x,camera.position.z,map.collider,camera.position.y);camera.position.x*=safe;camera.position.z*=safe;
 camera.lookAt(Math.sin(yaw)*1.7,world.y+1.35,-Math.cos(yaw)*1.7);camera.fov=THREE.MathUtils.lerp(camera.fov,world.boosting?76:58,Math.min(1,dt*5));camera.updateProjectionMatrix();
}
$('speed-bars').innerHTML='<i></i>'.repeat(20);$('start').onclick=()=>{if(loaded)reset();};$('pause').onclick=pause;$('resume').onclick=pause;$('restart').onclick=reset;
window.addEventListener('keydown',event=>{if($('info-dialog').open)return;const k=event.key.toLowerCase();if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))event.preventDefault();if(k==='m'&&!event.repeat&&loaded){showMap();return;}if(k==='escape'){if(!event.repeat)pause();return;}if(k==='enter'&&world.status==='ready'&&loaded){reset();return;}if(k===' '&&!event.repeat)jumpQueued=true;keys[k]=true;});
window.addEventListener('keyup',event=>keys[event.key.toLowerCase()]=false);window.addEventListener('blur',()=>{if(world.status==='running')pause();keysClear();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&world.status==='running')pause();});window.addEventListener('pagehide',saveRecords);
document.querySelectorAll('[data-key]').forEach(button=>{button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);keys[button.dataset.key]=true;if(button.dataset.key===' ')jumpQueued=true;});for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>keys[button.dataset.key]=false);});
$('quality').onclick=()=>{quality=!quality;renderer.setPixelRatio(quality?Math.min(devicePixelRatio,1.6):1);renderer.shadowMap.enabled=quality;$('quality').textContent=quality?'HQ':'LQ';showToast(quality?'High quality enabled':'Performance mode enabled');};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.game-frame').requestFullscreen();}catch{showToast('Fullscreen is unavailable in this browser.');}};
const guide=`<span class="eyebrow">FIELD GUIDE / AUSTIN</span><h2>Feel the momentum.</h2><p>Explore a real downtown Austin map: Congress Avenue, Sixth Street, the Capitol and Lady Bird Lake. There is no race timer.</p><ul><li><strong>WASD:</strong> move relative to the camera. Steering responds quickly while acceleration stays gradual. Grass and gravel have less grip than pavement. Release to brake; watch the surface-aware stopping-distance estimate.</li><li><strong>← / → arrows:</strong> rotate the camera. <strong>↑ / ↓:</strong> raise or lower the view. The mouse does not control the camera.</li><li><strong>Shift:</strong> apply speedster acceleration, up to 936 km/h. Normal running is capped at 324 km/h.</li><li><strong>Space:</strong> jump. Hold Space for a full jump; tap for a short hop. Limited air steering lets you adjust your landing. Takeoff uses 9.81 m/s² gravity, with stronger downward gravity for a quicker landing. Small curbs step up automatically; buffered jumps and a short ledge grace period make parkour forgiving.</li><li><strong>E:</strong> slow time to manage corners. Turning is responsive; wall impacts stop inward momentum while preserving sliding along the wall.</li><li><strong>Q / Phase button (hold):</strong> pass through buildings and traffic. Release in open space. Releasing inside a building returns you to your last clear position.</li><li><strong>Wall run:</strong> jump and rush toward a building, then keep moving into it to climb. Space pushes off; reaching the top carries you onto the roof.</li><li><strong>Lightning:</strong> refill 25 energy. Pickups respawn after 25 seconds.</li><li><strong>M / Expand map:</strong> explore street names, parks, trails and landmarks. Drag to pan and use the zoom slider.</li><li><strong>Escape:</strong> pause and save records. On mobile, W/A/S/D buttons move; the separate arrows control the view.</li></ul><p>The playable area is a downtown extract about 1.6 × 2.4 km. Street and building outlines are from OpenStreetMap. Trees, street furniture, crossings and points of interest use mapped locations. Curbs, facade details and bridge rails are generalized; base terrain is flat and missing building heights are estimated. Superhuman speed and acceleration remain fictional.</p>`;
function showMap(){if(!loaded)return;openInfo(`<h2>Austin</h2><div class="map-tools"><label>Zoom <input id="map-zoom" type="range" min="1" max="4" step=".1" value="1"></label></div><canvas id="city-overview" width="900" height="1000" aria-label="Austin map. Drag to pan; select a landmark to see its name."></canvas><p id="map-place" aria-live="polite"></p>`);mountMapOverview($('city-overview'),$('map-place'),$('map-zoom'),map,world);}
$('map-open').onclick=showMap;$('minimap').onclick=showMap;
function openInfo(content){if(world.status==='running')pause();$('dialog-content').innerHTML=content;$('info-dialog').showModal();}
$('guide-tab').onclick=$('how-to').onclick=()=>openInfo(guide);
$('records-tab').onclick=()=>{saveRecords();const r=readRecords();openInfo(`<span class="eyebrow">AUSTIN / PERSONAL BEST</span><h2>Your records.</h2><p>Your best Austin sessions, saved in this browser.</p><div class="record-row"><span>Top speed</span><strong>${Math.round(r.topSpeed*3.6)} km/h</strong></div><div class="record-row"><span>Longest exploration</span><strong>${(r.distance/1000).toFixed(2)} km</strong></div><div class="record-row"><span>Most lightning collected</span><strong>${r.pickups}</strong></div>`);};
$('credits').onclick=()=>openInfo(`<span class="eyebrow">REAL PLACES. GREAT CREATORS.</span><h2>Asset & map credits.</h2><ul><li>Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>, ODbL. <a href="/assets/austin/map.json" download>Download derived map data</a>.</li><li>Superhero model and Universal Animation Library: <a href="https://quaternius.com/packs/universalbasecharacters.html" target="_blank" rel="noopener">Quaternius</a>, CC0. Speedster suit and lightning effects customized for this game.</li><li>Ferrari 458 Italia by <a href="https://sketchfab.com/3d-models/ferrari-458-italia-57bf6cc56931426e87494f554df1dab6" target="_blank" rel="noopener">vicent091036</a>, via the Three.js car example.</li><li>Asphalt 02, Concrete Floor 02, Brick Wall 001 and Aerial Grass Rock textures: <a href="https://polyhaven.com" target="_blank" rel="noopener">Poly Haven</a>, CC0.</li></ul><p>Generalized building facades and the Capitol dome are generated from mapped footprints. Three.js renders the game; Google Fonts supplies the typography.</p>`);
$('play-tab').onclick=()=>{if($('info-dialog').open)$('info-dialog').close();document.querySelector('.game-frame').scrollIntoView({behavior:'smooth',block:'center'});};document.querySelector('.close-dialog').onclick=()=>$('info-dialog').close();$('info-dialog').addEventListener('click',e=>{if(e.target===$('info-dialog')){const r=$('info-dialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('info-dialog').close();}});
new ResizeObserver(()=>{const r=$('scene').getBoundingClientRect();renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}).observe($('scene'));
let last=performance.now(),lastHUD=0,lastSave=0,accumulator=0;
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.1);last=now;
 if(loaded){if(world.status==='running'){view=updateView(view,{left:keys.arrowleft,right:keys.arrowright,up:keys.arrowup,down:keys.arrowdown},dt);accumulator+=dt;
  while(accumulator>=1/120){stepWorld(world,{left:keys.a,right:keys.d,forward:keys.w,backward:keys.s,boost:keys.shift,slow:keys.e,phase:keys.q,viewYaw:view.yaw,jump:jumpQueued,jumpHeld:!!keys[' ']},1/120,map.collider);jumpQueued=false;contacts();accumulator-=1/120;}
 }else{accumulator=0;jumpQueued=false;}
 multiplayer?.poll(now);updateScene(dt);if(now-lastHUD>100){updateHUD();lastHUD=now;}if(world.status==='running'&&now-lastSave>5000){saveRecords();lastSave=now;}}
 if(now>toastUntil)$('toast').style.opacity='0';renderer.render(scene,camera);
}
init();requestAnimationFrame(frame);
