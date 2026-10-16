export const MANTA_ORIGIN=new URL(import.meta.env?.VITE_MANTA_ORIGIN||'https://manta-ray-dioscurias.vercel.app').origin;
export function trustedHostOrigin(referrer,ownOrigin){try{const origin=new URL(referrer).origin;return origin===MANTA_ORIGIN||origin===ownOrigin?origin:null;}catch{return null;}}
export function isHostMessage(event,parentWindow,origin){return Boolean(origin)&&event.origin===origin&&event.source===parentWindow;}
