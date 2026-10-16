import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
test('the project is independently installable from its own root',()=>{
 for(const path of ['index.html','src/bootstrap.js','public','vite.config.js','package.json'])assert.ok(existsSync(new URL('../'+path,import.meta.url)),path);
 const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url)));assert.equal(pkg.workspaces,undefined);
});
