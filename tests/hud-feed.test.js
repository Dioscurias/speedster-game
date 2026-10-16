import test from 'node:test';
import assert from 'node:assert/strict';
import {HudFeed} from '../src/hud/hud-overlay.js';

test('rapid speed records coalesce rather than flooding the event feed',()=>{
 const feed=new HudFeed();feed.push('New top speed · 120 KM/H',0,'speed');feed.push('New top speed · 300 KM/H',100,'speed');
 assert.equal(feed.read(100).length,1);assert.equal(feed.read(100)[0].message,'New top speed · 300 KM/H');
});
test('events fade and expire even when no new messages arrive',()=>{
 const feed=new HudFeed();feed.push('Bolt collected +1',0);
 assert.equal(feed.read(2000)[0].opacity,1);assert.ok(feed.read(4200)[0].opacity<.5);assert.deepEqual(feed.read(4500),[]);
});
test('the feed keeps only the latest four events and treats text literally',()=>{
 const feed=new HudFeed();for(let i=0;i<5;i++)feed.push(`Event ${i}`,i);
 assert.deepEqual(feed.read(10).map(e=>e.message),['Event 1','Event 2','Event 3','Event 4']);
 feed.push('<img onerror=alert(1)>',20);assert.equal(feed.read(20).at(-1).message,'<img onerror=alert(1)>');
});
