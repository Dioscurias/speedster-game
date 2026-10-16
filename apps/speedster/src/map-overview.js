// Canvas map uses the same geographic features and street widths as the world.
import {drawPlayerMarker} from './minimap.js';
export function mountMapOverview(canvas,readout,zoomControl,map,world){
 const rect=canvas.getBoundingClientRect(),width=rect.width,height=rect.height,density=Math.min(globalThis.devicePixelRatio||1,3);
 canvas.width=Math.round(width*density);canvas.height=Math.round(height*density);
 const ctx=canvas.getContext('2d');ctx.setTransform(canvas.width/width,0,0,canvas.height/height,0,0);
 const middle={x:(map.bounds.minX+map.bounds.maxX)/2,z:(map.bounds.minZ+map.bounds.maxZ)/2},view={...middle,zoom:1};
 const base=Math.min((width-70)/(map.bounds.maxX-map.bounds.minX),(height-70)/(map.bounds.maxZ-map.bounds.minZ));
 const markers=(map.features||[]).filter(f=>f.kind==='poi'&&f.name&&['attraction','artwork','museum','theatre','library','townhall'].includes(f.category));
 for(const name of ['Texas State Capitol']){const b=map.buildings.find(b=>b.name===name);if(b)markers.push({name,category:'landmark',x:b.polygon.reduce((v,p)=>v+p[0],0)/b.polygon.length,z:b.polygon.reduce((v,p)=>v+p[1],0)/b.polygon.length});}
 let dragging=null,selected=null;
 const screen=(x,z)=>[width/2+(x-view.x)*base*view.zoom,height/2+(z-view.z)*base*view.zoom];
 function draw(){
  ctx.fillStyle='#182129';ctx.fillRect(0,0,width,height);
  const polygon=(points,fill)=>{ctx.fillStyle=fill;ctx.beginPath();points.forEach((p,i)=>{const q=screen(p[0],p[1]);i?ctx.lineTo(...q):ctx.moveTo(...q);});ctx.closePath();ctx.fill();};
  for(const a of map.areas)polygon(a.polygon,a.kind==='water'?'#385c70':'#354d43');
  for(const b of map.buildings)polygon(b.polygon,b.height>60?'#ffffff18':'#ffffff0c');
  const names=new Map();
  for(const road of map.roads){if(['planned','elevator'].includes(road.kind))continue;const foot=road.width<=5;if(view.zoom<1.5&&foot&&!road.name)continue;ctx.strokeStyle=foot?'#86aa9380':road.kind==='service'?'#a3b2bf60':road.width>=11?'#e4eaef':'#a3b2bf';ctx.lineWidth=Math.max(foot?.65:1.1,road.width*base*view.zoom*.7);ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();road.points.forEach((p,i)=>{const q=screen(p[0],p[1]);i?ctx.lineTo(...q):ctx.moveTo(...q);});ctx.stroke();if(road.name&&!foot){const best=names.get(road.name);if(!best||road.points.length>best.points.length)names.set(road.name,road);}}
  ctx.font=`500 ${width<340?9:10}px "Space Grotesk", sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3;
  const playerPoint=screen(world.x,world.z),occupied=[{x:playerPoint[0]-23,y:playerPoint[1]-23,w:46,h:46}];
  for(const marker of markers)if(marker.name==='Texas State Capitol'||marker===selected){const p=screen(marker.x,marker.z);occupied.push({x:p[0]-65,y:p[1]-21,w:130,h:16});}
  const priority=name=>{const i=[/Congress/,/6th/,/Cesar Chavez/,/Red River/,/Lamar/].findIndex(pattern=>pattern.test(name));return i<0?5:i;};
  for(const [name,r] of [...names].sort(([a],[b])=>priority(a)-priority(b))){
   if(view.zoom<1.5&&!/Congress|6th|Cesar Chavez|11th|15th|Lamar|Red River/.test(name))continue;
   const i=Math.floor((r.points.length-1)/2),a=r.points[i],b=r.points[i+1]||r.points[0],p=screen((a[0]+b[0])/2,(a[1]+b[1])/2);
   let angle=Math.atan2(b[1]-a[1],b[0]-a[0]);if(angle>Math.PI/2||angle< -Math.PI/2)angle+=Math.PI;
   const label=name.replace(/ Avenue$/,' Ave').replace(/ Street$/,' St').replace(/ Boulevard$/,' Blvd');
   const length=ctx.measureText(label).width+6,halfWidth=(Math.abs(Math.cos(angle))*length+Math.abs(Math.sin(angle))*13)/2,halfHeight=(Math.abs(Math.sin(angle))*length+Math.abs(Math.cos(angle))*13)/2;
   const box={x:p[0]+6*Math.sin(angle)-halfWidth,y:p[1]-6*Math.cos(angle)-halfHeight,w:halfWidth*2,h:halfHeight*2};
   if(box.x<12||box.y<32||box.x+box.w>width-12||box.y+box.h>height-42||occupied.some(other=>box.x<other.x+other.w&&box.x+box.w>other.x&&box.y<other.y+other.h&&box.y+box.h>other.y))continue;
   occupied.push(box);ctx.save();ctx.translate(...p);ctx.rotate(angle);ctx.strokeStyle='#182129';ctx.strokeText(label,0,-6);ctx.fillStyle='#e4eaef';ctx.fillText(label,0,-6);ctx.restore();
  }
  for(const m of markers){const p=screen(m.x,m.z);ctx.fillStyle=m===selected?'#fff':'#e1c083';ctx.strokeStyle='#182129';ctx.lineWidth=2;ctx.beginPath();ctx.arc(...p,m===selected?5:2.5,0,Math.PI*2);ctx.stroke();ctx.fill();if(m===selected||m.name==='Texas State Capitol'){ctx.fillStyle='#fff0c7';ctx.font='500 11px "Space Grotesk", sans-serif';ctx.fillText(m.name,p[0],p[1]-13);}}
  const p=screen(world.x,world.z);drawPlayerMarker(ctx,...p,world.heading,17);
  ctx.textAlign='left';ctx.fillStyle='#e4eaef';ctx.font='600 12px "Space Grotesk", sans-serif';ctx.fillText('N ↑',18,22);ctx.font='500 10px "Space Grotesk", sans-serif';const scale=200*base*view.zoom;ctx.fillRect(18,height-18,scale,2);ctx.fillText('200 m',18,height-31);
 }
 const point=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*width/r.width,y:(e.clientY-r.top)*height/r.height};};
 canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);dragging={...point(e),startX:e.clientX,startY:e.clientY,viewX:view.x,viewZ:view.z};};
 canvas.onpointermove=e=>{if(!dragging)return;const p=point(e);view.x=dragging.viewX-(p.x-dragging.x)/(base*view.zoom);view.z=dragging.viewZ-(p.y-dragging.y)/(base*view.zoom);draw();};
 canvas.onpointerup=e=>{if(!dragging)return;if(Math.hypot(e.clientX-dragging.startX,e.clientY-dragging.startY)<5){const p=point(e);selected=markers.find(m=>{const q=screen(m.x,m.z);return Math.hypot(p.x-q[0],p.y-q[1])<12;})||null;readout.textContent=selected?`${selected.name} · ${selected.category}`:'';}dragging=null;draw();};
 canvas.onpointercancel=()=>dragging=null;
 zoomControl.oninput=()=>{view.zoom=Number(zoomControl.value);draw();};
 draw();
}
