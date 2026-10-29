import test from 'node:test';
import assert from 'node:assert/strict';
import {PresenceClient} from '../src/presence-client.js';
import {sanitizeImpact,roomPath} from '../src/presence-protocol.js';
import {createWorld} from '../src/game.js';

test('presence sends bounded movement snapshots, resumes after disconnect and never fakes connected status',()=>{
 const sockets=[],statuses=[],states=[];
 const client=new PresenceClient({onStatus:s=>statuses.push(s),onState:s=>states.push(s),socketFactory:url=>{
  const socket={url,readyState:0,bufferedAmount:0,sent:[],send(raw){this.sent.push(JSON.parse(raw));},close(){this.readyState=3;this.onclose?.();}};sockets.push(socket);return socket;
 }});
 const world={...createWorld(),status:'running',hero:'atlas',flying:true,y:10,wall:{private:true},untrusted:'discard'};
 client.update(world,'Nico',200);const a=sockets[0];assert.deepEqual(statuses,['Connecting']);a.readyState=1;a.onopen();
 a.onmessage({data:JSON.stringify({type:'welcome',id:'server-id',impacts:[]})});client.update(world,'Nico',400);
 assert.equal(a.sent.length,1);assert.equal(a.sent[0].state.flying,true);assert.equal(a.sent[0].state.wall,undefined);assert.equal(a.sent[0].state.untrusted,undefined);
 a.onmessage({data:JSON.stringify({type:'state',self:{id:'server-id'},players:[],online:1})});assert.equal(statuses.at(-1),'Connected');assert.equal(states.length,1);
 a.close();assert.equal(statuses.at(-1),'Reconnecting');client.update(world,'Nico',client.nextConnect+1);assert.equal(sockets.length,2);client.destroy();
});
test('impacts must be near the player, have finite normals and require superstrength for wall punches',()=>{
 const player={id:'a',hero:'atlas',x:0,y:0,z:0},impact={kind:'punch',nonce:'hit',x:0,y:1,z:-2,nx:0,ny:0,nz:1,radius:1.4};
 assert.equal(sanitizeImpact(impact,player).id,'a:hit');assert.equal(sanitizeImpact({...impact,x:100},player),null);assert.equal(sanitizeImpact({...impact,nx:Infinity},player),null);assert.equal(sanitizeImpact(impact,{...player,hero:'speedster'}),null);
 assert.equal(roomPath('parkour','friends'),'\/rooms/parkour/friends');
});
