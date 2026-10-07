export function planMinuteShow(lengths,step){
  if(lengths.length!==5||lengths.some(n=>!Number.isFinite(n)||n<=0))throw Error('Invalid narration durations');
  const holds=step.introHold+step.routeIntroHold+1+.44+step.routeClearHold+step.outroHold+.3;
  const rate=Math.max(1,lengths.reduce((a,b)=>a+b,0)/(60-holds));
  const speech=lengths.map(n=>n/rate);
  const durations=[speech[0]+speech[1]+step.introHold,speech[2]+step.routeIntroHold+speech[3]+1+.44+step.routeClearHold];
  durations.push(60-durations[0]-durations[1]);
  return {rate,speech,durations};
}
