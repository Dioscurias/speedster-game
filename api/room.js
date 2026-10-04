import {createRoomEngine} from '../src/room-engine.js';

const memory=globalThis.__speedsterRooms||(globalThis.__speedsterRooms=new Map());
const redisUrl=process.env.KV_REST_API_URL||process.env.UPSTASH_REDIS_REST_URL;
const redisToken=process.env.KV_REST_API_TOKEN||process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(command){
  const response=await fetch(`${redisUrl}/${command.map(value=>encodeURIComponent(String(value))).join('/')}`,{headers:{authorization:`Bearer ${redisToken}`}});
  if(!response.ok)throw new Error(`Redis ${response.status}`);
  return (await response.json()).result;
}

async function loadRoom(roomId){
  if(!redisUrl||!redisToken)return memory.get(roomId)||createRoomEngine();
  const raw=await redis(['get',`speedster:room:${roomId}`]);
  const players=raw?JSON.parse(raw):[];
  return createRoomEngine(players);
}

async function saveRoom(roomId,engine){
  if(!redisUrl||!redisToken){memory.set(roomId,engine);return;}
  await redis(['set',`speedster:room:${roomId}`,JSON.stringify([...engine.players.values()]),'EX',12]);
}

export default async function handler(request,response){
  response.setHeader('Cache-Control','no-store');
  if(request.method!=='POST')return response.status(405).json({error:'POST required'});
  try{
    const body=typeof request.body==='string'?JSON.parse(request.body):request.body||{};
    const id=String(body.id||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,48);
    const roomId=String(body.room||'austin').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,32)||'austin';
    if(!id)return response.status(400).json({error:'Player id required'});
    const engine=await loadRoom(roomId);
    const result=engine.update(id,body.state,Date.now());
    await saveRoom(roomId,engine);
    return response.status(200).json(result);
  }catch(error){
    console.error('room update failed',error);
    return response.status(500).json({error:'Room unavailable'});
  }
}
