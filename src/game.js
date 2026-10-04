export const PHYSICS=Object.freeze({acceleration:42,boostAcceleration:95,braking:105,reverseBraking:260,turnRate:12,airAcceleration:7,airTurnRate:1.8,jumpSpeed:6.8,jumpCutSpeed:3.8,fallGravity:1.45,stepHeight:.24,coyoteTime:.09,jumpBuffer:.12});
export const RUN_SPEED=90,BOOST_SPEED=260,GRAVITY=9.81,PLAYER_RADIUS=.38;
export function createWorld(spawn={x:0,z:0}){return {status:'ready',x:spawn.x,z:spawn.z,y:0,vx:0,vz:0,vy:0,grounded:true,heading:0,distance:0,speed:0,topSpeed:0,elapsed:0,worldTime:0,energy:100,collected:0,hits:0,cooldown:0,boosting:false,slowing:false,impact:0,phasing:false,phaseSafe:null,wallRunning:false,wall:null,wallCooldown:0,coyote:0,jumpBuffer:0,landingImpact:0,surface:'asphalt',grip:1,jumpCut:false};}
export function insidePolygon(x,z,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
export function nearestSegment(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));return {x:a[0]+t*dx,z:a[1]+t*dz};}
export function createCollider(objects=[],bounds=null){
 const cells=new Map(),size=80;
 for(const object of objects){const xs=object.polygon.map(p=>p[0]),zs=object.polygon.map(p=>p[1]);for(let x=Math.floor(Math.min(...xs)/size);x<=Math.floor(Math.max(...xs)/size);x++)for(let z=Math.floor(Math.min(...zs)/size);z<=Math.floor(Math.max(...zs)/size);z++){const key=`${x},${z}`;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(object);}}
 function contacts(x,z,y=0,r=PLAYER_RADIUS){const found=[],near=new Set();for(let i=Math.floor((x-r)/size);i<=Math.floor((x+r)/size);i++)for(let j=Math.floor((z-r)/size);j<=Math.floor((z+r)/size);j++)for(const o of cells.get(`${i},${j}`)||[])near.add(o);
  for(const o of near){if(y>=o.height)continue;let closest=null,best=Infinity;for(let i=0;i<o.polygon.length;i++){const q=nearestSegment(x,z,o.polygon[i],o.polygon[(i+1)%o.polygon.length]);const d=Math.hypot(x-q.x,z-q.z);if(d<best){closest=q;best=d;}}
   const inside=insidePolygon(x,z,o.polygon);if(inside||best<r){let nx=inside?closest.x-x:x-closest.x,nz=inside?closest.z-z:z-closest.z,len=Math.hypot(nx,nz);if(len<1e-8){nx=1;nz=0;len=1;}found.push({nx:nx/len,nz:nz/len,depth:inside?r+best:r-best,object:o});}
  }
  if(bounds){if(x<bounds.minX+r)found.push({nx:1,nz:0,depth:bounds.minX+r-x});if(x>bounds.maxX-r)found.push({nx:-1,nz:0,depth:x-bounds.maxX+r});if(z<bounds.minZ+r)found.push({nx:0,nz:1,depth:bounds.minZ+r-z});if(z>bounds.maxZ-r)found.push({nx:0,nz:-1,depth:z-bounds.maxZ+r});}return found;
 }
 return {surface:(x,z,y)=>(cells.get(`${Math.floor(x/size)},${Math.floor(z/size)}`)||[]).reduce((top,o)=>Number.isFinite(o.height)&&o.height<=y+.05&&insidePolygon(x,z,o.polygon)?Math.max(top,o.height):top,0),contacts,blocked:(x,z,y=0)=>contacts(x,z,y).length>0};
}
const empty=createCollider();
export function stepWorld(s,input,dt,collider=empty){
 if(s.status!=='running'||dt<=0)return;
 s.elapsed+=dt;s.cooldown=Math.max(0,s.cooldown-dt);s.impact=Math.max(0,s.impact-dt*2);
 const right=Number(!!input.right)-Number(!!input.left),forward=Number(!!input.forward)-Number(!!input.backward),moving=!!(right||forward),yaw=input.viewYaw||0;
 s.boosting=moving&&!!input.boost&&s.energy>2&&!input.slow;s.slowing=!!input.slow&&s.energy>2;
 s.energy=Math.max(0,Math.min(100,s.energy+dt*(s.boosting?-18:s.slowing?-12:16)));
 const timeScale=s.slowing?.35:1,total=dt*timeScale;s.worldTime+=total;
 s.wallCooldown=Math.max(0,s.wallCooldown-total);s.landingImpact=Math.max(0,s.landingImpact-total*3);
 s.coyote=s.grounded?PHYSICS.coyoteTime:Math.max(0,s.coyote-total);s.jumpBuffer=input.jump?PHYSICS.jumpBuffer:Math.max(0,s.jumpBuffer-total);
 if(!collider.blocked(s.x,s.z,s.y))s.phaseSafe={x:s.x,z:s.z,y:s.y,grounded:s.grounded};
 if(s.phasing&&!input.phase&&collider.blocked(s.x,s.z,s.y)&&s.phaseSafe){Object.assign(s,s.phaseSafe);s.vx=s.vz=s.vy=0;}
 s.phasing=!!input.phase;
 if(s.phasing){s.wallRunning=false;s.wall=null;}
 if(input.jump&&s.wallRunning){const w=s.wall;s.vx=w.nx*14;s.vz=w.nz*14;s.vy=8;s.jumpCut=false;s.wallRunning=false;s.wall=null;s.wallCooldown=.35;s.jumpBuffer=0;s.coyote=0;}

 if(s.jumpBuffer>0&&(s.grounded||s.coyote>0)&&!s.wallRunning){s.vy=PHYSICS.jumpSpeed;s.jumpCut=false;s.grounded=false;s.jumpBuffer=0;s.coyote=0;}
 if(!s.grounded&&!s.wallRunning&&!s.jumpCut&&input.jumpHeld===false&&s.vy>0){s.vy=Math.min(s.vy,PHYSICS.jumpCutSpeed);s.jumpCut=true;}
 const max=s.cooldown>.8?20:s.boosting?BOOST_SPEED:RUN_SPEED;
 let dx=right*Math.cos(yaw)+forward*Math.sin(yaw),dz=right*Math.sin(yaw)-forward*Math.cos(yaw),len=Math.hypot(dx,dz);if(len){dx/=len;dz/=len;}
 const count=Math.max(1,Math.ceil(total/(1/120)),Math.ceil(Math.hypot(s.vx,s.vz)*total/.2)),h=total/count;
 for(let i=0;i<count;i++){
  if(s.wallRunning){
   const w=s.wall,press=-(dx*w.nx+dz*w.nz);
   const nearby=collider.contacts(s.x-w.nx*.08,s.z-w.nz*.08,s.y).some(c=>c.object===w.object);
   if(!moving||press<.1||!nearby){s.wallRunning=false;s.wall=null;s.wallCooldown=.2;}
   else{
    const climb=Math.min(s.boosting?65:38,Math.max(12,w.climb));
    const tangentX=dx+w.nx*press,tangentZ=dz+w.nz*press;
    const ox=s.x,oz=s.z;s.vx=tangentX*climb;s.vz=tangentZ*climb;s.vy=climb;
    s.x+=s.vx*h;s.z+=s.vz*h;s.y+=climb*h;
    for(const c of collider.contacts(s.x-w.nx*.04,s.z-w.nz*.04,s.y)){if(c.object===w.object){s.x+=c.nx*Math.max(0,c.depth-.04+.001);s.z+=c.nz*Math.max(0,c.depth-.04+.001);}}
    s.distance+=Math.hypot(s.x-ox,s.z-oz,climb*h);s.heading=Math.atan2(-w.nx,w.nz);
    if(s.y>=w.object.height){s.y=w.object.height;s.x-=w.nx*(PLAYER_RADIUS+.12);s.z-=w.nz*(PLAYER_RADIUS+.12);s.vx=-w.nx*climb;s.vz=-w.nz*climb;s.vy=0;s.grounded=true;s.wallRunning=false;s.wall=null;}
    continue;
   }
  }
  const terrain=collider.terrain?.(s.x,s.z)??{height:0,grip:1,kind:'asphalt'};
  s.surface=terrain.kind;s.grip=terrain.grip;
  const floor=s.phasing?terrain.height:(collider.surface?.(s.x,s.z,s.y)??terrain.height);
  if(s.grounded){if(s.y>floor+.05)s.grounded=false;else if(floor-s.y<=PHYSICS.stepHeight)s.y=floor;}
  const speed=Math.hypot(s.vx,s.vz);
  if(s.grounded){
   if(moving){
    const target=Math.atan2(dx,-dz),current=speed>.05?Math.atan2(s.vx,-s.vz):target;
    const angle=Math.atan2(Math.sin(target-current),Math.cos(target-current));
    const turn=Math.max(-PHYSICS.turnRate*terrain.grip*h,Math.min(PHYSICS.turnRate*terrain.grip*h,angle));
    const reversing=Math.abs(angle)>Math.PI*.65;
    const acceleration=(s.boosting?PHYSICS.boostAcceleration:PHYSICS.acceleration)*terrain.grip;
    const next=reversing?Math.max(0,speed-PHYSICS.reverseBraking*h):Math.max(0,speed+Math.sign(max-speed)*Math.min(Math.abs(max-speed),(speed>max?PHYSICS.braking*terrain.grip:acceleration)*h));
    s.vx=Math.sin(current+turn)*next;s.vz=-Math.cos(current+turn)*next;
   }else{const next=Math.max(0,speed-PHYSICS.braking*terrain.grip*h),f=speed?next/speed:0;s.vx*=f;s.vz*=f;}
  }else{
   if(moving&&speed>5){const current=Math.atan2(s.vx,-s.vz),target=Math.atan2(dx,-dz),angle=Math.atan2(Math.sin(target-current),Math.cos(target-current)),turn=Math.max(-PHYSICS.airTurnRate*h,Math.min(PHYSICS.airTurnRate*h,angle));s.vx=Math.sin(current+turn)*speed;s.vz=-Math.cos(current+turn)*speed;}
   const ax=dx*max-s.vx,az=dz*max-s.vz,delta=Math.hypot(ax,az),limit=moving?PHYSICS.airAcceleration*h:0;
   if(delta>0){const f=Math.min(1,limit/delta);s.vx+=ax*f;s.vz+=az*f;}
   s.vx*=Math.exp(-.025*h);s.vz*=Math.exp(-.025*h);
  }
  const oldX=s.x,oldZ=s.z;s.x+=s.vx*h;s.z+=s.vz*h;
  for(let pass=0;pass<2;pass++)for(const contact of collider.contacts(s.x,s.z,s.y)){
   const building=contact.object&&Number.isFinite(contact.object.height);
   if(s.phasing&&building)continue;
   s.x+=contact.nx*(contact.depth+.001);s.z+=contact.nz*(contact.depth+.001);
   const normalSpeed=s.vx*contact.nx+s.vz*contact.nz;
   if(building&&contact.object.wallRunnable!==false&&!s.phasing&&!s.grounded&&s.y>.15&&moving&&normalSpeed< -10&&s.wallCooldown===0){
    s.wallRunning=true;s.wall={nx:contact.nx,nz:contact.nz,object:contact.object,climb:Math.max(12,-normalSpeed*.8)};s.vx=s.vz=0;s.vy=s.wall.climb;s.heading=Math.atan2(-contact.nx,contact.nz);
   }else if(normalSpeed<0){s.vx-=normalSpeed*contact.nx;s.vz-=normalSpeed*contact.nz;if(normalSpeed < -8)s.impact=Math.min(1,-normalSpeed/50);}
  }
  s.distance+=Math.hypot(s.x-oldX,s.z-oldZ);
  if(s.grounded){const ground=s.phasing?(collider.terrain?.(s.x,s.z)?.height??0):(collider.surface?.(s.x,s.z,s.y)??0);if(ground-s.y<=PHYSICS.stepHeight&&s.y-ground<=.05)s.y=ground;else if(s.y>ground+.05)s.grounded=false;}
  if(!s.grounded&&!s.wallRunning){const previousY=s.y;const gravity=GRAVITY*(s.vy<0?PHYSICS.fallGravity:1);s.y+=s.vy*h-.5*gravity*h*h;s.vy-=gravity*h;const support=s.phasing?(collider.terrain?.(s.x,s.z)?.height??0):(collider.surface?.(s.x,s.z,previousY)??0);if(s.y<=support){s.landingImpact=Math.min(1,Math.max(0,-s.vy-4)/14);s.y=support;s.vy=0;s.grounded=true;}}
 }
 s.speed=s.wallRunning?Math.hypot(s.vx,s.vz,s.vy):Math.hypot(s.vx,s.vz);s.topSpeed=Math.max(s.topSpeed,s.speed);if(!s.wallRunning&&s.speed>.2)s.heading=Math.atan2(s.vx,-s.vz);
}
export function hitTraffic(s,car={x:s.x+1,z:s.z,vx:0,vz:0}){if(s.status!=='running'||s.cooldown>0||s.phasing)return false;let nx=s.x-car.x,nz=s.z-car.z,n=Math.hypot(nx,nz)||1;nx/=n;nz/=n;const approach=(s.vx-(car.vx||0))*nx+(s.vz-(car.vz||0))*nz;if(approach<0){s.vx-=1.12*approach*nx;s.vz-=1.12*approach*nz;}s.vx*=.55;s.vz*=.55;s.speed=Math.hypot(s.vx,s.vz);s.hits++;s.energy=Math.max(0,s.energy-10);s.cooldown=1.3;s.impact=1;return true;}
export function collectEnergy(s){s.energy=Math.min(100,s.energy+25);s.collected++;}
export function cameraClearance(x,z,offsetX,offsetZ,collider=empty,y=1.5){const steps=Math.max(1,Math.ceil(Math.hypot(offsetX,offsetZ)/.2));for(let i=1;i<=steps;i++)if(collider.blocked(x+offsetX*i/steps,z+offsetZ*i/steps,y))return (i-1)/steps;return 1;}
export function updateView(view,input,dt){return {yaw:view.yaw+((input.right?1:0)-(input.left?1:0))*1.65*dt,pitch:Math.max(.08,Math.min(1.15,view.pitch+((input.up?1:0)-(input.down?1:0))*.75*dt))};}
