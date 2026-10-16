import {projects} from '../data/projects.ts';
import {resolveRoute,filterProjects} from './project-model.js';
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
 function select(button){const visible=new Set(filterProjects(projects,button.dataset.statusFilter).map(project=>project.slug));buttons.forEach(node=>node.setAttribute('aria-pressed',String(node===button)));rows.forEach(row=>row.hidden=!visible.has(row.getAttribute('href').split('/').at(-1)));document.querySelector('[data-project-count]').textContent=`${String(visible.size).padStart(2,'0')} projects`;document.querySelector('.filter-empty').hidden=visible.size!==0;}
 buttons.forEach((button,index)=>{button.onclick=()=>select(button);button.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(index+1)%buttons.length;if(event.key==='ArrowLeft')next=(index-1+buttons.length)%buttons.length;if(event.key==='Home')next=0;if(event.key==='End')next=buttons.length-1;if(next!==undefined){event.preventDefault();buttons[next].focus();select(buttons[next]);}});});
}
// The poster is the first paint. Video is optional and never blocks navigation.
const videos=[...document.querySelectorAll('[data-gameplay-video]')],visible=new Set(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
let mediaTimer;
function playVisible(){
 if(document.documentElement.classList.contains('intro-active')||document.hidden)return;
 for(const video of visible){if(reduced.matches||navigator.connection?.saveData){video.pause();continue;}if(!video.hasAttribute('src'))video.src=matchMedia('(max-width: 600px)').matches&&video.dataset.mobileSrc?video.dataset.mobileSrc:video.dataset.src;video.play().catch(()=>{});}
}
const mediaObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting)visible.add(entry.target);else{visible.delete(entry.target);entry.target.pause();}}clearTimeout(mediaTimer);mediaTimer=setTimeout(playVisible,500);},{threshold:.12});
for(const video of videos){video.addEventListener('playing',()=>video.classList.add('is-playing'));video.addEventListener('error',()=>{video.classList.remove('is-playing');video.pause();});mediaObserver.observe(video);}
const introObserver=new MutationObserver(playVisible);introObserver.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
const visibility=()=>{if(document.hidden)videos.forEach(video=>video.pause());else playVisible();};
const reduce=()=>{if(reduced.matches)videos.forEach(video=>{video.pause();video.classList.remove('is-playing');});else playVisible();};
document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',reduce);
let destroyPlayer;if(resolveRoute(location.pathname).type==='play'){const {mountPlayer}=await import('../game/player.js');destroyPlayer=mountPlayer(motion);}
window.addEventListener('pagehide',()=>{clearTimeout(mediaTimer);destroyIntro();motion.destroy();mediaObserver.disconnect();introObserver.disconnect();videos.forEach(video=>video.pause());document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',reduce);destroyPlayer?.();},{once:true});
