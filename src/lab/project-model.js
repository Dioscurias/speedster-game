import {projects,PLACEHOLDER} from '../data/projects.ts';
export const STAGES=['Idea','Prototype','Beta','Live'];
export const STATUSES=['Live','Beta','Prototype','Research',PLACEHOLDER];
export const GAME_PATH='/projects/speedster/play';
export function filterProjects(list,status='All'){return status==='All'?list:list.filter(project=>project.status===status);}
export function stageGroups(list){return {stages:STAGES.map(name=>({name,projects:list.filter(project=>project.stage===name)})),pending:list.filter(project=>!STAGES.includes(project.stage))};}
export function nextProject(project,list=projects){return list[(list.findIndex(item=>item.slug===project.slug)+1)%list.length];}
export function projectRoutes(list=projects){return ['/', '/projects','/about',...list.map(project=>`/projects/${project.slug}`),GAME_PATH];}
export function resolveRoute(path,list=projects){
 const clean=path.split('?')[0].replace(/\/+$/,'')||'/';
 if(clean==='/')return {type:'home'};if(clean==='/projects')return {type:'projects'};if(clean==='/about')return {type:'about'};
 if(clean===GAME_PATH||clean==='/play')return {type:'play',project:list.find(project=>project.slug==='speedster')};
 const project=list.find(project=>clean===`/projects/${project.slug}`);return project?{type:'project',project}:{type:'not-found'};
}
export function escapeHTML(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
export function safeURL(value){return value!==PLACEHOLDER&&(/^(https?:\/\/|\/[^/])/.test(value))?value:null;}
