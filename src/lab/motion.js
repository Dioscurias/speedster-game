export function mountLabMotion(){
 const header=document.querySelector('.site-header'),reduced=matchMedia('(prefers-reduced-motion: reduce)');let stopped=false;
 const nodes=[...document.querySelectorAll('[data-reveal]')],waiting=new Set();
 const show=node=>{node.classList.add('is-revealed');node.classList.remove('will-reveal');};
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;if(stopped){waiting.add(entry.target);continue;}show(entry.target);observer.unobserve(entry.target);}},{threshold:.08});
 for(const node of nodes){if(reduced.matches)show(node);else{node.classList.add('will-reveal');observer.observe(node);}}
 const updateHeader=()=>header?.classList.toggle('is-sticky',window.scrollY>24);
 const reduce=()=>{if(reduced.matches){nodes.forEach(show);observer.disconnect();}};
 window.addEventListener('scroll',updateHeader,{passive:true});reduced.addEventListener('change',reduce);updateHeader();
 return {stop(){stopped=true;},start(){stopped=false;waiting.forEach(node=>{show(node);observer.unobserve(node);});waiting.clear();},refresh(){},destroy(){observer.disconnect();window.removeEventListener('scroll',updateHeader);reduced.removeEventListener('change',reduce);}};
}
