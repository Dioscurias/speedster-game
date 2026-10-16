import {projects,contact} from '../data/projects.ts';
import {resolveRoute,filterProjects,GAME_PATH} from './project-model.js';
import {renderPage} from './pages.js';
import {wireDialog} from '../ui/components.js';
import {mountLabMotion} from './motion.js';
import {mountIntro} from './intro.js';

document.body.classList.add('manta-site','manta-lab');
if(!document.getElementById('main-content'))document.body.innerHTML=renderPage(location.pathname);
const motion=mountLabMotion(),navigation=document.getElementById('navigation-dialog');wireDialog(navigation);
const destroyIntro=mountIntro(motion);
document.getElementById('open-navigation').onclick=()=>{motion.stop();navigation.showModal();};
navigation.addEventListener('close',()=>{if(!document.body.classList.contains('playing-game'))motion.start();});navigation.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>navigation.close()));

const filter=document.querySelector('.filter-segmented');
if(filter){
 const buttons=[...filter.querySelectorAll('button')],rows=[...document.querySelectorAll('[data-project-row]')];
 function select(button){const visible=new Set(filterProjects(projects,button.dataset.statusFilter).map(project=>project.slug));
  filter.style.setProperty('--filter-index',buttons.indexOf(button));buttons.forEach(node=>node.setAttribute('aria-pressed',String(node===button)));
  rows.forEach(row=>row.hidden=!visible.has(row.getAttribute('href').split('/').at(-1)));document.querySelector('[data-project-count]').textContent=`${String(visible.size).padStart(2,'0')} projects`;document.querySelector('.filter-empty').hidden=visible.size!==0;motion.refresh();
 }
 buttons.forEach((button,index)=>{button.onclick=()=>select(button);button.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(index+1)%buttons.length;if(event.key==='ArrowLeft')next=(index-1+buttons.length)%buttons.length;if(event.key==='Home')next=0;if(event.key==='End')next=buttons.length-1;if(next!==undefined){event.preventDefault();buttons[next].focus();select(buttons[next]);}});});
}

const copy=document.querySelector('.copy-email');if(copy)copy.onclick=async()=>{const message=document.querySelector('.copy-status');try{await navigator.clipboard.writeText(contact.email);message.textContent='Copied';}catch{message.textContent='Select and copy the email.';}};
const preview=document.querySelector('[data-live-preview]');let previewObserver;
if(preview){previewObserver=new IntersectionObserver(entries=>{for(const entry of entries){const slot=preview.querySelector('.preview-slot');if(entry.isIntersecting&&!slot.firstChild){const frame=document.createElement('iframe');frame.title='Speedster live preview';frame.tabIndex=-1;frame.setAttribute('aria-hidden','true');frame.src=GAME_PATH+'?embed=1&preview=1&map=austin';slot.append(frame);}else if(!entry.isIntersecting)slot.replaceChildren();}},{rootMargin:'250px'});previewObserver.observe(preview);}
document.querySelectorAll('.project-row video').forEach(video=>{const row=video.closest('.project-row');row.addEventListener('mouseenter',()=>{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)video.play().catch(()=>{});});row.addEventListener('mouseleave',()=>video.pause());});
let destroyPlayer;if(resolveRoute(location.pathname).type==='play'){const {mountPlayer}=await import('../game/player.js');destroyPlayer=mountPlayer(motion);}
window.addEventListener('pagehide',()=>{destroyIntro();motion.destroy();previewObserver?.disconnect();destroyPlayer?.();},{once:true});
