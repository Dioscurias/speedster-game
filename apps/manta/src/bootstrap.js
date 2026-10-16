import '../../../packages/ui/tokens.css';
import '../../../packages/ui/loading.css';
import '../../../packages/game-bridge/map-dialog.css';
import './lab/lab.css';
import {brandSprite,manta} from '../../../packages/ui/components.js';
import {legacyGameURL} from '../../../packages/game-bridge/index.js';
const legacy=legacyGameURL(new URL(location.href));
if(legacy){location.replace(legacy);}else{
 const cover=document.createElement('div');cover.className='manta-loading';cover.setAttribute('role','status');cover.innerHTML=brandSprite()+manta('loading-manta')+'<span class="loading-wordmark">MANTA RAY</span><p>Loading</p>';document.body.append(cover);
 try{await import('./lab/app.js');cover.remove();}catch(error){cover.querySelector('p').textContent='Could not load. Reload to try again.';console.error(error);}
}
