import test from 'node:test';
import assert from 'node:assert/strict';
import { experienceStatus } from '../apps/main/js/experience.js';
const completed = {page:'outro',finished:true,completion:{page:'outro',run:7,at:123,evidence:'HTMLMediaElement.ended'}};
test('outro navigation, pause, blocked autoplay and errors never count as completion',()=>{
  for(const narration of [undefined,{page:'outro'},{page:'outro',paused:true},{page:'outro',finished:false},{page:'outro',stopped:true}])
    assert.equal(experienceStatus({page:'outro',narration}).experience,'active');
});
test('only matching actual ending evidence completes outro, replay clears completion',()=>{
  assert.equal(experienceStatus({page:'outro',narration:completed}).experience,'complete');
  assert.equal(experienceStatus({page:'outro',narration:{...completed,finished:false}}).experience,'active');
  assert.equal(experienceStatus({page:'outro',narration:{...completed,page:'intro'}}).experience,'active');
  assert.equal(experienceStatus({page:'outro',narration:{...completed,completion:null}}).experience,'active');
});
test('manual intro remains active until its narration ends or is explicitly stopped',()=>{
  assert.equal(experienceStatus({page:'intro',narration:{page:'intro',paused:true}}).experience,'active');
  assert.equal(experienceStatus({page:'intro',narration:{page:'intro',finished:true}}).experience,'idle');
  assert.equal(experienceStatus({page:'intro',narration:{page:'intro',stopped:true}}).experience,'idle');
});
test('autorun remains active through intro/outro holds; intermediate scenes never complete the whole experience',()=>{
  assert.equal(experienceStatus({page:'outro',narration:completed,autorun:true}).experience,'active');
  assert.equal(experienceStatus({page:'intro',narration:{page:'intro',finished:true},autorun:true}).experience,'active');
  for(const page of ['welcome','first','home','prevention'])
    assert.equal(experienceStatus({page,narration:{...completed,page}}).experience,'active');
});
