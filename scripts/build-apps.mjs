import {build} from 'vite';
import {cpSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url)),output=resolve(root,'dist');
await build({configFile:resolve(root,'apps/manta/vite.config.js'),build:{outDir:output,emptyOutDir:true}});
await build({configFile:resolve(root,'apps/speedster/vite.config.js'),mode:'integrated',build:{outDir:resolve(output,'speedster'),emptyOutDir:true}});
cpSync(resolve(root,'apps/speedster/public'),output,{recursive:true});
console.log('Built Manta Ray at / and Speedster at /speedster/.');
