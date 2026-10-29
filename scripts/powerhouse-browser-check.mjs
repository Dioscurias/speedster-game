import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL||'http://127.0.0.1:5202',room='check-'+Date.now();
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const errors=[];const contexts=[];
async function join(name,hero='speedster',map='austin'){
 const context=await browser.newContext({viewport:{width:1440,height:900}});contexts.push(context);const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${base}/?room=${room}&map=${map}`);await page.locator('#join-player-name').fill(name);await page.waitForFunction(()=>!document.getElementById('manta-start')?.disabled);
 await page.selectOption('#join-hero',hero);await page.click('#manta-start');await page.waitForFunction(()=>{const g=window.__velocity||window.__parkour;return g?.getState().status==='running'&&g.getNetwork().status==='Connected';},null,{timeout:30000});return page;
}
try{
 const a=await join('Atlas test','atlas'),b=await join('Runner test');
 await a.waitForFunction(()=>window.__velocity.getPeers().some(p=>p.name==='Runner test'),null,{timeout:15000});await b.waitForFunction(()=>window.__velocity.getPeers().some(p=>p.hero==='atlas'));
 await a.bringToFront();await a.evaluate(()=>{if(window.__velocity.getState().status==='paused')document.getElementById('resume').click();});
 await a.keyboard.press('r');await a.keyboard.down(' ');await a.waitForTimeout(650);await a.keyboard.up(' ');
 assert.equal(await a.evaluate(()=>window.__velocity.getState().flying),true);assert.ok(await a.evaluate(()=>window.__velocity.getState().y>4));
 await a.keyboard.down('w');await a.waitForTimeout(700);const normal=await a.evaluate(()=>window.__velocity.getState().speed);await a.keyboard.down('Shift');await a.waitForTimeout(800);await a.keyboard.up('Shift');await a.keyboard.up('w');
 assert.ok(await a.evaluate(()=>window.__velocity.getState().topSpeed)>normal);
 await a.screenshot({path:'/private/tmp/speedster-atlas-flight.png'});
 if(await a.evaluate(()=>!!window.__velocity.debug)){
  const before=await a.evaluate(()=>window.__velocity.getEffects().craters);
  // Place the player beside a real mapped facade; V still exercises the actual
  // control, hit detection, renderer, transport and shared-room code.
  await a.evaluate(async()=>{
   const data=await(await fetch('/assets/austin/map.json')).json();
   const {prepareMap}=await import('/src/austin.js');const {findPunchTarget}=await import('/src/powerhouse.js');const map=prepareMap(data);
   for(const building of map.buildings){if(building.height<6)continue;for(let i=0;i<building.polygon.length;i++){
    const p=building.polygon[i],q=building.polygon[(i+1)%building.polygon.length],len=Math.hypot(q[0]-p[0],q[1]-p[1]);if(len<8)continue;
    for(const side of [-1,1]){const nx=(q[1]-p[1])/len*side,nz=-(q[0]-p[0])/len*side,x=(p[0]+q[0])/2+nx*2,z=(p[1]+q[1])/2+nz*2,heading=Math.atan2(-nx,nz);
     if(!map.collider.blocked(x,z,0)&&findPunchTarget({x,z,y:0,heading},[building])){window.__velocity.debug.place({x,z,y:0,heading,vx:0,vy:0,vz:0,grounded:true,flying:false,status:'running',hero:'atlas'});return;}
    }
   }}throw Error('No reachable wall found');
  });
  await a.waitForTimeout(400);await a.keyboard.press('v');await a.waitForFunction(n=>window.__velocity.getEffects().craters>n,before);
  await b.waitForFunction(()=>window.__velocity.getEffects().craters>0);
  await a.waitForTimeout(120);await a.screenshot({path:'/private/tmp/speedster-atlas-impact.png'});
  const visuals=await a.evaluate(()=>window.__velocity.debug.peerVisuals());assert.ok(visuals.length&&visuals.every(v=>v.position.every(Number.isFinite)&&v.visible&&v.validRig));
 }
 await a.keyboard.press('m');await a.locator('#city-overview').waitFor({state:'visible'});assert.equal(await a.locator('#city-overview').getAttribute('data-player-count'),'2');await a.click('#map-recenter');assert.equal(await a.locator('#map-zoom').inputValue(),'3');await a.screenshot({path:'/private/tmp/speedster-live-map.png'});await a.keyboard.press('Escape');
 const c=await join('Parkour test','atlas','parkour');assert.equal(await c.evaluate(()=>window.__parkour.getPeers().length),0);
 const d=await join('Parkour friend','speedster','parkour');await c.waitForFunction(()=>window.__parkour.getPeers().length===1);
 await c.bringToFront();await c.evaluate(()=>{if(window.__parkour.getState().status==='paused')document.getElementById('play').click();});await c.keyboard.press('m');await c.locator('#course-overview').waitFor({state:'visible'});assert.equal(await c.locator('#course-overview').getAttribute('data-player-count'),'2');await c.keyboard.press('Escape');
 for(const [width,height]of [[390,844],[844,390]]){await a.setViewportSize({width,height});await a.evaluate(()=>{if(window.__velocity.getState().status==='paused')document.getElementById('resume').click();});await a.waitForTimeout(100);assert.equal(await a.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.equal(await a.locator('.hero-actions').isVisible(),true);await a.screenshot({path:`/private/tmp/speedster-mobile-${width}.png`});}
 await b.close();await a.waitForFunction(()=>window.__velocity.getPeers().length===0,null,{timeout:15000});
 assert.deepEqual(errors,[]);console.log('PASS: two real browser players, Atlas flight/boost/punch and shared craters, live maps, map isolation, mobile UI, clean disconnect, no browser errors.');
}finally{await browser.close();}
