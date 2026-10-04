// Canvas map uses the same geographic features and street widths as the world.
export function mountMapOverview(canvas,readout,zoomControl,map,world){
 const ctx=canvas.getContext('2d'),width=canvas.width,height=canvas.height;
 const middle={x:(map.bounds.minX+map.bounds.maxX)/2,z:(map.bounds.minZ+map.bounds.maxZ)/2},view={...middle,zoom:1};
 const base=Math.min((width-70)/(map.bounds.maxX-map.bounds.minX),(height-70)/(map.bounds.maxZ-map.bounds.minZ));
 const markers=(map.features||[]).filter(f=>f.kind==='poi'&&f.name&&['attraction','artwork','museum','theatre','library','townhall'].includes(f.category));
 for(const name of ['Texas State Capitol']){const b=map.buildings.find(b=>b.name===name);if(b)markers.push({name,category:'landmark',x:b.polygon.reduce((v,p)=>v+p[0],0)/b.polygon.length,z:b.polygon.reduce((v,p)=>v+p[1],0)/b.polygon.length});}
 let dragging=null,selected=null;
 const screen=(x,z)=>[width/2+(x-view.x)*base*view.zoom,height/2+(z-view.z)*base*view.zoom];
 function draw(){
  ctx.fillStyle='#182520';ctx.fillRect(0,0,width,height);
  const polygon=(points,fill)=>{ctx.fillStyle=fill;ctx.beginPath();points.forEach((p,i)=>{const q=screen(p[0],p[1]);i?ctx.lineTo(...q):ctx.moveTo(...q);});ctx.closePath();ctx.fill();};
  for(const a of map.areas)polygon(a.polygon,a.kind==='water'?'#3b7689':'#385b3e');
  for(const b of map.buildings)polygon(b.polygon,b.height>60?'#596971':'#40504c');
  const names=new Map();
  for(const road of map.roads){const foot=road.width<=5;ctx.strokeStyle=foot?'#779768':'#aab5a4';ctx.lineWidth=Math.max(foot?1:1.4,road.width*base*view.zoom*.75);ctx.beginPath();road.points.forEach((p,i)=>{const q=screen(p[0],p[1]);i?ctx.lineTo(...q):ctx.moveTo(...q);});ctx.stroke();if(road.name&&!foot){const best=names.get(road.name);if(!best||road.points.length>best.points.length)names.set(road.name,road);}}
  ctx.font='13px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=4;
  for(const [name,r] of names){if(view.zoom<1.5&&!/Congress|6th|Cesar Chavez|11th|15th|Lamar|Red River/.test(name))continue;const i=Math.floor((r.points.length-1)/2),a=r.points[i],b=r.points[i+1]||r.points[0],p=screen((a[0]+b[0])/2,(a[1]+b[1])/2);if(p[0]<30||p[0]>width-30||p[1]<30||p[1]>height-30)continue;let angle=Math.atan2(b[1]-a[1],b[0]-a[0]);if(angle>Math.PI/2||angle< -Math.PI/2)angle+=Math.PI;ctx.save();ctx.translate(...p);ctx.rotate(angle);ctx.strokeStyle='#182520';ctx.strokeText(name,0,-6);ctx.fillStyle='#eceddb';ctx.fillText(name,0,-6);ctx.restore();}
  for(const m of markers){const p=screen(m.x,m.z);ctx.fillStyle=m===selected?'#fff':'#f4c474';ctx.beginPath();ctx.arc(...p,m===selected?7:4,0,Math.PI*2);ctx.fill();if(m===selected||m.name==='Texas State Capitol'){ctx.fillStyle='#fff0c7';ctx.font='bold 14px sans-serif';ctx.fillText(m.name,p[0],p[1]-16);}}
  const p=screen(world.x,world.z);ctx.save();ctx.translate(...p);ctx.rotate(world.heading);ctx.fillStyle='#eaff78';ctx.strokeStyle='#17251b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(7,9);ctx.lineTo(0,5);ctx.lineTo(-7,9);ctx.closePath();ctx.stroke();ctx.fill();ctx.restore();
  ctx.textAlign='left';ctx.fillStyle='#f0f5d8';ctx.font='bold 17px sans-serif';ctx.fillText('N ↑',24,30);ctx.font='13px sans-serif';const scale=100*base*view.zoom;ctx.fillRect(24,height-28,scale,3);ctx.fillText('100 m',24,height-42);
 }
 const point=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*width/r.width,y:(e.clientY-r.top)*height/r.height};};
 canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);dragging={...point(e),startX:e.clientX,startY:e.clientY,viewX:view.x,viewZ:view.z};};
 canvas.onpointermove=e=>{if(!dragging)return;const p=point(e);view.x=dragging.viewX-(p.x-dragging.x)/(base*view.zoom);view.z=dragging.viewZ-(p.y-dragging.y)/(base*view.zoom);draw();};
 canvas.onpointerup=e=>{if(!dragging)return;if(Math.hypot(e.clientX-dragging.startX,e.clientY-dragging.startY)<5){const p=point(e);selected=markers.find(m=>{const q=screen(m.x,m.z);return Math.hypot(p.x-q[0],p.y-q[1])<16;})||null;readout.textContent=selected?`${selected.name} · ${selected.category}`:'Select a gold marker to identify a place.';}dragging=null;draw();};
 canvas.onpointercancel=()=>dragging=null;
 zoomControl.oninput=()=>{view.zoom=Number(zoomControl.value);draw();};
 draw();
}
