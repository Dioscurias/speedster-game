// The supplied artwork is stored unchanged. A luminance mask removes its black
// backdrop at render time and lets every mark inherit the existing color tokens.
export const mantaLogoURL='/brand/manta-ray.png';
export const mantaViewBox='64 144 1436 696';
export function mantaArtwork(imageURL=mantaLogoURL,maskId='manta-artwork'){
 return `<defs><mask id="${maskId}" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="64" y="144" width="1436" height="696" mask-type="luminance"><image href="${imageURL}" x="0" y="0" width="1536" height="1024"/></mask></defs><rect x="64" y="144" width="1436" height="696" fill="currentColor" mask="url(#${maskId})"/>`;
}
export function brandSprite(){return `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" aria-hidden="true" style="position:absolute;overflow:hidden"><symbol id="manta" viewBox="${mantaViewBox}">${mantaArtwork()}</symbol></svg>`;}
export function manta(className=''){return `<svg class="manta-mark ${className}" viewBox="0 0 1436 696" aria-hidden="true" fill="currentColor"><use href="#manta" width="1436" height="696"/></svg>`;}
export function brand(){return `${manta()}<span class="mr-wordmark">MANTA RAY</span>`;}
