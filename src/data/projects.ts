export const PLACEHOLDER = 'TBD';

export type Project = {
 slug:string; code:string; name:string; tagline:string; category:string;
 status:string; stage:string; year:string|number; summary:string; stack:string[];
 links:{label:string;url:string}[]; media:{cover:string;video:string}; featured:boolean;
};

// One entry adds a row, pipeline dot, project page and social preview at build time.
export const projects:Project[] = [
 {
  slug:'speedster',code:'MR-001',name:'Speedster',
  tagline:'Run at superhuman speed through real city maps, Austin first.',category:'Browser game',
  status:PLACEHOLDER,stage:PLACEHOLDER,year:PLACEHOLDER,
  summary:'Speedster is a browser game for running at superhuman speed through real city maps, beginning with Austin.',
  stack:[PLACEHOLDER],links:[{label:'Play',url:'/projects/speedster/play'}],
  media:{cover:PLACEHOLDER,video:PLACEHOLDER},featured:true
 },
 {
  slug:'burkit',code:'MR-002',name:'Burkit',tagline:'An insurtech venture.',category:'Insurtech',
  status:PLACEHOLDER,stage:PLACEHOLDER,year:PLACEHOLDER,summary:'Burkit is an insurtech venture.',
  stack:[PLACEHOLDER],links:[{label:PLACEHOLDER,url:PLACEHOLDER}],
  media:{cover:PLACEHOLDER,video:PLACEHOLDER},featured:false
 },
 {
  slug:'openclaw',code:'MR-003',name:'OpenClaw',tagline:'An AI agent orchestration framework.',category:'AI framework',
  status:PLACEHOLDER,stage:PLACEHOLDER,year:PLACEHOLDER,summary:'OpenClaw is an AI agent orchestration framework.',
  stack:[PLACEHOLDER],links:[{label:PLACEHOLDER,url:PLACEHOLDER}],
  media:{cover:PLACEHOLDER,video:PLACEHOLDER},featured:false
 },
 {
  slug:'orny-ai',code:'MR-004',name:'orny.ai',tagline:'An AI auditing tool.',category:'AI auditing',
  status:PLACEHOLDER,stage:PLACEHOLDER,year:PLACEHOLDER,summary:'orny.ai is an AI auditing tool.',
  stack:[PLACEHOLDER],links:[{label:PLACEHOLDER,url:PLACEHOLDER}],
  media:{cover:PLACEHOLDER,video:PLACEHOLDER},featured:false
 }
];

export const contact={email:PLACEHOLDER,socials:[{label:PLACEHOLDER,url:PLACEHOLDER}]};
export const labLog=projects.slice(0,5).map(project=>({date:PLACEHOLDER,code:project.code,text:project.tagline,name:project.name,slug:project.slug}));
