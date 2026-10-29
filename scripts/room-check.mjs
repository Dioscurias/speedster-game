import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';

const bundle=await build({entryPoints:['worker/rooms.js'],bundle:true,format:'esm',external:['cloudflare:workers'],write:false});
const mf=new Miniflare(convertV4MiniflareOptions({workers:[{name:'speedster-test',modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2026-10-26',durableObjects:{ROOMS:{className:'SpeedsterRoom',useSQLite:true}}}]}));
const sockets=[];
const waitFor=(client,predicate)=>new Promise((resolve,reject)=>{const existing=client.messages.find(predicate);if(existing)return resolve(existing);const timeout=setTimeout(()=>{client.ws.removeEventListener('message',onMessage);reject(new Error('Timed out waiting for room message'));},5000);const onMessage=event=>{const data=JSON.parse(event.data);if(predicate(data)){clearTimeout(timeout);client.ws.removeEventListener('message',onMessage);resolve(data);}};client.ws.addEventListener('message',onMessage);});
async function connect(room='austin/test'){
 const response=await mf.dispatchFetch('https://rooms.test/rooms/'+room,{headers:{Upgrade:'websocket'}});assert.equal(response.status,101);
 const ws=response.webSocket,client={ws,messages:[]};ws.addEventListener('message',event=>client.messages.push(JSON.parse(event.data)));ws.accept();sockets.push(ws);client.welcome=await waitFor(client,d=>d.type==='welcome');return client;
}
function send(c,name,x=0,extra={}){c.ws.send(JSON.stringify({type:'state',name,state:{x,z:0,y:0,hero:'atlas',vx:0,vz:0,...extra}}));}
try{
 const a=await connect(),b=await connect();send(a,'Alpha');await waitFor(a,d=>d.type==='state');send(b,'Bravo',12);
 const state=await waitFor(a,d=>d.type==='state'&&d.online===2);assert.equal(state.players[0].name,'Bravo');assert.notEqual(state.self.id,state.players[0].id);
 assert.notEqual(state.self.colorIndex,state.players[0].colorIndex);
 const other=await connect('parkour/test');send(other,'Canyon');assert.equal((await waitFor(other,d=>d.type==='state')).online,1);
 await new Promise(resolve=>setTimeout(resolve,110));
 a.ws.send(JSON.stringify({type:'state',name:'Alpha',state:{x:0,y:0,z:0,hero:'atlas'},impact:{kind:'punch',nonce:'impact-test',x:0,y:1,z:-2,nx:0,ny:0,nz:1,radius:1.4}}));
 const impact=await waitFor(b,d=>d.type==='impact');assert.equal(impact.impact.kind,'punch');
 const late=await connect();assert.ok(late.welcome.impacts.some(i=>i.id===impact.impact.id));
 b.ws.close(1000,'Leave');assert.equal((await waitFor(a,d=>d.type==='state'&&d.serverTime>state.serverTime&&d.online===1)).players.length,0);
 const capacity=[];for(let i=0;i<20;i++)capacity.push(await connect('austin/capacity'));
 const full=await mf.dispatchFetch('https://rooms.test/rooms/austin/capacity',{headers:{Upgrade:'websocket'}});assert.equal(full.status,503);
 const bad=await mf.dispatchFetch('https://rooms.test/rooms/austin/test',{headers:{Upgrade:'websocket',Origin:'https://unrelated.example'}});assert.equal(bad.status,403);
 console.log('PASS: runtime WebSockets, names/colors, room isolation, shared impacts, late joins, departures, 20-player capacity, origin validation.');
}finally{for(const ws of sockets)try{ws.close(1000);}catch{}await mf.dispose();}
