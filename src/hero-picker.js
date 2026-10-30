import {selectedHero} from './hero-controls.js';
import './hero-picker.css';

export function mountHeroPicker({loader,menu,shell,getState,parkour}){
 const selectors=[];
 const create=(parent,id)=>{
  const field=document.createElement('label');field.className='hero-picker';field.htmlFor=id;field.innerHTML=`<span>Choose your character</span><select id="${id}"><option value="speedster">Speedster — speed & ${parkour?'agility':'phase'}</option><option value="atlas">Atlas — flight & superstrength</option></select><small>Atlas: R flight · Space / C altitude · Shift boost · B brake · V punch · X slam${parkour?' · E blink · F / RMB blast':''}</small>`;
  parent.prepend(field);const select=field.querySelector('select');select.value=selectedHero();selectors.push(select);
  select.onchange=()=>{for(const s of selectors)s.value=select.value;window.dispatchEvent(new CustomEvent('speedster:hero',{detail:select.value}));};
 };
 create(loader,'join-hero');create(menu,'menu-hero');
 const bar=document.createElement('section');bar.className='hero-actions';bar.setAttribute('aria-label','Atlas abilities');
 bar.innerHTML='<span class="hero-status">ATLAS <b data-altitude>0 m</b></span><button data-hero-key="r">R <span>Fly</span></button><button data-hero-key=" ">↑ <span>Rise</span></button><button data-hero-key="c">C <span>Descend</span></button><button data-hero-key="shift">⇧ <span>Boost</span></button><button data-hero-key="b">B <span>Brake</span></button><button data-hero-key="v">V <span>Punch</span></button><button data-hero-key="x">X <span>Slam</span></button>';
 if(parkour)bar.insertAdjacentHTML('beforeend','<button data-hero-key="e">E <span>Blink</span></button><button data-hero-key="f">F <span>Hold blast</span></button>');
 shell.append(bar);
 for(const button of bar.querySelectorAll('button')){
  const key=button.dataset.heroKey;button.onpointerdown=e=>{e.preventDefault();button.setPointerCapture(e.pointerId);window.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true}));};
  for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,()=>window.dispatchEvent(new KeyboardEvent('keyup',{key,bubbles:true})));
 }
 return {update(){const w=getState();bar.hidden=!w||w.hero!=='atlas'||w.status!=='running';if(!w)return;const atlas=w.hero==='atlas';shell.classList.toggle('atlas-selected',atlas);bar.querySelector('[data-altitude]').textContent=`${w.boostExhausted?'RELEASE SHIFT':w.slamming?'SLAM':w.airBraking?'BRAKE':w.flying?'FLIGHT':'GROUNDED'} · ${Math.round(w.y)} m`;bar.querySelector('[data-hero-key="r"]').setAttribute('aria-pressed',String(!!w.flying));bar.querySelector('[data-hero-key="b"]').setAttribute('aria-pressed',String(!!w.airBraking));for(const select of selectors){select.disabled=!w.hero;select.value=w.hero||selectedHero();}}};
}
