// D3 force layout runs outside the UI thread. It never fetches or persists data.
import {forceSimulation, forceManyBody, forceLink, forceCenter, forceCollide} from 'd3-force';
let simulation, nodes=[], timer=null, paused=false, generation=0, quiet=false, tuning={};
function publish(done=false){
 const points=new Float32Array(nodes.length*2);
 nodes.forEach((n,i)=>{points[i*2]=n.x;points[i*2+1]=n.y;});
 postMessage({type:'positions',generation,points,done},[points.buffer]);
}
function schedule(){if(timer===null&&!paused)timer=setTimeout(run,0);}
function run(){
 timer=null;if(paused||!simulation)return;
 simulation.tick(quiet?160:8);
 const done=simulation.alpha()<.012;
 if(!quiet||done)publish(done);
 if(!done)schedule();
}
function tune(value){
 tuning={...tuning,...value};
 simulation.force('charge').strength(-170*tuning.repulsion);
 simulation.force('links').distance(e=>e.group?tuning.distance*1.5:tuning.distance);
 simulation.alpha(Math.max(simulation.alpha(),.38));if(paused)publish(true);else schedule();
}
onmessage=({data})=>{
 if(data.type==='start'){
  if(timer!==null)clearTimeout(timer);timer=null;generation=data.generation;nodes=data.nodes;
  paused=data.paused;quiet=data.reduced;tuning=data.tuning;
  simulation=forceSimulation(nodes).stop().alpha(data.warm ? .15 : 1).alphaDecay(.026).velocityDecay(.34)
   .force('charge',forceManyBody().strength(-170*tuning.repulsion).theta(.9).distanceMax(2000))
   .force('links',forceLink(data.edges).id(n=>n.id).distance(e=>e.group?tuning.distance*1.5:tuning.distance).strength(e=>e.group ? .035 : .16))
   .force('collision',forceCollide(n=>n.radius+5).iterations(1))
   .force('center',forceCenter(0,0).strength(.025));
  if(paused)publish(true);else schedule();
 }else if(data.type==='pause'){
  paused=data.value;if(paused){if(timer!==null)clearTimeout(timer);timer=null;publish(true);}else{simulation.alpha(Math.max(.2,simulation.alpha()));schedule();}
 }else if(data.type==='tune'&&simulation)tune(data.value);
 else if(data.type==='drag'){
  const n=nodes[data.index];if(!n)return;
  n.fx=data.release?null:data.x;n.fy=data.release?null:data.y;
  if(!data.release){n.x=data.x;n.y=data.y;n.vx=n.vy=0;}
  simulation.alpha(Math.max(simulation.alpha(),.25));schedule();
 }
};
