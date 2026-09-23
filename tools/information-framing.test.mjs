import test from 'node:test';
import assert from 'node:assert/strict';
import {fitInformationShot} from '../apps/main/js/information-framing.js';
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const norm=a=>a.map(v=>v/Math.hypot(...a));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
test('all orbit angles center the subject and fill one dimension without clipping',()=>{
  const points=[];
  for(const x of [-15,-10])for(const y of [35,45])for(const z of [-25,-14])points.push([x,y,z]);
  for(const aspect of [1.3,2,3])for(const angle of [-.8,0,.8]){
    const tanY=.4,tanX=tanY*aspect;
    const shot={target:[-12.5,40,-19.5],pos:[20*Math.cos(angle),65,20*Math.sin(angle)]};
    const result=fitInformationShot(shot,points,{tanX,tanY});
    const forward=norm(sub(result.pos,result.target)),right=norm(cross([0,1,0],forward)),up=cross(forward,right);
    const coords=points.map(p=>{const q=sub(p,result.pos),depth=-dot(q,forward);return [dot(q,right)/depth/tanX,dot(q,up)/depth/tanY];});
    const xs=coords.map(p=>p[0]),ys=coords.map(p=>p[1]);
    assert.ok(Math.max(...xs)<.91&&Math.min(...xs)>-.91);
    assert.ok(Math.max(...ys)<.91&&Math.min(...ys)>-.91);
    assert.ok(Math.abs(Math.max(...xs)+Math.min(...xs))<.03);
    assert.ok(Math.abs(Math.max(...ys)+Math.min(...ys))<.03);
    assert.ok(Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys))>1.7);
  }
});
test('top view remains top view, empty subjects leave authored shot unchanged',()=>{
  const shot={target:[0,0,0],pos:[-.1,40,0]};
  assert.equal(fitInformationShot(shot,[],{tanX:.8,tanY:.4}),shot);
  const result=fitInformationShot(shot,[[-10,0,-20],[10,0,20]],{tanX:.8,tanY:.4});
  const direction=norm(sub(result.pos,result.target));assert.ok(direction[1]>.999);
});
