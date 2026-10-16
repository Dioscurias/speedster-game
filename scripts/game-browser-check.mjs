import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL||'http://127.0.0.1:5202';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}),errors=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.locator('#join-player-name').waitFor({timeout:90000});await page.locator('#join-player-name').fill('Runner');await page.locator('#manta-start').click();await page.waitForFunction(()=>window.__velocity?.getState().status==='running',null,{timeout:90000});
 assert.equal(await page.title(),'Speedster | Austin');assert.equal(await page.locator('.site-header,.site-footer,symbol#manta').count(),0);
 await page.locator('#hud-pause').click();await page.locator('#hud-maps').click();await page.locator('#maps-dialog[open]').waitFor();await page.keyboard.press('Escape');await page.waitForFunction(()=>window.__velocity?.getState().status==='running');
 await page.locator('#hud-pause').click();await page.locator('#hud-maps').click();await page.getByRole('radio',{name:'The Last Household',exact:true}).check();await page.click('#launch-game');await page.waitForFunction(()=>window.__parkour?.getState().status==='running',null,{timeout:90000});
 for(const [width,height] of [[360,800],[844,390],[1440,900]]){await page.setViewportSize({width,height});await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.equal(await page.locator('.manta-hud').isVisible(),true);}
 assert.deepEqual(errors,[]);console.log('PASS: standalone root, both maps, map picker cancel/resume, unchanged game HUD, no lab branding, responsive sizes.');
}finally{await browser.close();}
