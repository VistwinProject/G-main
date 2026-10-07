import assert from 'node:assert/strict';
import {planMinuteShow} from '../apps/main/js/show-timing.js';
const step={introHold:2.2,routeIntroHold:1.2,routeClearHold:3.5,outroHold:2.2};
for(const lengths of [[17.6,11.23,8.86,6,12.82],[40,12,9,7,13],[15,8,6,5,9]]){
  const p=planMinuteShow(lengths,step);
  assert.ok(Math.abs(p.durations.reduce((a,b)=>a+b,0)-60)<1e-9);
  p.speech.forEach((n,i)=>assert.ok(Math.abs(n*p.rate-lengths[i])<1e-9));
  assert.ok(p.durations[2]>=p.speech[4]+step.outroHold);
}
assert.throws(()=>planMinuteShow([NaN,1,1,1,1],step));
console.log('PASS: 60-second schedule, uniform rate, complete speech, final hold, invalid metadata');
