// UI-only preview: retain hidden engine bindings, expose just the live WebGL canvas.
export function mountGamePreview(){
 document.title='Speedster preview';document.body.className='speedster-preview';
 const originals=[...document.body.children],scene=document.querySelector('#scene,#parkour-scene'),legacy=document.createElement('div');legacy.hidden=true;
 for(const node of originals)legacy.append(node);document.body.append(legacy,scene);
 scene.style.cssText='position:fixed;inset:0;width:100%;height:100%;overflow:hidden';
 document.body.style.cssText='margin:0;overflow:hidden;width:100%;height:100%;background:#000000';
}
