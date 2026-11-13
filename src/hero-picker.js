import {selectedHero} from './hero-controls.js';
import './hero-picker.css';

export function mountHeroPicker({loader,menu,getState,parkour}){
 const selectors=[];
 const create=(parent,id)=>{
  const field=document.createElement('label');field.className='hero-picker';field.htmlFor=id;field.innerHTML=`<span>Choose your character</span><select id="${id}"><option value="speedster">Speedster — speed & ${parkour?'agility':'phase'}</option><option value="atlas">Atlas — flight & superstrength</option></select><small>Atlas: R flight · Space / C altitude · Shift boost · B brake · V punch · X slam${parkour?' · E blink · F / RMB blast':''}</small>`;
  parent.prepend(field);const select=field.querySelector('select');select.value=selectedHero();selectors.push(select);
  select.onchange=()=>{for(const s of selectors)s.value=select.value;window.dispatchEvent(new CustomEvent('speedster:hero',{detail:select.value}));};
 };
 create(loader,'join-hero');create(menu,'menu-hero');
 return {update(w=getState()){if(!w)return;for(const select of selectors){select.disabled=!w.hero;select.value=w.hero||selectedHero();}}};
}
