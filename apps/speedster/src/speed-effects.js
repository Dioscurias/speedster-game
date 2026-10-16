// Simulation-time effects never alter the collision body or the camera.
export function phaseVibration(time,active){return active?{x:Math.sin(time*163)*.075+Math.sin(time*251)*.018,y:Math.sin(time*193)*.015,z:Math.cos(time*179)*.042}:{x:0,y:0,z:0};}
export class LightningHistory{
 constructor(){this.samples=[];}
 reset(){this.samples.length=0;}
 sample(time,anchors){
  const last=this.samples[0];if(last&&time===last.time)return;
  if(last&&(time<last.time||Math.hypot(anchors[0].x-last.anchors[0].x,anchors[0].y-last.anchors[0].y,anchors[0].z-last.anchors[0].z)>Math.max(12,(time-last.time)*320)))this.reset();
  this.samples.unshift({time,anchors:anchors.map(p=>({...p}))});
  this.samples=this.samples.filter(s=>time-s.time<=.24).slice(0,32);
 }
 points(index,time){return this.samples.filter(s=>time-s.time<=.24).map(s=>s.anchors[index]);}
}
