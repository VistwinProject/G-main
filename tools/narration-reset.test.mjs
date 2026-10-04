import test from 'node:test';
import assert from 'node:assert/strict';
import { experienceStatus } from '../apps/main/js/experience.js';

// Exercise the real narration controller with inert DOM/media adapters. No sound/device/browser.
class Element {
  constructor(){this.style={};this.dataset={};this.classList={add(){},toggle(){}};this.children=new Map();this.attrs=new Map();this.textContent='';}
  append(){} prepend(){} replaceChildren(){}
  setAttribute(k,v){this.attrs.set(k,v);} getAttribute(k){return this.attrs.get(k);}
  querySelector(k){if(!this.children.has(k))this.children.set(k,new Element());return this.children.get(k);}
}
class Media extends EventTarget {
  constructor(){super();this.paused=true;this.ended=false;this.currentTime=0;this.calls=0;Media.instance=this;}
  set src(value){this.source=value;this.ended=false;this.currentTime=0;} get src(){return this.source;}
  getAttribute(k){return k==='src'?this.source:null;}
  removeAttribute(){this.source='';} load(){}
  pause(){this.paused=true;this.dispatchEvent(new Event('pause'));}
  async play(){this.calls++;this.paused=false;this.ended=false;this.dispatchEvent(new Event('play'));}
}
test('real narration reset cancels in-flight autoplay and remains paused; normal manual entry and genuine completion still work',async()=>{
  const doc=new Element(),wave=new Element();wave.parentElement=new Element();
  globalThis.location={search:'?orb=off&mute=1'};
  globalThis.document={body:new Element(),createElement:()=>new Element(),getElementById:()=>doc,querySelector:s=>s==='.voice-wave'?wave:doc.querySelector(s),querySelectorAll:()=>[]};
  globalThis.window=new EventTarget();
  globalThis.Audio=Media;
  globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};
  globalThis.fetch=async()=>({ok:false});
  let resume;
  let gate=new Promise(resolve=>{resume=resolve;});
  globalThis.AudioContext=class {
    constructor(){this.destination={};} resume(){return gate;} close(){}
    createAnalyser(){return {getFloatTimeDomainData(){},connect(){}};}
    createMediaElementSource(){return {connect(){}};}
    createGain(){return {gain:{value:1},connect(){}};}
  };
  const {createNarration}=await import('../apps/main/js/narration.js');
  const player=createNarration({navigate(){throw Error('reset must not navigate');}});
  const media=Media.instance;
  const settle=()=>new Promise(resolve=>setImmediate(resolve));
  try {
    player.enter('outro'); // Actual play is waiting on AudioContext.resume().
    player.stop();player.enter('intro',{autoplay:false});
    resume();await settle();await settle();
    assert.equal(media.calls,0,'old asynchronous play must not resume after reset');
    assert.equal(media.paused,true);assert.equal(media.muted,true);
    assert.equal(experienceStatus({page:'intro',narration:player.getStatus()}).experience,'idle');
    player.enter('intro',{autoplay:false});await settle();
    assert.equal(media.calls,0,'repeated reset while already intro must remain silent');
    player.enter('intro');await settle();await settle();
    assert.equal(media.calls,1,'non-X/manual default entry still autoplays');
    assert.equal(experienceStatus({page:'intro',narration:player.getStatus()}).experience,'active');
    player.stop();player.enter('intro',{autoplay:false});await settle();
    assert.equal(media.paused,true);assert.equal(media.calls,1,'reset stops already playing audio');
    player.enter('outro');await settle();await settle();
    assert.equal(experienceStatus({page:'outro',narration:player.getStatus()}).experience,'active');
    media.ended=true;media.paused=true;media.dispatchEvent(new Event('ended'));
    assert.equal(experienceStatus({page:'outro',narration:player.getStatus()}).experience,'complete');
    player.stop();player.enter('intro',{autoplay:false});
    assert.equal(player.getStatus().completion,null);
    assert.equal(experienceStatus({page:'intro',narration:player.getStatus()}).experience,'idle');
  } finally { window.dispatchEvent(new Event('pagehide')); }
});
