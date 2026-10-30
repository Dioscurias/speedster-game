import * as THREE from 'three';

export class ImpactFX {
 constructor(scene){
  this.root=new THREE.Group();scene.add(this.root);this.scars=[];this.particles=[];this.rings=[];this.ids=new Set();this.kick=0;this.time=0;this.wasGrounded=true;
  this.rubbleGeometry=new THREE.IcosahedronGeometry(1,0);this.rubbleMaterial=new THREE.MeshStandardMaterial({color:'#79776f',roughness:1});this.lastWake=0;
 }
 observe(w,emit){
  if(w.status!=='running')return;
  if(w.hero!=='atlas'){this.wasGrounded=w.grounded;return;}
  const takeoff=this.wasGrounded&&!w.grounded&&w.vy>0&&!w.flying,land=!this.wasGrounded&&w.grounded;
  if(takeoff||land){const radius=w.hero==='atlas'?(land?2+3*(w.landingImpact||0):2.5):(land?1.2:0.8);const event={kind:takeoff?'launch':'land',x:w.x,y:w.y+.04,z:w.z,nx:0,ny:1,nz:0,radius};emit(event);}
  this.wasGrounded=w.grounded;
 }
 add(event,quiet=false){
  if(this.ids.has(event.id))return;this.ids.add(event.id);if(this.ids.size>256)this.ids.delete(this.ids.values().next().value);
  const normal=new THREE.Vector3(event.nx,event.ny,event.nz),origin=new THREE.Vector3(event.x,event.y,event.z),radius=event.radius;
  const group=new THREE.Group();group.position.copy(origin).addScaledVector(normal,.085);group.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal);this.root.add(group);
  if(event.kind!=='launch'){
   const bowl=new THREE.Mesh(new THREE.CircleGeometry(radius*.72,17),new THREE.MeshBasicMaterial({color:'#181b20',transparent:true,opacity:.88,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3}));group.add(bowl);
   const rim=new THREE.Mesh(new THREE.RingGeometry(radius*.68,radius,17,2),new THREE.MeshStandardMaterial({color:'#67665f',roughness:1,side:THREE.DoubleSide,vertexColors:true}));const positions=rim.geometry.attributes.position,colors=[];
   for(let i=0;i<positions.count;i++){const x=positions.getX(i),y=positions.getY(i),r=Math.hypot(x,y),jag=1+.10*Math.sin(i*12.3);positions.setXYZ(i,x*jag,y*jag,r<radius*.8?.02:.15+.16*Math.sin(i*7));const shade=.5+.5*Math.abs(Math.sin(i*5.3));colors.push(shade,shade,shade);}rim.geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));rim.geometry.computeVertexNormals();group.add(rim);
   const cracks=[];for(let i=0;i<11;i++){const a=i*Math.PI*2/11;for(let j=0;j<3;j++){const r=radius*(.8+j*.35),b=a+Math.sin(i*5+j)*.12;cracks.push(Math.cos(b)*r,Math.sin(b)*r,.025,Math.cos(b+.08)*r*1.28,Math.sin(b+.08)*r*1.28,.025);}}
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(cracks,3));group.add(new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:'#272b31',transparent:true,opacity:.8})));
   this.scars.push(group);if(this.scars.length>64)this.disposeGroup(this.scars.shift());
  }else this.root.remove(group);
  if(quiet)return;
  const ring=new THREE.Mesh(new THREE.RingGeometry(.92,1,48),new THREE.MeshBasicMaterial({color:'#f1dfac',transparent:true,opacity:.7,side:THREE.DoubleSide,depthWrite:false}));ring.position.copy(origin).addScaledVector(normal,.12);ring.quaternion.copy(group.quaternion);this.root.add(ring);this.rings.push({mesh:ring,age:0,radius});
  for(let i=0;i<18&&this.particles.length<180;i++){const mesh=new THREE.Mesh(this.rubbleGeometry,this.rubbleMaterial);mesh.position.copy(origin).addScaledVector(normal,.2);mesh.scale.setScalar(.09+Math.random()*.19);this.root.add(mesh);const velocity=new THREE.Vector3((Math.random()-.5)*radius*5,2+Math.random()*radius*3,(Math.random()-.5)*radius*5).addScaledVector(normal,2);this.particles.push({mesh,velocity,age:0});}
  if(!this.world||origin.distanceTo(new THREE.Vector3(this.world.x,this.world.y,this.world.z))<35)this.kick=Math.min(1,radius*.25);
 }
 disposeGroup(group){this.root.remove(group);group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
 update(w,dt){
  this.world=w;this.root.position.set(-w.x,0,-w.z);this.time+=dt;this.kick=Math.max(0,this.kick-dt*2.4);
  if(dt>0&&w.flying&&w.boosting&&this.time-this.lastWake>.12){this.lastWake=this.time;const ring=new THREE.Mesh(new THREE.RingGeometry(.94,1,36),new THREE.MeshBasicMaterial({color:'#b6eaff',transparent:true,opacity:.25,side:THREE.DoubleSide,depthWrite:false}));ring.position.set(w.x,w.y+.9,w.z);const velocity=new THREE.Vector3(w.vx,w.vy,w.vz).normalize();ring.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),velocity);this.root.add(ring);this.rings.push({mesh:ring,age:0,radius:1.2});}
  for(let i=this.rings.length-1;i>=0;i--){const p=this.rings[i];p.age+=dt;if(p.age>.7){this.disposeGroup(p.mesh);this.rings.splice(i,1);continue;}p.mesh.scale.setScalar(p.radius*(1+p.age*7));p.mesh.material.opacity=.65*(1-p.age/.7);}
  for(let i=this.particles.length-1;i>=0;i--){const p=this.particles[i];p.age+=dt;if(p.age>1.4){this.root.remove(p.mesh);this.particles.splice(i,1);continue;}p.velocity.y-=18*dt;p.mesh.position.addScaledVector(p.velocity,dt);p.mesh.rotation.x+=dt*5;p.mesh.rotation.z+=dt*3;p.mesh.scale.multiplyScalar(Math.exp(-dt*.6));}
 }
 camera(reduced){return reduced?{shake:0,dip:0}:{shake:Math.sin(this.time*91)*this.kick*.15,dip:Math.cos(this.time*67)*this.kick*.1};}
}
