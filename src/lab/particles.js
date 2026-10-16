export function mountPlankton(canvas){
 if(!canvas)return ()=>{};
 const context=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let width=1,height=1,particles=[],visible=true,frame=0,last=0,clock=0;
 function paint(){
  const dpr=Math.min(devicePixelRatio||1,1.5);context.setTransform(dpr,0,0,dpr,0,0);context.clearRect(0,0,width,height);context.fillStyle='#5cb4ff';
  for(const p of particles){const x=(p.x*width+Math.sin(clock*.1+p.seed)*10+clock*p.speed*.3)%width,y=(p.y*height-clock*p.speed+Math.sin(clock*.16+p.seed)*5+height*100)%height;context.globalAlpha=p.opacity+(reduced.matches?0:Math.sin(clock*.5+p.seed)*.04);context.beginPath();context.arc(x,y,p.radius,0,Math.PI*2);context.fill();}
  context.globalAlpha=1;
 }
 function tick(now){frame=0;clock+=Math.min(.05,(now-(last||now))/1000);last=now;paint();if(visible&&!document.hidden&&!reduced.matches)frame=requestAnimationFrame(tick);}
 function sync(){cancelAnimationFrame(frame);frame=0;last=0;paint();if(visible&&!document.hidden&&!reduced.matches)frame=requestAnimationFrame(tick);}
 const resize=new ResizeObserver(()=>{
  const rect=canvas.getBoundingClientRect();width=Math.max(1,rect.width);height=Math.max(1,rect.height);const ratio=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
  particles=Array.from({length:Math.min(80,Math.max(26,Math.round(width*height/18000)))},()=>({x:Math.random(),y:Math.random(),seed:Math.random()*10,speed:.5+Math.random()*2,radius:.35+Math.random()*1.1,opacity:.08+Math.random()*.2}));sync();
 });resize.observe(canvas);
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();});observer.observe(canvas);
 reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
 return ()=>{cancelAnimationFrame(frame);resize.disconnect();observer.disconnect();reduced.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);};
}
