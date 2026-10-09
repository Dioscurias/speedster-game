import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto((process.env.TEST_URL||'http://localhost:5173')+'/?embed=1&map=parkour&autoplay=1');await page.waitForFunction(()=>window.__parkour?.getState().status==='running');
 const initial=await page.evaluate(()=>window.__parkour.getPlatforms()[5].x);await page.waitForTimeout(350);assert.notEqual(await page.evaluate(()=>window.__parkour.getPlatforms()[5].x),initial);
 for(let i=0;i<3;i++){await page.keyboard.press('e');await page.waitForTimeout(100);}assert.equal(await page.evaluate(()=>window.__parkour.getAbilities().teleports.available),0);
 await page.keyboard.down('f');await page.waitForFunction(()=>window.__parkour.getAbilities().blast.ready&&window.__parkour.getAbilities().blast.aiming);assert.equal(await page.locator('#aim-reticle').isVisible(),true);await page.screenshot({path:'/private/tmp/parkour-abilities-aim.png'});await page.keyboard.up('f');await page.waitForFunction(()=>window.__parkour.getAbilities().blast.cooldown>0);assert.equal(await page.locator('#aim-reticle').isVisible(),false);
 await page.keyboard.press('Escape');const before=await page.evaluate(()=>window.__parkour.getAbilities());await page.waitForTimeout(200);assert.deepEqual(await page.evaluate(()=>window.__parkour.getAbilities()),before);await page.click('#play');await page.waitForFunction(()=>window.__parkour.getAbilities().teleports.available===3,null,{timeout:15000});
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:'/private/tmp/parkour-abilities-mobile.png'});
 assert.deepEqual(errors,[]);console.log('PASS: moving platforms, three blinks, refill, charged aim/release, cooldown, pause timers, mobile HUD, no runtime errors.');
}finally{await browser.close();}
