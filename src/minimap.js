export function minimapMetrics(cssSize,pixelRatio=1){
 const size=Math.max(1,Math.round(cssSize));
 const ratio=Math.min(3,Math.max(1,pixelRatio||1));
 return {cssSize:size,pixelRatio:ratio,backingSize:Math.round(size*ratio),worldScale:size/1500,playerSize:15};
}

export function minimapProjection(world,metrics){
 const radius=metrics.cssSize/(2*metrics.worldScale),center=metrics.cssSize/2;
 return {
  project:point=>[center+(point[0]-world.x)*metrics.worldScale,center+(point[1]-world.z)*metrics.worldScale],
  visible:bounds=>bounds.maxX>=world.x-radius&&bounds.minX<=world.x+radius&&bounds.maxZ>=world.z-radius&&bounds.minZ<=world.z+radius
 };
}

function geometry(points,closed=false){
 const path=new Path2D(),bounds={minX:Infinity,maxX:-Infinity,minZ:Infinity,maxZ:-Infinity};
 points.forEach(([x,z],i)=>{
  i?path.lineTo(x,z):path.moveTo(x,z);
  bounds.minX=Math.min(bounds.minX,x);bounds.maxX=Math.max(bounds.maxX,x);
  bounds.minZ=Math.min(bounds.minZ,z);bounds.maxZ=Math.max(bounds.maxZ,z);
 });
 if(closed)path.closePath();
 return {path,bounds};
}

export function drawPlayerMarker(ctx,x,y,heading,size=15){
 ctx.save();ctx.translate(x,y);ctx.rotate(heading);
 ctx.beginPath();ctx.moveTo(0,-size);ctx.lineTo(size*.65,size*.8);ctx.lineTo(0,size*.4);ctx.lineTo(-size*.65,size*.8);ctx.closePath();
 ctx.lineJoin='round';ctx.strokeStyle='#101820';ctx.lineWidth=5;ctx.stroke();ctx.strokeStyle='#fff2cd';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#e9bf65';ctx.fill();ctx.restore();
}

// Cache geographic paths once; only the projection and live markers change.
export function createMinimapRenderer(map){
 const areas=map.areas.map(area=>({...geometry(area.polygon,true),kind:area.kind}));
 const buildings=map.buildings.map(building=>geometry(building.polygon,true));
 const paths=[],major=[],minor=[];
 for(const road of map.roads){
  if(['planned','elevator','service'].includes(road.kind))continue;
  const trail=['footway','path','cycleway','pedestrian'].includes(road.kind);
  // Thousands of individual sidewalks obscure the useful street grid at this zoom.
  if(trail&&!road.name)continue;
  const feature={...geometry(road.points),...road};
  (trail?paths:road.width>=11?major:minor).push(feature);
 }
 const landmarks=map.buildings.filter(building=>building.name==='Texas State Capitol').map(building=>({x:building.polygon.reduce((sum,p)=>sum+p[0],0)/building.polygon.length,z:building.polygon.reduce((sum,p)=>sum+p[1],0)/building.polygon.length}));

 return function drawMap(canvas,world,{players=[],pickups=[]}={}){
  const metrics=minimapMetrics(canvas.getBoundingClientRect().width||188,globalThis.devicePixelRatio);
  if(canvas.width!==metrics.backingSize||canvas.height!==metrics.backingSize){canvas.width=canvas.height=metrics.backingSize;}
  const ctx=canvas.getContext('2d'),size=metrics.cssSize,center=size/2,scale=metrics.worldScale,view=minimapProjection(world,metrics);
  const density=metrics.backingSize/size;
  ctx.setTransform(density,0,0,density,0,0);ctx.clearRect(0,0,size,size);
  ctx.save();ctx.beginPath();ctx.arc(center,center,center,0,Math.PI*2);ctx.clip();
  // One translucent base; the HUD container adds no second opaque layer.
  ctx.fillStyle='#11181fb0';ctx.fillRect(0,0,size,size);
  ctx.save();ctx.translate(center,center);ctx.scale(scale,scale);ctx.translate(-world.x,-world.z);
  for(const area of areas)if(view.visible(area.bounds)){ctx.fillStyle=area.kind==='water'?'#6dacc477':'#71968555';ctx.fill(area.path);}
  ctx.fillStyle='#d6dfe61b';for(const building of buildings)if(view.visible(building.bounds))ctx.fill(building.path);
  ctx.lineCap='round';ctx.lineJoin='round';
  const stroke=(features,color,width,dash=[])=>{
   ctx.strokeStyle=color;ctx.setLineDash(dash.map(value=>value/scale));
   for(const feature of features)if(view.visible(feature.bounds)){ctx.lineWidth=width(feature)/scale;ctx.stroke(feature.path);}
  };
  stroke(paths,'#a3c1ac88',()=>.7,[1.4,2.4]);
  stroke(minor,'#c1cbd585',()=>1.05);
  stroke(major,'#15212ce0',road=>Math.max(2.3,road.width*scale*.7)+1.4);
  stroke(major,'#ebeff2df',road=>Math.max(1.8,road.width*scale*.7));
  ctx.setLineDash([]);ctx.restore();

  const inside=(x,z,inset=12)=>{const p=view.project([x,z]);return Math.hypot(p[0]-center,p[1]-center)<center-inset?p:null;};
  for(const landmark of landmarks){const p=inside(landmark.x,landmark.z,18);if(!p)continue;ctx.fillStyle='#e1c083';ctx.strokeStyle='#18212a';ctx.lineWidth=1.5;ctx.beginPath();ctx.rect(p[0]-2.8,p[1]-2.8,5.6,5.6);ctx.stroke();ctx.fill();}
  // Only nearby available pickups are shown, keeping the map readable at speed.
  const nearby=pickups.filter(pickup=>pickup.available<=world.elapsed).map(pickup=>({...pickup,distance:Math.hypot(pickup.x-world.x,pickup.z-world.z)})).filter(pickup=>pickup.distance*scale>=24).sort((a,b)=>a.distance-b.distance).slice(0,6);
  for(const pickup of nearby){const p=inside(pickup.x,pickup.z);if(!p||Math.hypot(p[0]-center,p[1]-center)<24)continue;ctx.fillStyle='#e1c083';ctx.beginPath();ctx.arc(...p,1.8,0,Math.PI*2);ctx.fill();}
  for(const player of players){if(player.health<=0)continue;const p=inside(player.x,player.z,9);if(!p)continue;ctx.fillStyle=player.color||'#b7d9ef';ctx.strokeStyle='#151c23';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(...p,4.2,0,Math.PI*2);ctx.stroke();ctx.fill();}

  // The player's marker is measured in CSS pixels, independently of map zoom.
  drawPlayerMarker(ctx,center,center,world.heading,metrics.playerSize);

  ctx.font='500 9px "Space Grotesk", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.strokeStyle='#11181f';ctx.lineWidth=3;ctx.strokeText('N',center,12);ctx.fillStyle='#f2f4f5';ctx.fillText('N',center,12);
  const scaleWidth=200*scale;ctx.strokeStyle='#ebeff2';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(center-scaleWidth/2,size-15);ctx.lineTo(center+scaleWidth/2,size-15);ctx.stroke();ctx.font='500 8px "Space Grotesk", sans-serif';ctx.strokeStyle='#11181f';ctx.lineWidth=3;ctx.strokeText('200 m',center,size-24);ctx.fillStyle='#e1e7ec';ctx.fillText('200 m',center,size-24);
  ctx.restore();
 };
}
