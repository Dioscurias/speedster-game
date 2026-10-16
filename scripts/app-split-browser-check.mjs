import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const base=process.env.TEST_URL||'http://127.0.0.1:5195';
const dev=process.env.TEST_DEV_URL||'http://127.0.0.1:5194';
const standalone=process.env.TEST_GAME_URL||'http://127.0.0.1:5196';
const errors=[];
try{
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.emulateMedia({reducedMotion:'reduce'});
 const requests=[];page.on('request',r=>requests.push(r.url()));
 await page.goto(base);await page.locator('.site-hero').waitFor();
 assert.equal(requests.some(url=>url.includes('/speedster/')),false,'the site does not boot the game engine');
 for(const origin of [dev,standalone]){
  const map=await page.request.get(origin+'/assets/austin/map.json');assert.equal(map.status(),200);assert.ok((await map.json()).roads);
  const model=await page.request.get(origin+'/assets/human/Superhero.glb');assert.equal(model.status(),200);assert.equal((await model.body()).subarray(0,4).toString(),'glTF');
  const font=await page.request.get(origin+'/fonts/inter-tight-latin.woff2');assert.equal(font.status(),200);assert.equal((await font.body()).subarray(0,4).toString(),'wOF2');
 }
 for(const url of [standalone+'/',dev+'/speedster/']){
  await page.goto(url);await page.locator('#join-player-name').waitFor({timeout:90000});await page.locator('#join-player-name').fill('Standalone');await page.locator('#manta-start').click();
  await page.waitForFunction(()=>window.__velocity?.getState().status==='running',null,{timeout:90000});
  await page.locator('#hud-pause').click();await page.locator('#result:not(.hidden)').waitFor();await page.locator('#hud-maps').click();await page.locator('#maps-dialog[open]').waitFor();
  await page.keyboard.press('Escape');await page.waitForFunction(()=>window.__velocity?.getState().status==='running');
 }
 await page.locator('#hud-pause').click();await page.locator('#result:not(.hidden)').waitFor();await page.locator('#hud-maps').click();await page.getByRole('radio',{name:'The Last Household',exact:true}).check();await page.click('#launch-game');
 await page.waitForFunction(()=>window.__parkour?.getState().status==='running',null,{timeout:90000});
 await page.goto(base+'/projects/speedster/play?embed=1&map=austin');await page.locator('#join-player-name').waitFor({timeout:90000});assert.equal(new URL(page.url()).pathname,'/speedster/');
 assert.deepEqual(errors,[]);console.log('PASS: independent game, development assets/fonts, map picker cancellation and launch, legacy embed links, and site without game engine.');
}finally{await browser.close();}
