import '../../../packages/ui/tokens.css';
import './site-page.css';
import {brandSprite,brand,manta,icon,button,header,dialog,wireDialog} from '../../../packages/ui/components.js';
import {mountSiteMotion} from '../../../packages/ui/site-motion.js';

export const maps=[
 {id:'austin',name:'Austin',mode:'Multiplayer',kind:'City / Free roam',hint:'Downtown streets. Rooftops. Room to run.',image:'/assets/previews/austin.jpg'},
 {id:'parkour',name:'The Last Household',mode:'Single player',kind:'Parkour',hint:'Five zones. Fifteen bolts. One way through.',image:'/assets/previews/parkour.jpg'}
];
document.title='Manta Ray | Run through Austin';document.body.className='manta-site';
document.body.innerHTML=`${brandSprite()}${header()}<div class="site-grain" aria-hidden="true"></div>
<main>
 <section class="site-hero" aria-labelledby="hero-title">
  <img class="hero-image" src="/assets/previews/austin.jpg" alt="" width="1390" height="992" fetchpriority="high">
  <div class="hero-scrim" aria-hidden="true"></div>${manta('hero-watermark')}
  <div class="hero-content"><p class="mr-caption hero-kicker">A city. A different speed.</p>
   <h1 id="hero-title"><span class="sr-only">Run through Austin.</span><span aria-hidden="true"><span class="rolling-word"><span class="rolling-track"><span>Run</span><span>Glide</span><span>Vault</span><span>Phase</span><span>Run</span></span></span><br>through<br>Austin.</span></h1>
   <div class="hero-bottom"><p>Superhuman speed.<br>Real streets. Your own route.</p><div class="hero-buttons">${button('Play',{attrs:'data-open-maps'})}${button('How it works',{href:'#how-it-works',ghost:true})}</div></div>
  </div>
  <div class="hero-foot"><span class="mr-caption">Austin, Texas / 30.2672° N 97.7431° W</span><a href="#manifesto" class="mr-caption">Scroll to explore <span aria-hidden="true">↓</span></a></div>
 </section>
 <section id="manifesto" class="manifesto section-pad"><span class="mr-caption">01 / The premise</span><p>${'No lanes. No finish line. Just you, the city, and the speed to make it yours.'.split(' ').map(word=>`<span>${word}</span>`).join(' ')}</p></section>
 <section id="maps" class="map-section section-pad" aria-labelledby="maps-title"><div class="section-heading"><p class="mr-caption">02 / Open ground</p><h2 id="maps-title">Choose your terrain.</h2><span class="mr-caption">${String(maps.length).padStart(2,'0')} maps available</span></div>
  <div class="map-rows">${maps.map((map,i)=>`<button class="map-row" data-map="${map.id}" data-reveal aria-label="Play ${map.name}"><span class="row-number">${String(i+1).padStart(2,'0')}</span><span class="map-row-copy"><span class="mr-caption">${map.kind} / ${map.mode}</span><strong>${map.name}</strong><span class="map-hint">${map.hint}</span></span><span class="map-row-image"><img src="${map.image}" alt="${map.name} gameplay" loading="lazy" width="1390" height="992"></span><span class="map-row-arrow">${icon('arrow')}</span></button>`).join('')}</div>
 </section>
 <section id="how-it-works" class="how-section section-pad" aria-labelledby="how-title"><div class="how-layout"><div class="how-heading"><p class="mr-caption">03 / How it works</p><h2 id="how-title">Find your<br>own flow.</h2><p>Learn the keys.<br>The rest is instinct.</p><div class="step-progress" aria-label="Guide progress">${Array.from({length:4},(_,i)=>`<button data-step-index="${i}" aria-label="Step ${i+1}"><span></span></button>`).join('')}</div><span class="mr-caption step-counter">01 / 04</span></div>
  <div class="how-steps">${[
   ['Movement','Pick a direction. Keep moving.','WASD moves. Arrow keys turn your view. Hold Space for a higher jump.','W A S D / SPACE','move'],
   ['Abilities','Go through. Go over.','Hold Q to phase. Hold E to slow time. Jump toward a building to wall run.','Q / E','phase'],
   ['Energy','Speed has a rhythm.','Hold Shift to boost. Keep an eye on your Energy as you build speed.','SHIFT','bolt'],
   ['Bolts','Find your next spark.','Collect Bolts to restore Energy. Explore another street. Take another roof.','+25 ENERGY','bolt']
  ].map(([name,title,copy,keys,glyph],i)=>`<article class="how-step" data-step="${i}"><span class="step-number" aria-hidden="true">0${i+1}</span><div class="step-copy"><span class="mr-caption">${name}</span><h3>${title}</h3><p>${copy}</p><span class="step-key">${icon(glyph)}${keys}</span></div></article>`).join('')}</div></div>
 </section>
 <section class="play-section" id="play-section"><div class="play-section-scrim"></div><div><p class="mr-caption">04 / Make your move</p><h2>The city<br>is open.</h2>${button('Play Manta Ray',{attrs:'data-open-maps'})}<p class="play-note">In your browser. No download.</p></div></section>
 <section id="player" hidden aria-label="Game player"><div id="frame-slot"></div><p id="player-message" role="status"></p></section>
</main><footer class="site-footer"><div class="footer-top"><a class="site-brand" href="/" aria-label="Manta Ray home">${brand()}</a><a href="#maps">Maps ${icon('arrow')}</a><a href="#how-it-works">How it works ${icon('arrow')}</a><span class="mr-caption">Built for the run.</span></div><p class="footer-wordmark" aria-hidden="true">MANTA RAY</p><div class="footer-bottom"><span class="mr-caption">A browser game</span><a class="mr-caption" href="#hero-title">Back to top ↑</a></div></footer>
${dialog('maps-dialog','maps',`<p class="mr-caption">Change map</p><h2 id="maps-dialog-title">Where to?</h2><fieldset class="map-options"><legend class="sr-only">Choose a map</legend>${maps.map((map,i)=>`<label class="map-option"><input type="radio" name="map" value="${map.id}" aria-label="${map.name}" ${i===0?'checked':''}><span class="tile-number">0${i+1}</span><span class="map-tile-copy"><strong>${map.name}</strong><span>${map.kind} / ${map.mode}</span><small>${map.hint}</small></span><img src="${map.image}" alt="" width="1390" height="992"><span class="tile-check" aria-hidden="true">${icon('arrow')}</span></label>`).join('')}</fieldset><div class="launch-row"><p id="selection-status" role="status">Austin selected</p>${button('Play',{id:'launch-game'})}</div>`)}
${dialog('navigation-dialog','navigation',`<p class="mr-caption">Manta Ray</p><h2 id="navigation-dialog-title">Explore.</h2><nav class="mobile-navigation" aria-label="Mobile navigation"><a href="#maps"><span>01</span><strong>Maps<small>Find your terrain.</small></strong>${icon('arrow')}</a><a href="#how-it-works"><span>02</span><strong>How it works<small>Movement, abilities, Energy, Bolts.</small></strong>${icon('arrow')}</a><button data-open-maps><span>03</span><strong>Play<small>The city is open.</small></strong>${icon('arrow')}</button></nav>`,'navigation-dialog')}`;

