import {cameraSweep} from '../game.js';
import {clamp} from './flight-physics.js';
import {FLIGHT as C} from './flight-config.js';

export function stabilizeFlightCamera(camera,target,w){
 if(w.hero!=='atlas'||!w.flying)return;
 camera.position.y=clamp(camera.position.y,target.y-C.cameraHeightLag,target.y+C.cameraHeightLag);
}

export function followHeroCamera(camera,target,w,collider,dt){
 const anchor=w.y+1.4;
 camera.position.lerp(target,1-Math.exp(-dt*(w.flying?C.cameraEase:10)));
 stabilizeFlightCamera(camera,target,w);
 if(w.phasing)return;
 const {x,y,z}=camera.position;
 const fraction=cameraSweep(w.x,w.z,anchor,x,y,z,collider);
 camera.position.set(x*fraction,anchor+(y-anchor)*fraction,z*fraction);
}

export function bankCamera(camera,w,reduced){
 if(w.hero==='atlas'&&w.flying&&!reduced)camera.rotateZ(clamp((w.flightBank||0)/C.maxBank,-1,1)*C.cameraRoll);
}
