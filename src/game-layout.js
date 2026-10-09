import './game-layout.css';
export function mountGameLayout(parkour,autoplay){
 document.body.classList.add('embedded-game',parkour?'parkour-layout':'austin-layout');
 const shell=document.createElement('div');shell.className='embedded-shell';
 const toolbar=document.createElement('div');toolbar.className='hud-toolbar';
 const body=document.createElement('div');body.className='hud-body';
 const viewport=document.createElement('div');viewport.className='hud-viewport';
 const rail=document.createElement('aside');rail.className='hud-rail';rail.setAttribute('aria-label','Game status');
 const footer=document.createElement('div');footer.className='hud-footer';
 const move=(selector,parent,name)=>{const el=document.querySelector(selector);if(el){parent.append(el);if(name)el.dataset.hudRegion=name;}return el;};
 if(parkour){
  move('header',toolbar,'actions');const exit=toolbar.querySelector('a');if(exit){exit.href='/play';exit.target='_top';exit.textContent='Maps';}
  move('#parkour-scene',viewport);move('#overlay',viewport);
  move('#progress',rail,'progress');move('#ability-hud',rail,'abilities');move('#hint',footer,'help');move('#touch',footer,'movement');
 }else{
  const frame=document.querySelector('.game-frame');
  move('.scene-top',toolbar,'actions');move('.compass-hud',toolbar,'compass');
  move('#scene',viewport);move('.scene-vignette',viewport);move('.intro-card',viewport);move('#result',viewport);move('#death',viewport);move('#impact',viewport);move('#toast',viewport);
  move('.multiplayer-hud',rail,'health');move('.mission-panel',rail,'stats');move('.map-hud',rail,'map');move('.speed-display',rail,'speed');
  move('.view-buttons',footer,'camera');move('.touch-controls',footer,'movement');move('.scene-bottom',footer,'status');
  // Preserve the original fullscreen target used by the game code.
  frame.classList.remove('game-frame');shell.classList.add('game-frame');
  const fullscreen=document.getElementById('fullscreen');if(fullscreen)fullscreen.hidden=true;
 }
 body.append(viewport,rail);shell.append(toolbar,body,footer);document.body.append(shell);
 if(autoplay){const button=document.getElementById(parkour?'play':'start');const timer=setInterval(()=>{if(button&&!button.disabled){clearInterval(timer);button.click();}},50);setTimeout(()=>clearInterval(timer),90000);}
}
