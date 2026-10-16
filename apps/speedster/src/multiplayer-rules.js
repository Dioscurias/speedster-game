export const MAX_HEALTH=100;
export const RESPAWN_MS=3000;
export const HIT_COOLDOWN_MS=850;
export const PLAYER_COLLISION_RADIUS=1.45;

const number=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function sanitizeSnapshot(input={}){
  return {
    x:clamp(number(input.x),-5000,5000),
    z:clamp(number(input.z),-5000,5000),
    y:clamp(number(input.y),0,250),
    vx:clamp(number(input.vx),-300,300),
    vz:clamp(number(input.vz),-300,300),
    heading:number(input.heading),
    phasing:Boolean(input.phasing)
  };
}

export function crashDamage(a,b){
  if(a.phasing||b.phasing)return 0;
  const distance=Math.hypot(number(a.x)-number(b.x),number(a.z)-number(b.z));
  if(distance>PLAYER_COLLISION_RADIUS)return 0;
  const relativeSpeed=Math.hypot(number(a.vx)-number(b.vx),number(a.vz)-number(b.vz));
  return clamp(Math.round((relativeSpeed-8)*1.375),0,MAX_HEALTH);
}

export function resolvePlayerUpdate(previous={},event={}){
  const now=number(event.now,Date.now());
  if(number(previous.respawnAt)>0&&now>=number(previous.respawnAt)){
    return {...previous,health:MAX_HEALTH,respawnAt:0,lastHitAt:0,justRespawned:true};
  }
  if(number(previous.health,MAX_HEALTH)<=0)return {...previous,health:0};
  const damage=clamp(number(event.damage),0,MAX_HEALTH);
  if(!damage||now-number(previous.lastHitAt)<=HIT_COOLDOWN_MS)return {...previous,health:number(previous.health,MAX_HEALTH)};
  const health=clamp(number(previous.health,MAX_HEALTH)-damage,0,MAX_HEALTH);
  return {...previous,health,lastHitAt:now,respawnAt:health===0?now+RESPAWN_MS:0};
}
