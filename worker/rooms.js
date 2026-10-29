import {DurableObject} from 'cloudflare:workers';
import {createRoomEngine} from '../src/room-engine.js';
import {ROOM_CAPACITY,sanitizeImpact} from '../src/presence-protocol.js';

export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname==='/health')return Response.json({ok:true,capacity:ROOM_CAPACITY});
  if(!/^\/rooms\/(austin|parkour)\/[a-zA-Z0-9_-]{1,32}$/.test(url.pathname))return new Response('Room not found',{status:404});
  if(request.method!=='GET'||request.headers.get('Upgrade')?.toLowerCase()!=='websocket')return new Response('WebSocket required',{status:426});
  const origin=request.headers.get('Origin');
  if(origin&&!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)&&!/^https:\/\/speedster-game(?:-[a-zA-Z0-9-]+)?\.vercel\.app$/.test(origin))return new Response('Origin not allowed',{status:403});
  return env.ROOMS.getByName(url.pathname).fetch(request);
 }
};

export class SpeedsterRoom extends DurableObject {
 constructor(ctx,env){
  super(ctx,env);this.lastBroadcast=0;
  ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS impacts (id TEXT PRIMARY KEY, at INTEGER, data TEXT)');
  ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping','pong'));
 }
 fetch(request){
  const now=Date.now();this.prune(now);
  if(this.ctx.getWebSockets().filter(ws=>ws.deserializeAttachment()?.active!==false).length>=ROOM_CAPACITY)return new Response('Room full',{status:503});
  const [client,server]=Object.values(new WebSocketPair());this.ctx.acceptWebSocket(server);
  const id=crypto.randomUUID();server.serializeAttachment({id,active:true,combat:!new URL(request.url).pathname.includes('/parkour/'),seenAt:now,lastImpact:0,player:null});
  this.ctx.storage.sql.exec('DELETE FROM impacts WHERE at < ?',now-15*60*1000);
  const impacts=this.ctx.storage.sql.exec('SELECT data FROM impacts ORDER BY at').toArray().map(row=>JSON.parse(row.data));
  server.send(JSON.stringify({type:'welcome',id,impacts,capacity:ROOM_CAPACITY}));
  return new Response(null,{status:101,webSocket:client});
 }
 prune(now){
  for(const ws of this.ctx.getWebSockets()){
   const a=ws.deserializeAttachment();if(a&&now-a.seenAt>20000){ws.serializeAttachment({...a,active:false});ws.close(1000,'Presence expired');}
  }
 }
 webSocketMessage(ws,message){
  if(typeof message!=='string'||message.length>2048){ws.close(1009,'Snapshot too large');return;}
  let body;try{body=JSON.parse(message);}catch{ws.close(1007,'Invalid JSON');return;}
  if(!body||body.type!=='state'||!body.state||typeof body.state!=='object')return;
  const now=Date.now(),a=ws.deserializeAttachment();if(!a?.active)return;
  if(a.player&&now-a.seenAt<65)return;
  this.prune(now);
  const peers=this.ctx.getWebSockets().filter(peer=>peer.deserializeAttachment()?.active);
  const engine=createRoomEngine(peers.map(peer=>peer.deserializeAttachment().player).filter(Boolean),{combat:a.combat});
  const data=engine.update(a.id,body.state,now,{name:body.name});
  // Save all changed health values to the attachments before broadcasting.
  for(const peer of peers){const current=peer.deserializeAttachment(),player=engine.players.get(current.id);if(player)peer.serializeAttachment({...current,player,seenAt:peer===ws?now:current.seenAt});}
  let impact=null;
  if(body.impact&&now-a.lastImpact>=450){impact=sanitizeImpact(body.impact,data.self,now);if(impact){
   this.ctx.storage.sql.exec('INSERT INTO impacts VALUES (?, ?, ?)',impact.id,now,JSON.stringify(impact));
   this.ctx.storage.sql.exec('DELETE FROM impacts WHERE id NOT IN (SELECT id FROM impacts ORDER BY at DESC LIMIT 64)');
   ws.serializeAttachment({...ws.deserializeAttachment(),lastImpact:now});
  }}
  if(impact)for(const peer of peers){try{peer.send(JSON.stringify({type:'impact',impact,source:a.id}));}catch{}}
  if(now-this.lastBroadcast>=90||!a.player){this.lastBroadcast=now;this.broadcast();}
 }
 broadcast(exclude){
  const now=Date.now(),peers=this.ctx.getWebSockets().filter(ws=>ws!==exclude&&ws.deserializeAttachment()?.active);
  const players=peers.map(ws=>ws.deserializeAttachment().player).filter(p=>p&&now-p.seenAt<=8000);
  for(const ws of peers){const a=ws.deserializeAttachment(),self=players.find(p=>p.id===a.id);if(!self)continue;
   try{ws.send(JSON.stringify({type:'state',self,players:players.filter(p=>p.id!==a.id),online:players.length,capacity:ROOM_CAPACITY,serverTime:now}));}catch{}
  }
 }
 webSocketClose(ws){const a=ws.deserializeAttachment();if(a)ws.serializeAttachment({...a,active:false});this.broadcast(ws);}
 webSocketError(ws){this.webSocketClose(ws);ws.close(1011,'Connection interrupted');}
}
