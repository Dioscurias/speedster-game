import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));const base=process.env.TEST_URL||'http://127.0.0.1:5173';
 // Check the reusable component without any game engine or update loop.
 const source=await page.goto(base+'/src/hud/hud-overlay.html');
 if(source.status()===200&&await page.locator('.speedster-hud').count()){
 await page.addStyleTag({url:base+'/src/hud/hud-overlay.css'});
 const standalone=await page.evaluate(async()=>{
  const {createSpeedsterHUD}=await import('/src/hud/hud-overlay.js');window.hud=createSpeedsterHUD(document.querySelector('.speedster-hud'));
  window.hud.update({health:25,energy:100,speed:700,topSpeed:900,distance:1200,bolts:3});
  const root=document.querySelector('.speedster-hud'),row=root.querySelector('[data-hud-health-row]'),at25=row.classList.contains('is-low');
  window.hud.update({health:24});window.hud.event('<img src=x onerror=alert(1)>');
  return {at25,at24:row.classList.contains('is-low'),color:getComputedStyle(row).color,injectedImages:root.querySelectorAll('li img').length,pulse:getComputedStyle(root.querySelector('[data-hud-energy-fill]')).animationName};
 });assert.deepEqual(standalone,{at25:false,at24:true,color:'rgb(226, 93, 93)',injectedImages:0,pulse:'hud-energy-pulse'});
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('[data-hud-energy-fill]').evaluate(el=>getComputedStyle(el).animationName),'none');
 await page.waitForTimeout(4700);assert.equal(await page.locator('[data-hud-events] li').count(),0,'events expire without engine updates');assert.equal(await page.locator('[data-hud-hint]').isVisible(),false);
 await page.evaluate(()=>window.hud.destroy());await page.emulateMedia({reducedMotion:'no-preference'});
 }
 await page.goto(base+'/play');
 await page.getByRole('radio',{name:'Austin',exact:true}).check();await page.click('#launch-game');
 const frame=page.frameLocator('#game-window');
 await page.waitForFunction(()=>document.querySelector('iframe')?.contentWindow.__velocity?.getState().status==='running',null,{timeout:90000});
 await frame.locator('.speedster-hud:not([hidden])').waitFor();
 await frame.locator('body').focus();await page.keyboard.down('w');await page.waitForTimeout(1600);await page.keyboard.up('w');
 assert.ok(Number(await frame.locator('[data-hud-speed]').innerText())>10,'speed comes from real movement');
 assert.ok(await frame.locator('[data-hud-events]').getByText(/New top speed/).isVisible(),'real acceleration produces a feed event');
 async function layout(){
  const outer=await page.locator('#game-window').boundingBox();const viewport=page.viewportSize();
  assert.equal(Math.round(outer.width),viewport.width,'the game fills the browser width');assert.equal(Math.round(outer.height),viewport.height,'the game fills the browser height');
  const result=await page.locator('#game-window').evaluate(iframe=>{
   const doc=iframe.contentDocument,canvas=doc.querySelector('#scene canvas,#parkour-scene canvas'),rect=canvas.getBoundingClientRect();
   const panels=[...doc.querySelectorAll('.speedster-hud>[data-hud-region]')].map(el=>({name:el.dataset.hudRegion,r:el.getBoundingClientRect()})).filter(p=>p.r.width&&p.r.height);
   const collisions=[];for(let i=0;i<panels.length;i++)for(let j=i+1;j<panels.length;j++){const a=panels[i],b=panels[j];if(Math.min(a.r.right,b.r.right)-Math.max(a.r.left,b.r.left)>1&&Math.min(a.r.bottom,b.r.bottom)-Math.max(a.r.top,b.r.top)>1)collisions.push([a.name,b.name]);}
   return {width:Math.round(rect.width),height:Math.round(rect.height),collisions,inBounds:panels.every(p=>p.r.left>=0&&p.r.top>=0&&p.r.right<=iframe.clientWidth+1&&p.r.bottom<=iframe.clientHeight+1),center:doc.elementFromPoint(iframe.clientWidth/2,iframe.clientHeight/2)?.tagName};
  });
  assert.equal(result.width,viewport.width);assert.equal(result.height,viewport.height);assert.deepEqual(result.collisions,[]);assert.equal(result.inBounds,true);assert.equal(result.center,'CANVAS','the center has no HUD or reticle');
 }
 for(const [w,h] of [[1440,900],[390,844],[844,390],[320,568]]){await page.setViewportSize({width:w,height:h});await page.waitForTimeout(250);await layout();await page.screenshot({path:`/private/tmp/fps-hud-austin-${w}.png`});}
 assert.equal(await frame.locator('.view-buttons').isVisible(),false);assert.equal(await frame.locator('#quality').isVisible(),false);
 await page.waitForTimeout(4000);assert.equal(await frame.locator('[data-hud-hint]').isVisible(),false,'start hint expires');
 await frame.locator('body').press('Escape');await frame.locator('#resume').waitFor();assert.equal(await frame.locator('#quality').isVisible(),true);
 const before=await page.locator('#game-window').evaluate(f=>f.contentWindow.__velocity.getState());await page.waitForTimeout(180);assert.deepEqual(await page.locator('#game-window').evaluate(f=>f.contentWindow.__velocity.getState()),before);
 const behavior=await page.locator('#game-window').evaluate(f=>{
  f.contentWindow.dispatchEvent(new CustomEvent('speedster:hud',{detail:{health:24,energy:100,speed:700,topSpeed:900,distance:1200,bolts:3,heading:Math.PI/2,boosting:true,status:'paused'}}));
  const doc=f.contentDocument,root=doc.querySelector('.speedster-hud');
  return {low:root.querySelector('[data-hud-health-row]').classList.contains('is-low'),full:root.querySelector('[data-hud-energy-row]').classList.contains('is-full'),boost:root.classList.contains('is-boosting'),fast:root.classList.contains('is-fast'),scale:Number(root.style.getPropertyValue('--hud-speed-scale')),speed:root.querySelector('[data-hud-speed]').textContent};
 });assert.deepEqual({...behavior,scale:undefined},{low:true,full:true,boost:true,fast:true,scale:undefined,speed:'700'});assert.ok(behavior.scale>1&&behavior.scale<=1.1);
 await page.setViewportSize({width:1440,height:900});await frame.locator('#hud-fullscreen').click();await page.waitForFunction(()=>!!document.fullscreenElement);await page.evaluate(()=>document.exitFullscreen());
 await frame.locator('#hud-maps').click();await page.locator('#map-selection').waitFor();assert.equal(await page.locator('iframe').count(),0);
 await page.getByRole('radio',{name:'The Last Household',exact:true}).check();await page.click('#launch-game');
 await page.waitForFunction(()=>document.querySelector('iframe')?.contentWindow.__parkour?.getState().status==='running');
 await frame.locator('.speedster-hud:not([hidden])').waitFor();
 for(const [w,h] of [[1440,900],[390,844],[844,390],[320,568]]){await page.setViewportSize({width:w,height:h});await page.waitForTimeout(250);await layout();}
 await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(250);await frame.locator('body').focus();await page.keyboard.down('f');
 await page.waitForFunction(()=>document.querySelector('iframe')?.contentWindow.__parkour?.getAbilities().blast.aiming);
 assert.equal(await frame.locator('#aim-reticle').isVisible(),false);await page.keyboard.up('f');
 await page.screenshot({path:'/private/tmp/fps-hud-parkour.png'});
 assert.deepEqual(errors,[]);console.log('PASS: full browser and canvas, four responsive sizes, unclipped nonoverlapping HUD, empty center, fading hint, low health/full energy/boost/high speed, pause freeze, fullscreen, map switching, no aim reticle or page errors.');
}finally{await browser.close();}
