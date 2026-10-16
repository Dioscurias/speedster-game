import {defineConfig} from 'vite';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {Resvg} from '@resvg/resvg-js';
import {renderPage} from './src/lab/pages.js';
import {projectRoutes} from './src/lab/project-model.js';
import {seoHead,socialImages,ogSVG,SITE_ORIGIN} from './src/lab/seo.js';

function documentFor(html,path){
 if(!html.includes('<!--manta-page-start-->'))throw new Error('Static page template markers are missing.');
 return html.replace(/<!--manta-seo-start-->[\s\S]*?<!--manta-seo-end-->/,`<!--manta-seo-start-->${seoHead(path)}<!--manta-seo-end-->`).replace(/<!--manta-page-start-->[\s\S]*?<!--manta-page-end-->/,`<!--manta-page-start-->${renderPage(path)}<!--manta-page-end-->`);
}
export default defineConfig({plugins:[{
 name:'manta-ray-static-pages',
 transformIndexHtml:{order:'pre',handler(html,context){return html.includes('<!--manta-page-start-->')?documentFor(html,new URL(context.originalUrl||context.path,'http://localhost').pathname):html;}},
 writeBundle(){
  const output=resolve('dist'),template=readFileSync(resolve(output,'index.html'),'utf8');
  for(const path of projectRoutes()){
   const file=resolve(output,path==='/'?'index.html':path.slice(1)+'.html');mkdirSync(dirname(file),{recursive:true});writeFileSync(file,documentFor(template,path));
  }
  writeFileSync(resolve(output,'404.html'),documentFor(template,'/404'));
  const images=resolve(output,'og');mkdirSync(images,{recursive:true});
  for(const {slug,project} of socialImages()){
   const svg=ogSVG(project);
   const image=new Resvg(svg,{font:{loadSystemFonts:false,fontFiles:[resolve('public/fonts/barlow-condensed-600.ttf'),resolve('public/fonts/barlow-condensed-700.ttf'),resolve('scripts/fonts/jetbrains-mono-regular.ttf'),resolve('scripts/fonts/inter-variable.ttf')],defaultFontFamily:'Inter'}}).render().asPng();
   writeFileSync(resolve(images,slug+'.png'),image);
  }
  writeFileSync(resolve(output,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+projectRoutes().map(path=>'<url><loc>'+SITE_ORIGIN+path+'</loc></url>').join('')+'</urlset>');
  writeFileSync(resolve(output,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+SITE_ORIGIN+'/sitemap.xml\n');
 }
}]});