const $=id=>document.getElementById(id),mapDialog=$('maps-dialog'),navigation=$('navigation-dialog');
for(const node of [mapDialog,navigation])wireDialog(node);
const motion=mountSiteMotion();let selected=maps.find(map=>map.id===new URLSearchParams(location.search).get('map'))||maps[0],returnToGame=false,launching=false;
function selectMap(id){selected=maps.find(map=>map.id===id)||maps[0];document.querySelector(`[name=map][value="${selected.id}"]`).checked=true;$('selection-status').textContent=`${selected.name} selected`;}
selectMap(selected.id);
function openMaps(id){if(id)selectMap(id);if(navigation.open)navigation.close();returnToGame=!$('player').hidden;motion.stop();if(!mapDialog.open)mapDialog.showModal();}
document.querySelectorAll('[data-open-maps]').forEach(node=>node.onclick=()=>openMaps());
document.querySelectorAll('[data-map]').forEach(node=>node.onclick=()=>openMaps(node.dataset.map));
document.querySelectorAll('[name=map]').forEach(node=>node.onchange=()=>selectMap(node.value));
$('open-navigation').onclick=()=>{motion.stop();navigation.showModal();};
navigation.querySelectorAll('a').forEach(node=>node.addEventListener('click',()=>navigation.close()));
navigation.addEventListener('close',()=>{if(!mapDialog.open&&!document.body.classList.contains('playing-game'))motion.start();});
mapDialog.addEventListener('close',()=>{
 if(returnToGame&&!launching){const frame=$('game-window');frame?.contentWindow.postMessage({type:'manta:resume'},location.origin);frame?.focus();}
 if($('player').hidden)motion.start();launching=false;
});
$('launch-game').onclick=()=>{
 launching=true;mapDialog.close();returnToGame=false;motion.stop();$('player').hidden=false;document.body.classList.add('playing-game');
 const frame=document.createElement('iframe');frame.id='game-window';frame.title=`${selected.name} game`;frame.allow='fullscreen';frame.allowFullscreen=true;frame.src=`/?embed=1&map=${selected.id}&autoplay=1`;
 $('frame-slot').replaceChildren(frame);history.replaceState(null,'',`/play?map=${selected.id}`);document.title=`${selected.name} | Manta Ray`;frame.onload=()=>frame.focus();
};
window.addEventListener('message',async event=>{
 if(event.origin!==location.origin||event.source!==$('game-window')?.contentWindow)return;
 if(event.data?.type==='speedster:maps')openMaps();
 if(event.data?.type==='manta:leave'){
  if(document.fullscreenElement)await document.exitFullscreen();$('frame-slot').replaceChildren();$('player').hidden=true;document.body.classList.remove('playing-game');motion.start();history.replaceState(null,'','/');document.title='Manta Ray | Run through Austin';document.querySelector('[data-open-maps]').focus({preventScroll:true});
 }
});
window.addEventListener('pagehide',()=>motion.destroy(),{once:true});
