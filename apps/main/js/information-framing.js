const add=(a,b,k=1)=>a.map((v,i)=>v+b[i]*k);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const norm=a=>{const n=Math.hypot(...a)||1;return a.map(v=>v/n);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];

// Fit each subtitle angle independently. No per-frame geometry work.
export function fitInformationShot(shot,points,{tanX,tanY,fill=.9,rotate=false}){
  if(!points.length)return shot;
  const base=norm(add(shot.pos,shot.target,-1));
  function fit(angle){
    const c=Math.cos(angle),s=Math.sin(angle);
    const forward=[base[0]*c+base[2]*s,base[1],base[2]*c-base[0]*s];
    const right=norm(cross([0,1,0],forward)),up=cross(forward,right);
    let target=[...shot.target],distance=1;
    let extents;
    for(let pass=0;pass<7;pass++){
      const projected=points.map(p=>{const q=add(p,target,-1);return [dot(q,right),dot(q,up),dot(q,forward)];});
      distance=1;
      for(const [x,y,z] of projected)distance=Math.max(distance,z+Math.max(Math.abs(x)/(tanX*fill),Math.abs(y)/(tanY*fill)));
      let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;
      for(const [x,y,z] of projected){const w=distance-z;x0=Math.min(x0,x/w);x1=Math.max(x1,x/w);y0=Math.min(y0,y/w);y1=Math.max(y1,y/w);}
      extents={x0,x1,y0,y1};
      if(pass<6)target=add(add(target,right,(x0+x1)*distance*.5),up,(y0+y1)*distance*.5);
    }
    return {shot:{target,pos:add(target,forward,distance)},score:(extents.x1-extents.x0)*(extents.y1-extents.y0)/(tanX*tanY)};
  }
  const candidates=(rotate?[-Math.PI/9,0,Math.PI/9]:[0]).map(fit);
  // Small angle changes only, and only when they materially improve occupancy.
  let best=candidates[rotate?1:0];
  for(const candidate of candidates)if(candidate.score>best.score*1.08)best=candidate;
  return best.shot;
}
