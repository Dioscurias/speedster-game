import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import roomHandler from '../api/room.js';

const base=process.env.TEST_URL||'http://127.0.0.1:5188';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const clients=[],errors=[];
async function until(check,message,timeout=15000){const end=Date.now()+timeout;while(Date.now()<end){if(await check())return;await new Promise(resolve=>setTimeout(resolve,100));}assert.fail(message);}
async function openClient(name,viewport={width:1280,height:800},mobile=false){
 const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile}),page=await context.newPage();
 const client={context,page,last:null,calls:0};clients.push(client);
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>{
  window.__drawnPlayerNames=[];const draw=CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText=function(text,...args){if(this.canvas.width===256&&this.canvas.height===64){window.__drawnPlayerNames.push(text);if(window.__drawnPlayerNames.length>40)window.__drawnPlayerNames.shift();}return draw.call(this,text,...args);};
 });
 if(process.env.TEST_ROOM_LOCAL==='1')await page.route('**/api/room',async route=>{
  let status=200,headers={};
  await roomHandler({method:'POST',body:route.request().postDataJSON()},{setHeader:(key,value)=>headers[key]=value,status(code){status=code;return this;},async json(body){await route.fulfill({status,headers:{...headers,'content-type':'application/json'},body:JSON.stringify(body)});}});
 });
 page.on('response',async response=>{if(!response.url().endsWith('/api/room'))return;client.calls++;try{if(response.ok())client.last=await response.json();}catch(error){if(!/No resource|navigated away|Target.*closed|Response body is unavailable/i.test(error.message))errors.push(error.message);}});
 await page.goto(base+'/');
 const frame=page;await frame.getByRole('textbox',{name:'Player name',exact:true}).waitFor({timeout:90000});
 assert.equal(client.calls,0,'no multiplayer presence before choosing a name');
 await frame.getByRole('textbox',{name:'Player name',exact:true}).fill(name);await frame.locator('#manta-start').click();
 await page.waitForFunction(()=>window.__velocity?.getState().status==='running',null,{timeout:90000});
 return client;
}
try{
 const a=await openClient('Nico'),b=await openClient('Maya');
 await until(()=>a.last?.players?.some(p=>p.id===b.last?.self.id)&&b.last?.players?.some(p=>p.id===a.last?.self.id),'both players receive each other');
 const peer=(owner,other)=>owner.last.players.find(p=>p.id===other.last.self.id);
 assert.equal(a.last.self.name,'Nico');assert.equal(b.last.self.name,'Maya');
 assert.equal(peer(a,b).name,'Maya');assert.equal(peer(b,a).name,'Nico');
 assert.equal(a.last.self.colorIndex,peer(b,a).colorIndex);assert.equal(b.last.self.colorIndex,peer(a,b).colorIndex);assert.notEqual(a.last.self.colorIndex,b.last.self.colorIndex);
 await until(async()=>await a.page.evaluate(()=>window.__drawnPlayerNames.includes('Maya'))&&await b.page.evaluate(()=>window.__drawnPlayerNames.includes('Nico')),'both names are drawn above actual remote avatars');
 for(const [client,key] of [[a,'d'],[b,'a']]){await client.page.locator('.manta-stage').focus();await client.page.keyboard.down(key);await client.page.waitForTimeout(300);await client.page.keyboard.up(key);}
 const initial={id:a.last.self.id,color:a.last.self.colorIndex};
 const frame=a.page;await frame.locator('.manta-stage').press('Escape');await frame.locator('#result:not(.hidden)').waitFor();
 await frame.locator('#hud-player-name').click();await frame.locator('#info-dialog[open]').waitFor();const edit=frame.getByRole('textbox',{name:'Player name',exact:true});await edit.fill('');await edit.pressSequentially('Nico Ray');await frame.getByRole('button',{name:'Save name',exact:true}).click();
 await until(()=>peer(b,a)?.name==='Nico Ray','renamed player reaches the other screen');
 await until(async()=>await frame.locator('#info-dialog').evaluate(dialog=>!dialog.classList.contains('player-name-dialog')),'closing the name form restores the shared dialog');
 assert.equal(a.last.self.colorIndex,initial.color);assert.equal(peer(b,a).colorIndex,initial.color);
 await until(async()=>await b.page.evaluate(()=>window.__drawnPlayerNames.includes('Nico Ray')),'updated name is drawn above the peer');
 await frame.locator('#resume').click();
 a.last=null;await a.page.reload();await a.page.waitForFunction(()=>window.__velocity?.getState().status==='running',null,{timeout:90000});
 await until(()=>a.last?.self.name==='Nico Ray','saved name survives refresh');assert.equal(a.last.self.id,initial.id);assert.equal(a.last.self.colorIndex,initial.color);
 await a.page.screenshot({path:'/private/tmp/speedster-identity-a.png'});await b.page.screenshot({path:'/private/tmp/speedster-identity-b.png'});
 const mobile=await openClient('Mobile',{width:360,height:800},true);
 await mobile.page.locator('#hud-pause').click();await mobile.page.locator('#hud-player-name').click();
 for(const viewport of [{width:360,height:800},{width:844,height:390}]){
  await mobile.page.setViewportSize(viewport);const bounds=await mobile.page.evaluate(()=>{const nodes=[...document.querySelectorAll('#info-dialog input,#info-dialog [type=submit]')];return nodes.every(node=>{const r=node.getBoundingClientRect();return r.width>0&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;});});assert.equal(bounds,true,'name editing fits mobile');
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: independent players, matching colors in both snapshots, actual name labels, pause-menu rename, saved names on refresh, and mobile forms.');
}finally{await browser.close();}
