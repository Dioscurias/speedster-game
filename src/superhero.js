import * as THREE from 'three';
// Quaternius uses Unreal-style joint names; the animation controller exposes
// the same semantic names for locomotion offsets and lightning attachments.
export const HERO_BONES={pelvis:'Hips',spine_01:'Spine',spine_02:'Spine1',spine_03:'Spine2',neck_01:'Neck',Head:'Head',clavicle_l:'LeftShoulder',clavicle_r:'RightShoulder',upperarm_l:'LeftArm',upperarm_r:'RightArm',lowerarm_l:'LeftForeArm',lowerarm_r:'RightForeArm',hand_l:'LeftHand',hand_r:'RightHand',thigh_l:'LeftUpLeg',thigh_r:'RightUpLeg',calf_l:'LeftLeg',calf_r:'RightLeg',foot_l:'LeftFoot',foot_r:'RightFoot'};
const SUIT_RED=new THREE.Color('#a41732');
const PLAYER_COLORS=['#a41732','#285fa8','#6941a5','#b84c24','#177c7c','#d8d4ca','#397042','#b13b76'];
export function speedsterColorForId(id){let hash=0;for(const char of String(id))hash=(hash*31+char.charCodeAt(0))|0;return PLAYER_COLORS[Math.abs(hash)%PLAYER_COLORS.length];}
export function speedsterColorForIndex(index){if(index<PLAYER_COLORS.length)return PLAYER_COLORS[index];return new THREE.Color().setHSL((index*.61803398875)%1,.55,.43).getStyle();}
export function recolorSpeedsterSuit(model,color){
 const target=new THREE.Color(color);
 model.traverse(object=>{
  const attribute=object.isMesh&&object.geometry.attributes.color;if(!attribute)return;
  object.geometry=object.geometry.clone();const colors=object.geometry.attributes.color;
  for(let index=0;index<colors.count;index++){
   const dr=colors.getX(index)-SUIT_RED.r,dg=colors.getY(index)-SUIT_RED.g,db=colors.getZ(index)-SUIT_RED.b;
   if(dr*dr+dg*dg+db*db<.006)colors.setXYZ(index,target.r,target.g,target.b);
  }
  colors.needsUpdate=true;
 });
 return target;
}
export function styleSuperhero(model,{normalMap=null}={}){
 model.updateMatrixWorld(true);
 const red=SUIT_RED,dark=new THREE.Color('#172633'),gold=new THREE.Color('#edc475'),skin=new THREE.Color('#ad7053');
 model.traverse(o=>{
  if(!o.isMesh)return;o.frustumCulled=false;o.castShadow=true;o.receiveShadow=true;
  if(o.name==='Eyebrows'){o.visible=false;return;}
  if(o.name==='Eyes'){o.material=new THREE.MeshStandardMaterial({color:0xfff5da,emissive:0xffc35a,emissiveIntensity:.45,roughness:.25});return;}
  o.skeleton?.update();const colors=[],v=new THREE.Vector3();
  for(let i=0;i<o.geometry.attributes.position.count;i++){
   o.getVertexPosition(i,v);o.localToWorld(v);const x=Math.abs(v.x),y=v.y,z=v.z;
   let color=red;
   if((y>.82&&y<1.28&&x>.16)||(y>.48&&y<.88&&x<.09))color=dark;
   if((y>.92&&y<.98)||(y>.29&&y<.35)||(x>.58&&x<.63&&y>1.3))color=gold;
   if(y<.29||x>.63&&y>1.3)color=dark;
   if(y>1.27&&y<1.51&&z>.07&&Math.abs(y-(1.31+x*.48))<.024)color=gold;
   if(y>.35&&y<.91&&Math.abs(x-(.105+(y-.35)*.07))<.012)color=gold;
   if(y>1.72&&x>.045&&x<.062)color=gold;
   // Cowl exposes the lower face, while retaining the hero's sculpted features.
   if(y>1.59&&y<1.685&&z>.055)color=skin;
   colors.push(color.r,color.g,color.b);
  }
  o.geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  o.material=new THREE.MeshPhysicalMaterial({vertexColors:true,normalMap,normalScale:new THREE.Vector2(.4,.4),metalness:.12,roughness:.48,clearcoat:.28,clearcoatRoughness:.38});
  o.material.onBeforeCompile=shader=>{
   shader.vertexShader='varying vec2 vFabricUV;\n'+shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nvFabricUV=uv;');
   shader.fragmentShader='varying vec2 vFabricUV;\n'+shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nfloat fabricFade=1.-smoothstep(.001,.005,max(fwidth(vFabricUV.x),fwidth(vFabricUV.y)));\nfloat weave=sin(vFabricUV.x*1800.)*sin(vFabricUV.y*1800.);\nroughnessFactor=clamp(roughnessFactor+weave*.07*fabricFade,.2,1.);\ndiffuseColor.rgb*=1.+weave*.035*fabricFade;');
  };o.material.customProgramCacheKey=()=> 'speedster-woven-suit-v1';
 });
 const chest=model.getObjectByName('spine_03'),head=model.getObjectByName('Head');
 const emblem=new THREE.Group(),disc=new THREE.Mesh(new THREE.CylinderGeometry(.092,.092,.012,32),new THREE.MeshStandardMaterial({color:0x241628,metalness:.6,roughness:.3}));disc.rotation.x=Math.PI/2;emblem.add(disc);
 const shape=new THREE.Shape();shape.moveTo(.027,.077);shape.lineTo(-.04,-.007);shape.lineTo(-.007,-.007);shape.lineTo(-.027,-.078);shape.lineTo(.049,.022);shape.lineTo(.012,.022);shape.closePath();
 const bolt=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshStandardMaterial({color:0xffd35a,emissive:0xffa020,emissiveIntensity:.4,side:THREE.DoubleSide}));bolt.position.z=.009;emblem.add(bolt);emblem.position.set(0,1.43,.134);model.add(emblem);chest.attach(emblem);
 for(const sign of [-1,1]){const fin=new THREE.Mesh(new THREE.ConeGeometry(.021,.1,6),new THREE.MeshStandardMaterial({color:0xffbf42,metalness:.65,roughness:.3}));fin.position.set(sign*.102,1.71,-.005);fin.rotation.z=-sign*.6;model.add(fin);head.attach(fin);}
 // The downloaded character faces +Z; the game's visual forward is -Z.
 model.rotation.y=Math.PI;
}
