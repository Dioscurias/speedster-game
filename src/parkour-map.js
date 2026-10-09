import * as THREE from 'three';
export function buildParkourMap(scene,course){
 const root=new THREE.Group();scene.add(root);const geometry=new THREE.BoxGeometry(1,1,1);
 const concrete=new THREE.MeshStandardMaterial({color:'#c99470',roughness:.96}),monument=new THREE.MeshStandardMaterial({color:'#936d64',roughness:1}),sand=new THREE.MeshStandardMaterial({color:'#b7422e',roughness:1});
 const box=(x,y,z,w,h,d,material=monument)=>{const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);return mesh;};
 const decks=course.platforms.map(p=>{const group=new THREE.Group();root.add(group);const material=concrete.clone();const mesh=new THREE.Mesh(geometry,material);mesh.scale.set(p.width,2,p.depth);mesh.position.y=-1;mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);for(const sign of [-1,1]){const edge=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:'#e7b090'}));edge.scale.set(.07,.025,p.depth);edge.position.set(sign*(p.width/2-.08),.015,0);edge.userData.blastSolid=false;group.add(edge);}return {group,material};});

 box(0,-62,-160,1800,4,1800,sand);box(-125,-42,-150,40,36,460);box(125,-42,-150,40,36,460);
 // Towering everyday objects outside the playable corridor.
 for(const dx of [-58,58])for(const dz of [-58,58])box(-95+dx,-15,-95+dz,12,90,12);
 box(-95,36,-95,140,12,140);box(-95,81,-159,140,78,12);
 const driftingBooks=[];for(let i=0;i<3;i++){const group=new THREE.Group();group.position.set(70+i*28,-5,-150-i*12);root.add(group);group.attach(box(70+i*28,-5,-150-i*12,16,110,75));for(let j=0;j<6;j++)group.attach(box(70+i*28,10+j*7,-111-i*12,14,.5,.5,concrete));driftingBooks.push(group);}
 const finish=course.finish;box(0,150,finish.z-350,280,420,180);const floatingRoof=box(0,155,finish.z-5,320,35,160);
 // Repeated seams make the distant facade's scale legible.
 for(let i=-6;i<=6;i++)box(i*20,150,finish.z-259.8,.35,420,.3,concrete);
 const glow=new THREE.MeshBasicMaterial({color:'#ffe69a'});
 box(-2.3,finish.top+3,finish.z,.6,6,.6,glow);box(2.3,finish.top+3,finish.z,.6,6,.6,glow);box(0,finish.top+6.3,finish.z,5.2,.6,.6,glow);
 const orbGeometry=new THREE.SphereGeometry(.22,12,8),orbMeshes=course.orbs.map(o=>{const mesh=new THREE.Mesh(orbGeometry,glow);mesh.position.set(o.x,o.y,o.z);mesh.userData.blastSolid=false;root.add(mesh);return mesh;});
 const rings=course.checkpoints.map(p=>{const mesh=new THREE.Mesh(new THREE.RingGeometry(.7,.85,32),new THREE.MeshBasicMaterial({color:'#4acfff',side:THREE.DoubleSide}));mesh.rotation.x=-Math.PI/2;mesh.position.set(0,p.top+.025,p.z);mesh.userData.blastSolid=false;root.add(mesh);return mesh;});
 const bounds=new THREE.Box3(),capsuleBounds=new THREE.Box3();
 function blockedVolume(x,y,z,r,height){root.updateMatrixWorld(true);capsuleBounds.min.set(x+root.position.x-r,y+.04,z+root.position.z-r);capsuleBounds.max.set(x+root.position.x+r,y+height,z+root.position.z+r);let blocked=false;root.traverse(o=>{if(!blocked&&o.isMesh&&o.userData.blastSolid!==false&&o.visible){bounds.setFromObject(o);if(bounds.intersectsBox(capsuleBounds))blocked=true;}});return blocked;}
 return {root,blockedVolume,update(w,time,zone){root.position.set(-w.x,0,-w.z);decks.forEach(({group,material},i)=>{const p=course.platforms[i];group.position.set(p.x,p.top,p.z);group.rotation.y=p.angle;material.color.set(p.warning>0?'#ff7049':'#c99470');material.emissive.set('#ff481e');material.emissiveIntensity=p.warning*(.3+.25*Math.sin(course.motionTime*18));});driftingBooks.forEach((book,i)=>{book.rotation.z=.015*Math.sin(course.motionTime*.07+i);book.position.y=-5+2*Math.sin(course.motionTime*.09+i);});floatingRoof.position.y=155+5*Math.sin(course.motionTime*.08);floatingRoof.rotation.z=.025*Math.sin(course.motionTime*.06);orbMeshes.forEach((mesh,i)=>{mesh.visible=!course.orbs[i].collected;mesh.position.set(course.orbs[i].x,course.orbs[i].y+Math.sin(time*2.5+i)*.12,course.orbs[i].z);});rings.forEach((r,i)=>r.material.color.set(i<zone?'#a9ffc7':'#4acfff'));}};
}
