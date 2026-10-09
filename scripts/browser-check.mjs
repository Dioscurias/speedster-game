import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1160}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto((process.env.TEST_URL||'http://localhost:5173')+'/?embed=1');await page.waitForFunction(()=>window.__velocity?.assetsLoaded,null,{timeout:90000});await page.waitForTimeout(700);
 const animation=()=>page.evaluate(()=>window.__velocity.getAnimation());
 const state=()=>page.evaluate(()=>window.__velocity.getState());const hold=async(key,ms)=>{await page.keyboard.down(key);await page.waitForTimeout(ms);await page.keyboard.up(key);};
 assert.match(await page.evaluate(()=>window.__velocity.mapName),/Austin/);assert.equal(await page.evaluate(()=>window.__velocity.model),'Quaternius Superhero');
 await page.screenshot({path:'/tmp/velocity-austin-desktop.png',fullPage:true});await page.click('#start');assert.equal((await animation()).phase,'idle');const origin=await state();await page.waitForTimeout(200);assert.equal((await state()).distance,0);
 await page.keyboard.down('q');await page.waitForFunction(()=>window.__velocity.getState().phasing);const phaseEffects=await page.evaluate(()=>window.__velocity.getEffects());await page.waitForTimeout(90);assert.notDeepEqual((await page.evaluate(()=>window.__velocity.getEffects())).vibration,phaseEffects.vibration);assert.equal((await state()).distance,0,'vibration does not move collision body');assert.ok(phaseEffects.lightning.visible);assert.equal(await page.locator('#phase').getAttribute('aria-pressed'),'true');await page.keyboard.up('q');await page.waitForFunction(()=>!window.__velocity.getState().phasing);
 const phaseButton=await page.locator('#phase').boundingBox();await page.mouse.move(phaseButton.x+10,phaseButton.y+10);await page.mouse.down();await page.waitForFunction(()=>window.__velocity.getState().phasing);await page.mouse.up();await page.waitForFunction(()=>!window.__velocity.getState().phasing);
 const wallCheck=await page.evaluate(async()=>{
  const {createWorld,stepWorld}=await import('/src/game.js'),{prepareMap}=await import('/src/austin.js');const map=prepareMap(await (await fetch('/assets/austin/map.json')).json());
  for(const b of map.buildings)for(let i=0;i<b.polygon.length;i++){
   const a=b.polygon[i],c=b.polygon[(i+1)%b.polygon.length],len=Math.hypot(c[0]-a[0],c[1]-a[1]);if(len<8)continue;
   for(const sign of [-1,1]){const nx=sign*(c[1]-a[1])/len,nz=-sign*(c[0]-a[0])/len,x=(a[0]+c[0])/2+nx*2,z=(a[1]+c[1])/2+nz*2;if(map.collider.blocked(x,z,1))continue;
    const w=createWorld({x,z});Object.assign(w,{status:'running',y:1,grounded:false,vx:-nx*45,vz:-nz*45});const yaw=Math.atan2(-nx,nz);
    for(let j=0;j<30;j++){stepWorld(w,{forward:true,viewYaw:yaw},1/120,map.collider);if(w.wallRunning)return w.y>1;}
   }
  }return false;
 });assert.equal(wallCheck,true,'wall running works with actual Austin building contacts');
 await hold('ArrowRight',250);assert.ok((await state()).viewYaw>origin.viewYaw);assert.equal((await state()).distance,0,'arrows only control the view');
 const oldPitch=(await state()).viewPitch;await hold('ArrowUp',200);assert.ok((await state()).viewPitch>oldPitch);
 await page.keyboard.press('Escape');await page.click('#restart');await hold('w',650);const moving=await state();assert.ok(['run','brake'].includes((await animation()).phase));assert.ok(moving.distance>2);assert.ok(moving.speed>10&&moving.speed<45,'finite acceleration');await page.waitForTimeout(100);assert.ok((await state()).distance>moving.distance,'momentum during braking');assert.equal((await animation()).phase,'brake');await page.waitForTimeout(600);assert.ok((await state()).speed<1,'brakes settle');
 await page.keyboard.down('w');await page.keyboard.down('Shift');await page.waitForTimeout(1200);assert.equal((await animation()).phase,'boost');assert.ok((await animation()).lean>.25);await page.screenshot({path:'/tmp/velocity-animation-boost.png'});await page.keyboard.up('Shift');await page.keyboard.up('w');assert.ok((await state()).topSpeed>65,'boost speed');
 await page.keyboard.press('Space');await page.waitForTimeout(180);assert.ok((await state()).y>.1,'ballistic jump');assert.ok(['air','takeoff'].includes((await animation()).phase));assert.ok((await animation()).run<.05,'no running in midair');await page.screenshot({path:'/tmp/velocity-animation-jump.png'});
 await page.keyboard.press('Escape');const paused=await state(),frozenPose=await animation(),frozenEffects=await page.evaluate(()=>window.__velocity.getEffects());await page.waitForTimeout(200);assert.deepEqual(await state(),paused);assert.deepEqual(await animation(),frozenPose);assert.deepEqual(await page.evaluate(()=>window.__velocity.getEffects()),frozenEffects);await page.click('#resume');
 const rect=await page.locator('#scene canvas').boundingBox();await page.mouse.move(rect.x+rect.width*.5,rect.y+rect.height*.45);const yaw=(await state()).viewYaw;await page.mouse.down();await page.mouse.move(rect.x+rect.width*.5+90,rect.y+rect.height*.45,{steps:8});await page.mouse.up();assert.equal((await state()).viewYaw,yaw,'mouse no longer changes view');
 await page.waitForFunction(()=>window.__velocity.getAnimation().phase==='land',null,{timeout:5000});assert.ok((await animation()).crouch>0);await page.screenshot({path:'/tmp/velocity-animation-land.png'});await page.waitForTimeout(500);await page.screenshot({path:'/tmp/velocity-austin-playing.png'});assert.equal((await state()).grounded,true);
 await page.click('#how-to');assert.match(await page.locator('#dialog-content').innerText(),/9.81/);await page.click('.close-dialog');await page.evaluate(()=>document.querySelector('#records-tab').click());assert.match(await page.locator('#dialog-content').innerText(),/Austin sessions/);await page.click('.close-dialog');await page.click('#resume');await page.click('#quality');assert.equal(await page.locator('#quality').innerText(),'LQ');
 console.log('Desktop Austin:',await state());
 await page.setViewportSize({width:390,height:844});await page.reload();await page.waitForFunction(()=>window.__velocity?.assetsLoaded,null,{timeout:90000});await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:'/tmp/velocity-austin-mobile.png',fullPage:true});await page.click('#start');
 const look=page.locator('[data-key="arrowright"]');await look.scrollIntoViewIfNeeded();const lb=await look.boundingBox(),before=await state();await page.mouse.move(lb.x+15,lb.y+15);await page.mouse.down();await page.waitForTimeout(250);await page.mouse.up();assert.ok((await state()).viewYaw>before.viewYaw);assert.equal((await state()).distance,0);
 const forward=page.locator('[data-key="w"]');await forward.scrollIntoViewIfNeeded();const b=await forward.boundingBox();await page.mouse.move(b.x+15,b.y+15);await page.mouse.down();await page.waitForTimeout(400);await page.mouse.up();assert.ok((await state()).distance>0,'separate touch movement');
 assert.deepEqual(errors,[]);console.log('PASS: Austin data + human model, momentum, boost, gravity, arrows-only view, independent WASD, pause, records and mobile controls; responsive animation states verified; no browser errors.');
}finally{await browser.close();}
