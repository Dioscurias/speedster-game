import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto((process.env.TEST_URL||'http://localhost:5173')+'/play');
 assert.equal(await page.locator('#launch-game').isDisabled(),true);
 assert.equal(await page.locator('iframe').count(),0);
 await page.getByRole('radio',{name:/Last Household/}).check();await page.click('#launch-game');
 const frame=page.frameLocator('#game-window');await frame.locator('#pause').waitFor();await page.waitForFunction(()=>document.querySelector('iframe')?.contentWindow.__parkour?.getState().status==='running');
 async function noOverlap(){const result=await page.locator('#game-window').evaluate(frame=>{const doc=frame.contentDocument,panels=[...doc.querySelectorAll('[data-hud-region]')].filter(e=>getComputedStyle(e).display!=='none').map(e=>{const r=e.getBoundingClientRect(),clip=e.closest('.hud-rail,.hud-footer')?.getBoundingClientRect();return {name:e.dataset.hudRegion,r:clip?{left:Math.max(r.left,clip.left),right:Math.min(r.right,clip.right),top:Math.max(r.top,clip.top),bottom:Math.min(r.bottom,clip.bottom)}:r};});const collisions=[];for(let i=0;i<panels.length;i++)for(let j=i+1;j<panels.length;j++){const a=panels[i],b=panels[j];if(Math.min(a.r.right,b.r.right)-Math.max(a.r.left,b.r.left)>1&&Math.min(a.r.bottom,b.r.bottom)-Math.max(a.r.top,b.r.top)>1)collisions.push([a.name,b.name]);}return {collisions,overflow:doc.documentElement.scrollWidth>frame.clientWidth};});assert.deepEqual(result,{collisions:[],overflow:false});}
 for(const [width,height] of [[1440,1000],[390,844],[844,390]]){await page.setViewportSize({width,height});await page.waitForTimeout(150);await noOverlap();await page.screenshot({path:`/private/tmp/player-${width}-${height}.png`});}
 await page.setViewportSize({width:1440,height:1000});await page.click('#expand-game');await page.waitForFunction(()=>!!document.fullscreenElement);await noOverlap();await page.evaluate(()=>document.exitFullscreen());
 await page.click('#change-map');assert.equal(await page.locator('iframe').count(),0);await page.getByRole('radio',{name:/Austin/}).check();await page.click('#launch-game');await page.waitForFunction(()=>document.querySelector('iframe')?.contentWindow.__velocity?.getState().status==='running',null,{timeout:90000});
 for(const [width,height] of [[1440,1000],[390,844],[844,390]]){await page.setViewportSize({width,height});await page.waitForTimeout(150);await noOverlap();await page.screenshot({path:`/private/tmp/player-${width}-${height}.png`});}
 await page.screenshot({path:'/private/tmp/player-mobile.png'});assert.deepEqual(errors,[]);console.log('PASS: selection before play, both maps start, map switching, fullscreen, non-overlapping HUD at desktop/mobile/landscape.');
}finally{await browser.close();}
