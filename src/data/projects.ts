export type Project = {
 slug:string; code:string; name:string; description:string; category:string;
 status:string|null; stage:string|null; image:string|null; video?:string|null;
 link:string|null; stack?:string[]; links?:{label:string;url:string}[]; featured:boolean;
};

// Add one entry here to create its tile, detail route, and social image.
// Unknown facts stay null. The renderer omits them.
export const projects:Project[] = [
 {slug:'speedster',code:'MR-001',name:'Speedster',description:'Run at superhuman speed through real city maps, Austin first.',category:'Browser game',status:null,stage:null,image:'/brand/speedster-poster.jpg',video:'/brand/speedster-gameplay.mp4',link:'/projects/speedster/play',featured:true},
 {slug:'burkit',code:'MR-002',name:'Burkit',description:'An insurtech venture.',category:'Insurtech',status:null,stage:null,image:null,link:null,featured:false},
 {slug:'openclaw',code:'MR-003',name:'OpenClaw',description:'An AI agent orchestration framework.',category:'AI framework',status:null,stage:null,image:null,link:null,featured:false},
 {slug:'orny-ai',code:'MR-004',name:'orny.ai',description:'An AI auditing tool.',category:'AI auditing',status:null,stage:null,image:null,link:null,featured:false}
];
