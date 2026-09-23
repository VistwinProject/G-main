import test from 'node:test';
import assert from 'node:assert/strict';
import {createCaptionDirector,buildCaptionShots,createCaptionProgress} from '../apps/main/js/information-story.js';

const cue=(index,run=1)=>({page:'prevention',topic:'防火區劃',clip:'fire.mp3',run,index});
test('queues the current sentence during loading / top-view prelude, never replays stale sentences',()=>{
  const calls=[],director=createCaptionDirector({topic:'防火區劃',onShot:c=>calls.push(c.index)});
  director.accept(cue(0));director.accept(cue(1));
  assert.deepEqual(calls,[]);
  director.ready();director.ready();
  assert.deepEqual(calls,[1]);
});
test('only sentence changes advance shots; replay and backward seeking select the correct shot',()=>{
  const calls=[],director=createCaptionDirector({topic:'防火區劃',onShot:c=>calls.push([c.run,c.index])});
  director.ready();director.accept(cue(0));
  for(let i=0;i<300;i++)director.accept(cue(0)); // timeupdate / pause / metadata updates
  director.accept(cue(1));director.accept(cue(2));director.accept(cue(0));director.accept(cue(0,2));
  assert.deepEqual(calls,[[1,0],[1,1],[1,2],[1,0],[2,0]]);
});
test('other pages/topics and late events after manual control or navigation cannot move the camera',()=>{
  const calls=[],director=createCaptionDirector({topic:'防火區劃',onShot:c=>calls.push(c.index)});
  director.ready();
  director.accept({...cue(0),page:'home'});director.accept({...cue(0),topic:'窗框與玻璃'});
  director.accept(cue(-1));director.accept(cue(.5));
  assert.deepEqual(calls,[]);
  director.accept(cue(0));director.cancel();director.accept(cue(1));director.ready();
  assert.deepEqual(calls,[0]);
});
const shot={pos:[0,40,1],target:[0,0,0]};
test('backup equipment starts top-down, returns to full overview on sentence two',()=>{
  const overview={pos:[20,15,20],target:[0,0,0]},topShot={pos:[-.5,30,0],target:[0,0,0]};
  const shots=buildCaptionShots({shot:overview,kind:'backup',topShot});
  assert.deepEqual(shots[0],topShot);assert.deepEqual(shots[1],overview);
  assert.notDeepEqual(shots[2].pos,shots[1].pos);
  assert.deepEqual(shots[2].target,overview.target);
});
test('resize re-prepares the current cue without cancelling future subtitles',()=>{
  const calls=[],director=createCaptionDirector({topic:'防火區劃',onShot:c=>calls.push(c.index)});
  director.accept(cue(0));director.ready();director.prepare();director.accept(cue(1));
  assert.deepEqual(calls,[0]);director.ready();director.accept(cue(2));
  assert.deepEqual(calls,[0,1,2]);director.prepare();director.ready();
  assert.deepEqual(calls,[0,1,2,2]);
});
test('only completed matching narration returns to overview, once; replay remains available',()=>{
  const calls=[],director=createCaptionDirector({topic:'防火區劃',onShot:c=>calls.push(c.index),onEnd:()=>calls.push('overview')});
  director.ready();director.accept(cue(0));director.accept(cue(1));director.accept(cue(2));
  assert.deepEqual(calls,[0,1,2]);
  director.finish({...cue(2),topic:'窗框與玻璃'});director.finish(cue(2,99));
  assert.deepEqual(calls,[0,1,2]);
  director.finish(cue(2));director.finish(cue(2));
  assert.deepEqual(calls,[0,1,2,'overview']);
  director.accept(cue(0,2));director.accept(cue(2,2));director.finish(cue(2,2));
  assert.deepEqual(calls,[0,1,2,'overview',0,2,'overview']);
});
test('completion during model loading waits for readiness; cancelled topics never return',()=>{
  const calls=[],director=createCaptionDirector({topic:'防火區劃',onShot:()=>calls.push('shot'),onEnd:()=>calls.push('overview')});
  director.accept(cue(2));director.finish(cue(2));assert.deepEqual(calls,[]);
  director.ready();assert.deepEqual(calls,['overview']);
  director.accept(cue(0,2));director.cancel();director.finish(cue(0,2));
  assert.deepEqual(calls,['overview','shot']);
});
test('fire compartment: three enlarged spatial views preserve horizontal top-view orientation',()=>{
  const shots=buildCaptionShots({shot,kind:'compartment',right:[1,0,0],span:40});
  assert.equal(shots.length,3);
  const [a,b,c]=shots.map(s=>s.target);
  assert.ok(a[0]<b[0]&&b[0]<c[0]);
  assert.ok(b[2]<a[2]&&a[2]<c[2],'middle stop is above the corridors, last is lower');
  assert.ok(Math.abs((b[0]-a[0])*(c[2]-a[2])-(b[2]-a[2])*(c[0]-a[0]))>1,'stops must not be collinear');
  assert.ok(shots.every(s=>s.target[1]===0),'translation stays on the horizontal plane');
  shots.forEach(s=>s.pos.forEach((v,i)=>assert.ok(Math.abs(v-s.target[i]-(shot.pos[i]-shot.target[i])*.55)<1e-10)));
});
test('fire stops follow rotated footprint bounds independently of perspective framing shifts',()=>{
  const footprint={origin:[10,40,20],up:[-1,0,0],minX:-20,maxX:20,minY:-10,maxY:10};
  const shots=buildCaptionShots({shot,kind:'compartment',right:[0,0,1],footprint});
  const marks=[[.16,.52],[.52,.28],[.89,.65]];
  shots.forEach((s,i)=>{
    assert.ok(Math.abs(s.target[0]-(10-(10-marks[i][1]*20)))<1e-10);
    assert.equal(s.target[1],40);
    assert.ok(Math.abs(s.target[2]-(20-20+marks[i][0]*40))<1e-10);
  });
});
test('beam/column: subtitle shots visit three different joints with identical angle and distance',()=>{
  const targets=[[-8,40,-20],[0,40,-35],[-10,40,-5]];
  const shots=buildCaptionShots({shot,kind:'joint',targets});
  assert.deepEqual(shots.map(s=>s.target),targets);
  shots.forEach(s=>s.pos.forEach((v,i)=>assert.equal(v-s.target[i],shot.pos[i]-shot.target[i])));
});
test('sparse or merged joint geometry still provides three distinct spatial shots',()=>{
  for(const targets of [[],[[0,0,0]],[[0,0,0],[0,0,0]],[[0,0,0],[2,0,0]]]){
    const shots=buildCaptionShots({shot,kind:'joint',targets,span:20});
    assert.equal(shots.length,3);
    assert.equal(new Set(shots.map(s=>JSON.stringify(s.target))).size,3);
    assert.ok(shots.every(s=>[...s.target,...s.pos].every(Number.isFinite)));
  }
});
test('window and other topics: three finite shots, without timed loops or changing focus',()=>{
  for(const kind of ['detail','overview','plan']){
    const shots=buildCaptionShots({shot:{pos:[20,15,20],target:[0,0,0]},kind,span:40});
    assert.equal(shots.length,3);
    assert.ok(shots.every(s=>[...s.pos,...s.target].every(Number.isFinite)));
    assert.notDeepEqual(shots[0].pos,shots[1].pos);
    if(kind!=='plan')assert.ok(shots.every(s=>s.target.every(v=>v===0)));
  }
});
test('floor/drainage begins with the unchanged full view, then two closer spatial views',()=>{
  const shots=buildCaptionShots({shot,kind:'drainage',right:[1,0,0],span:40});
  assert.deepEqual(shots[0],shot);
  for(const s of shots.slice(1)){
    assert.ok(Math.hypot(...s.pos.map((v,i)=>v-s.target[i]))<Math.hypot(...shot.pos));
  }
  assert.notDeepEqual(shots[1].target,shots[2].target);
});
test('camera travels for the sentence duration minus 1.5 seconds and then holds',()=>{
  const clock={time:0,start:0,end:8,ready:true};
  const sample=createCaptionProgress(()=>clock);
  assert.equal(sample().progress,0);
  clock.time=3.25;assert.equal(sample().progress,.5);
  for(let i=0;i<120;i++)assert.equal(sample().progress,.5,'paused media cannot move the camera');
  clock.time=6.5;assert.equal(sample().progress,1);
  clock.time=8;assert.equal(sample().progress,1);
});
test('late loading / top-view prelude uses remaining media time and waits for audio metadata',()=>{
  const clock={time:3,start:0,end:10,ready:false};
  const sample=createCaptionProgress(()=>clock);
  assert.equal(sample().ready,false);
  clock.time=4;clock.ready=true;assert.equal(sample().progress,0);
  clock.time=6.25;assert.equal(sample().progress,.5);
  clock.time=8.5;assert.equal(sample().progress,1);
});
test('short sentences and stale audio runs are bounded; backward seeking follows media time',()=>{
  let clock={time:0,start:0,end:1,ready:true};
  assert.equal(createCaptionProgress(()=>clock)().progress,1);
  clock={time:0,start:0,end:5,ready:true};
  const sample=createCaptionProgress(()=>clock);sample();
  clock.time=3.5;assert.equal(sample().progress,1);
  clock.time=1.75;assert.equal(sample().progress,.5);
  clock=null;assert.equal(sample().valid,false);
});
