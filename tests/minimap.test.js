import test from 'node:test';
import assert from 'node:assert/strict';
import {minimapMetrics} from '../src/minimap.js';

test('minimap uses a square high-density backing canvas',()=>{
 const metrics=minimapMetrics(164,2);
 assert.equal(metrics.cssSize,164);
 assert.equal(metrics.pixelRatio,2);
 assert.equal(metrics.backingSize,328);
});

test('minimap caps pixel density and shows a wider area',()=>{
 const metrics=minimapMetrics(164,4);
 assert.equal(metrics.pixelRatio,2);
 assert.equal(metrics.worldScale,.19);
 assert.ok(metrics.playerSize>=11);
});
