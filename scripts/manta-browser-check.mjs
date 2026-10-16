import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const base=process.env.TEST_URL||'http://127.0.0.1:5173',errors=[];
async function neutralFrame(frame,label){const colored=await frame.locator('body').evaluate(body=>{const colored=value=>{const m=value.match(/^rgba?\(([^)]+)\)/);if(!m)return false;const [r,g,b]=m[1].split(',').map(Number);return Math.max(r,g,b)-Math.min(r,g,b)>1;};return [...body.querySelectorAll('*')].filter(node=>{const box=node.getBoundingClientRect(),style=getComputedStyle(node);return box.width&&box.height&&style.visibility!=='hidden'&&style.display!=='none';}).flatMap(node=>{const style=getComputedStyle(node);return ['color','backgroundColor','borderTopColor'].filter(key=>colored(style[key])).map(key=>node.tagName+'#'+node.id+':'+key+':'+style[key]);});});assert.deepEqual(colored,[],label+' UI is neutral');}
async function enterAustin(page,name){const frame=page.frameLocator('#game-window');await frame.locator('#join-player-name').waitFor({timeout:90000});await frame.locator('#join-player-name').fill(name);await frame.locator('#manta-start:not([disabled])').click();}
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base);await page.locator('.site-hero').waitFor();await page.evaluate(()=>document.fonts.ready);
 await page.locator('body > .manta-loading').waitFor({state:'hidden'});if(await page.locator('#site-intro[open]').count())await page.locator('[data-intro-skip]').click();await page.locator('#site-intro[open]').waitFor({state:'hidden'});
 assert.match(await page.title(),/Manta Ray/);assert.equal(await page.locator('symbol#manta').count(),1);
 for(const [width,height] of [[360,800],[844,390],[1440,900],[2560,1440]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(150);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`site fits ${width}`);
 }
 await page.setViewportSize({width:360,height:800});await page.click('#open-navigation');await page.locator('#navigation-dialog[open]').waitFor();await page.keyboard.press('Escape');assert.equal(await page.locator('#navigation-dialog').isVisible(),false);
 await page.setViewportSize({width:1440,height:900});await page.screenshot({path:'/private/tmp/manta-site-desktop.png'});
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>[...document.querySelectorAll('[data-reveal]')].every(n=>getComputedStyle(n).opacity==='1'));await page.screenshot({path:'/private/tmp/manta-site-full.png',fullPage:true});await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto(base+'/projects/speedster/play');
 await enterAustin(page,'Runner');
 const frame=page.frameLocator('#game-window');await page.waitForFunction(()=>document.querySelector('iframe')?.contentWindow.__velocity?.getState().status==='running',null,{timeout:90000});await frame.locator('.manta-hud:not([hidden])').waitFor();
 assert.equal(await frame.locator('use[href="#manta"]').count(),0,'the manta mark belongs to the lab');
 const liveTokens=await frame.locator('.manta-hud').evaluate(node=>{const style=getComputedStyle(node);return ['--bg','--fg','--muted','--line','--danger'].map(key=>style.getPropertyValue(key).trim().replace(/,0\./g,',.'));});assert.deepEqual(liveTokens,['#000000','#FFFFFF','rgba(255,255,255,.6)','rgba(255,255,255,.14)','#FFFFFF'],'late engine styles cannot override neutral HUD tokens');assert.equal(await page.locator('.site-header').isVisible(),false,'lab header hides while playing');assert.equal(new URL(await page.locator('#game-window').getAttribute('src'),base).pathname,'/speedster/');
 await neutralFrame(frame,'Austin');
 const collectionCount=await page.locator('#game-window').evaluate(f=>{const api=f.contentWindow.__velocity,read=api.getState;f.contentWindow.restoreHudReader=()=>api.getState=read;const count=read().collected+1;api.getState=()=>({...read(),collected:count});return count;});
 await page.waitForTimeout(150);assert.equal(Number(await frame.locator('[data-hud-bolts]').innerText()),collectionCount,'adapter maps collected to the Bolts readout');assert.equal(await frame.locator('.manta-hud').evaluate(n=>n.classList.contains('is-pickup')),true,'a collection flashes the ring');await page.locator('#game-window').evaluate(f=>f.contentWindow.restoreHudReader());
 async function layout(width,height){
  await page.setViewportSize({width,height});await page.waitForTimeout(200);
  const result=await page.locator('#game-window').evaluate(f=>{
   const d=f.contentDocument,canvas=d.querySelector('#scene canvas,#parkour-scene canvas'),r=canvas.getBoundingClientRect(),root=d.querySelector('.manta-hud');
   const panels=[...root.querySelectorAll('[data-hud-region]')].map(n=>({name:n.dataset.hudRegion,r:n.getBoundingClientRect()})).filter(p=>p.r.width&&p.r.height);
   const outside=panels.filter(p=>p.r.left<-.5||p.r.top<-.5||p.r.right>innerWidth+.5||p.r.bottom>innerHeight+.5).map(p=>p.name);
   const collisions=[];for(let i=0;i<panels.length;i++)for(let j=i+1;j<panels.length;j++){const a=panels[i],b=panels[j];if(Math.min(a.r.right,b.r.right)-Math.max(a.r.left,b.r.left)>1&&Math.min(a.r.bottom,b.r.bottom)-Math.max(a.r.top,b.r.top)>1)collisions.push([a.name,b.name]);}
   const radar=d.querySelector('.hud-radar canvas'),rr=radar.getBoundingClientRect();
   const toolOutside=[...root.querySelectorAll('.hud-tools button')].filter(n=>{const b=n.getBoundingClientRect();return b.left<0||b.right>innerWidth||b.bottom>innerHeight;}).map(n=>n.id);
   return {width:Math.round(r.width),height:Math.round(r.height),outside,collisions,toolOutside,center:d.elementFromPoint(innerWidth/2,innerHeight/2)?.tagName,radarSquare:Math.abs(rr.width-rr.height)<1,radarSharp:radar.width>=rr.width,arrows:d.querySelector('.view-buttons')?.getBoundingClientRect().width||0};
  });
  assert.equal(result.width,width);assert.equal(result.height,height);assert.deepEqual(result.outside,[],`HUD in bounds at ${width}`);assert.deepEqual(result.collisions,[],`no HUD overlap at ${width}`);assert.deepEqual(result.toolOutside,[],`all controls in bounds at ${width}`);assert.equal(result.center,'CANVAS');assert.equal(result.radarSquare,true);assert.equal(result.radarSharp,true);assert.equal(result.arrows,0);
 }
 for(const [w,h] of [[360,800],[844,390],[1440,900],[2560,1440]]){await layout(w,h);await page.screenshot({path:`/private/tmp/manta-hud-austin-${w}.png`});}
 await page.setViewportSize({width:1440,height:900});await frame.locator('.manta-stage').focus();await page.keyboard.down('w');await page.waitForTimeout(600);await page.keyboard.down('Shift');await page.waitForTimeout(500);assert.equal(await frame.locator('[data-key-hint=shift]').evaluate(n=>n.classList.contains('is-pressed')),true);await page.keyboard.up('Shift');await page.keyboard.up('w');
 assert.ok(Number(await frame.locator('[data-hud-speed]').innerText())>0,'speed reads the real engine');
 await frame.locator('#hud-quality').click();assert.equal(await frame.locator('#hud-quality').getAttribute('aria-checked'),'false');await frame.locator('#hud-quality').click();assert.equal(await frame.locator('#hud-quality').getAttribute('aria-checked'),'true');
 await frame.locator('#hud-fullscreen').click();await page.waitForFunction(()=>!!document.fullscreenElement);await page.evaluate(()=>document.exitFullscreen());
 await frame.locator('.manta-stage').press('Escape');await frame.locator('#result:not(.hidden)').waitFor();await neutralFrame(frame,'Austin pause');
 const before=await page.locator('#game-window').evaluate(f=>f.contentWindow.__velocity.getState());await page.waitForTimeout(200);assert.deepEqual(await page.locator('#game-window').evaluate(f=>f.contentWindow.__velocity.getState()),before,'pause freezes simulation');
 await frame.locator('#resume').click();await frame.locator('#hud-phase').hover();await page.mouse.down();await page.waitForTimeout(100);assert.equal(await page.locator('#game-window').evaluate(f=>f.contentWindow.__velocity.getState().phasing),true);await page.mouse.up();
 await frame.locator('#hud-guide').click();await frame.locator('#info-dialog[open]').waitFor();await neutralFrame(frame,'Guide');await page.keyboard.press('Escape');await frame.locator('#info-dialog').waitFor({state:'hidden'});
 await frame.locator('#hud-maps').click();await page.locator('#maps-dialog[open]').waitFor();await page.keyboard.press('Escape');await page.waitForFunction(()=>document.querySelector('iframe')?.contentWindow.__velocity.getState().status==='running');
 await frame.locator('#hud-pause').click();await frame.locator('#hud-maps').click();await page.getByRole('radio',{name:'The Last Household',exact:true}).check();await page.click('#launch-game');
 await page.waitForFunction(()=>document.querySelector('iframe')?.contentWindow.__parkour?.getState().status==='running',null,{timeout:90000});await frame.locator('.manta-hud:not([hidden])').waitFor();
 await neutralFrame(frame,'Parkour');
 assert.equal(await frame.locator('[data-key-hint=e]').locator('..').innerText(),'E\nBlink');assert.equal(await frame.locator('[data-key-hint=f]').locator('..').innerText(),'F\nHand blast');
 for(const [w,h] of [[360,800],[844,390],[1440,900],[2560,1440]])await layout(w,h);
 await page.setViewportSize({width:1440,height:900});await page.screenshot({path:'/private/tmp/manta-hud-parkour.png'});
 await frame.locator('#hud-guide').click();await page.keyboard.press('Escape');await frame.locator('#play').click();await frame.locator('.manta-stage').focus();await page.keyboard.down('f');await page.waitForTimeout(150);assert.equal(await frame.locator('#aim-reticle').isVisible(),false);await page.keyboard.up('f');
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await frame.locator('.ring-energy').evaluate(n=>getComputedStyle(n).animationName),'none');
 const mobile=await browser.newContext({viewport:{width:360,height:800},isMobile:true,hasTouch:true,deviceScaleFactor:3});
 const touch=await mobile.newPage();touch.on('pageerror',error=>errors.push(error.message));await touch.goto(base+'/projects/speedster/play');
 await enterAustin(touch,'Touch Runner');
 await touch.waitForFunction(()=>document.querySelector('iframe')?.contentWindow.__velocity?.getState().status==='running',null,{timeout:90000});
 const touchFrame=touch.frameLocator('#game-window');assert.equal(await touchFrame.locator('.hud-keys').isVisible(),false);assert.equal(await touchFrame.locator('.manta-touch-controls').isVisible(),true);await neutralFrame(touchFrame,'Austin touch');
 for(const [width,height] of [[360,800],[844,390]]){
  await touch.setViewportSize({width,height});await touch.waitForTimeout(200);
  const state=await touch.locator('#game-window').evaluate(f=>{
   const doc=f.contentDocument,p=[...doc.querySelectorAll('[data-hud-region]')].map(n=>({name:n.dataset.hudRegion,r:n.getBoundingClientRect()})).filter(n=>n.r.width&&n.r.height),collisions=[];
   for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++){const a=p[i],b=p[j];if(Math.min(a.r.right,b.r.right)-Math.max(a.r.left,b.r.left)>1&&Math.min(a.r.bottom,b.r.bottom)-Math.max(a.r.top,b.r.top)>1)collisions.push([a.name,b.name]);}
   const outside=[...doc.querySelectorAll('.manta-touch-controls button')].filter(n=>{const r=n.getBoundingClientRect();return r.width&&(r.left<0||r.right>f.clientWidth||r.bottom>f.clientHeight);}).map(n=>n.getAttribute('aria-label'));
   return {collisions,outside};
  });assert.deepEqual(state,{collisions:[],outside:[]},`touch HUD fits ${width}`);await touch.screenshot({path:`/private/tmp/manta-touch-${width}.png`});
 }
 const forward=touchFrame.locator('.touch-dpad button[data-key=w]'),pos=await forward.boundingBox(),cdp=await mobile.newCDPSession(touch);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:pos.x+pos.width/2,y:pos.y+pos.height/2,id:1}]});await touch.waitForTimeout(300);
 assert.ok(await touch.locator('#game-window').evaluate(f=>f.contentWindow.__velocity.getState().speed)>.1,'touch moves the actual character');
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await touchFrame.locator('#hud-pause').click();await touchFrame.locator('#hud-maps').click();await touch.getByRole('radio',{name:'The Last Household',exact:true}).check();await touch.locator('#launch-game').click();await touch.waitForFunction(()=>document.querySelector('iframe')?.contentWindow.__parkour?.getState().status==='running',null,{timeout:90000});await neutralFrame(touchFrame,'Parkour touch');await mobile.close();
 // Exercise presentation states directly through the public HUD API in a source preview.
 const fixture=await browser.newPage(),source=await fixture.goto(base+'/speedster/src/hud/hud-overlay.html');
 if(source.status()===200&&await fixture.locator('.speedster-hud').count()){
  await fixture.addStyleTag({url:base+'/shared-ui/tokens.css'});
  const behavior=await fixture.evaluate(async()=>{
   const {mountMantaHUD}=await import('/speedster/src/hud/manta-hud.js');document.body.replaceChildren();window.hud=mountMantaHUD(document.body);
   window.hud.update({status:'running',health:24,energy:100,speed:900,topSpeed:910,distance:1200,bolts:3,heading:Math.PI/2},performance.now());
   const root=window.hud.element;return {health:getComputedStyle(root.querySelector('[data-hud-health-row]')).color,speed:root.style.getPropertyValue('--speed'),energy:root.style.getPropertyValue('--energy'),heading:root.querySelector('[data-hud-heading]').textContent,fast:root.classList.contains('is-fast'),pulse:getComputedStyle(root.querySelector('.ring-energy')).animationName};
  });assert.equal(behavior.health,'rgb(255, 255, 255)');assert.equal(behavior.energy,'1');assert.equal(behavior.heading,'E 90°');assert.equal(behavior.fast,true);assert.ok(Number(behavior.speed)>.9);assert.equal(behavior.pulse,'energy-breathe');
  await fixture.emulateMedia({reducedMotion:'reduce'});assert.equal(await fixture.locator('.ring-energy').evaluate(n=>getComputedStyle(n).animationName),'none');await fixture.evaluate(()=>window.hud.destroy());
 }
 await fixture.close();
 assert.deepEqual(errors,[]);console.log('PASS: Manta Ray site, navigation, four viewport sizes, both live games, unclipped square radar, nonoverlapping HUD, empty center, real speed/keys/phase, pause, Guide, map change/cancel, and reduced motion.');
}finally{await browser.close();}
