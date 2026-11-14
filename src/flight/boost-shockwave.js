import * as THREE from 'three';

const normal=new THREE.Vector3(0,0,1);
const lifetime=.48;

export function createBoostShockwave(scene){
 const ring=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({
  transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,
  uniforms:{age:{value:0}},
  vertexShader:`
   varying vec2 point;
   void main(){
    point=uv*2.-1.;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
   }`,
  fragmentShader:`
   varying vec2 point;
   uniform float age;
   void main(){
    float angle=atan(point.y,point.x);
    float r=length(point)+.012*sin(9.*angle+5.*age)+.006*sin(19.*angle);
    float rim=exp(-pow(abs(r-.84)/.021,2.));
    float mist=exp(-pow(abs(r-.78)/.086,2.));
    float front=exp(-pow(abs(r-.56)/.014,2.));
    float breakup=.82+.18*sin(7.*angle-5.*age);
    float alpha=(rim*.79+mist*.37+front*.23)*breakup*pow(1.-age,1.3);
    gl_FragColor=vec4(mix(vec3(.46,.73,.9),vec3(1.),rim),alpha);
    #include <colorspace_fragment>
   }`
 }));
 ring.name='Atlas boost shockwave';
 ring.visible=false;
 scene.add(ring);

 const origin=new THREE.Vector3(),velocity=new THREE.Vector3(),direction=new THREE.Vector3();
 let age=lifetime,lastTime=0;
 function start(world,yaw,reducedMotion){
  if(reducedMotion)return;
  age=0;
  lastTime=world.worldTime;
  velocity.set(world.vx,world.vy,world.vz);
  direction.copy(velocity);
  if(direction.lengthSq()<1)direction.set(Math.sin(yaw),0,-Math.cos(yaw));
  direction.normalize();
  velocity.multiplyScalar(.91);
  origin.set(world.x,world.y+.85,world.z).addScaledVector(direction,1.4);
  ring.quaternion.setFromUnitVectors(normal,direction);
 }
 function update(world,dt,reducedMotion){
  if(reducedMotion||world.hero!=='atlas'||world.status==='ready'||world.status==='dead'||world.worldTime<lastTime){
   age=lifetime;ring.visible=false;
  }
  lastTime=world.worldTime;
  if(reducedMotion||world.hero!=='atlas'||world.status!=='running')return;
  ring.visible=age<lifetime;
  if(!ring.visible)return;
  const progress=age/lifetime;
  ring.position.copy(origin).addScaledVector(velocity,age);
  ring.position.x-=world.x;
  ring.position.z-=world.z;
  ring.scale.setScalar(1.15+8*Math.pow(progress,.62));
  ring.material.uniforms.age.value=progress;
  age+=dt;
 }
 return {start,update};
}
