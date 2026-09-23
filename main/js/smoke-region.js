// Flood only enclosed free space; an opening to the exterior fails closed.
export function enclosedRegion(blocked,width,height,seed){
  const seen=new Uint8Array(width*height),queue=new Int32Array(width*height);
  const sx=Math.round(seed[0]),sy=Math.round(seed[1]);
  if(sx<0||sy<0||sx>=width||sy>=height||blocked[sy*width+sx])return null;
  let head=0,tail=1,open=false;queue[0]=sy*width+sx;seen[queue[0]]=1;
  while(head<tail){
    const n=queue[head++],x=n%width,y=Math.floor(n/width);
    if(x===0||y===0||x===width-1||y===height-1){open=true;continue;}
    for(const next of [n-1,n+1,n-width,n+width])if(!blocked[next]&&!seen[next]){seen[next]=1;queue[tail++]=next;}
  }
  return open?null:seen;
}
