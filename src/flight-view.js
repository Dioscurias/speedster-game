import * as THREE from 'three';

const flightAltitude = altitude => THREE.MathUtils.smoothstep(altitude,25,125);
const horizon = new THREE.Color('#b9d4e7');

export function createAustinSky(scene,camera,sun){
 const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,20,12),new THREE.ShaderMaterial({
  side:THREE.BackSide,depthWrite:false,depthTest:false,toneMapped:false,
  uniforms:{horizon:{value:horizon},zenith:{value:new THREE.Color('#38679c')},
   altitude:{value:0},height:{value:0},origin:{value:new THREE.Vector2()},sunDirection:{value:sun.position.clone().normalize()}},
  vertexShader:`varying vec3 ray;
   void main(){ray=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`varying vec3 ray;
   uniform vec3 horizon,zenith,sunDirection;
   uniform float altitude,height;
   uniform vec2 origin;
   float cloud(vec3 dir, float layer, vec2 center, vec2 radius){
    if(dir.y<.025 || height>=layer)return 0.;
    vec2 p=(dir.xz*((layer-height)/dir.y)+origin-center)/radius;
    float shape=1.-length(p)+.12*cos(p.x*7.)+.08*cos(p.y*12.+p.x*5.);
    return smoothstep(0.,.44,shape)*smoothstep(.025,.13,dir.y);
   }
   void main(){
    vec3 dir=normalize(ray);
    float above=smoothstep(.015,.56,dir.y);
    vec3 color=mix(horizon,zenith,above*altitude);
    float towardSun=max(0.,dot(dir,sunDirection));
    color+=vec3(1.,.72,.41)*altitude*(.15*pow(towardSun,40.)+.88*smoothstep(.9995,.99985,towardSun));
    float clouds=max(cloud(dir,190.,vec2(-430.,-440.),vec2(280.,90.)),
     max(cloud(dir,325.,vec2(520.,-640.),vec2(320.,130.)),cloud(dir,460.,vec2(150.,810.),vec2(440.,120.))));
    color=mix(color,vec3(.89,.93,.99),clouds*altitude*.62);
    gl_FragColor=vec4(color,1.);
    #include <colorspace_fragment>
   }`
 }));
 mesh.frustumCulled=false;
 mesh.renderOrder=-1000;
 mesh.visible=false;
 scene.add(mesh);
 return (world,altitude)=>{
  const fade=flightAltitude(altitude);
  mesh.visible=fade>0;
  mesh.position.copy(camera.position);
  mesh.scale.setScalar(camera.far*.9);
  mesh.material.uniforms.altitude.value=fade;
  mesh.material.uniforms.height.value=camera.position.y;
  mesh.material.uniforms.origin.value.set(world.x+camera.position.x,world.z+camera.position.z);
  scene.fog.density=THREE.MathUtils.lerp(.00165,.00024,THREE.MathUtils.smoothstep(altitude,25,300));
  const far=THREE.MathUtils.lerp(1800,4200,fade);
  if(camera.far!==far){camera.far=far;camera.updateProjectionMatrix();}
 };
}
