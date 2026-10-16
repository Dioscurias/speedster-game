import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {projects,PLACEHOLDER} from '../src/data/projects.ts';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}),base=process.env.TEST_URL||'http://127.0.0.1:5173',errors=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});page.on('pageerror',error=>errors.push(error.message));
 for(const path of ['/','/projects','/about',...projects.map(p=>'/projects/'+p.slug)]){
  const response=await page.request.get(base+path),html=await response.text();assert.equal(response.status(),200,path);
  assert.ok(html.includes('application/ld+json'),'Organization JSON-LD is in static HTML');
  if(path.startsWith('/projects/')){const project=projects.find(p=>path.endsWith(p.slug));assert.ok(html.includes(`<title>${project.name} | Manta Ray</title>`));assert.ok(html.includes(project.summary));assert.ok(html.includes(`/og/${project.slug}.png`));assert.ok(html.includes('Problem'));}
  await page.goto(base+path);await page.locator('#main-content').waitFor();await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('.manta-hud').count(),0,'HUD is absent from lab pages');assert.equal(await page.locator('a[href="TBD"]').count(),0);assert.equal(await page.locator('body').innerText().then(t=>/Manta Lab/i.test(t)),false);
  for(const [width,height] of [[360,800],[844,390],[1440,900],[2560,1440]]){await page.setViewportSize({width,height});await page.waitForTimeout(80);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${path} fits ${width}`);}
 }
 await page.goto(base+'/about');await page.locator('.site-header nav a[href="/#contact"]').click();await page.waitForURL('**/#contact');await page.waitForFunction(()=>{const r=document.getElementById('contact').getBoundingClientRect();return r.top<innerHeight&&r.bottom>0;});
 await page.goto(base);await page.setViewportSize({width:1440,height:900});
 assert.deepEqual(await page.locator('main>section').evaluateAll(nodes=>nodes.map(n=>n.id||n.classList[0])),['site-hero','manifesto','project-index','pipeline','featured-project','lab-log','contact']);
 assert.equal(await page.locator('.log-entry').count(),4);assert.equal(await page.locator('.stage-pending .stage-project').count(),4);assert.equal(await page.locator('.copy-email').isDisabled(),true);
 assert.equal(await page.locator('[data-project-row]:visible').count(),4);await page.locator('[data-status-filter="Live"]').click();assert.equal(await page.locator('[data-project-row]:visible').count(),0);assert.equal(await page.locator('.filter-empty').isVisible(),true);
 await page.locator(`[data-status-filter="${PLACEHOLDER}"]`).click();assert.equal(await page.locator('[data-project-row]:visible').count(),4);await page.locator('[data-status-filter="All"]').click();
 assert.match(await page.locator('.project-code').first().evaluate(n=>getComputedStyle(n).fontFamily),/JetBrains Mono/);
 await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(150);await page.screenshot({path:'/private/tmp/manta-lab-home.png'});
 await page.locator('#featured-project').scrollIntoViewIfNeeded();await page.locator('.preview-slot iframe').waitFor({timeout:30000});
 const preview=page.frameLocator('.preview-slot iframe');await preview.locator('.speedster-preview #scene canvas').waitFor({timeout:90000});await page.waitForFunction(()=>document.querySelector('.preview-slot iframe')?.contentWindow.__velocity?.assetsLoaded,null,{timeout:90000});assert.equal(await page.locator('.preview-slot iframe').evaluate(f=>f.contentWindow.__velocity.getState().status),'ready','preview does not enter a multiplayer room');assert.equal(await preview.locator('.manta-hud').count(),0);assert.equal(await preview.locator('use[href="#manta"]').count(),0);await page.screenshot({path:'/private/tmp/manta-live-preview.png'});
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelectorAll('.pin-spacer').length===0&&getComputedStyle(document.querySelector('.manifesto p span')).opacity==='1');assert.equal(await page.locator('.lab-hero-mark').evaluate(n=>getComputedStyle(n).animationName),'none');await page.screenshot({path:'/private/tmp/manta-lab-full.png',fullPage:true});
 await page.setViewportSize({width:360,height:800});await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:'/private/tmp/manta-lab-mobile.png'});await page.click('#open-navigation');await page.locator('#navigation-dialog[open]').waitFor();assert.deepEqual(await page.locator('.mobile-navigation strong').evaluateAll(nodes=>nodes.map(n=>n.firstChild.textContent)),['Projects','About','Contact']);await page.keyboard.press('Escape');
 await page.setViewportSize({width:1440,height:900});await page.goto(base+'/projects/burkit');await page.screenshot({path:'/private/tmp/manta-project-burkit.png',fullPage:true});assert.equal(await page.locator('.project-body-section').count(),3);assert.equal(await page.locator('.project-gallery .specimen-frame').count(),2);
 if(process.env.TEST_STATIC==='1'){for(const project of projects){const response=await page.request.get(base+'/og/'+project.slug+'.png');assert.equal(response.status(),200);assert.match(response.headers()['content-type'],/image\/png/);const png=await response.body();assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);}}
 if(process.env.TEST_DEPLOYED==='1'){const missing=await page.request.get(base+'/projects/not-a-project');assert.equal(missing.status(),404);}
 assert.deepEqual(errors,[]);console.log('PASS: all lab routes and static metadata, four responsive sizes, single project data source, truthful placeholders, filters, pipeline, HUD-free live preview, mobile navigation, and reduced motion.');
}finally{await browser.close();}
await import('./manta-browser-check.mjs');
