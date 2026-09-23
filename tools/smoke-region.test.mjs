import test from 'node:test';
import assert from 'node:assert/strict';
import {enclosedRegion} from '../apps/main/js/smoke-region.js';
test('wall barrier confines smoke to the selected compartment',()=>{
  const walls=new Uint8Array(100);
  for(let i=1;i<=8;i++){walls[10+i]=1;walls[80+i]=1;walls[i*10+1]=1;walls[i*10+8]=1;walls[i*10+5]=1;}
  const area=enclosedRegion(walls,10,10,[3,3]);
  assert.equal(area[33],1);assert.equal(area[37],0);assert.equal(area[35],0);assert.equal(area[0],0);
  walls[13]=0;assert.equal(enclosedRegion(walls,10,10,[3,3]),null);
});
test('blocked and exterior seeds never produce smoke masks',()=>{
  const walls=new Uint8Array(100);walls[33]=1;
  assert.equal(enclosedRegion(walls,10,10,[3,3]),null);
  assert.equal(enclosedRegion(walls,10,10,[4,4]),null);
});
