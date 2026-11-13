import {icon} from './icons.js';
export {icon} from './icons.js';
export function button(label,{id='',href='',ghost=false,attrs=''}={}){
 const tag=href?'a':'button';return `<${tag} ${id?`id="${id}"`:''} ${href?`href="${href}"`:'type="button"'} class="mr-btn${ghost?' mr-btn--ghost':''}" ${attrs}><span>${label}</span><span class="mr-arrow" aria-hidden="true">${icon('arrow')}</span></${tag}>`;
}
export function dialog(id,label,content,className=''){return `<dialog id="${id}" class="mr-dialog ${className}" aria-labelledby="${id}-title"><button class="mr-icon-btn mr-dialog-close" data-close-dialog aria-label="Close ${label}">${icon('close')}</button>${content}</dialog>`;}
export function wireDialog(node){
 node.querySelector('[data-close-dialog]')?.addEventListener('click',()=>node.close());
 node.addEventListener('click',event=>{if(event.target===node){const r=node.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)node.close();}});
}
