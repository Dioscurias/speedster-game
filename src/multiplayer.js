import * as THREE from 'three';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {recolorSpeedsterSuit,speedsterColorForIndex} from './superhero.js';
import {readPlayerName,sanitizePlayerName} from './player-profile.js';
import {PresenceClient} from './presence-client.js';
import {CharacterAnimation} from './character-animation.js';
import {poseHero} from './hero-visuals.js';
import {createWorld} from './game.js';

const POLL_MS=120;
let memoryPlayerId;
const playerId=()=>{
  try{
    const storage=globalThis.sessionStorage;
    const saved=storage?.getItem('speedster-player-id');
    if(saved)return saved;
    memoryPlayerId||=crypto.randomUUID();
    storage?.setItem('speedster-player-id',memoryPlayerId);
  }catch{memoryPlayerId||=crypto.randomUUID();}
  return memoryPlayerId;
};

export class Multiplayer{
  constructor({scene,template,getWorld,onState,onImpact,map='austin',clips=[],request}){
    this.scene=scene;this.template=template;this.getWorld=getWorld;this.onState=onState;
    this.id=playerId();this.avatars=new Map();this.connected=false;this.online=1;this.health=100;this.respawnAt=0;this.nextPoll=0;this.pending=false;
    this.colorIndex=null;
    this.request=request;this.clips=clips;this.status='Connecting';this.receivedAt=0;
    const room=typeof location==='undefined'?'public':new URLSearchParams(location.search).get('room')||'public';
    this.transport=new PresenceClient({map,room,onImpact,onState:data=>this.receive(data),onStatus:status=>{this.status=status;this.connected=status==='Connected';if(!this.connected){this.online=1;this.sync([]);}}});
    globalThis.addEventListener?.('pagehide',()=>this.transport.destroy(),{once:true});
  }

  receive(data){this.id=data.self.id;this.connected=true;this.status='Connected';this.receivedAt=performance.now();this.online=data.online;this.health=data.self.health;this.respawnAt=data.self.respawnAt;this.applySelf(data.self);this.sync(data.players);this.onState?.(data);}

  async poll(now=performance.now()){
    const world=this.getWorld();
    if(!this.request){this.transport.update(world,sanitizePlayerName(readPlayerName()),now);return;}
    if(this.pending||now<this.nextPoll||world.status==='ready')return;
    this.nextPoll=now+POLL_MS;this.pending=true;
    try{
      const name=sanitizePlayerName(readPlayerName());
      const response=await this.request('/api/room',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:this.id,name,room:'austin',state:world})});
      if(!response.ok)throw new Error(`room ${response.status}`);
      const data=await response.json();this.connected=true;this.online=data.online;this.health=data.self.health;this.respawnAt=data.self.respawnAt;this.applySelf(data.self);this.sync(data.players);this.onState?.(data);
    }catch{this.connected=false;this.online=1;}
    finally{this.pending=false;}
  }

  applySelf(player){
    if(this.colorIndex===player.colorIndex&&this.hero===player.hero)return;
    recolorSpeedsterSuit(this.template,player.hero==='atlas'?'#258cb7':speedsterColorForIndex(player.colorIndex));this.colorIndex=player.colorIndex;this.hero=player.hero;
  }

  sync(players){
    const present=new Set(players.map(player=>player.id));
    for(const [id,avatar] of this.avatars)if(!present.has(id)){this.scene.remove(avatar.root);avatar.texture.dispose();avatar.label.material.dispose();avatar.model.traverse(o=>{if(o.isMesh){o.material.dispose();if(o.geometry.attributes.speedsterSuitMask)o.geometry.dispose();}});this.avatars.delete(id);}
    for(const player of players){
      let avatar=this.avatars.get(player.id);
      if(!avatar){avatar=this.createAvatar(player.id,player.colorIndex);this.avatars.set(player.id,avatar);this.scene.add(avatar.root);}
      if(avatar.colorIndex!==player.colorIndex||avatar.hero!==player.hero){if(avatar.hero!==player.hero){avatar.model.rotation.x=avatar.model.rotation.z=0;avatar.model.scale.setScalar(1);avatar.animation?.reset({...createWorld(),...player});}recolorSpeedsterSuit(avatar.model,player.hero==='atlas'?'#258cb7':speedsterColorForIndex(player.colorIndex));avatar.colorIndex=player.colorIndex;avatar.hero=player.hero;}
      if(!avatar.state)avatar.position.set(player.x,player.y,player.z);
      avatar.state=player;avatar.receivedAt=performance.now();
    }
  }

  createAvatar(id,colorIndex=0){
    const root=new THREE.Group(),model=clone(this.template);root.add(model);model.traverse(object=>{if(object.isMesh)object.material=object.material.clone();});recolorSpeedsterSuit(model,speedsterColorForIndex(colorIndex));
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const texture=new THREE.CanvasTexture(canvas),label=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));label.scale.set(3.3,.82,1);label.position.y=2.5;root.add(label);
    const animation=this.clips.length?new CharacterAnimation(model,this.clips,createWorld()):null;
    return {root,model,label,canvas,texture,colorIndex,animation,position:new THREE.Vector3(),state:null,labelState:'',phase:hash(id)%10};
  }

  update(dt){
    const world=this.getWorld();
    for(const avatar of this.avatars.values()){
      const player=avatar.state;if(!player)continue;
      const age=Math.min(.18,Math.max(0,(performance.now()-avatar.receivedAt)/1000));
      const target=new THREE.Vector3(player.x+player.vx*age,player.y+(player.flying?player.vy*age:0),player.z+player.vz*age);avatar.position.lerp(target,1-Math.exp(-dt*16));
      avatar.root.position.set(avatar.position.x-world.x,avatar.position.y,avatar.position.z-world.z);
      const turn=Math.atan2(Math.sin(-player.heading-avatar.root.rotation.y),Math.cos(-player.heading-avatar.root.rotation.y));avatar.root.rotation.y+=turn*(1-Math.exp(-dt*16));const speed=Math.hypot(player.vx,player.vz);
      if(avatar.animation){const state={...createWorld(),...player,status:'running',speed,worldTime:performance.now()/1000};avatar.animation.update(state,{forward:speed>.5,viewYaw:player.heading},dt);poseHero(avatar.animation,avatar.model,state,dt);}
      avatar.model.visible=player.health>0;avatar.label.visible=player.health>0;avatar.model.traverse(object=>{if(object.isMesh){object.material.transparent=player.phasing;object.material.opacity=player.phasing?.48:1;}});
      const name=sanitizePlayerName(player.name),labelState=JSON.stringify([name,player.health]);
      if(labelState!==avatar.labelState){
        const context=avatar.canvas.getContext('2d');context.clearRect(0,0,256,64);context.fillStyle='rgba(5,7,13,.65)';context.fillRect(18,5,220,45);context.fillStyle='#e9eefb';context.font='600 18px Inter, sans-serif';context.textAlign='center';context.fillText(name,128,25,200);context.fillStyle='#343b30';context.fillRect(38,35,180,8);context.fillStyle=player.health<25?'#ff5a36':'#e9eefb';context.fillRect(38,35,180*player.health/100,8);avatar.texture.needsUpdate=true;avatar.labelState=labelState;
      }
    }
  }
}

function hash(value){let result=0;for(const char of value)result=(result*31+char.charCodeAt(0))|0;return Math.abs(result);}
