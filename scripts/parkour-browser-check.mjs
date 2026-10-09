import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto((process.env.TEST_URL||'http://localhost:5173')+'/?map=parkour');
 await page.waitForFunction(()=>document.querySelector('#play')?.textContent==='Begin journey');
 await page.click('#play');
 await page.keyboard.down('Space');
 await page.waitForFunction(()=>window.__parkour.getState().y>1);
 await page.screenshot({path:'/private/tmp/parkour-jump.png'});
 await page.keyboard.up('Space');await page.waitForFunction(()=>window.__parkour.getState().grounded);
 await page.keyboard.press('Escape');const paused=await page.evaluate(()=>window.__parkour.getState());await page.waitForTimeout(150);assert.deepEqual(await page.evaluate(()=>window.__parkour.getState()),paused);
 await page.click('#play');await page.keyboard.down('w');await page.waitForTimeout(550);await page.keyboard.up('w');assert.ok((await page.evaluate(()=>window.__parkour.getState())).distance>1);
 await page.screenshot({path:'/private/tmp/parkour-playing.png'});
 await page.keyboard.press('Escape');await page.click('#restart');assert.ok((await page.evaluate(()=>window.__parkour.getState())).distance<.01);
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:'/private/tmp/parkour-mobile.png'});
 assert.deepEqual(errors,[]);console.log('Parkour browser checks passed: load, jump, land, pause, movement, restart, mobile layout.');
}finally{await browser.close();}
