import {FLIGHT as C} from './flight-config.js';

const airborne=['HOVER','CRUISE','BOOST','BRAKE','GLIDE','WALL_CONTACT','DIVE_SLAM'];
export const TRANSITIONS=Object.freeze({
 GROUNDED:['TAKEOFF','HOVER','DIVE_SLAM'],
 TAKEOFF:[...airborne,'LANDING','GROUNDED'],
 LANDING:['GROUNDED','TAKEOFF','HOVER','DIVE_SLAM'],
 HOVER:['CRUISE','BOOST','BRAKE','GLIDE','WALL_CONTACT','DIVE_SLAM','LANDING','GROUNDED'],
 CRUISE:['HOVER','BOOST','BRAKE','GLIDE','WALL_CONTACT','DIVE_SLAM','LANDING','GROUNDED'],
 BOOST:['HOVER','CRUISE','BRAKE','GLIDE','WALL_CONTACT','DIVE_SLAM','LANDING','GROUNDED'],
 BRAKE:['HOVER','CRUISE','BOOST','GLIDE','WALL_CONTACT','DIVE_SLAM','LANDING','GROUNDED'],
 GLIDE:['HOVER','CRUISE','BOOST','BRAKE','WALL_CONTACT','DIVE_SLAM','LANDING','GROUNDED'],
 WALL_CONTACT:['HOVER','CRUISE','BOOST','BRAKE','GLIDE','DIVE_SLAM','LANDING','GROUNDED'],
 DIVE_SLAM:['HOVER','CRUISE','BOOST','BRAKE','GLIDE','WALL_CONTACT','LANDING','GROUNDED'],
});
export const isFlight=state=>Boolean(TRANSITIONS[state]&&state!=='GROUNDED'&&state!=='LANDING');

const handlers=Object.fromEntries(Object.keys(TRANSITIONS).map(state=>[state,{
 enter(machine){machine.age=0;},
 update(machine,dt){machine.age+=dt;},
 exit(){},
}]));
export function createFlightState(initial='GROUNDED'){
 return {
  state:initial,previous:null,age:0,transitions:[],reason:'',
  update(dt){handlers[this.state].update(this,dt);},
  transition(next,reason){
   if(next===this.state)return false;
   if(!TRANSITIONS[this.state]?.includes(next)){this.reason=`${next} is unavailable from ${this.state}`;return false;}
   handlers[this.state].exit(this);
   this.previous=this.state;
   this.state=next;
   this.reason='';
   handlers[next].enter(this);
   this.transitions.push(`${this.previous} → ${next} · ${reason}`);
   if(this.transitions.length>C.debugHistory)this.transitions.shift();
   return true;
  },
 };
}
