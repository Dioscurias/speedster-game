export class HudFeed{
 constructor(){this.entries=[];this.sequence=0;}
 push(message,now,key){
  this.read(now);const existing=this.entries.find(entry=>(key!==undefined&&entry.key===key)||entry.message===message);
  if(existing){existing.message=message;existing.time=now;existing.key=key??existing.key;}
  else this.entries.push({id:++this.sequence,message,key,time:now});
  this.entries=this.entries.slice(-4);
 }
 read(now){this.entries=this.entries.filter(entry=>now-entry.time<4500);return this.entries.map(entry=>({...entry,opacity:Math.min(1,(4500-now+entry.time)/1000)}));}
 clear(){this.entries=[];}
}
