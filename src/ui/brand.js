// The mark is a white, transparent extraction of the supplied Manta Ray artwork.
export const mantaLogoURL='/brand/manta-ray-mark.png';
export const mantaViewBox='0 0 1436 696';
export function mantaArtwork(imageURL=mantaLogoURL){return `<image href="${imageURL}" x="0" y="0" width="1436" height="696"/>`;}
export function brandSprite(){return `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" aria-hidden="true" style="position:absolute;overflow:hidden"><symbol id="manta" viewBox="${mantaViewBox}">${mantaArtwork()}</symbol></svg>`;}
export function manta(className=''){return `<svg class="manta-mark ${className}" viewBox="${mantaViewBox}" aria-hidden="true"><use href="#manta" width="1436" height="696"/></svg>`;}
export function brand(){return `${manta()}<span class="mr-wordmark">MANTA RAY</span>`;}
