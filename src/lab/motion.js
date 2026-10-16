import Lenis from 'lenis';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {mountPlankton} from './particles.js';
gsap.registerPlugin(ScrollTrigger);

export function mountLabMotion(){
 const media=gsap.matchMedia(),header=document.querySelector('.site-header'),track=document.querySelector('.rolling-track'),destroyParticles=mountPlankton(document.querySelector('.plankton-canvas'));
 let lenis,ticker,verbTimer,previousY=window.scrollY,stopped=false;
 const updateHeader=()=>{const y=window.scrollY;header.classList.toggle('is-sticky',y>80);header.classList.toggle('is-hidden',y>180&&y>previousY+1);previousY=y;};
 window.addEventListener('scroll',updateHeader,{passive:true});
 media.add('(prefers-reduced-motion: no-preference)',()=>{
  lenis=new Lenis({duration:1.05,smoothWheel:true,anchors:true,prevent:node=>!!node.closest('dialog,.project-filter-scroll')});lenis.on('scroll',ScrollTrigger.update);ticker=time=>lenis.raf(time*1000);gsap.ticker.add(ticker);if(stopped)lenis.stop();
  if(track){let index=0;verbTimer=setInterval(()=>{if(stopped||document.hidden)return;index=(index+1)%4;track.style.transform=`translateY(-${index*20}%)`;},2800);}
  for(const section of document.querySelectorAll('.manifesto'))gsap.fromTo(section.querySelectorAll('p span'),{opacity:.16},{opacity:1,stagger:1,ease:'none',scrollTrigger:{trigger:section,start:'top 78%',end:'bottom 45%',scrub:true}});
  document.querySelectorAll('.project-rows').forEach(rows=>rows.classList.add('has-rules'));
  for(const rule of document.querySelectorAll('.row-rule'))gsap.fromTo(rule,{scaleX:0},{scaleX:1,duration:.8,ease:'power2.out',scrollTrigger:{trigger:rule.parentElement,start:'top 90%',once:true}});
  const dots=document.querySelectorAll('.stage-dot');if(dots.length)gsap.fromTo(dots,{opacity:0,scale:0},{opacity:1,scale:1,duration:.45,stagger:.12,scrollTrigger:{trigger:'.stage-track',start:'top 85%',once:true}});
  const pins=gsap.matchMedia();pins.add('(min-width: 901px) and (min-height: 650px)',()=>{
   const featured=document.querySelector('.featured-layout');if(!featured)return;
   ScrollTrigger.create({trigger:featured,pin:true,start:'top 16%',end:'+=1000',onUpdate:self=>{featured.querySelectorAll('.featured-progress span').forEach((bar,index)=>bar.style.setProperty('--feature-progress',Math.max(0,Math.min(1,self.progress*3-index))));}});
  });
  return ()=>{clearInterval(verbTimer);gsap.ticker.remove(ticker);lenis.destroy();lenis=null;pins.revert();if(track)track.style.transform='';document.querySelectorAll('.project-rows').forEach(rows=>rows.classList.remove('has-rules'));};
 });
 return {stop(){stopped=true;lenis?.stop();},start(){stopped=false;lenis?.start();},refresh(){ScrollTrigger.refresh();},destroy(){media.revert();destroyParticles();window.removeEventListener('scroll',updateHeader);}};
}
