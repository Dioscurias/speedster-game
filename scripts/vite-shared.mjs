import {existsSync,readFileSync,cpSync} from 'node:fs';
import {resolve,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
export const REPO_ROOT=fileURLToPath(new URL('..',import.meta.url));
export function sharedUIPlugin({copyFonts=true}={}){let output;return {name:'shared-ui-assets',configResolved(config){output=resolve(config.root,config.build.outDir);},configureServer(server){server.middlewares.use((request,response,next)=>{
 const url=new URL(request.url,'http://localhost');
 if(url.pathname.startsWith('/shared-ui/')){const file=resolve(REPO_ROOT,'packages/ui',url.pathname.slice(11));if(!file.startsWith(resolve(REPO_ROOT,'packages/ui')+'/'))return next();request.url='/@fs'+file+url.search;return next();}
 if(!/^\/fonts\/[a-zA-Z0-9._-]+$/.test(url.pathname))return next();const file=resolve(REPO_ROOT,'packages/ui/public/fonts',basename(url.pathname));if(!existsSync(file))return next();response.setHeader('Content-Type',file.endsWith('.woff2')?'font/woff2':file.endsWith('.ttf')?'font/ttf':'text/plain');response.setHeader('Cache-Control','no-cache');response.end(readFileSync(file));
});},writeBundle(){if(copyFonts)cpSync(resolve(REPO_ROOT,'packages/ui/public/fonts'),resolve(output,'fonts'),{recursive:true});}};}
export function speedsterDevelopmentPlugin(){return {name:'speedster-development-mount',async configureServer(server){
 const {createServer}=await import('vite');const game=await createServer({configFile:resolve(REPO_ROOT,'apps/speedster/vite.config.js'),mode:'integrated',server:{middlewareMode:true,hmr:{server:server.httpServer,path:'/speedster-hmr'}}});
 server.middlewares.use((request,response,next)=>{const path=new URL(request.url,'http://localhost').pathname;if(path==='/speedster'){response.writeHead(302,{Location:'/speedster/'+(request.url.includes('?')?'?'+request.url.split('?')[1]:'')});response.end();return;}if(path.startsWith('/assets/')){request.url='/speedster'+request.url;game.middlewares(request,response,next);return;}if(path.startsWith('/speedster/'))game.middlewares(request,response,next);else next();});server.httpServer?.once('close',()=>game.close());
}};}
