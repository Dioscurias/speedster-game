import {crashDamage, HIT_COOLDOWN_MS, MAX_HEALTH, resolvePlayerUpdate, sanitizeSnapshot} from './multiplayer-rules.js';
import {sanitizePlayerName} from './player-profile.js';

const PRESENCE_MS=8_000;

export function createRoomEngine(initialPlayers=[],{combat=true}={}){
  const players=new Map(initialPlayers.map(player=>[player.id,{health:MAX_HEALTH,respawnAt:0,lastHitAt:0,...player,name:sanitizePlayerName(player.name)}]));
  const collisions=new Map();

  function update(id,input,now=Date.now(),profile={}){
    for(const [playerId,player] of players)if(now-player.seenAt>PRESENCE_MS)players.delete(playerId);
    let self=players.get(id);
    if(!self){const used=new Set([...players.values()].map(player=>player.colorIndex));let colorIndex=0;while(used.has(colorIndex))colorIndex++;self={id,colorIndex,health:MAX_HEALTH,respawnAt:0,lastHitAt:0};}
    self={...self,...sanitizeSnapshot(input),name:sanitizePlayerName(profile.name??self.name),seenAt:now};
    self=resolvePlayerUpdate(self,{damage:0,now});
    players.set(id,self);

    if(combat&&self.health>0){
      for(const [otherId,currentOther] of players){
        if(otherId===id||currentOther.health<=0)continue;
        const pair=[id,otherId].sort().join(':');
        const damage=crashDamage(self,currentOther);
        if(!damage||now-(collisions.get(pair)||0)<=HIT_COOLDOWN_MS)continue;
        collisions.set(pair,now);
        self=resolvePlayerUpdate(self,{damage,now});
        const other=resolvePlayerUpdate(currentOther,{damage,now});
        players.set(id,self);players.set(otherId,other);
      }
    }

    const visible=[];
    for(const [playerId,player] of players)if(playerId!==id)visible.push(publicPlayer(player));
    visible.sort((a,b)=>a.id.localeCompare(b.id));
    return {self:publicPlayer(self),players:visible,online:players.size,serverTime:now};
  }

  return {update,players};
}

function publicPlayer(player){
  const {id,name,colorIndex,health,respawnAt,seenAt}=player;
  return {id,name,colorIndex,health,respawnAt,seenAt,...sanitizeSnapshot(player)};
}
