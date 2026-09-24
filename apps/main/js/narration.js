// Default on; 9 toggles the approved renderer. ?orb=off skips GPU drawing at startup.
const initialOrbEnabled = new URLSearchParams(location.search).get('orb') !== 'off';
export const clipTranscripts = {
  'flood-drainage.mp3':[
    '建築配置雨水、廢水排水及抽水設備，在豪雨期間協助排除積水，',
    '相關設備並納入後續維護管理。',
    '關注地下室與低窪處警示，不在進水時下地下室取車。',
  ],
  'flood-backup.mp3':[
    '建築配置緊急發電機，並將發電設備納入定期保養與運轉管理，',
    '在停電等異常狀況下提供必要的備援能力。',
    '留意社區公告與停電安排，勿接觸浸水電器。',
  ],
  'slope-risk.mp3':[
    '是否涉及坡地或土砂災害風險，仍須依基地位置、地形與地質條件判定；',
    '目前資料未提供坡地防護或擋土設施相關資訊。',
    '遇到豪雨或颱風時，留意官方警戒與社區疏散通知。',
  ],
  'slope-observation.mp3':[
    '建築的柱、牆及其他結構構件可作為觀察裂縫、傾斜等異常的位置；',
    '異常原因仍應由專業人員進一步判讀。',
    '發現突然增大的裂縫、地面變形或異常聲響，遠離並通報。',
  ],
  'slope-drainage-v2.mp3':[
    '坡地安全也和排水、地盤狀況密切相關。',
    '排水路徑如果受到改變，可能影響原本的排水方式，因此這類設施不適合自行調整。',
    '不要自行改變排水路徑，依警戒公告提前準備撤離。',
  ],
  'typhoon-windows.mp3':[
    '門窗的玻璃、框材與固定方式共同形成抵抗風雨的建築外殼，',
    '外牆金屬構件採用不鏽鋼材質，降低長期鏽蝕造成鬆動的風險。',
    '颱風前檢查窗戶能否鎖妥，強風時避免靠近玻璃。',
  ],
  'typhoon-facade.mp3':[
    '外牆構件的材料、固定與後續巡檢共同維持建築外殼的安全，',
    '並透過長期維護降低材料老化、鬆動與掉落的風險。',
    '一旦發現外牆鬆動或異常聲響，通知管理單位檢查。',
  ],
  'typhoon-drainage.mp3':[
    '建築配置雨水排水及相關抽水設備，',
    '包括雨水泵浦與機坑抽水設備，協助雨水排除。',
    '平時清理可安全接近的排水口，收妥陽台物品。',
  ],
  'quake-structure.mp3':[
    '建築採用 0.41G 耐震設計，由結構骨架承受及傳遞地震作用，',
    '提升建築面對地震時的耐震能力。',
    '日常裝修時，不任意拆改梁柱，也不要自行鑿切結構構件。',
  ],
  'quake-pipes.mp3':[
    '採用 SI 工法，將結構與管線分離，使管線在地震時具有搖晃與緩衝空間，',
    '也讓震後檢查及維修更容易進行。',
    '裝修或變更管線前先確認原有設計，避免任意破壞結構或改變管線配置。',
  ],
  'quake-elevator.mp3':[
    '電梯配置地震感知器，地震發生時可自動定位並於避難樓層停靠開門，',
    '降低人員受困於電梯的風險。',
    '地震發生時依現場指示避難；震後未確認設備安全前，不自行搭乘電梯。',
  ],
  'fire-compartment-v2.mp3':[
    '建築透過防火門、防火窗等構件建立防火區劃，在火災發生時協助限制火勢向其他空間蔓延。',
    '公區生命週期計畫也已將防火門、防火窗納入後續保養與更新管理。',
    '平時保持防火門正常關閉，不以物品固定門扇，也不要堆放物品妨礙防火門運作。',
  ],
  'fire-evacuation-v2.mp3':[
    '公共空間配置緊急照明、出口標示及避難方向指示等設備，',
    '在火災或停電時協助辨識避難方向，相關消防設備也納入後續定期維護管理。',
    '平時熟悉出口；火災時依現場狀況及消防指示行動，不進入充滿濃煙的通道。',
  ],
  'fire-detection-v2.mp3':[
    '建築配置火警受信總機、緊急廣播、探測、消防栓、泡沫滅火及自動撒水等設備，',
    '從偵測、警報到初期滅火形成多層防護。',
    '發現火煙請先示警並通報；勿為取物返回危險區域。',
  ],
  'phase-0.mp3':['警報響起，先辨識所在位置與出口方向。','留意畫面上的起火點，以及正在顯示的避難動線。'],
  'phase-1.mp3':['煙霧開始影響通道。','觀察危險區域與動線的關係，理解路線為什麼需要調整。'],
  'phase-2.mp3':['時間持續流逝，可用的選擇也可能改變。','事先熟悉出口與安全梯，才能在危機中減少猶豫。'],
  'route-intro.mp3':['同一棟建築，不同位置，可能需要不同的避難路徑。','接下來，跟著畫面認識空間與出口的連結。'],
  'route-play.mp3':['沿著畫面中的動線，觀察通道、安全梯與出口如何相連。'],
  'route-change-intro.mp3':['換一個位置，再看一次。'],
  'route-change-detail.mp3':['起點改變後，通往出口的路徑也可能不同。'],
};
// Add each page's recording and [seconds, subtitle] pairs here when supplied.
export const pageNarration = {
  first: {file:null, captions:[]},
  home: {file:'route-intro.mp3', captions:[]},
  prevention: {file:null, captions:[]},
};
// Initial cue fallback; replaced by pause detection from the current recording.
export const welcomeCaptions = [
  [0, '危機發生時，最重要的是知道該往哪裡走。'],
  [5.14, '接下來，你將進入火災逃生模擬。'],
  [8.74, '這個家會根據起火位置、煙霧方向與空間路徑，'],
  [13.74, '讓危機中的每一步，都有清楚的指引。'],
];
export function createNarrationPages(){
  const section=document.createElement('section');section.className='page page--welcome';section.dataset.page='welcome';
  section.innerHTML='<div class="grain" aria-hidden="true"></div><div class="welcome-noise" aria-hidden="true"></div><i class="intro__corner intro__corner--tl" aria-hidden="true"></i><i class="intro__corner intro__corner--tr" aria-hidden="true"></i><i class="intro__corner intro__corner--bl" aria-hidden="true"></i><i class="intro__corner intro__corner--br" aria-hidden="true"></i><button class="voice-wave" type="button" aria-label="播放開場語音；播放中按一下暫停"><canvas aria-hidden="true"></canvas></button><div class="welcome-captions" role="region" aria-label="開場滾動字幕"><div class="welcome-caption-track">危機發生時，掌握狀況，才能判斷下一步。　接下來，你將進入火災逃生模擬。　在這個模擬情境中，我們將展示起火位置、煙霧與空間動線，如何影響逃生路徑的選擇。　請留意畫面中的引導，想像螢幕、平板與燈光彼此連動，如何協助住戶辨識方向、避開危險。　真正的安全，不只是在危機中找到方向，更從日常的預防開始。</div></div>';
  document.getElementById('app').append(section);
  const captions=section.querySelector('.welcome-captions');
  captions.setAttribute('aria-label','開場逐句字幕');captions.replaceChildren();
  welcomeCaptions.forEach(([,text])=>{const line=document.createElement('p');line.textContent=text;captions.append(line);});
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
  const files={welcome:'welcome-v2.mp3',intro:'intro.mp3',outro:'outro-v2.mp3'};
  const audio=new Audio();audio.preload='auto';let context,analyser,source,current,raf,request=0;const cache=new Map();let cues=[0,5,10];
  let closingStarted=false,closingHold=false,closingTimer=null,watchFrame=null;
  let cuePreparation=Promise.resolve(),sentenceWeights=null;
  let clipQueue=[],clipSequence=[];
  let activeClipLines=[],activeTopic=null,activeClip=null,lastCaptionKey=null,clipGeneration=0,clipDuration=NaN;
  function loadClip(file){
    const ticket=request;
    const generation=++clipGeneration;
    clipDuration=NaN;
    activeClip=file;lastCaptionKey=null;
    activeClipLines=clipTranscripts[file]||[];
    sentenceWeights=activeClipLines.map(line=>line.length);
    audio.src=`./assets/narration/${file}`;
    // Explicitly reset repeated/cached sources before publishing the first cue.
    audio.load();
    cues=[0];sync();
    const key=`clip:${file}`;
    if(!cache.has(key))cache.set(key,fetch(audio.src).then(r=>{if(!r.ok)throw Error('audio');return r.arrayBuffer();}).then(bytes=>setup().decodeAudioData(bytes)).then(buffer=>({cues:findSentenceCues(buffer,clipTranscripts[file].map(line=>line.length)),duration:buffer.duration})).catch(()=>null));
    cuePreparation=cache.get(key).then(result=>{if(ticket===request&&generation===clipGeneration&&result){sentenceWeights=null;cues=result.cues;clipDuration=result.duration;sync();}});
  }
  function playClips(files){
    ++request;audio.pause();resetClosing();cancelAnimationFrame(watchFrame);
    cuePreparation=Promise.resolve();sentenceWeights=null;clipSequence=[...files];clipQueue=files.slice(1);
    cues=[0];dockCaption.textContent='';controls.hidden=false;
    wave.setAttribute('aria-disabled','false');wave.setAttribute('aria-label','播放或暫停本頁旁白');
    loadClip(files[0]);play();
  }
  window.addEventListener('narration:phase',event=>{
    const phase=event.detail;
    if(current==='first'&&Number.isInteger(phase)&&phase>=0&&phase<3)playClips([`phase-${phase}.mp3`]);
  });
  window.addEventListener('narration:route',event=>{
    if(current==='home')playClips(event.detail==='repeat'?['route-play.mp3']:['route-change-intro.mp3','route-change-detail.mp3']);
  });
  window.addEventListener('narration:topic',event=>{
    if(current!=='prevention')return;
    activeTopic=event.detail;
    const file={
      '防火區劃':'fire-compartment-v2.mp3','安全梯與避難':'fire-evacuation-v2.mp3','偵測與初期應變':'fire-detection-v2.mp3',
      '梁柱抗震':'quake-structure.mp3','結構與管線分離':'quake-pipes.mp3','地震感知與安全停靠':'quake-elevator.mp3',
      '窗框與玻璃':'typhoon-windows.mp3','外牆與結構':'typhoon-facade.mp3','樓板與排水界面':'typhoon-drainage.mp3',
      '排水與抽水':'flood-drainage.mp3','機電與備援':'flood-backup.mp3',
      '結構異常觀察':'slope-observation.mp3','排水與地盤':'slope-drainage-v2.mp3',
    }[event.detail];
    if(file){playClips([file]);return;}
    ++request;audio.pause();resetClosing();clipQueue=[];clipSequence=[];activeClipLines=[];
    sentenceWeights=null;cuePreparation=Promise.resolve();audio.removeAttribute('src');audio.load();
    dockCaption.textContent='';controls.hidden=true;wave.setAttribute('aria-disabled','true');wave.setAttribute('aria-label','本頁語音球，旁白待加入');
  });
  function resetClosing(){clearTimeout(closingTimer);closingTimer=null;closingHold=false;closingStarted=false;audio.playbackRate=1;audio.preservesPitch=true;}
  const wave=document.querySelector('.voice-wave');
  const welcomePage=wave.parentElement;
  const dock=document.createElement('div');dock.className='narration-dock';dock.hidden=true;
  const dockCaption=document.createElement('div');dockCaption.className='narration-dock__caption';dockCaption.setAttribute('role','region');dockCaption.setAttribute('aria-label','本頁旁白字幕');
  dock.append(dockCaption);document.getElementById('app').append(dock);
  wave.replaceChildren();
  const orbHost=document.createElement('span');orbHost.className='voice-orb';wave.append(orbHost);
  let orb=null,orbEnabled=false,orbReady=false,showActive=false,orbRequest=0,orbModule;
  wave.style.display='none';
  async function setOrbEnabled(enabled){
    const ticket=++orbRequest;
    orbEnabled=enabled;orbReady=false;
    orb?.dispose();orb=null;
    wave.style.display=enabled?'':'none';
    if(current==='welcome')controls.hidden=enabled;
    if(!enabled)return;
    let candidate;
    try{
      const module=await (orbModule??=import('../assets/anlb-orb/orb.js'));
      if(ticket!==orbRequest)return;
      candidate=module.mountOrb(orbHost);candidate.canvas.setAttribute('aria-hidden','true');
      await candidate.ready;
      // Initialization can finish after a second press: release that stale renderer.
      if(ticket!==orbRequest){candidate.dispose();return;}
      orb=candidate;orbReady=true;
      if(showActive)orb.start();
      orb.setLevel(speechLevel());
    }catch{
      candidate?.dispose();
      if(ticket!==orbRequest)return;
      orbModule=null;
      wave.setAttribute('aria-label','語音球無法顯示，按一下仍可播放旁白');
      if(current==='welcome')controls.hidden=false;
    }
  }
  function onOrbKey(event){
    if(event.defaultPrevented||event.repeat||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;
    if(event.key!=='9')return;
    if(event.target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]'))return;
    event.preventDefault();void setOrbEnabled(!orbEnabled);
  }
  const controls=document.createElement('div');controls.className='voice-controls';controls.hidden=true;
  controls.innerHTML='<button type="button" class="voice-toggle">播放語音</button><button type="button" class="voice-replay">重播</button><span class="voice-error" role="status"></span>';document.getElementById('app').append(controls);
  const toggle=controls.querySelector('.voice-toggle'),error=controls.querySelector('.voice-error');
  const finish=document.createElement('button');finish.type='button';finish.className='voice-finish';finish.textContent='結束展演';finish.hidden=true;document.getElementById('app').append(finish);
  finish.onclick=()=>{++request;clipQueue=[];audio.pause();resetClosing();showActive=false;orb?.end();finish.hidden=true;};
  const samples=new Float32Array(1024);
  function setup(){if(!context){context=new AudioContext();analyser=context.createAnalyser();analyser.fftSize=1024;source=context.createMediaElementSource(audio);source.connect(analyser);analyser.connect(context.destination);}return context;}
  async function play(){const ticket=request;try{await setup().resume();await cuePreparation;if(ticket!==request)return;await audio.play();error.textContent='';}catch{if(ticket===request)toggle.textContent='點此播放語音';}}
  // If analysis fails, derive fallback cues from the real duration, never 10 seconds.
  audio.addEventListener('loadedmetadata',()=>{
    if(!sentenceWeights||!Number.isFinite(audio.duration))return;
    const total=sentenceWeights.reduce((sum,n)=>sum+n,0);let used=0;
    cues=sentenceWeights.map(n=>{const t=audio.duration*used/total;used+=n;return t;});sync();
  });
  function sync(){
    const lines=document.querySelectorAll(current==='welcome'?'.welcome-captions > p':`[data-page="${current}"] .intro__roll > *`);
    let index=0;cues.forEach((t,i)=>{if(audio.currentTime>=t)index=i;});if(closingHold)index=1;
    lines.forEach((line,i)=>{line.classList.toggle('voice-current',i===index);line.setAttribute('aria-hidden',String(i!==index));});
    const captions=pageNarration[current]?.captions,text=activeClipLines[index]||captions?.[index]?.[1]||'';
    dockCaption.textContent=text;
    const key=`${request}:${current}:${activeTopic}:${activeClip}:${index}`;
    if(text&&key!==lastCaptionKey){
      lastCaptionKey=key;
      const run=request;
      const generation=clipGeneration;
      // Local camera access only; no changes to Main/Pad WebSocket messages.
      const readClock=()=>{
        if(run!==request||generation!==clipGeneration)return null;
        const end=cues[index+1]??(Number.isFinite(audio.duration)?audio.duration:clipDuration);
        return {time:audio.currentTime,start:cues[index]??0,end,ready:cues.length>=activeClipLines.length&&Number.isFinite(end)};
      };
      window.dispatchEvent(new CustomEvent('narration:caption',{detail:{page:current,topic:activeTopic,clip:activeClip,run,index,text,readClock}}));
    }
  }
  function watchClosing(){
    if((current==='intro'||current==='outro')&&!audio.paused&&!closingStarted&&audio.currentTime>=cues[2]-.025){
      // Pause in place: seeking an MP3 here can restart playback on servers
      // without byte-range support. Only explicit replay should rewind audio.
      closingStarted=true;closingHold=true;audio.pause();sync();
      const ticket=request;toggle.textContent='停頓中 · 點此暫停';
      closingTimer=setTimeout(()=>{closingTimer=null;if(ticket!==request)return;closingHold=false;audio.playbackRate=.93;sync();play();},500);
    }
    watchFrame=requestAnimationFrame(watchClosing);
  }
  audio.addEventListener('timeupdate',sync);audio.addEventListener('play',()=>toggle.textContent='暫停語音');audio.addEventListener('pause',()=>toggle.textContent='播放語音');
  audio.addEventListener('play',()=>{if(!showActive){showActive=true;if(orbReady)orb.start();}finish.hidden=false;});
  audio.addEventListener('pause',()=>orb?.setLevel(0));
  audio.addEventListener('error',()=>{error.textContent='音檔載入失敗，請重播或重新整理';wave.setAttribute('aria-label','音檔載入失敗，按一下重試');});
  audio.addEventListener('ended',()=>{
    if(!audio.ended)return;
    sync();
    if(clipQueue.length){loadClip(clipQueue.shift());play();return;}
    window.dispatchEvent(new CustomEvent('narration:ended',{detail:{page:current,topic:activeTopic,clip:activeClip,run:request}}));
    if(current==='welcome')navigate('intro');
  });
  toggle.onclick=()=>{if(closingHold){clearTimeout(closingTimer);closingTimer=null;closingHold=false;audio.playbackRate=.93;toggle.textContent='播放語音';return;}audio.paused?play():audio.pause();};wave.onclick=()=>{if(audio.getAttribute('src'))toggle.onclick();};controls.querySelector('.voice-replay').onclick=()=>{if(clipSequence.length){playClips(clipSequence);return;}resetClosing();audio.currentTime=0;sync();play();};
  // Reuse the player's single audio graph. Silence changes level, never show state.
  function speechLevel(){
    let level=0;
    if(showActive&&analyser&&!audio.paused&&!audio.ended){
      analyser.getFloatTimeDomainData(samples);
      const rms=Math.sqrt(samples.reduce((sum,x)=>sum+x*x,0)/samples.length);
      level=Math.min(1,Math.max(0,rms-.008)*5);
    }
    return level;
  }
  const sendVoice=()=>window.dispatchEvent(new CustomEvent('narration:level',{detail:{active:showActive,level:speechLevel()}}));
  const voiceTimer=setInterval(sendVoice,50);
  audio.addEventListener('pause',sendVoice);audio.addEventListener('ended',sendVoice);
  function draw(){
    if(orbReady)orb.setLevel(speechLevel());
    if(current==='welcome')sync();
    raf=requestAnimationFrame(draw);
  }
  draw();
  window.addEventListener('keydown',onOrbKey);
  void setOrbEnabled(initialOrbEnabled);
  window.addEventListener('pagehide',event=>{if(!event.persisted){++orbRequest;window.removeEventListener('keydown',onOrbKey);clearInterval(voiceTimer);cancelAnimationFrame(raf);cancelAnimationFrame(watchFrame);clearTimeout(closingTimer);orb?.dispose();audio.pause();context?.close();}});
  return {enter(id){++request;const ticket=request;clipQueue=[];clipSequence=[];activeClipLines=[];activeTopic=null;activeClip=null;lastCaptionKey=null;audio.pause();resetClosing();cancelAnimationFrame(watchFrame);current=id;cuePreparation=Promise.resolve();sentenceWeights=null;error.textContent='';controls.hidden=!files[id]||id==='welcome';
    const file=files[id]||pageNarration[id]?.file;
    dock.hidden=id==='welcome';dock.dataset.page=id;dockCaption.textContent='';
    (id==='welcome'?welcomePage:dock).prepend(wave);
    wave.setAttribute('aria-label',file?'播放或暫停本頁旁白':'本頁語音球，旁白待加入');
    wave.setAttribute('aria-disabled',String(!file));
    controls.hidden=!file||(id==='welcome'&&orbEnabled);
    if(!file){audio.removeAttribute('src');audio.load();return;}
    if(clipTranscripts[file]){playClips([file]);return;}
    audio.src=`./assets/narration/${file}`;cues=id==='welcome'?welcomeCaptions.map(([time])=>time):pageNarration[id]?.captions.map(([time])=>time)||[0,5,10];document.querySelector(`[data-page="${id}"]`).classList.add('voice-synced');sync();
    if(id==='welcome'||id==='intro'||id==='outro'){
      if(id!=='welcome')watchClosing();
      const text=id==='welcome'?welcomeCaptions.map(([,line])=>line.length):[...document.querySelectorAll(`[data-page="${id}"] .intro__roll > *`)].map(el=>el.textContent.replace(/\s/g,'').length);
      sentenceWeights=text;
      if(!cache.has(id))cache.set(id,fetch(audio.src).then(r=>{if(!r.ok)throw Error('audio');return r.arrayBuffer();}).then(bytes=>setup().decodeAudioData(bytes)).then(buffer=>findSentenceCues(buffer,text)).catch(()=>null));
      cuePreparation=cache.get(id).then(result=>{if(ticket===request&&result){sentenceWeights=null;cues=result;sync();}});
    }
    play();
  }};
}
