import arrow from '@phosphor-icons/core/assets/regular/arrow-up-right.svg?raw';
import pause from '@phosphor-icons/core/assets/regular/pause.svg?raw';
import expand from '@phosphor-icons/core/assets/regular/corners-out.svg?raw';
import guide from '@phosphor-icons/core/assets/regular/question.svg?raw';
import close from '@phosphor-icons/core/assets/regular/x.svg?raw';
import menu from '@phosphor-icons/core/assets/regular/list.svg?raw';
import bolt from '@phosphor-icons/core/assets/regular/lightning.svg?raw';
import jump from '@phosphor-icons/core/assets/regular/arrow-line-up.svg?raw';
import phase from '@phosphor-icons/core/assets/regular/waves.svg?raw';
import slow from '@phosphor-icons/core/assets/regular/hourglass.svg?raw';
import move from '@phosphor-icons/core/assets/regular/arrows-out-cardinal.svg?raw';
import look from '@phosphor-icons/core/assets/regular/eye.svg?raw';
import blast from '@phosphor-icons/core/assets/regular/hand-palm.svg?raw';
import map from '@phosphor-icons/core/assets/regular/map-trifold.svg?raw';

const icons={arrow,pause,expand,guide,close,menu,bolt,jump,phase,slow,move,look,blast,map};
export function icon(name){return (icons[name]||icons.arrow).replace(/<svg[^>]*>/,'<svg class="mr-icon" viewBox="0 0 256 256" aria-hidden="true" fill="currentColor">');}
// Replace this one placeholder symbol with your final logo. All inline marks use it.
export const mantaPath='M48 9C38 18 26 15 3 7c4 16 13 28 31 30l11-7 3 13 3-13 11 7c18-2 27-14 31-30-23 8-35 11-45 2ZM47 32c-1 11-5 19-1 26 0-8 4-11 4-24Z';
export function brandSprite(){return `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" aria-hidden="true" style="position:absolute;overflow:hidden"><symbol id="manta" viewBox="0 0 96 60"><path fill="currentColor" d="${mantaPath}"/></symbol></svg>`;}
export function manta(className=''){return `<svg class="manta-mark ${className}" viewBox="0 0 96 60" aria-hidden="true" fill="currentColor"><use href="#manta"/></svg>`;}
export function brand(){return `${manta()}<span class="mr-wordmark">MANTA RAY</span>`;}
export function button(label,{id='',href='',ghost=false,attrs=''}={}){
 const tag=href?'a':'button';return `<${tag} ${id?`id="${id}"`:''} ${href?`href="${href}"`:'type="button"'} class="mr-btn${ghost?' mr-btn--ghost':''}" ${attrs}><span>${label}</span><span class="mr-arrow" aria-hidden="true">${icon('arrow')}${icon('arrow')}</span></${tag}>`;
}
export function segmented(label,id,{active=false,disabled=false}={}){return `<button type="button" id="${id}" class="mr-segmented" role="switch" aria-label="${label}" aria-checked="${active}" ${disabled?'disabled':''}><span>${label}</span><i aria-hidden="true"></i></button>`;}
export function keycap(key,display){return `<kbd class="mr-keycap" data-key-hint="${key}">${display}</kbd>`;}
export function header(){return `<header class="site-header"><a class="site-brand" href="/" aria-label="Manta Ray home">${brand()}</a><nav aria-label="Main navigation"><a href="#maps">Maps</a><a href="#how-it-works">How it works</a></nav><div class="header-actions">${button('Play',{attrs:'data-open-maps'})}<button class="mr-icon-btn mobile-menu-button" id="open-navigation" aria-label="Open navigation">${icon('menu')}</button></div></header>`;}
export function dialog(id,label,content,className=''){return `<dialog id="${id}" class="mr-dialog ${className}" aria-labelledby="${id}-title"><button class="mr-icon-btn mr-dialog-close" data-close-dialog aria-label="Close ${label}">${icon('close')}</button>${content}</dialog>`;}
export function wireDialog(node){
 node.querySelector('[data-close-dialog]')?.addEventListener('click',()=>node.close());
 node.addEventListener('click',event=>{if(event.target===node){const r=node.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)node.close();}});
}
export function speedRing(){return `<section class="hud-speed" data-hud-region="speed" aria-label="Speed and energy">
 <svg class="speed-ring" viewBox="0 0 240 240" aria-hidden="true"><defs><path id="ring-text" d="M120 120m-101 0a101 101 0 1 1 202 0a101 101 0 1 1-202 0"/></defs>
 <g class="ring-dots"><circle cx="120" cy="120" r="116" pathLength="100" stroke-dasharray=".3 1.7"/></g>
 <g class="ring-dashes"><circle cx="120" cy="120" r="108" pathLength="100" stroke-dasharray="3 12"/></g>
 <circle class="ring-hairline" cx="120" cy="120" r="92"/>
 <circle class="ring-track" cx="120" cy="120" r="83" pathLength="100" stroke-dasharray="75 25" transform="rotate(135 120 120)"/>
 <circle class="ring-speed" cx="120" cy="120" r="83" pathLength="100" transform="rotate(135 120 120)"/>
 <circle class="ring-energy-track" cx="120" cy="120" r="99" pathLength="100" stroke-dasharray="25 75" transform="rotate(45 120 120)"/>
 <circle class="ring-energy" data-hud-energy-fill cx="120" cy="120" r="99" pathLength="100" transform="rotate(45 120 120)"/>
 <text class="ring-text"><textPath href="#ring-text" startOffset="2%">MANTA RAY / VELOCITY</textPath></text>
 </svg><div class="speed-center"><div class="speed-numerals"><strong data-hud-speed>0</strong><span>km/h</span></div><p class="hud-top-speed">TOP <b data-hud-top-speed>0</b> km/h</p></div>
 <div class="hud-energy" data-hud-energy-row><span>Energy</span><b data-hud-energy>100</b><span>%</span><span class="sr-only" data-hud-energy-meter role="progressbar" aria-label="Energy" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"></span></div>
 </section>`;}
export function minimap(){return `<div class="hud-radar-region" data-hud-region="radar"><div class="hud-radar-shell"><button class="hud-radar" type="button" aria-label="Expand map"><canvas data-hud-radar width="480" height="480" aria-label="Nearby streets and players"></canvas><span class="radar-player">${manta()}</span></button><div class="radar-ticks" aria-hidden="true"></div><span class="radar-north-orbit" aria-hidden="true"><span class="radar-north">N</span></span><span class="hud-heading" data-hud-heading>N 0°</span></div><div class="hud-tools"></div></div>`;}
