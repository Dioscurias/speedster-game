import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
function graph(entry,seen=new Set()){
 const file=resolve(root,entry);assert.ok(existsSync(file),`Missing application entry: ${entry}`);if(seen.has(file))return seen;seen.add(file);
 const source=readFileSync(file,'utf8'),imports=/(?:from\s*|import\s*(?:\(\s*)?)(['"])(\.{1,2}\/[^'"]+)\1/g;
 for(const match of source.matchAll(imports)){const path=resolve(dirname(file),match[2].split('?')[0]);if(existsSync(path))graph(path,seen);}
 return seen;
}
test('Manta Ray and Speedster have their own HTML, bootstrap and Vite configuration',()=>{
 for(const app of ['manta','speedster'])for(const file of ['index.html',['src','bootstrap.js'].join('/'),'vite.config.js','package.json'])assert.ok(existsSync(resolve(root,'apps',app,file)),`${app}/${file} is separate`);
});
test('neither client application imports the other application',()=>{
 const manta=[...graph('apps/manta/src/bootstrap.js')],speedster=[...graph('apps/speedster/src/bootstrap.js')];
 assert.equal(manta.some(path=>path.includes('/apps/speedster/')),false);assert.equal(speedster.some(path=>path.includes('/apps/manta/')),false);
 assert.equal(manta.some(path=>path.endsWith('game-shell.html')||path.endsWith('/game.js')),false);
});
test('the bridge keeps Manta play links and builds independent game URLs',async()=>{
 const file=resolve(root,'packages/game-bridge/index.js');assert.ok(existsSync(file),'shared game bridge exists');const {GAME_PATH,GAME_EMBED_PATH,gameURL,legacyGameURL}=await import(file);
 assert.equal(GAME_PATH,'/projects/speedster/play');assert.equal(GAME_EMBED_PATH,'/speedster/');
 assert.equal(gameURL({map:'parkour',autoplay:true}),'/speedster/?map=parkour&autoplay=1');assert.equal(gameURL({map:'unknown'}),'/speedster/?map=austin');
 assert.equal(legacyGameURL(new URL('https://example.test/projects/speedster/play?embed=1&map=parkour&autoplay=1')),'/speedster/?map=parkour&autoplay=1');
 assert.equal(legacyGameURL(new URL('https://example.test/projects/speedster/play?map=austin')),null);
});
test('brand media and game assets belong to their respective applications',()=>{
 assert.ok(existsSync(resolve(root,'apps/manta/public/brand/manta-ray-mark.png')));assert.ok(existsSync(resolve(root,'apps/manta/public/brand/speedster-gameplay.mp4')));
 assert.ok(existsSync(resolve(root,'apps/speedster/public/assets/austin/map.json')));assert.ok(existsSync(resolve(root,'apps/speedster/public/assets/human/Superhero.glb')));assert.ok(existsSync(resolve(root,'packages/ui/public/fonts/inter-tight-latin.woff2')));
});
test('the root API delegates to the game-owned multiplayer handler',()=>{
 assert.ok(existsSync(resolve(root,'apps/speedster/api/room.js')));assert.match(readFileSync(resolve(root,'api/room.js'),'utf8'),/apps\/speedster\/api\/room/);
});
