import {test} from 'node:test';import assert from 'node:assert/strict';import {ribbon} from '../src/city.js';
test('road surface normals face upwards in every compass direction',()=>{for(const end of [[10,0],[0,10],[-10,3],[4,-8]]){const g=ribbon([0,0],end,8,.04);assert.ok(g.attributes.normal.getY(0)>.99,'road must be visible from above');g.dispose();}});
