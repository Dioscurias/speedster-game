import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {REPO_ROOT,sharedUIPlugin} from '../../scripts/vite-shared.mjs';
const app=fileURLToPath(new URL('.',import.meta.url));
export default defineConfig(({mode,command})=>({root:app,base:mode==='integrated'?'/speedster/':'/',publicDir:mode==='integrated'&&command==='build'?false:resolve(app,'public'),cacheDir:resolve(REPO_ROOT,'node_modules/.vite-speedster'),server:{port:5174,fs:{allow:[REPO_ROOT]}},build:{outDir:resolve(app,'dist'),emptyOutDir:true},plugins:[sharedUIPlugin({copyFonts:mode!=='integrated'})]}));
