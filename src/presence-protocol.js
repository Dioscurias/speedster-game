export const ROOM_CAPACITY=20;
export const ROOM_URL='wss://speedster-rooms.argus-global.workers.dev';
export function sanitizeImpact(input,player,now=Date.now()){
 if(!input||!['punch','land','launch'].includes(input.kind))return null;
 if(input.kind==='punch'&&player.hero!=='atlas')return null;
 const values=['x','y','z','nx','ny','nz','radius'];if(values.some(k=>!Number.isFinite(input[k])))return null;
 if(Math.hypot(input.x-player.x,input.z-player.z,input.y-player.y)>7)return null;
 const n=Math.hypot(input.nx,input.ny,input.nz);if(n<.9||n>1.1)return null;
 const nonce=typeof input.nonce==='string'&&/^[a-zA-Z0-9-]{1,40}$/.test(input.nonce)?input.nonce:crypto.randomUUID();
 return {id:player.id+':'+nonce,kind:input.kind,x:input.x,y:input.y,z:input.z,nx:input.nx/n,ny:input.ny/n,nz:input.nz/n,radius:Math.max(.5,Math.min(input.kind==='punch'?2:5,input.radius)),at:now};
}
export function roomPath(map='austin',room='public'){
 return `/rooms/${map==='parkour'?'parkour':'austin'}/${String(room).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,32)||'public'}`;
}
