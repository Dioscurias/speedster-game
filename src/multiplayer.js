import * as THREE from 'three';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {recolorSpeedsterSuit,speedsterColorForIndex} from './superhero.js';
import {readPlayerName,sanitizePlayerName} from './player-profile.js';

const POLL_MS=120;
const LOCAL_DEV=import.meta.env?.DEV;
const playerId=()=>{
  let id=sessionStorage.getItem('speedster-player-id');
  if(!id){id=crypto.randomUUID();sessionStorage.setItem('speedster-player-id',id);}
  return id;
};

export class Multiplayer{
  constructor({scene,template,getWorld,onState}){
    this.scene=scene;this.template=template;this.getWorld=getWorld;this.onState=onState;
    this.id=playerId();this.avatars=new Map();this.connected=false;this.online=1;this.health=100;this.respawnAt=0;this.nextPoll=0;this.pending=false;
    this.colorIndex=null;
  }

  async poll(now=performance.now()){
    const world=this.getWorld();
    if(this.pending||now<this.nextPoll||world.status==='ready')return;
    this.nextPoll=now+POLL_MS;this.pending=true;
    try{
      const name=sanitizePlayerName(readPlayerName());
      if(LOCAL_DEV){this.connected=true;this.online=1;this.applySelf({colorIndex:0});this.onState?.({self:{name,colorIndex:0,health:this.health,respawnAt:0},players:[],online:1,serverTime:Date.now()});return;}
      const response=await fetch('/api/room',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:this.id,name,room:'austin',state:{x:world.x,z:world.z,y:world.y,vx:world.vx,vz:world.vz,heading:world.heading,phasing:world.phasing}})});
      if(!response.ok)throw new Error(`room ${response.status}`);
      const data=await response.json();this.connected=true;this.online=data.online;this.health=data.self.health;this.respawnAt=data.self.respawnAt;this.applySelf(data.self);this.sync(data.players);this.onState?.(data);
    }catch{this.connected=false;this.online=1;}
    finally{this.pending=false;}
  }

  applySelf(player){
    if(this.colorIndex===player.colorIndex)return;
    recolorSpeedsterSuit(this.template,speedsterColorForIndex(player.colorIndex));this.colorIndex=player.colorIndex;
  }

  sync(players){
    const present=new Set(players.map(player=>player.id));
    for(const [id,avatar] of this.avatars)if(!present.has(id)){this.scene.remove(avatar.root);this.avatars.delete(id);}
    for(const player of players){
      let avatar=this.avatars.get(player.id);
      if(!avatar){avatar=this.createAvatar(player.id,player.colorIndex);this.avatars.set(player.id,avatar);this.scene.add(avatar.root);}
      if(avatar.colorIndex!==player.colorIndex){recolorSpeedsterSuit(avatar.model,speedsterColorForIndex(player.colorIndex));avatar.colorIndex=player.colorIndex;}
      avatar.state=player;
    }
  }

  createAvatar(id,colorIndex=0){
    const root=new THREE.Group(),model=clone(this.template);root.add(model);model.traverse(object=>{if(object.isMesh)object.material=object.material.clone();});recolorSpeedsterSuit(model,speedsterColorForIndex(colorIndex));
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const texture=new THREE.CanvasTexture(canvas),label=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));label.scale.set(3.3,.82,1);label.position.y=2.5;root.add(label);
    return {root,model,label,canvas,texture,colorIndex,state:null,labelState:'',phase:hash(id)%10};
  }

  update(dt){
    const world=this.getWorld();
    for(const avatar of this.avatars.values()){
      const player=avatar.state;if(!player)continue;
      const target=new THREE.Vector3(player.x-world.x,player.y,player.z-world.z);avatar.root.position.lerp(target,1-Math.exp(-dt*13));
      avatar.root.rotation.y=-player.heading;const speed=Math.hypot(player.vx,player.vz);avatar.model.position.y=Math.sin(performance.now()*.014+avatar.phase)*Math.min(.08,speed*.0015);
      avatar.model.visible=player.health>0;avatar.label.visible=player.health>0;avatar.model.traverse(object=>{if(object.isMesh){object.material.transparent=player.phasing;object.material.opacity=player.phasing?.48:1;}});
      const name=sanitizePlayerName(player.name),labelState=JSON.stringify([name,player.health]);
      if(labelState!==avatar.labelState){
        const context=avatar.canvas.getContext('2d');context.clearRect(0,0,256,64);context.fillStyle='rgba(5,7,13,.65)';context.fillRect(18,5,220,45);context.fillStyle='#e9eefb';context.font='600 18px Inter, sans-serif';context.textAlign='center';context.fillText(name,128,25,200);context.fillStyle='#343b30';context.fillRect(38,35,180,8);context.fillStyle=player.health<25?'#ff5a36':'#e9eefb';context.fillRect(38,35,180*player.health/100,8);avatar.texture.needsUpdate=true;avatar.labelState=labelState;
      }
    }
  }
}

function hash(value){let result=0;for(const char of value)result=(result*31+char.charCodeAt(0))|0;return Math.abs(result);}
