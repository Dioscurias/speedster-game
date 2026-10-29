import {drawPlayerMarker} from './minimap.js';
import {speedsterColorForIndex} from './superhero.js';
export function mountCourseOverview(canvas){
 const draw=()=>{const game=window.__parkour;if(!game)return;const w=game.getState(),platforms=game.getPlatforms(),peers=game.getPeers(),rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,2),width=rect.width,height=rect.height;
  canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#161c24';ctx.fillRect(0,0,width,height);
  const min=Math.min(...platforms.map(p=>p.z))-20,max=24,scale=Math.min((height-50)/(max-min),(width-60)/100),point=(x,z)=>[width/2+x*scale,25+(z-min)*scale];
  ctx.strokeStyle='#e0b79066';ctx.lineWidth=2;ctx.beginPath();platforms.forEach((p,i)=>{const q=point(p.x,p.z);i?ctx.lineTo(...q):ctx.moveTo(...q);});ctx.stroke();
  platforms.forEach((p,i)=>{const q=point(p.x,p.z);ctx.save();ctx.translate(...q);ctx.rotate(p.angle||0);ctx.fillStyle=p.active===false?'#9e3939':'#b89070';ctx.fillRect(-p.width*scale/2,-p.depth*scale/2,p.width*scale,p.depth*scale);ctx.restore();if([1,4,7,10,13].includes(i)){ctx.fillStyle='#73d9ff';ctx.font='11px sans-serif';ctx.fillText(p.name,q[0]+p.width*scale/2+8,q[1]+3);}});
  for(const p of peers){const q=point(p.x,p.z);ctx.fillStyle=speedsterColorForIndex(p.colorIndex);ctx.beginPath();ctx.arc(...q,5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='11px sans-serif';ctx.fillText(p.name,q[0]+8,q[1]-6);}
  drawPlayerMarker(ctx,...point(w.x,w.z),w.heading,10);canvas.dataset.playerCount=String(peers.length+1);
 };draw();const timer=setInterval(()=>{if(canvas.isConnected)draw();else clearInterval(timer);},150);return ()=>clearInterval(timer);
}
