import * as THREE from 'three';
import {LineSegments2} from 'three/addons/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/addons/lines/LineSegmentsGeometry.js';
import {LineMaterial} from 'three/addons/lines/LineMaterial.js';
import {LightningHistory} from './speed-effects.js';

export class SpeedLightning{
 constructor(scene,animator){
  this.animator=animator;this.history=new LightningHistory();this.time=-1;
  this.names=['LeftHand','RightHand','LeftFoot','RightFoot','Spine2','Head'];
  this.layers=[{width:7,opacity:.14,color:0xff870d},{width:2.2,opacity:.85,color:0xffd45c},{width:.8,opacity:1,color:0xfff4cd}].map(({width,opacity,color})=>{
   const geometry=new LineSegmentsGeometry();geometry.setPositions(new Float32Array(800*6));geometry.setColors(new Float32Array(800*6));geometry.instanceCount=0;
   const material=new LineMaterial({color,linewidth:width,transparent:true,opacity,vertexColors:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
   const line=new LineSegments2(geometry,material);line.frustumCulled=false;line.visible=false;scene.add(line);return line;
  });
 }
 reset(){this.history.reset();this.time=-1;for(const l of this.layers)l.visible=false;}
 update(world,runner){
  if(world.status==='paused'||world.worldTime===this.time)return;
  this.time=world.worldTime;
  const enabled=world.status==='running'&&(world.speed>8||world.phasing);
  for(const l of this.layers){l.visible=enabled;l.material.color.setHex(world.phasing?0x8befff:l===this.layers[0]?0xff870d:l===this.layers[1]?0xffd45c:0xfff4cd);}
  if(!enabled){this.history.reset();return;}
  runner.updateWorldMatrix(true,true);
  const anchors=this.names.map(name=>{const p=new THREE.Vector3();const bone=this.animator.bones[name]?.bone;(bone||runner).getWorldPosition(p);return {x:p.x+world.x,y:p.y,z:p.z+world.z};});
  this.history.sample(world.worldTime,anchors);
  const positions=[],colors=[],tick=Math.floor(world.worldTime*30);
  const noise=(seed)=>{const n=Math.sin(seed*127.1+tick*311.7)*43758.5453;return n-Math.floor(n)-.5;};
  const segment=(a,b,brightness)=>{positions.push(a.x-world.x,a.y,a.z-world.z,b.x-world.x,b.y,b.z-world.z);for(let i=0;i<6;i++)colors.push(brightness);};
  const bolt=(a,b,seed,brightness,jitter=.13)=>{
   let previous=a;
   for(let j=1;j<=5;j++){const f=j/5,edge=j===5?0:1,next={x:a.x+(b.x-a.x)*f+noise(seed+j)*jitter*edge,y:a.y+(b.y-a.y)*f+noise(seed+j+20)*jitter*edge,z:a.z+(b.z-a.z)*f+noise(seed+j+40)*jitter*edge};segment(previous,next,brightness);if(j===3){const fork={x:next.x+noise(seed+70)*.35,y:next.y+noise(seed+80)*.35,z:next.z+noise(seed+90)*.35};segment(next,fork,brightness*.5);}previous=next;}
  };
  // Current arcs are attached to the animated skeleton, including wall orientation.
  for(const [a,b] of [[4,0],[4,1],[4,2],[4,3],[4,5]])bolt(anchors[a],anchors[b],a*13+b*19,.85,.2);
  // Old anchor positions stay in world space; turning does not rotate the wake.
  for(let i=0;i<4;i++){
   const points=this.history.points(i,world.worldTime);
   for(let j=1;j<points.length;j++){if(Math.hypot(points[j].x-points[j-1].x,points[j].y-points[j-1].y,points[j].z-points[j-1].z)<.025)continue;bolt(points[j-1],points[j],i*83+j*7,Math.pow(1-j/points.length,1.5)*(world.boosting?1:.7),.15);}
  }
  for(const line of this.layers){const g=line.geometry;g.attributes.instanceStart.data.array.set(positions);g.attributes.instanceColorStart.data.array.set(colors);g.attributes.instanceStart.data.needsUpdate=true;g.attributes.instanceColorStart.data.needsUpdate=true;g.instanceCount=positions.length/6;}
 }
 snapshot(){return {visible:this.layers[0].visible,samples:this.history.samples.length,anchors:this.history.samples[0]?.anchors??[],segments:this.layers[0].geometry.instanceCount};}
}
