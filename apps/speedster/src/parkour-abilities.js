// Distances in game units; timers in active-play seconds (paused with the game).
export const ABILITY=Object.freeze({teleportDistance:8,teleportCharges:3,teleportWindow:10,damage:80,force:18,chargeTime:1.2,cooldown:2.5,minimumCharge:.2,projectileSpeed:45,projectileRange:120});
export function createAbilities(config=ABILITY){
 let spent=Array(config.teleportCharges).fill(null),aimStarted=null,readyAt=0;
 const clean=now=>{spent=spent.map(t=>t!==null&&now-t>=config.teleportWindow?null:t);};
 return {
  teleports(now){clean(now);return {available:spent.filter(t=>t===null).length,pips:spent.map(t=>t===null?1:Math.min(1,(now-t)/config.teleportWindow))};},
  spendTeleport(now){clean(now);const slot=spent.indexOf(null);if(slot<0)return false;spent[slot]=now;return true;},
  beginAim(now){if(now<readyAt)return false;if(aimStarted===null)aimStarted=now;return true;},
  cancelAim(){aimStarted=null;},
  status(now){const aiming=aimStarted!==null,charge=aiming?Math.min(1,(now-aimStarted)/config.chargeTime):0,cooldown=Math.max(0,readyAt-now);return {aiming,charge,cooldown,ready:aiming?charge>=1:cooldown===0};},
  release(now){if(aimStarted===null)return null;const duration=now-aimStarted;aimStarted=null;if(duration<config.minimumCharge)return null;const power=Math.min(1,duration/config.chargeTime);readyAt=now+config.cooldown;return {power,damage:config.damage*power,force:config.force*power};}
 };
}
export function findTeleport(w,direction,course,config=ABILITY){
 const length=Math.hypot(direction.x,direction.z);if(length<.001)return null;
 const x=w.x+direction.x/length*config.teleportDistance,z=w.z+direction.z/length*config.teleportDistance;
 const p=course.supportAt(x,z,Infinity,.42);if(!p||p.top>w.y+2.4||p.top<w.y-4)return null;
 const target={x,y:p.top,z};
 // Sweep the full upright character, not only the destination. This deliberately
 // rejects obstructed blinks rather than passing through walls or snapping to ledges.
 const steps=Math.ceil(config.teleportDistance/.12);
 for(let i=1;i<=steps;i++){const t=i/steps,px=w.x+(x-w.x)*t,py=w.y+(target.y-w.y)*t,pz=w.z+(z-w.z)*t;
  if(course.collider.contacts(px,pz,py+.03,.4).length||course.blockedVolume?.(px,py,pz,.4,1.86))return null;
 }
 return target;
}
