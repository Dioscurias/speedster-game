import {ROOM_URL,roomPath} from './presence-protocol.js';
import {sanitizeSnapshot} from './multiplayer-rules.js';

export class PresenceClient {
 constructor({map='austin',room='public',onState,onImpact,onStatus,socketFactory=url=>new WebSocket(url),url=import.meta.env?.VITE_ROOM_URL||ROOM_URL}){
  Object.assign(this,{map,room,onState,onImpact,onStatus,socketFactory,url});this.socket=null;this.nextConnect=0;this.retry=0;this.lastSend=0;this.lastReceive=0;this.id=null;this.impacts=[];
 }
 update(state,name,now=performance.now()){
  if(this.closed||state.status==='ready')return;
  if(!this.socket&&now>=this.nextConnect)this.connect(now);
  if(this.socket?.readyState!==1)return;
  if(now-this.lastReceive>10000){this.socket.close();return;}
  if(now-this.lastSend<100||this.socket.bufferedAmount>4096)return;
  const snapshot=sanitizeSnapshot(state);if(state.status!=='running'){snapshot.vx=snapshot.vy=snapshot.vz=0;}
  this.lastSend=now;this.socket.send(JSON.stringify({type:'state',name,state:snapshot,impact:this.impacts.shift()}));
 }
 connect(now){
  this.onStatus?.(this.retry?'Reconnecting':'Connecting');this.lastReceive=now;
  let socket;try{socket=this.socketFactory(this.url+roomPath(this.map,this.room));}catch{this.nextConnect=now+2000;this.retry++;return;}
  this.socket=socket;
  const timeout=setTimeout(()=>{if(this.socket===socket&&socket.readyState===0)socket.close();},8000);
  socket.onopen=()=>{clearTimeout(timeout);this.lastReceive=performance.now();};
  socket.onmessage=event=>{
   if(event.data==='pong')return;let data;try{data=JSON.parse(event.data);}catch{return;}
   this.lastReceive=performance.now();this.retry=0;
   if(data.type==='welcome'){this.id=data.id;for(const impact of data.impacts||[])this.onImpact?.(impact,true);}
   if(data.type==='state'&&data.self&&Array.isArray(data.players)){this.onStatus?.('Connected');this.onState?.(data);}
   if(data.type==='impact')this.onImpact?.(data.impact,false);
  };
  socket.onclose=()=>{clearTimeout(timeout);if(this.socket!==socket)return;this.socket=null;this.onStatus?.('Reconnecting');this.retry++;this.nextConnect=performance.now()+Math.min(10000,500*2**Math.min(this.retry,5));};
  socket.onerror=()=>this.onStatus?.('Reconnecting');
 }
 impact(event){if(this.impacts.length<4)this.impacts.push(event);}
 destroy(){this.closed=true;this.socket?.close(1000,'Left map');this.socket=null;}
}
