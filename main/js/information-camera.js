// Camera-only motion: no geometry scans, extra render loop or per-frame allocations.
// The fitted shot is the anchor, so motion never accumulates into a drifting camera.
const SWING_RANGE_DEGREES=180; // Total sweep: 90 degrees to either side of the focused view.
const SWING_ONE_WAY_SECONDS={detail:2,overview:8};
const JOINT_LEG_SECONDS=3;
export function createInformationCamera({pos, target, right, up, mode, tanX, tanY,targets}) {
  const offset=pos.map((v,i)=>v-target[i]);
  const distance=Math.hypot(...offset);
  const oneWaySeconds=SWING_ONE_WAY_SECONDS[mode]??8;
  const shot={pos:[...pos],target:[...target]};
  // Translate eye and target together between actual spatial joints, without orbiting.
  const jointStops=mode==='joint'?(targets?.length?targets:[target]).map(p=>[...p]):null;
  let elapsed=0,lastTime=null;
  return (time,paused=false)=>{
    if(lastTime!==null&&!paused)elapsed+=Math.max(0,Math.min(.05,time-lastTime));
    lastTime=time;
    if(jointStops){
      if(elapsed===0)return shot;
      const progress=(elapsed/JOINT_LEG_SECONDS)%jointStops.length;
      const index=Math.floor(progress),u=progress-index,k=u*u*(3-2*u);
      const a=jointStops[index],b=jointStops[(index+1)%jointStops.length];
      for(let i=0;i<3;i++){
        shot.target[i]=a[i]+(b[i]-a[i])*k;
        shot.pos[i]=shot.target[i]+offset[i];
      }
      return shot;
    }
    const ramp=Math.min(1,elapsed/.4);
    const ease=ramp*ramp*(3-2*ramp);
    // Short smooth start; a sine sweep eases into each reversal without a pause.
    const motionTime=elapsed<.4?.4*(ramp**3-.5*ramp**4):elapsed-.2;
    const phase=elapsed*Math.PI*2/9;
    const lateral=Math.sin(phase)*ease;
    const vertical=Math.sin(phase*.73)*ease;
    const dolly=1+.012*(1-Math.cos(phase*.61))*ease;
    if(mode==='plan'){
      // Translate eye and target together: keep the building's long axis horizontal.
      for(let i=0;i<3;i++){
        const shift=distance*.018*(right[i]*tanX*lateral+up[i]*tanY*vertical);
        shot.target[i]=target[i]+shift;
        shot.pos[i]=target[i]+shift+offset[i]*dolly;
      }
    }else{
      const angle=(SWING_RANGE_DEGREES*Math.PI/360)*Math.sin(motionTime*Math.PI/oneWaySeconds);
      const c=Math.cos(angle),s=Math.sin(angle);
      shot.pos[0]=target[0]+offset[0]*c+offset[2]*s;
      shot.pos[1]=target[1]+offset[1];
      shot.pos[2]=target[2]+offset[2]*c-offset[0]*s;
    }
    return shot;
  };
}
