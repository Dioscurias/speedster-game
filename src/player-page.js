import './player-page.css';
const maps=[{id:'austin',name:'Austin',mode:'Multiplayer',kind:'City / Free roam',image:'/assets/previews/austin.jpg'},{id:'parkour',name:'The Last Household',mode:'Single player',kind:'Parkour',image:'/assets/previews/parkour.jpg'}];
document.title='Play — Speedster Game';
document.body.innerHTML=`<header class="player-header"><a href="/" class="player-brand" aria-label="Speedster Game home"><svg viewBox="0 0 24 32" aria-hidden="true"><path d="M14 1 2 18h10L9 31l13-19H12z"/></svg>Speedster Game</a><a class="player-nav" href="#map-selection" aria-current="page">Play</a></header>
<main class="player-page">
 <section id="map-selection" aria-labelledby="selection-title">
  <div class="selection-heading"><h1 id="selection-title">Maps</h1><span>Free roam &amp; parkour</span></div>
  <fieldset class="map-options"><legend>Choose a map</legend>${maps.map(m=>`
   <label class="map-option">
    <input type="radio" name="map" value="${m.id}" aria-label="${m.name}">
    <span class="selection-mark" aria-hidden="true">Selected</span>
    <span class="map-image"><img src="${m.image}" alt="" width="1390" height="992" fetchpriority="${m.id==='austin'?'high':'auto'}"></span>
    <span class="map-copy"><strong>${m.name}</strong><span class="map-meta"><span>${m.kind}</span><span>${m.mode}</span></span></span>
   </label>`).join('')}</fieldset>
  <div class="launch-row"><span id="selection-status" role="status">Select a map</span><button id="launch-game" disabled><span>Play</span><span aria-hidden="true">↗</span></button></div>
 </section>
 <section id="player" hidden aria-label="Game player"><div class="player-toolbar"><h1 id="map-title"></h1><div class="player-actions"><button id="change-map">Change map</button><button id="expand-game">Full screen</button></div></div><div id="frame-slot"></div><p id="player-message" role="status"></p></section>
 <details class="player-help"><summary>Controls <span aria-hidden="true">+</span></summary><dl><div><dt>Move</dt><dd>WASD</dd></div><div><dt>Jump</dt><dd>Space</dd></div><div><dt>Look</dt><dd>Arrow keys</dd></div><div><dt>Pause</dt><dd>Esc</dd></div></dl></details>
</main>`;
const $=id=>document.getElementById(id);let selected=null;
for(const input of document.querySelectorAll('[name="map"]'))input.addEventListener('change',()=>{selected=maps.find(m=>m.id===input.value);$('launch-game').disabled=false;$('selection-status').textContent=`${selected.name} selected`;});
$('launch-game').onclick=()=>{if(!selected)return;$('map-selection').hidden=true;$('player').hidden=false;$('map-title').textContent=selected.name;const frame=document.createElement('iframe');frame.id='game-window';frame.title=`${selected.name} game`;frame.allow='fullscreen';frame.allowFullscreen=true;frame.src=`/?embed=1&map=${selected.id}&autoplay=1`;$('frame-slot').replaceChildren(frame);history.replaceState(null,'',`/play?map=${selected.id}`);frame.onload=()=>frame.focus();};
$('change-map').onclick=async()=>{if(document.fullscreenElement)await document.exitFullscreen();$('frame-slot').replaceChildren();$('player').hidden=true;$('map-selection').hidden=false;$('launch-game').focus();history.replaceState(null,'','/play');};
document.querySelector('.player-nav').onclick=event=>{if(!$('player').hidden){event.preventDefault();$('change-map').click();}};
$('expand-game').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('player').requestFullscreen();}catch{$('player-message').textContent='Full screen is unavailable in this browser. You can still play in this window.';}};
document.addEventListener('fullscreenchange',()=>{$('expand-game').textContent=document.fullscreenElement?'Exit full screen':'Full screen';});
