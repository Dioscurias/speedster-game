// Replace this one placeholder symbol with your final logo. All inline marks use it.
export const mantaPath='M48 9C38 18 26 15 3 7c4 16 13 28 31 30l11-7 3 13 3-13 11 7c18-2 27-14 31-30-23 8-35 11-45 2ZM47 32c-1 11-5 19-1 26 0-8 4-11 4-24Z';
export function brandSprite(){return `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" aria-hidden="true" style="position:absolute;overflow:hidden"><symbol id="manta" viewBox="0 0 96 60"><path fill="currentColor" d="${mantaPath}"/></symbol></svg>`;}
export function manta(className=''){return `<svg class="manta-mark ${className}" viewBox="0 0 96 60" aria-hidden="true" fill="currentColor"><use href="#manta"/></svg>`;}
export function brand(){return `${manta()}<span class="mr-wordmark">MANTA RAY</span>`;}
