import Lenis from 'lenis';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
export function mountSiteMotion(){
 const media=gsap.matchMedia(),header=document.querySelector('.site-header'),track=document.querySelector('.rolling-track');
 let lenis,verbTimer,previousY=0,stopped=false,ticker;
 const updateHeader=()=>{const y=window.scrollY;header.classList.toggle('is-sticky',y>80);header.classList.toggle('is-hidden',y>180&&y>previousY+1);previousY=y;};
 window.addEventListener('scroll',updateHeader,{passive:true});
 media.add('(prefers-reduced-motion: no-preference)',()=>{
  lenis=new Lenis({duration:1.05,smoothWheel:true,anchors:true,prevent:node=>node.closest('dialog')});
  lenis.on('scroll',ScrollTrigger.update);ticker=time=>lenis.raf(time*1000);gsap.ticker.add(ticker);if(stopped)lenis.stop();
  let index=0;verbTimer=setInterval(()=>{if(document.hidden||stopped)return;index=(index+1)%4;track.style.transform=`translateY(-${index*20}%)`;},2800);
  gsap.fromTo('.manifesto p span',{opacity:.16},{opacity:1,stagger:1,ease:'none',scrollTrigger:{trigger:'.manifesto',start:'top 78%',end:'bottom 45%',scrub:true}});
  gsap.utils.toArray('[data-reveal]').forEach(row=>gsap.fromTo(row,{opacity:.25,y:14},{opacity:1,y:0,duration:.6,scrollTrigger:{trigger:row,start:'top 88%',once:true}}));
  gsap.utils.toArray('.map-row').forEach(row=>{const rule=document.createElement('span');rule.className='animated-rule';rule.setAttribute('aria-hidden','true');rule.style.cssText='position:absolute;left:0;right:0;top:0;height:1px;background:var(--line);transform-origin:left;pointer-events:none';row.append(rule);gsap.fromTo(rule,{scaleX:0},{scaleX:1,duration:.9,ease:'power2.out',scrollTrigger:{trigger:row,start:'top 90%',once:true}});});
  const pinMedia=gsap.matchMedia();
  pinMedia.add('(min-width: 901px)',()=>{
   document.querySelector('.how-section').classList.add('has-motion');
   const steps=[...document.querySelectorAll('.how-step')],bars=[...document.querySelectorAll('.step-progress button>span')];
   const trigger=ScrollTrigger.create({trigger:'.how-layout',pin:true,start:'top 15%',end:'+=1800',onUpdate:self=>{
    const at=Math.min(3,Math.floor(self.progress*4));document.querySelector('.step-counter').textContent=`0${at+1} / 04`;
    steps.forEach((step,i)=>{step.style.opacity=i===at?'1':'0';step.style.transform=`translateY(${i===at?0:12}px)`;});bars.forEach((bar,i)=>bar.style.transform=`scaleX(${Math.min(1,Math.max(0,self.progress*4-i))})`);
   }});
   document.querySelectorAll('[data-step-index]').forEach(node=>node.onclick=()=>lenis.scrollTo(trigger.start+(Number(node.dataset.stepIndex)+.1)/4*(trigger.end-trigger.start)));
   return ()=>{document.querySelector('.how-section').classList.remove('has-motion');document.querySelectorAll('[data-step-index]').forEach(node=>node.onclick=null);steps.forEach(step=>{step.style.opacity='';step.style.transform='';});};
  });
  return ()=>{clearInterval(verbTimer);gsap.ticker.remove(ticker);lenis.destroy();lenis=null;pinMedia.revert();track.style.transform='';document.querySelectorAll('.animated-rule').forEach(rule=>rule.remove());};
 });
 return {stop(){stopped=true;lenis?.stop();},start(){stopped=false;lenis?.start();ScrollTrigger.refresh();},destroy(){media.revert();window.removeEventListener('scroll',updateHeader);}};
}
