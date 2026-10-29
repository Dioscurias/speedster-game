import {ROOM_URL,ROOM_CAPACITY} from '../src/presence-protocol.js';

// Old clients must reload: never return an isolated in-memory player list.
export default function handler(request,response){
 response.setHeader('Cache-Control','no-store');
 if(request.method==='GET')return response.status(200).json({transport:'websocket',url:ROOM_URL,capacity:ROOM_CAPACITY});
 return response.status(426).json({error:'Reload the game to join the shared multiplayer room.',transport:'websocket',url:ROOM_URL});
}
