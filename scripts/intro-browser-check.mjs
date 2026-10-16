import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';

const base=process.env.TEST_URL||'http://127.0.0.1:5188';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}),errors=[];
const filmURL=url=>/\/brand\/manta-intro(?:-mobile)?\.mp4(?:\?|$)/.test(url);
async function client(options={},init){
 const context=await browser.newContext({viewport:{width:1440,height:900},...options});if(init)await context.addInitScript(init);
 const page=await context.newPage(),requests=[];page.on('request',request=>{if(filmURL(request.url()))requests.push(request.url());});page.on('pageerror',error=>errors.push(error.message));
 return {context,page,requests};
}
async function ready(page,path='/'){await page.goto(base+path);await page.locator('#main-content').waitFor();await page.locator('body > .manta-loading').waitFor({state:'hidden'});}
async function closed(page){await page.locator('#site-intro').waitFor({state:'detached',timeout:10000});assert.equal(await page.locator('html').evaluate(n=>n.classList.contains('intro-active')),false);}
try{
 const first=await client();await ready(first.page);
 assert.equal(await first.page.locator('#site-intro[open]').count(),1,'first Home visit opens the supplied film');
 await first.page.waitForFunction(()=>document.querySelector('#site-intro video')?.currentTime>.1);
 assert.equal(await first.page.locator('#site-intro video').evaluate(v=>v.muted),true);assert.equal(await first.page.locator('#site-intro video').evaluate(v=>v.playsInline),true);
 await first.page.getByRole('button',{name:'Turn sound on',exact:true}).click();assert.equal(await first.page.locator('#site-intro video').evaluate(v=>v.muted),false);
 await first.page.getByRole('button',{name:'Turn sound off',exact:true}).click();
 await first.page.screenshot({path:'/private/tmp/manta-intro-desktop.png'});
 await first.page.getByRole('button',{name:'Skip intro',exact:true}).click();await closed(first.page);
 assert.equal(await first.page.evaluate(()=>document.activeElement.id),'main-content');
 const previous=first.requests.length;await ready(first.page);await closed(first.page);assert.equal(first.requests.length,previous,'return visits do not fetch the film again');await first.context.close();

 const complete=await client();await ready(complete.page);await complete.page.waitForFunction(()=>Number.isFinite(document.querySelector('#site-intro video')?.duration));
 await complete.page.locator('#site-intro video').evaluate(video=>video.currentTime=video.duration-.2);await closed(complete.page);await complete.page.locator('.site-header nav a[href="/projects"]').click();await complete.page.waitForURL('**/projects');assert.equal(await complete.page.locator('#site-intro').count(),0);await complete.context.close();

 const keyboard=await client();await ready(keyboard.page);await keyboard.page.locator('#site-intro[open]').waitFor();await keyboard.page.keyboard.press('Escape');await closed(keyboard.page);await keyboard.context.close();
 const reduced=await client({reducedMotion:'reduce'});await ready(reduced.page);await closed(reduced.page);assert.equal(reduced.requests.length,0,'reduced motion does not download the film');await reduced.context.close();
 const deepLink=await client();await ready(deepLink.page,'/#contact');await closed(deepLink.page);assert.equal(deepLink.requests.length,0,'direct section links do not open the intro');await deepLink.context.close();
 const dataSaver=await client({},()=>Object.defineProperty(navigator,'connection',{configurable:true,value:{saveData:true}}));await ready(dataSaver.page);await closed(dataSaver.page);assert.equal(dataSaver.requests.length,0);await dataSaver.context.close();

 const blocked=await client({},()=>HTMLMediaElement.prototype.play=function(){return Promise.reject(new DOMException('Blocked','NotAllowedError'));});await ready(blocked.page);await closed(blocked.page);await blocked.context.close();
 const failed=await client();await failed.page.route('**/brand/manta-intro*.mp4',route=>route.abort());await ready(failed.page);await closed(failed.page);await failed.context.close();

 const mobile=await client({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await ready(mobile.page);await mobile.page.waitForFunction(()=>document.querySelector('#site-intro video')?.currentTime>.1);
 assert.ok(await mobile.page.locator('#site-intro video').evaluate(v=>v.currentSrc.endsWith('manta-intro-mobile.mp4')));assert.equal(await mobile.page.locator('#site-intro video').evaluate(v=>getComputedStyle(v).objectFit),'contain');
 for(const viewport of [{width:390,height:844},{width:844,height:390}]){await mobile.page.setViewportSize(viewport);await mobile.page.waitForTimeout(300);assert.equal(await mobile.page.locator('#site-intro button').evaluateAll(nodes=>nodes.every(node=>{const r=node.getBoundingClientRect();return r.width>0&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;})),true,'intro controls remain inside mobile viewport');}
 await mobile.page.setViewportSize({width:390,height:844});await mobile.page.waitForTimeout(300);await mobile.page.screenshot({path:'/private/tmp/manta-intro-mobile.png'});await mobile.page.getByRole('button',{name:'Skip intro',exact:true}).tap();await closed(mobile.page);await mobile.context.close();
 assert.deepEqual(errors,[]);console.log('PASS: real intro playback, audio control, completion, Skip and Escape, session persistence, reduced motion, direct links, data saving, playback failures, and mobile framing.');
}finally{await browser.close();}
