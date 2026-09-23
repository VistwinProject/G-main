// One storyboard step per displayed subtitle. No wall-clock scene cycling.
export function createCaptionDirector({topic,onShot,onEnd=()=>{}}){
  let pending=null,prepared=false,cancelled=false,lastKey=null,ended=false,endDelivered=false;
  function flush(){
    if(!prepared||cancelled||!pending)return;
    if(ended){if(!endDelivered){endDelivered=true;onEnd();}return;}
    const key=`${pending.run}:${pending.clip}:${pending.index}`;
    if(key===lastKey)return;
    lastKey=key;onShot(pending);
  }
  return {
    accept(cue){
      if(cancelled||cue?.page!=='prevention'||cue.topic!==topic||!Number.isInteger(cue.index)||cue.index<0)return;
      if(!pending||pending.run!==cue.run||(ended&&pending.index!==cue.index)){ended=false;endDelivered=false;}
      pending=cue;flush();
    },
    finish(cue){
      if(cancelled||cue?.page!=='prevention'||cue.topic!==topic||!pending||cue.run!==pending.run||cue.clip!==pending.clip)return;
      ended=true;flush();
    },
    ready(){prepared=true;flush();},
    prepare(){prepared=false;lastKey=null;},
    cancel(){cancelled=true;pending=null;},
  };
}

// Follow media time, not a fixed-duration timer: pausing also pauses camera travel.
// Late model/audio loading uses the remaining sentence time, never a new full interval.
export function createCaptionProgress(readClock,settleSeconds=1.5){
  let startTime=null;
  const result={valid:true,ready:false,progress:0};
  return ()=>{
    const clock=readClock?.();
    result.valid=!!clock;
    if(!clock)return result;
    result.ready=clock.ready&&Number.isFinite(clock.end)&&Number.isFinite(clock.time);
    if(!result.ready)return result;
    startTime??=clock.time;
    const deadline=Math.max(clock.start,clock.end-settleSeconds);
    result.progress=deadline<=startTime?1:Math.max(0,Math.min(1,(clock.time-startTime)/(deadline-startTime)));
    return result;
  };
}

export function buildCaptionShots({shot,kind,targets=[],right=[1,0,0],span=1,footprint,topShot}){
  const offset=shot.pos.map((v,i)=>v-shot.target[i]);
  if(kind==='backup'){
    const overview=buildCaptionShots({shot,kind:'overview'});
    return [{pos:[...topShot.pos],target:[...topShot.target]},overview[0],overview[2]];
  }
  if(kind==='joint'){
    const stops=targets.filter((target,i)=>!targets.slice(0,i).some(other=>Math.hypot(...target.map((v,j)=>v-other[j]))<.01)).slice(0,3).map(target=>[...target]);
    const center=stops[0]??shot.target;
    // Sparse/merged component geometry may expose fewer than three joints.
    // Fill missing shots with nearby spatial translations, never repeat one shot.
    for(const side of [0,-1,1,-2,2]){
      if(stops.length>=3)break;
      const point=center.map((v,i)=>v+right[i]*Math.max(1,span*.12)*side);
      if(!stops.some(other=>Math.hypot(...point.map((v,i)=>v-other[i]))<.01))stops.push(point);
    }
    return stops.map(target=>({target,pos:target.map((v,i)=>v+offset[i])}));
  }
  if(kind==='drainage')return [
    {pos:[...shot.pos],target:[...shot.target]},
    ...[-1,1].map(side=>{
      const target=shot.target.map((v,i)=>v+right[i]*span*.2*side);
      return {target,pos:target.map((v,i)=>v+offset[i]*.7)};
    }),
  ];
  if(kind==='compartment'){
    // User-marked floor-plan stops: left corridor, upper central room, right corridor.
    // Coordinates are normalized within the building outline; v increases downward.
    const stops=[[.16,.52],[.52,.28],[.89,.65]];
    const bounds=footprint??{origin:shot.target,up:[0,0,-1],minX:-span/2,maxX:span/2,minY:-span/4,maxY:span/4};
    return stops.map(([u,v])=>{
      const x=bounds.minX+u*(bounds.maxX-bounds.minX);
      const y=bounds.maxY-v*(bounds.maxY-bounds.minY);
      const target=bounds.origin.map((value,i)=>value+right[i]*x+bounds.up[i]*y);
      return {target,pos:target.map((value,i)=>value+offset[i]*.55)};
    });
  }
  if(kind==='plan'){
    return [-1,0,1].map(side=>{
      const target=shot.target.map((v,i)=>v+right[i]*span*.12*side);
      return {target,pos:target.map((v,i)=>v+offset[i]*.85)};
    });
  }
  const amplitude=kind==='detail'?Math.PI/4:Math.PI/9;
  return [0,-amplitude,amplitude].map(angle=>{
    const c=Math.cos(angle),s=Math.sin(angle);
    return {target:[...shot.target],pos:[shot.target[0]+offset[0]*c+offset[2]*s,shot.pos[1],shot.target[2]+offset[2]*c-offset[0]*s]};
  });
}
