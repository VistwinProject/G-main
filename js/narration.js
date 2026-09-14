export function createNarrationPages(){
  const section=document.createElement('section');section.className='page page--welcome';section.dataset.page='welcome';
  section.innerHTML='<button class="voice-wave" type="button" aria-label="播放開場語音；播放中按一下暫停"><canvas aria-hidden="true"></canvas></button>';
  document.getElementById('app').append(section);
}

// Sentence changes follow audio.currentTime rather than the old fixed CSS timer.
// Pauses provide initial sentence cues; these may be overridden after editorial review.
export function findSentenceCues(buffer, weights){
  const samples=buffer.getChannelData(0),step=Math.round(buffer.sampleRate*.02),frames=[];
  for(let i=0;i<samples.length;i+=step){let sum=0;for(let j=i;j<Math.min(i+step,samples.length);j++)sum+=samples[j]*samples[j];frames.push(Math.sqrt(sum/step));}
  const peak=Math.max(...frames),threshold=Math.max(.003,peak*.045),gaps=[];let start=null;
  frames.forEach((v,i)=>{if(v<threshold){start??=i;}else if(start!==null){if(i-start>=10)gaps.push({start:start*.02,end:i*.02});start=null;}});
  const duration=buffer.duration,total=weights.reduce((a,b)=>a+b,0);let used=0,previous=0;
  return [0,...weights.slice(0,-1).map(weight=>{used+=weight;const target=duration*used/total;const options=gaps.filter(g=>g.end>previous+.7&&g.end<duration-.7&&Math.abs(g.end-target)<duration*.22);options.sort((a,b)=>Math.abs(a.end-target)-Math.abs(b.end-target));previous=options[0]?.end??Math.max(previous+.7,target);return previous;})];
}

export function createNarration({navigate}){
  const files={welcome:'welcome.wav',intro:'intro.mp3',outro:'outro.mp3'};
  const audio=new Audio();audio.preload='auto';let context,analyser,source,current,raf,request=0;const cache=new Map();let cues=[0,5,10];
  let closingStarted=false,closingHold=false,closingTimer=null,watchFrame=null;
  function resetClosing(){clearTimeout(closingTimer);closingTimer=null;closingHold=false;closingStarted=false;audio.playbackRate=1;audio.preservesPitch=true;}
  const wave=document.querySelector('.voice-wave'),canvas=wave.querySelector('canvas'),paint=canvas.getContext('2d');
  const controls=document.createElement('div');controls.className='voice-controls';controls.hidden=true;
  controls.innerHTML='<button type="button" class="voice-toggle">播放語音</button><button type="button" class="voice-replay">重播</button><span class="voice-error" role="status"></span>';document.getElementById('app').append(controls);
  const toggle=controls.querySelector('.voice-toggle'),error=controls.querySelector('.voice-error');
  function setup(){if(!context){context=new AudioContext();analyser=context.createAnalyser();analyser.fftSize=256;source=context.createMediaElementSource(audio);source.connect(analyser);analyser.connect(context.destination);}return context;}
  async function play(){try{await setup().resume();await audio.play();error.textContent='';}catch{toggle.textContent='點此播放語音';}}
  function sync(){const lines=document.querySelectorAll(`[data-page="${current}"] .intro__roll > *`);let index=0;cues.forEach((t,i)=>{if(audio.currentTime>=t)index=i;});if(closingHold)index=1;lines.forEach((line,i)=>line.classList.toggle('voice-current',i===index));}
  function watchClosing(){
    if((current==='intro'||current==='outro')&&!audio.paused&&!closingStarted&&audio.currentTime>=cues[2]-.025){
      closingStarted=true;closingHold=true;audio.pause();audio.currentTime=cues[2];sync();
      const ticket=request;toggle.textContent='停頓中 · 點此暫停';
      closingTimer=setTimeout(()=>{closingTimer=null;if(ticket!==request)return;closingHold=false;audio.playbackRate=.93;sync();play();},500);
    }
    watchFrame=requestAnimationFrame(watchClosing);
  }
  audio.addEventListener('timeupdate',sync);audio.addEventListener('play',()=>toggle.textContent='暫停語音');audio.addEventListener('pause',()=>toggle.textContent='播放語音');
  audio.addEventListener('error',()=>{error.textContent='音檔載入失敗，請重播或重新整理';wave.setAttribute('aria-label','音檔載入失敗，按一下重試');});
  audio.addEventListener('ended',()=>{sync();if(current==='welcome')navigate('intro');});
  toggle.onclick=()=>{if(closingHold){clearTimeout(closingTimer);closingTimer=null;closingHold=false;audio.playbackRate=.93;toggle.textContent='播放語音';return;}audio.paused?play():audio.pause();};wave.onclick=()=>audio.paused?play():audio.pause();controls.querySelector('.voice-replay').onclick=()=>{resetClosing();audio.currentTime=0;sync();play();};
  function draw(){if(current!=='welcome')return;const rect=canvas.getBoundingClientRect();canvas.width=Math.max(1,Math.round(rect.width*devicePixelRatio));canvas.height=Math.max(1,Math.round(rect.height*devicePixelRatio));const w=canvas.width,h=canvas.height;paint.clearRect(0,0,w,h);const values=new Uint8Array(128);if(analyser)analyser.getByteFrequencyData(values);paint.strokeStyle='#75d8ff';paint.lineWidth=Math.max(2,w/350);paint.lineCap='round';paint.shadowColor='#3bbcff';paint.shadowBlur=18;
    for(let i=0;i<65;i++){const x=w*(.05+.9*i/64),level=audio.paused?.025:Math.max(.015,values[Math.floor(i*1.5)]/255),height=h*(.025+level*.7)*Math.sin(Math.PI*(i+1)/66);paint.beginPath();paint.moveTo(x,h/2-height/2);paint.lineTo(x,h/2+height/2);paint.stroke();}raf=requestAnimationFrame(draw);
  }
  return {enter(id){++request;const ticket=request;audio.pause();resetClosing();cancelAnimationFrame(raf);cancelAnimationFrame(watchFrame);current=id;error.textContent='';controls.hidden=!files[id]||id==='welcome';
    if(!files[id]){audio.removeAttribute('src');audio.load();return;}
    audio.src=`./assets/narration/${files[id]}`;cues=[0,5,10];document.querySelector(`[data-page="${id}"]`).classList.add('voice-synced');sync();
    if(id==='welcome')draw();
    if(id==='intro'||id==='outro'){
      watchClosing();
      const text=[...document.querySelectorAll(`[data-page="${id}"] .intro__roll > *`)].map(el=>el.textContent.replace(/\s/g,'').length);
      if(!cache.has(id))cache.set(id,fetch(audio.src).then(r=>{if(!r.ok)throw Error('audio');return r.arrayBuffer();}).then(bytes=>setup().decodeAudioData(bytes)).then(buffer=>findSentenceCues(buffer,text)).catch(()=>null));
      cache.get(id).then(result=>{if(ticket===request&&result){cues=result;sync();}});
    }
    play();
  }};
}
