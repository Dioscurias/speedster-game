import {defineConfig} from 'vite';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Resvg} from '@resvg/resvg-js';
import {renderPage} from './src/lab/pages.js';
import {projectRoutes} from './src/lab/project-model.js';
import {seoHead,socialImages,ogSVG,SITE_ORIGIN} from './src/lab/seo.js';
import {REPO_ROOT,sharedUIPlugin,speedsterDevelopmentPlugin} from '../../scripts/vite-shared.mjs';
const app=fileURLToPath(new URL('.',import.meta.url));
function documentFor(html,path){if(!html.includes('<!--manta-page-start-->'))throw new Error('Static page template markers are missing.');return html.replace(/<!--manta-seo-start-->[\s\S]*?<!--manta-seo-end-->/,`<!--manta-seo-start-->${seoHead(path)}<!--manta-seo-end-->`).replace(/<!--manta-page-start-->[\s\S]*?<!--manta-page-end-->/,`<!--manta-page-start-->${renderPage(path)}<!--manta-page-end-->`);}
function pages(){let output;return {name:'manta-ray-static-pages',configResolved(config){output=resolve(config.root,config.build.outDir);},transformIndexHtml:{order:'pre',handler(html,context){return html.includes('<!--manta-page-start-->')?documentFor(html,new URL(context.originalUrl||context.path,'http://localhost').pathname):html;}},writeBundle(){
 const template=readFileSync(resolve(output,'index.html'),'utf8');for(const path of projectRoutes()){const file=resolve(output,path==='/'?'index.html':path.slice(1)+'.html');mkdirSync(dirname(file),{recursive:true});writeFileSync(file,documentFor(template,path));}writeFileSync(resolve(output,'404.html'),documentFor(template,'/404'));
 const images=resolve(output,'og');mkdirSync(images,{recursive:true});const logo='data:image/png;base64,'+readFileSync(resolve(app,'public/brand/manta-ray-mark.png')).toString('base64');for(const {slug,project} of socialImages()){const image=new Resvg(ogSVG(project,logo),{font:{loadSystemFonts:false,fontFiles:[resolve(REPO_ROOT,'scripts/fonts/inter-tight-variable.ttf'),resolve(REPO_ROOT,'scripts/fonts/ibm-plex-mono-regular.ttf')],defaultFontFamily:'Inter Tight'}}).render().asPng();writeFileSync(resolve(images,slug+'.png'),image);}
 writeFileSync(resolve(output,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+projectRoutes().map(path=>'<url><loc>'+SITE_ORIGIN+path+'</loc></url>').join('')+'</urlset>');writeFileSync(resolve(output,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+SITE_ORIGIN+'/sitemap.xml\n');
}};}
export default defineConfig(({mode})=>({root:app,publicDir:resolve(app,'public'),cacheDir:resolve(REPO_ROOT,'node_modules/.vite-manta'),server:{fs:{allow:[REPO_ROOT]}},build:{outDir:resolve(app,'dist'),emptyOutDir:true},plugins:[sharedUIPlugin(),pages(),...(mode==='standalone'?[]:[speedsterDevelopmentPlugin()])]}));
