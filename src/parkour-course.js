import {createCollider,createWorld} from './game.js';
export function createCourse(){
 const platforms=[{z:0,width:14,depth:18,top:0,zone:-1}],checkpoints=[],orbs=[];
 const zones=[['Salt Steps',10,2,0],['Chair Foundations',8,3,.4],['Fallen Books',6,4,.6],['Canyon Teeth',4.5,4.5,-.4],['The Threshold',3.2,5.5,.5]];
 let top=0;
 zones.forEach(([name,width,gap,rise],zone)=>{for(let i=0;i<3;i++){const prev=platforms.at(-1);top+=rise;const p={z:prev.z-prev.depth/2-gap-7,width,depth:14,top,zone,name};platforms.push(p);if(i===0)checkpoints.push(p);orbs.push({x:0,y:top+1,z:p.z,collected:false});}});
 const prev=platforms.at(-1),finish={z:prev.z-prev.depth/2-12,width:14,depth:18,top,zone:5};platforms.push(finish);
 const contains=(p,x,z)=>Math.abs(x)<=p.width/2&&Math.abs(z-p.z)<=p.depth/2;
 const collider=createCollider(platforms.map(p=>({height:p.top,wallRunnable:false,polygon:[[-p.width/2,p.z-p.depth/2],[p.width/2,p.z-p.depth/2],[p.width/2,p.z+p.depth/2],[-p.width/2,p.z+p.depth/2]]})));
 collider.surface=(x,z,y)=>platforms.reduce((h,p)=>p.top<=y+.05&&contains(p,x,z)?Math.max(h,p.top):h,-60);
 collider.terrain=()=>({height:-60,grip:1,kind:'red-sand'});
 const spawn={x:0,z:4};let checkpoint={...spawn,top:0},nextZone=0,collected=0,complete=false;
 function update(w){let respawned=false;if(w.status==='running'&&!complete){if(w.y < -15){const elapsed=w.elapsed;Object.assign(w,createWorld({x:0,z:checkpoint.z}),{y:checkpoint.top,status:'running',elapsed,collected});respawned=true;}
 const p=checkpoints[nextZone];if(p&&w.grounded&&Math.abs(w.y-p.top)<.08&&contains(p,w.x,w.z)){checkpoint=p;nextZone++;}
 for(const o of orbs)if(!o.collected&&Math.hypot(w.x-o.x,w.y+.95-o.y,w.z-o.z)<.9){o.collected=true;w.collected=++collected;}
 if(nextZone===5&&w.grounded&&Math.abs(w.y-finish.top)<.08&&Math.abs(w.x)<1.6&&Math.abs(w.z-finish.z)<1){complete=true;w.status='complete';w.vx=w.vy=w.vz=w.speed=0;}}
 return {respawned,complete,collected,total:orbs.length,zone:nextZone,name:zones[Math.max(0,nextZone-1)][0]};}
 return {platforms,checkpoints,orbs,spawn,finish,collider,update};
}
