import * as THREE from 'three';
import {clone} from 'three/addons/utils/SkeletonUtils.js';

const POLL_MS=120;
const LOCAL_DEV=import.meta.env.DEV;
const playerId=()=>{
  let id=sessionStorage.getItem('speedster-player-id');
  if(!id){id=crypto.randomUUID();sessionStorage.setItem('speedster-player-id',id);}
  return id;
};

export class Multiplayer{
  constructor({scene,template,getWorld,onState}){
    this.scene=scene;this.template=template;this.getWorld=getWorld;this.onState=onState;
    this.id=playerId();this.avatars=new Map();this.connected=false;this.online=1;this.health=100;this.respawnAt=0;this.nextPoll=0;this.pending=false;
  }

  async poll(now=performance.now()){
    const world=this.getWorld();
    if(this.pending||now<this.nextPoll||world.status==='ready')return;
    this.nextPoll=now+POLL_MS;this.pending=true;
    try{
      if(LOCAL_DEV){this.connected=true;this.online=1;this.onState?.({self:{health:this.health,respawnAt:0},players:[],online:1,serverTime:Date.now()});return;}
      const response=await fetch('/api/room',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:this.id,room:'austin',state:{x:world.x,z:world.z,y:world.y,vx:world.vx,vz:world.vz,heading:world.heading,phasing:world.phasing}})});
      if(!response.ok)throw new Error(`room ${response.status}`);
      const data=await response.json();this.connected=true;this.online=data.online;this.health=data.self.health;this.respawnAt=data.self.respawnAt;this.sync(data.players);this.onState?.(data);
    }catch{this.connected=false;this.online=1;}
    finally{this.pending=false;}
  }

  sync(players){
    const present=new Set(players.map(player=>player.id));
    for(const [id,avatar] of this.avatars)if(!present.has(id)){this.scene.remove(avatar.root);this.avatars.delete(id);}
    for(const player of players){
      let avatar=this.avatars.get(player.id);
      if(!avatar){avatar=this.createAvatar(player.id);this.avatars.set(player.id,avatar);this.scene.add(avatar.root);}
      avatar.state=player;
    }
  }

  createAvatar(id){
    const root=new THREE.Group(),model=clone(this.template);root.add(model);model.traverse(object=>{if(object.isMesh){object.material=object.material.clone();object.material.color?.offsetHSL(((hash(id)%9)-4)*.018,.04,0);}});
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const texture=new THREE.CanvasTexture(canvas),label=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));label.scale.set(3.3,.82,1);label.position.y=2.5;root.add(label);
    return {root,model,label,canvas,texture,state:null,phase:hash(id)%10};
  }

  update(dt){
    const world=this.getWorld();
    for(const avatar of this.avatars.values()){
      const player=avatar.state;if(!player)continue;
      const target=new THREE.Vector3(player.x-world.x,player.y,player.z-world.z);avatar.root.position.lerp(target,1-Math.exp(-dt*13));
      avatar.root.rotation.y=-player.heading;const speed=Math.hypot(player.vx,player.vz);avatar.model.position.y=Math.sin(performance.now()*.014+avatar.phase)*Math.min(.08,speed*.0015);
      avatar.model.visible=player.health>0;avatar.label.visible=player.health>0;avatar.model.traverse(object=>{if(object.isMesh){object.material.transparent=player.phasing;object.material.opacity=player.phasing?.48:1;}});
      const context=avatar.canvas.getContext('2d');context.clearRect(0,0,256,64);context.fillStyle='#111a13dd';context.fillRect(18,5,220,45);context.fillStyle='#e7f979';context.font='600 18px Space Grotesk';context.textAlign='center';context.fillText('SPEEDSTER',128,25);context.fillStyle='#343b30';context.fillRect(38,35,180,8);context.fillStyle=player.health<35?'#ff5c45':'#e7f979';context.fillRect(38,35,180*player.health/100,8);avatar.texture.needsUpdate=true;
    }
  }
}

function hash(value){let result=0;for(const char of value)result=(result*31+char.charCodeAt(0))|0;return Math.abs(result);}
