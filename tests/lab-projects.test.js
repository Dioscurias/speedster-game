import test from 'node:test';
import assert from 'node:assert/strict';

test('all four seed projects preserve unknown fields through one placeholder',async()=>{
 const {projects,PLACEHOLDER}=await import('../src/data/projects.ts');
 assert.deepEqual(projects.map(p=>[p.code,p.name]),[['MR-001','Speedster'],['MR-002','Burkit'],['MR-003','OpenClaw'],['MR-004','orny.ai']]);
 for(const p of projects){for(const field of ['status','stage','year'])assert.equal(p[field],PLACEHOLDER);assert.equal(p.media.cover,PLACEHOLDER);assert.equal(p.media.video,PLACEHOLDER);}
 assert.equal(projects.filter(p=>p.featured).length,1);
});
test('filtering and stage grouping never assign unknown projects an invented stage',async()=>{
 const {projects,PLACEHOLDER}=await import('../src/data/projects.ts');const {filterProjects,stageGroups}=await import('../src/lab/project-model.js');
 assert.equal(filterProjects(projects,'All').length,4);assert.equal(filterProjects(projects,'Live').length,0);assert.equal(filterProjects(projects,PLACEHOLDER).length,4);
 const groups=stageGroups(projects);assert.deepEqual(groups.stages.map(g=>g.name),['Idea','Prototype','Beta','Live']);assert.ok(groups.stages.every(g=>g.projects.length===0));assert.equal(groups.pending.length,4);
 const live={...projects[0],stage:'Live',status:'Live'};assert.equal(stageGroups([live]).stages[3].projects[0],live);
});
test('adding one data entry creates its route, metadata, next-project and row without a registry',async()=>{
 const {projects}=await import('../src/data/projects.ts');const {projectRoutes,resolveRoute,nextProject}=await import('../src/lab/project-model.js');
 const extra={...projects[1],slug:'new-project',code:'MR-005',name:'New project'},list=[...projects,extra];
 assert.ok(projectRoutes(list).includes('/projects/new-project'));assert.equal(resolveRoute('/projects/new-project/',list).project,extra);assert.equal(nextProject(projects.at(-1),list),extra);assert.equal(nextProject(extra,list),list[0]);assert.equal(resolveRoute('/projects/missing',list).type,'not-found');
});
test('project metadata and Organization schema contain no invented legal or business claims',async()=>{
 const {projects}=await import('../src/data/projects.ts');const {pageSEO,organization,ogSVG}=await import('../src/lab/seo.js');
 const seo=pageSEO('/projects/burkit');assert.equal(seo.title,'Burkit | Manta Ray');assert.match(seo.description,/insurtech/);assert.equal(seo.image,'/og/burkit.png');
 assert.deepEqual(Object.keys(organization).sort(),['@context','@type','name']);assert.equal(organization.name,'Manta Ray');assert.ok(ogSVG(projects[0]).includes('Speedster'));
});
test('project components escape content and render missing URLs as text instead of fake links',async()=>{
 const {projects}=await import('../src/data/projects.ts');const {ProjectRow,ProjectPage,StatusChip}=await import('../src/lab/components.js');
 const item={...projects[1],name:'<img src=x onerror=alert(1)>'};assert.ok(ProjectRow(item,1).includes('&lt;img'));assert.equal(ProjectRow(item,1).includes('<img src=x'),false);
 const detail=ProjectPage(projects[1],projects);assert.match(detail,/Problem/);assert.match(detail,/Build/);assert.match(detail,/Result/);assert.equal(detail.includes('href="TBD"'),false);
 assert.match(StatusChip('Live'),/status-live/);assert.equal(StatusChip('Beta').includes('status-live'),false);
});
