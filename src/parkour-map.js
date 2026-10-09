import * as THREE from 'three';
export function buildParkourMap(scene,course){
 const root=new THREE.Group();scene.add(root);const geometry=new THREE.BoxGeometry(1,1,1);
 const concrete=new THREE.MeshStandardMaterial({color:'#c99470',roughness:.96}),monument=new THREE.MeshStandardMaterial({color:'#936d64',roughness:1}),sand=new THREE.MeshStandardMaterial({color:'#b7422e',roughness:1});
 const box=(x,y,z,w,h,d,material=monument)=>{const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);return mesh;};
 for(const p of course.platforms){box(0,(p.top-60)/2,p.z,p.width,p.top+60,p.depth,concrete);for(const sign of [-1,1])box(sign*(p.width/2-.08),p.top+.015,p.z,.07,.025,p.depth,new THREE.MeshBasicMaterial({color:'#e7b090'}));}
 box(0,-62,-160,1800,4,1800,sand);box(-125,-42,-150,40,36,460);box(125,-42,-150,40,36,460);
 // Towering everyday objects outside the playable corridor.
 for(const dx of [-58,58])for(const dz of [-58,58])box(-95+dx,-15,-95+dz,12,90,12);
 box(-95,36,-95,140,12,140);box(-95,81,-159,140,78,12);
 for(let i=0;i<3;i++){box(70+i*28,-5,-150-i*12,16,110,75);for(let j=0;j<6;j++)box(70+i*28,10+j*7,-111-i*12,14,.5,.5,concrete);}
 const finish=course.finish;box(0,150,finish.z-350,280,420,180);box(0,155,finish.z-5,320,35,160);
 // Repeated seams make the distant facade's scale legible.
 for(let i=-6;i<=6;i++)box(i*20,150,finish.z-259.8,.35,420,.3,concrete);
 const glow=new THREE.MeshBasicMaterial({color:'#ffe69a'});
 box(-2.3,finish.top+3,finish.z,.6,6,.6,glow);box(2.3,finish.top+3,finish.z,.6,6,.6,glow);box(0,finish.top+6.3,finish.z,5.2,.6,.6,glow);
 const orbGeometry=new THREE.SphereGeometry(.22,12,8),orbMeshes=course.orbs.map(o=>{const mesh=new THREE.Mesh(orbGeometry,glow);mesh.position.set(o.x,o.y,o.z);root.add(mesh);return mesh;});
 const rings=course.checkpoints.map(p=>{const mesh=new THREE.Mesh(new THREE.RingGeometry(.7,.85,32),new THREE.MeshBasicMaterial({color:'#4acfff',side:THREE.DoubleSide}));mesh.rotation.x=-Math.PI/2;mesh.position.set(0,p.top+.025,p.z);root.add(mesh);return mesh;});
 return {root,update(w,time,zone){root.position.set(-w.x,0,-w.z);orbMeshes.forEach((mesh,i)=>{mesh.visible=!course.orbs[i].collected;mesh.position.y=course.orbs[i].y+Math.sin(time*2.5+i)*.12;});rings.forEach((r,i)=>r.material.color.set(i<zone?'#a9ffc7':'#4acfff'));}};
}
