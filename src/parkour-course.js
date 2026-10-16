import {createCollider,createWorld} from './game.js';
export const WORLD_MOTION={speed:1,period:12};
export function platformPoint(p,lx,lz){const c=Math.cos(p.angle),s=Math.sin(p.angle);return {x:p.x+c*lx+s*lz,z:p.z-s*lx+c*lz};}
export function platformLocal(p,x,z){const c=Math.cos(p.angle),s=Math.sin(p.angle),dx=x-p.x,dz=z-p.z;return {x:c*dx-s*dz,z:s*dx+c*dz};}
export function createCourse(){
 const platforms=[{z:0,width:14,depth:18,top:0,zone:-1}],checkpoints=[],orbs=[];
 const zones=[['Salt Steps',10,2,0],['Chair Foundations',8,3,.4],['Fallen Books',6,4,.6],['Canyon Teeth',4.5,4.5,-.4],['The Threshold',3.2,5.5,.5]];
 let top=0;
 zones.forEach(([name,width,gap,rise],zone)=>{for(let i=0;i<3;i++){const prev=platforms.at(-1);top+=rise;const p={z:prev.z-prev.depth/2-gap-7,width,depth:14,top,zone,name};platforms.push(p);if(i===0)checkpoints.push(p);orbs.push({x:0,y:top+1,z:p.z,collected:false,platform:p});}});
 const prev=platforms.at(-1),finish={z:prev.z-prev.depth/2-12,width:14,depth:18,top,zone:5};platforms.push(finish);
 platforms.forEach((p,i)=>Object.assign(p,{id:i,x:0,angle:0,baseZ:p.z,baseTop:p.top,active:true,warning:0}));
 function contains(p,x,z,margin=0){const q=platformLocal(p,x,z);return p.active&&Math.abs(q.x)<=p.width/2-margin&&Math.abs(q.z)<=p.depth/2-margin;}
 function supportAt(x,z,y=Infinity,margin=0){return platforms.filter(p=>p.top<=y+.05&&contains(p,x,z,margin)).sort((a,b)=>b.top-a.top)[0]??null;}
 let collision=createCollider();
 function rebuild(){collision=createCollider(platforms.filter(p=>p.active).map(p=>({height:p.top,wallRunnable:false,polygon:[[-p.width/2,-p.depth/2],[p.width/2,-p.depth/2],[p.width/2,p.depth/2],[-p.width/2,p.depth/2]].map(([x,z])=>{const q=platformPoint(p,x,z);return [q.x,q.z];})})));}
 rebuild();
 const collider={contacts:(...args)=>collision.contacts(...args),blocked:(...args)=>collision.blocked(...args),surface:(x,z,y)=>supportAt(x,z,y)?.top??-60,terrain:()=>({height:-60,grip:1,kind:'red-sand'})};
 const spawn={x:0,z:4};let checkpoint={...spawn,top:0},nextZone=0,collected=0,complete=false,motionTime=0;
 const course={platforms,checkpoints,orbs,spawn,finish,collider,supportAt,motionSpeed:WORLD_MOTION.speed,get motionTime(){return motionTime;},advance,update};
 function advance(dt,w){
  const standing=w?.grounded?supportAt(w.x,w.z,w.y):null,local=standing&&Math.abs(w.y-standing.top)<.06?platformLocal(standing,w.x,w.z):null;
  motionTime+=dt*Math.max(0,Math.min(2,course.motionSpeed));const phase=motionTime/WORLD_MOTION.period*Math.PI*2;
  platforms[5].x=.6*Math.sin(phase);platforms[8].angle=.055*Math.sin(phase);platforms[11].top=platforms[11].baseTop+.35*Math.sin(phase);platforms[12].top=platforms[12].baseTop-.3*(1-Math.cos(phase));
  const p=platforms[14],cycle=motionTime%12;p.warning=cycle>=8&&cycle<10?(cycle-8)/2:0;p.active=cycle<10;p.top=p.baseTop-(cycle<10?0:cycle<11?(cycle-10)*18:(12-cycle)*18);
  if(local){if(standing.active){const next=platformPoint(standing,local.x,local.z);w.x=next.x;w.z=next.z;w.y=standing.top;}else w.grounded=false;}
  for(const o of orbs){o.x=o.platform.x;o.y=o.platform.top+1;o.z=o.platform.z;}
  rebuild();
 }
 function update(w){let respawned=false;if(w.status==='running'&&!complete){if(w.y < -15){const elapsed=w.elapsed,worldTime=w.worldTime;Object.assign(w,createWorld({x:checkpoint.x??0,z:checkpoint.z}),{y:checkpoint.top,status:'running',elapsed,worldTime,collected});respawned=true;}
 const p=checkpoints[nextZone];if(p&&w.grounded&&Math.abs(w.y-p.top)<.08&&contains(p,w.x,w.z)){checkpoint=p;nextZone++;}
 for(const o of orbs)if(!o.collected&&o.platform.active&&Math.hypot(w.x-o.x,w.y+.95-o.y,w.z-o.z)<.9){o.collected=true;w.collected=++collected;}
 if(nextZone===5&&w.grounded&&Math.abs(w.y-finish.top)<.08&&Math.abs(w.x)<1.6&&Math.abs(w.z-finish.z)<1){complete=true;w.status='complete';w.vx=w.vy=w.vz=w.speed=0;}}
 return {respawned,complete,collected,total:orbs.length,zone:nextZone,name:zones[Math.max(0,nextZone-1)][0]};}
 return course;
}
