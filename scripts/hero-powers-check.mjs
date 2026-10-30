import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL||'http://127.0.0.1:5202';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const errors=[];
try{
 for(const map of ['parkour','austin']){
 const p=await browser.newPage();p.on('pageerror',e=>errors.push(e.message));
 await p.goto(`${base}/?map=${map}`);await p.locator('#join-player-name').fill('Power check');await p.waitForFunction(()=>!document.getElementById('manta-start')?.disabled);await p.selectOption('#join-hero','speedster');await p.click('#manta-start');
 await p.waitForFunction(()=>{const g=window.__parkour||window.__velocity;return g?.getState().status==='running';});await p.waitForTimeout(200);
 const read=()=>p.evaluate(()=>{const g=window.__parkour||window.__velocity;return {w:g.getState(),visual:g.debug.visuals(),abilities:g.getAbilities?.(),combat:g.getCombat?.()};});
 const visible=async()=>{const {visual}=await read();assert.ok(visual.finite);assert.ok(visual.visibleMeshes>0);assert.ok(visual.height>1&&visual.height<4);assert.ok(visual.inView);};
 if(map==='parkour'){
 const before=await read();await p.keyboard.press('e');await p.keyboard.down('f');await p.waitForTimeout(1300);await p.keyboard.up('f');await p.waitForTimeout(100);const after=await read();
 assert.equal(after.w.x,before.w.x);assert.equal(after.w.z,before.w.z);assert.equal(after.abilities.teleports.available,3);assert.equal(after.combat.projectiles,0);assert.equal(after.abilities.blast.aiming,false);
 }
 // Select through the same event dispatched by both character pickers.
 await p.evaluate(()=>window.dispatchEvent(new CustomEvent('speedster:hero',{detail:'atlas'})));await p.waitForTimeout(200);
 await p.keyboard.press('r');await p.keyboard.down(' ');await p.waitForTimeout(700);await p.keyboard.up(' ');await p.waitForTimeout(150);
 assert.equal((await read()).w.flying,true);assert.ok((await read()).w.y>4);await visible();
 await p.keyboard.down('Shift');await p.keyboard.down(' ');await p.waitForTimeout(800);await p.keyboard.up(' ');await p.keyboard.up('Shift');await p.waitForTimeout(150);await visible();
 if(map==='parkour'){
 await p.keyboard.down('f');await p.waitForTimeout(1300);assert.equal((await read()).abilities.blast.aiming,true);await p.keyboard.up('f');await p.waitForTimeout(80);assert.ok((await read()).abilities.blast.cooldown>0);await visible();
 }
 await p.keyboard.down('x');await p.waitForTimeout(1200);await p.keyboard.up('x');await p.waitForTimeout(300);await visible();
 if(map==='parkour'){await p.waitForFunction(()=>window.__parkour.getState().grounded);const before=await read();await p.keyboard.press('e');await p.waitForTimeout(150);const after=await read();assert.equal(after.abilities.teleports.available,2);assert.ok(Math.hypot(after.w.x-before.w.x,after.w.z-before.w.z)>7);await visible();}
 await p.evaluate(()=>window.dispatchEvent(new CustomEvent('speedster:hero',{detail:'speedster'})));await p.waitForTimeout(200);assert.equal((await read()).w.flying,false);assert.equal((await read()).w.phasing,false);await visible();
 await p.screenshot({path:`/private/tmp/hero-powers-${map}.png`});await p.close();
 }
 assert.deepEqual(errors,[]);console.log('PASS: Speedster denied extra powers; Atlas flight, boosted ascent, charged blast, slam and character switches keep finite visible models on both maps.');
}finally{await browser.close();}
