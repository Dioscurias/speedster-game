export function poseHero(animator,model,w){
 const atlas=w.hero==='atlas';model.scale.set(atlas?1.18:1,atlas?1.06:1,atlas?1.14:1);
 model.rotation.x=atlas&&w.flying?-Math.min(1.2,Math.hypot(w.vx,w.vz)/150):0;
 if(atlas&&w.flying){
  animator.bodyBend('Spine',w.boosting?-.8:-.18);
  for(const side of ['Left','Right']){animator.bodyBend(side+'Arm',w.boosting?-2.4:-.45);animator.bodyBend(side+'ForeArm',-.25);animator.bodyBend(side+'UpLeg',.15);}
 }
 if(atlas&&w.punchTime>0){const strike=Math.sin(Math.min(1,w.punchTime/.4)*Math.PI);animator.bodyBend('RightArm',-1.8*strike);animator.bodyBend('RightForeArm',-.5*strike);animator.bodyBend('Spine',.2*strike,'y');}
}
