import * as THREE from 'three';
export class JumpFX {
 constructor(scene,visual,support){
  this.visual=visual;this.support=support;this.root=new THREE.Group();scene.add(this.root);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const ctx=canvas.getContext('2d'),g=ctx.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'white');g.addColorStop(.4,'rgba(255,255,255,.5)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);this.texture=new THREE.CanvasTexture(canvas);this.texture.colorSpace=THREE.SRGBColorSpace;
  this.shadow=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:this.texture,color:'#30172a',transparent:true,depthWrite:false}));this.shadow.rotation.x=-Math.PI/2;this.root.add(this.shadow);
  this.particles=[];this.reset({grounded:true});
 }
 reset(w){for(const p of this.particles){this.root.remove(p.mesh);p.mesh.material.dispose();}this.particles=[];this.wasGrounded=w.grounded;this.launch=this.land=99;this.strength=0;this.time=this.emit=0;this.visual.scale.setScalar(1);}
 particle(w,blue=false){if(this.particles.length>=96)return;const mesh=new THREE.Sprite(new THREE.SpriteMaterial({map:this.texture,color:blue?'#4acfff':'#cf704d',depthWrite:false,blending:blue?THREE.AdditiveBlending:THREE.NormalBlending}));mesh.position.set(w.x,w.y+(blue?.85:.06),w.z);this.root.add(mesh);const angle=Math.random()*Math.PI*2,speed=blue?0:.6+Math.random()*1.2;this.particles.push({mesh,blue,age:0,life:blue?.23:.45,size:blue?.4:.25,vx:Math.cos(angle)*speed,vz:Math.sin(angle)*speed,vy:blue?.08:.8});}
 update(w,dt,reduced=false){
  if(dt<=0)return;
  this.time+=dt;const takeoff=this.wasGrounded&&!w.grounded&&w.vy>0,landing=!this.wasGrounded&&w.grounded;
  if(takeoff){this.launch=0;for(let i=0;i<9;i++)this.particle(w);}
  if(landing){this.land=0;this.strength=.45+.55*w.landingImpact;for(let i=0;i<18;i++)this.particle(w);}
  let sy=1;if(!w.grounded){sy=this.launch<.035?.9:this.launch<.11?1.12:Math.abs(w.vy)<.65?1.02:w.vy<0?1.05:1.04;}else if(this.land<.22)sy=1-.16*this.strength*Math.exp(-this.land*15);
  if(reduced)sy=1;this.visual.scale.set(1/Math.sqrt(sy),sy,1/Math.sqrt(sy));
  this.root.position.set(-w.x,0,-w.z);const floor=this.support(w.x,w.z,w.y),height=Math.max(0,w.y-floor);this.shadow.visible=height<12;this.shadow.position.set(w.x,floor+.025,w.z);const size=Math.max(.28,1.25/(1+height*.22));this.shadow.scale.set(size,size,1);this.shadow.material.opacity=.32*Math.exp(-height*.28);
  this.emit+=dt;if(!w.grounded&&this.emit>=1/30){this.emit%=1/30;this.particle(w,true);}if(w.grounded)this.emit=0;
  for(let i=this.particles.length-1;i>=0;i--){const p=this.particles[i];p.age+=dt;if(p.age>=p.life){this.root.remove(p.mesh);p.mesh.material.dispose();this.particles.splice(i,1);continue;}p.mesh.position.x+=p.vx*dt;p.mesh.position.y+=p.vy*dt;p.mesh.position.z+=p.vz*dt;if(!p.blue)p.vy-=1.8*dt;const t=p.age/p.life;p.mesh.scale.setScalar(p.size*(1+t*1.5));p.mesh.material.opacity=(p.blue?.24:.45)*(1-t)**2;}
  this.wasGrounded=w.grounded;this.launch+=dt;this.land+=dt;
 }
 camera(reduced=false){const impact=this.strength*Math.exp(-this.land*18);return reduced?{fov:0,dip:0,shake:0}:{fov:2*Math.exp(-this.launch*12),dip:-.07*impact,shake:Math.sin(this.time*91)*.018*impact};}
}
