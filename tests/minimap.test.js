import test from 'node:test';
import assert from 'node:assert/strict';
import {minimapMetrics,minimapProjection} from '../src/minimap.js';

test('minimap uses a square high-density backing canvas',()=>{
 const metrics=minimapMetrics(164,2);
 assert.equal(metrics.cssSize,164);
 assert.equal(metrics.pixelRatio,2);
 assert.equal(metrics.backingSize,328);
});

test('high-density displays preserve the actual pixel ratio without changing map zoom',()=>{
 const metrics=minimapMetrics(164,4);
 assert.equal(metrics.pixelRatio,3);
 assert.equal(metrics.worldScale,minimapMetrics(164,1).worldScale);
 assert.equal(metrics.playerSize,minimapMetrics(164,1).playerSize);
});

test('desktop and mobile show the same 1.5 km span while the player stays large',()=>{
 for(const size of [112,136,164,188]){
  const metrics=minimapMetrics(size,2);
  assert.equal(Math.round(size/metrics.worldScale),1500);
  assert.ok(metrics.playerSize*1.8>=26,'player remains at least 26 CSS pixels tall');
 }
});

test('map projection centers the player and keeps all four directions proportional',()=>{
 const world={x:230,z:-440},metrics=minimapMetrics(188,2),view=minimapProjection(world,metrics);
 assert.deepEqual(view.project([world.x,world.z]),[94,94]);
 const east=view.project([world.x+300,world.z]),north=view.project([world.x,world.z-300]);
 assert.ok(Math.abs(east[0]-94-(94-north[1]))<1e-9);
 assert.equal(east[1],94);
 assert.equal(north[0],94);
 assert.ok(view.visible({minX:-1000,maxX:world.x+5,minZ:-450,maxZ:-430}),'intersecting geometry stays visible even when its first vertex is outside the map');
 assert.equal(view.visible({minX:1100,maxX:1300,minZ:-450,maxZ:-430}),false);
});
