import test from 'node:test';
import assert from 'node:assert/strict';
import {createInformationCamera} from '../apps/main/js/information-camera.js';

const target=[3,4,5];
const options={pos:[23,24,25],target,targets:[target,[3,4,-12],[-8,4,18]],right:[Math.SQRT1_2,0,-Math.SQRT1_2],up:[-.408248,.816497,-.408248],tanX:1.2,tanY:.5};
for(const mode of ['plan','detail','overview','joint']){
  test(`${mode}: starts at the fitted shot and keeps moving without unbounded drift`,()=>{
    const sample=createInformationCamera({...options,mode});
    const initial=sample(0);
    assert.deepEqual(initial.pos,options.pos);
    assert.deepEqual(initial.target,target);
    const positions=[];
    for(let frame=1;frame<=36000;frame++){
      const shot=sample(frame/60);
      assert.equal(shot,initial,'reuse the same output without frame allocations');
      assert.ok([...shot.pos,...shot.target].every(Number.isFinite));
      const radius=Math.hypot(...shot.pos.map((v,i)=>v-shot.target[i]));
      const fittedRadius=Math.hypot(...options.pos.map((v,i)=>v-target[i]));
      assert.ok(radius>=fittedRadius*.999&&radius<=fittedRadius*1.025,'maintain fitted distance');
      if(mode!=='plan'&&mode!=='joint')assert.deepEqual(shot.target,target,'keep the highlighted component in focus');
      if(frame%300===0)positions.push([...shot.pos]);
    }
    assert.ok(positions.every((p,i)=>!i||Math.hypot(...p.map((v,k)=>v-positions[i-1][k]))>.01));
  });
}
test('joint: translates between three spatial joints without changing viewing angle or zoom',()=>{
  const sample=createInformationCamera({...options,mode:'joint'});
  const views=[];
  let previous=null,maxStep=0;
  for(let frame=0;frame<=540;frame++){
    const shot=sample(frame/60);
    for(let i=0;i<3;i++)assert.ok(Math.abs(shot.pos[i]-shot.target[i]-(options.pos[i]-target[i]))<1e-10,'fixed eye-to-target vector');
    if(frame%180===0){
      const expected=options.targets[(frame/180)%3];
      assert.ok(Math.hypot(...shot.target.map((v,i)=>v-expected[i]))<1e-9,'visit the actual spatial point');
    }
    if(previous)maxStep=Math.max(maxStep,Math.hypot(...shot.pos.map((v,i)=>v-previous[i])));
    previous=[...shot.pos];
    if(frame%180===0)views.push([...shot.pos]);
  }
  assert.ok(Math.hypot(...views[0].map((v,i)=>v-views[3][i]))<1e-9,'nine-second loop closes');
  for(let i=0;i<3;i++)assert.ok(Math.hypot(...views[i].map((v,k)=>v-views[(i+1)%3][k]))>1);
  assert.ok(maxStep<1,'no jumps at view boundaries');
});
for(const mode of ['detail','overview']){
  const oneWaySeconds=mode==='detail'?2:8;
  test(`${mode}: stays within a 180-degree sweep, ${oneWaySeconds} seconds between endpoints`,()=>{
    const sample=createInformationCamera({...options,mode});
    const angles=[];
    for(let frame=0;frame<=1200;frame++){
      const shot=sample(frame/60);
      const x=shot.pos[0]-target[0],z=shot.pos[2]-target[2];
      const angle=Math.atan2(x-z,x+z);
      assert.ok(Math.abs(angle)<=Math.PI/2+1e-10,'never completes a full rotation');
      assert.equal(shot.pos[1],options.pos[1]);
      angles.push(angle);
    }
    const first=Math.round((.2+oneWaySeconds/2)*60);
    const second=first+oneWaySeconds*60;
    assert.ok(Math.abs(angles[first]-Math.PI/2)<1e-9);
    assert.ok(Math.abs(angles[second]+Math.PI/2)<1e-9);
    assert.ok(angles[first+1]<angles[first]&&angles[second+1]>angles[second],'reverse at both endpoints');
  });
}
test('plan view preserves the camera direction / horizontal long axis',()=>{
  const sample=createInformationCamera({...options,mode:'plan'});
  for(let frame=0;frame<2400;frame++){
    const shot=sample(frame/60);
    const offsets=shot.pos.map((v,i)=>v-shot.target[i]);
    assert.ok(Math.abs(offsets[0]-offsets[1])<1e-10);
    assert.ok(Math.abs(offsets[1]-offsets[2])<1e-10);
  }
});
test('pause holds the shot and a background time gap cannot jump the camera',()=>{
  const sample=createInformationCamera({...options,mode:'detail'});
  const reference=createInformationCamera({...options,mode:'detail'});
  for(let frame=0;frame<600;frame++){sample(frame/60);reference(frame/60);}
  const before=structuredClone(sample(10));
  reference(10);
  assert.deepEqual(sample(50,true),before);
  reference(50,true);
  const resumed=sample(1000);
  const normalFrame=reference(50.05);
  // A long background gap advances no farther than the existing 50 ms cap,
  // independent of the deliberately adjustable presentation speed.
  assert.ok(Math.hypot(...resumed.pos.map((v,i)=>v-normalFrame.pos[i]))<1e-10);
});
