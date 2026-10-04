const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const smooth=(a,b,rate,dt)=>a+(b-a)*(1-Math.exp(-rate*dt));
export function createAnimationState(world){return {phase:'idle',idle:1,walk:0,run:0,cadence:1,lean:0,bank:0,crouch:0,air:0,tuck:0,reach:0,flinch:0,takeoff:0,landing:0,landingStrength:.65,stagger:0,wasGrounded:world.grounded,lastSpeed:world.speed,lastVx:world.vx,lastVz:world.vz,lastVy:world.vy,lastImpact:world.impact,worldTime:world.worldTime};}
export function updateAnimation(s,w,input,dt){
 if(w.status==='paused'||dt<=0)return s;
 dt=Math.min(dt,.1);
 const onSurface=w.grounded||w.wallRunning;
 const x=Number(!!input.right)-Number(!!input.left),z=Number(!!input.forward)-Number(!!input.backward),hasInput=!!(x||z),yaw=input.viewYaw||0;
 let dx=x*Math.cos(yaw)+z*Math.sin(yaw),dz=x*Math.sin(yaw)-z*Math.cos(yaw),length=Math.hypot(dx,dz);if(length){dx/=length;dz/=length;}
 const reversing=hasInput&&w.speed>1&&(dx*w.vx+dz*w.vz)<-w.speed*.15;
 const braking=w.grounded&&w.speed>.7&&(!hasInput||reversing);
 const acceleration=clamp((w.speed-s.lastSpeed)/dt,-90,100);
 const lateral=clamp(((w.vx-s.lastVx)*Math.cos(w.heading)+(w.vz-s.lastVz)*Math.sin(w.heading))/dt,-70,70);
 if(s.wasGrounded&&!w.grounded&&w.vy>0)s.takeoff=.18;
 if(!s.wasGrounded&&w.grounded){s.landing=.3;s.landingStrength=.45+clamp(w.landingImpact||0,0,1)*.55;}
 if(w.impact>s.lastImpact+.12)s.stagger=.25;
 s.phase=w.wallRunning?'wallrun':s.stagger>0?'stagger':!w.grounded?(s.takeoff>0?'takeoff':'air'):s.landing>0?'land':braking?'brake':hasInput&&w.speed<2?'launch':w.boosting?'boost':w.speed>6?'run':w.speed>.15?'walk':'idle';
 const movement=clamp(w.speed/.9,0,1),runBlend=clamp((w.speed-3)/5,0,1);
 // Immediately suspend the locomotion cycle in flight. Blend toward a neutral
 // base pose and layer bent knees / arms instead of running in the air.
 const walkTarget=onSurface?movement*(1-runBlend):0,runTarget=onSurface?movement*runBlend:0;
 s.walk=smooth(s.walk,walkTarget,w.grounded?20:30,dt);s.run=smooth(s.run,runTarget,w.grounded?20:30,dt);s.idle=1-s.walk-s.run;
 s.cadence=clamp(.75+Math.sqrt(w.speed)*.19+(w.boosting?.5:0),.75,3.5);
 let lean=braking?-.23:hasInput?.09+clamp(acceleration/100,-.07,.2)+Math.min(w.speed/500,.14)+(w.boosting?.2:0):0;
 if(!onSurface)lean=.035+.085*clamp(w.vy/6.8,0,1);if(s.stagger>0)lean=-.19;
 const steering=hasInput?dx*Math.cos(w.heading)+dz*Math.sin(w.heading):0;
 const bank=w.grounded?-clamp(lateral/220+steering*.11,-.23,.23):0;
 s.lean=smooth(s.lean,lean,18,dt);s.bank=smooth(s.bank,bank,16,dt);
 s.air=smooth(s.air,onSurface?0:1,22,dt);
 // Follow the ballistic arc continuously, then straighten before contact.
 const flight=clamp((6.8-w.vy)/13.6,0,1);
 const tuckTarget=!onSurface?.72*Math.pow(Math.sin(Math.PI*flight),1.3):0;
 s.tuck=smooth(s.tuck,tuckTarget,22,dt);
 s.reach=smooth(s.reach,!onSurface&&w.vy<0?clamp(-w.vy/6,0,1):0,18,dt);
 s.crouch=smooth(s.crouch,s.landing>0?Math.sin(Math.PI*(1-s.landing/.3))*s.landingStrength:s.phase==='launch'?.12:0,30,dt);
 // Initial contact should react within the first rendered frame.
 if(!s.wasGrounded&&w.grounded)s.crouch=Math.max(s.crouch,.22);
 s.flinch=smooth(s.flinch,s.stagger>0?s.stagger/.25:0,25,dt);
 s.takeoff=Math.max(0,s.takeoff-dt);s.landing=Math.max(0,s.landing-dt);s.stagger=Math.max(0,s.stagger-dt);
 s.wasGrounded=w.grounded;s.lastSpeed=w.speed;s.lastVx=w.vx;s.lastVz=w.vz;s.lastVy=w.vy;s.lastImpact=w.impact;s.worldTime=w.worldTime;
 return s;
}
