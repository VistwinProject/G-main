import {planMinuteShow} from './show-timing.js';
/* =========================================================================
   自動展演：按一次「▶ 自動展演」，01 → 05 整場跑完
   -------------------------------------------------------------------------
   01 前言介紹 → 03 逃生動線（隨機兩條）
   → 05 結語，結束後停在結語頁。

   ⚠️ 這支**只從外面操作既有 UI**：window.__goto 換頁、點 #route-next、點科普的
      災害／主題按鈕。刻意不碰 main.js / information.js / narration.js 的內部狀態，
      那幾支還在改，綁進去會一直撞車。
   ⚠️ 時間表用的是**實測的旁白長度**（decodeAudioData 量的，不是估的）：
      welcome-v2 17.60s、intro 11.23s、outro-v2 12.82s、route-intro 8.86s、
      科普各主題 15.8–24.98s。要調節奏只改下面 NARRATION / STEP 兩張表。
   ⚠️ 動線那一段**不是純計時**：按下「切換逃生動線」之後盯 data-theme 變成 green
      才算跑完（每條動線長度不一樣，計時一定會對不準）。等不到就用 routeTimeout 放行。
   ========================================================================= */

// 實測的旁白長度（秒）。換了音檔要重量。
const NARRATION = { welcome: 17.6, intro: 11.23, routeIntro: 8.86, outro: 12.82 };

const STEP = {
  welcomeMax: 30,       // 等 welcome 自己接到 intro 最久等多久（音檔要下載＋解碼，會比 17.6 秒晚）
  introHold: 2.2,       // 前言頁旁白之後的緩衝。⚠️ 要留夠：narration 在最後一句前會停 0.5 秒，
                        //    之後還用 0.93 倍速播，實際比音檔長度長一些
  routeIntroHold: 1.2,  // 動線頁進場旁白之後的緩衝
  routeTimeout: 60,    // 等原有動線動畫與通關畫面完成
  routeClearHold: 3.5,
  outroHold: 2.2,       // 結語頁跟前言頁一樣有收尾停頓＋0.93 倍速，緩衝要留夠
};

const STOP = Symbol('stop');
let current = 0;        // 每按一次 +1；awaits 醒來發現變了就中止
let timer = null;
let cancelSleep=null;
let button = null;
let timeline=null,progressTimer=null,stage=0,stageStarted=0,stageDuration=1,slider=null,dragging=false;
const stageNames=['01 前言介紹','02 逃生動線','03 結語'];
let durations=[30,20,10],rate=1;
const total=60;
function updateProgress(){
  if(!slider||dragging)return;
  const clock=window.__showNarration?.clock();
  let elapsed=(performance.now()-stageStarted)/1000;
  if(clock?.page==='welcome'&&stage===0)elapsed=clock.time/rate;
  if(clock?.page==='intro'&&stage===0)elapsed=NARRATION.welcome+clock.time/rate;
  if(clock?.page==='outro'&&stage===2)elapsed=clock.time/rate;
  slider.value=durations.slice(0,stage).reduce((a,b)=>a+b,0)+Math.min(stageDuration,elapsed);
  slider.style.setProperty('--progress',`${Number(slider.value)/total*100}%`);
}
function setStage(index,seconds){
  stage=index;stageStarted=performance.now();stageDuration=seconds;
  timeline?.querySelectorAll('button').forEach((b,i)=>{
    b.classList.toggle('is-current',i===index);
    if(i===index)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');
    b.style.setProperty('--progress',i<index?'100%':'0%');
  });
}


function sleep(seconds, mine) {
  if(mine!==current)return Promise.reject(STOP);
  return new Promise((resolve, reject) => {
    clearTimeout(timer);
    cancelSleep=()=>reject(STOP);
    timer = setTimeout(() => {cancelSleep=null;mine === current ? resolve() : reject(STOP);}, seconds * 1000);
  });
}

/** 盯著條件成立，或逾時就放行（不丟錯 —— 逾時不該讓整場停掉） */
async function until(test, maxSeconds, mine) {
  const deadline = Date.now() + maxSeconds * 1000;
  while (Date.now() < deadline) {
    if (mine !== current) throw STOP;
    if (test()) return true;
    await sleep(0.2, mine);
  }
  return false;
}

const go = (page) => window.__goto?.(page);
const page = () => document.querySelector('.page.is-active')?.dataset.page;

function setRunning(on) {
  if (!button) return;
  button.textContent = on ? '■' : '▶';
  button.title=on?'停止自動展演':'自動展演';
  button.setAttribute('aria-label',button.title);
  clearInterval(progressTimer);
  if(on)progressTimer=setInterval(updateProgress,100);
  button.classList.toggle('is-running', on);
  document.documentElement.classList.toggle('is-autorun', on);
  if(!on)window.__showNarration?.setShowRate(1);
}

function stop() {
  current += 1;            // 讓所有還在等的 await 醒來時中止
  clearTimeout(timer);
  cancelSleep?.();cancelSleep=null;
  setRunning(false);
  window.dispatchEvent(new Event('show:ended'));
}

async function play(start=0,offset=0) {
  window.dispatchEvent(new Event('lighting:cancel'));
  clearTimeout(timer);
  cancelSleep?.();cancelSleep=null;
  const mine = ++current;
  try {
    button.disabled=true;button.title='準備一分鐘展演音檔';
    const lengths=await window.__showNarration.prepareShow();
    if(mine!==current)throw STOP;
    // Keep all narration; use one pitch-preserving speed across the five clips.
    const plan=planMinuteShow(lengths,STEP);rate=plan.rate;durations=plan.durations;
    [NARRATION.welcome,NARRATION.intro,NARRATION.routeIntro,NARRATION.routePlay,NARRATION.outro]=plan.speech;
    const deadline=performance.now()+(total-durations.slice(0,start).reduce((a,b)=>a+b,0)-offset)*1000;
    setRunning(true);window.__showNarration.setShowRate(rate);button.disabled=false;
    console.info('[autorun] 60-second show', {rate,durations});
    if(start<=0){
    setStage(0,NARRATION.welcome+NARRATION.intro+STEP.introHold);
    stageStarted-=offset*1000;
    // 01 前言介紹＝**兩頁**：welcome（開場）旁白播完，narration.js 會自己 navigate('intro')。
    //    導覽上的 01 對這兩頁都會亮（main.js 的 goto 有特別處理），所以只播 welcome 等於沒演完。
    // ⚠️ 不要用計時等 welcome —— 音檔要先下載 + decodeAudioData 算字幕斷點，真正開始播的時間
    //    比 17.6 秒的長度晚，計時一定會提早切走。改成**等它自己換頁到 intro**。
    // ⚠️ 按下按鈕時常常本來就停在 welcome，那時 goto() 會因為 id === current 直接 return，
    //    旁白**不會從頭播**，開場就等於演一半。所以這種情況改叫 narration 的「重播」。
    const onWelcome = page() === 'welcome';
    if(offset<NARRATION.welcome){
      go('welcome');if(onWelcome)document.querySelector('.voice-replay')?.click();
      if(offset)await window.__showNarration?.seek(offset*rate);
      if(!(await until(()=>page()==='intro',NARRATION.welcome+5,mine)))throw Error('前言語音未完成，請確認可播放音訊');
      await sleep(NARRATION.intro+STEP.introHold,mine);
    }else{
      go('intro');await window.__showNarration?.seek((offset-NARRATION.welcome)*rate);
      await sleep(Math.max(.01,durations[0]-offset),mine);
    }
    offset=0;
    }

    // 03 逃生動線：進場旁白之後展示設備方向
    if(start<=1){
    setStage(1,durations[1]);
    stageStarted-=offset*1000;
    const wasHome=page()==='home';
    if(wasHome)go('intro');
    go('home');
    const routeStart=NARRATION.routeIntro+STEP.routeIntroHold;
    if(offset<routeStart){
      if(offset)await window.__showNarration?.seek(offset*rate);
      await sleep(routeStart-offset,mine);
    }
    if(mine!==current)throw STOP;
    document.getElementById('route-play')?.click();
    if(offset>=routeStart){
      await until(()=>window.__showNarration?.clock().clip==='route-play.mp3',10,mine);
      if(mine!==current)throw STOP;
      await window.__showNarration?.seek((offset-routeStart-.22)*rate);
    }
    await until(() => document.documentElement.dataset.theme === 'green', STEP.routeTimeout, mine);
    await sleep(STEP.routeClearHold, mine);
    offset=0;
    }

    // 05 結語
    setStage(2,durations[2]);
    stageStarted-=offset*1000;
    const wasOutro=page()==='outro';
    go('outro');
    if(wasOutro)document.querySelector('.voice-replay')?.click();
    if(offset)await window.__showNarration?.seek(offset*rate);
    const remaining=Math.max(.01,(deadline-performance.now())/1000);
    await sleep(Math.max(0,remaining-.5),mine);
    window.dispatchEvent(new CustomEvent('lighting:preview',{detail:{effect:'blue'}}));
    await sleep(Math.min(.5,remaining),mine);
  } catch (error) {
    if(mine===current){button.disabled=false;setRunning(false);}
    if (error !== STOP) {console.error(error);button.title=`展演準備失敗：${error.message}`;}
    return;                                   // 被停掉：setRunning 已經在 stop() 做過
  }
  if (mine === current) {setRunning(false);window.dispatchEvent(new Event('show:ended'));}
}

/* ---------- 掛上按鈕 ----------
   ⚠️ .page-nav 是 information.js 在模組載入時建的，這支可能比它早跑，
      所以用 MutationObserver 等它出現，不要假設當下就在。 */
function mount(nav) {
  if (button) return;
  button = document.createElement('button');
  button.type = 'button';
  button.className = 'autorun-toggle';
  button.textContent = '▶';
  button.title='自動展演';button.setAttribute('aria-label','自動展演');
  button.onclick = () => (document.documentElement.classList.contains('is-autorun') ? stop() : play());
  nav.prepend(button);
  timeline=document.createElement('div');timeline.className='show-timeline';
  const labels=document.createElement('div');labels.className='show-timeline-labels';
  stageNames.forEach(name=>{const label=document.createElement('span');label.textContent=name;labels.append(label);});
  slider=document.createElement('input');slider.type='range';slider.min=0;slider.max=total;slider.step=.1;slider.value=0;
  slider.setAttribute('aria-label','拖曳控制展演進度');
  slider.oninput=()=>{dragging=true;slider.style.setProperty('--progress',`${Number(slider.value)/total*100}%`);};
  slider.onchange=()=>{
    let time=Number(slider.value),index=0;
    while(index<durations.length-1&&time>=durations[index])time-=durations[index++];
    dragging=false;void play(index,time);
  };
  timeline.append(labels,slider);
  button.after(timeline);
  const style=document.createElement('style');style.textContent=`
  .page-nav .skin-toggle__label{display:none!important}
  .page-nav .autorun-toggle{min-width:3rem;padding-inline:1rem}
  .show-timeline{display:none;flex-direction:column;justify-content:center;gap:.6rem;width:32rem;max-width:55vw;padding:.5rem}
  .show-timeline-labels{display:flex;justify-content:space-between;width:100%;font-size:.8rem;color:var(--ink)}
  .show-timeline input{appearance:none;width:100%;height:6px;margin:.5rem 0;background:linear-gradient(to right,var(--brand-hi) var(--progress,0%),var(--brand-line) var(--progress,0%));border-radius:4px;cursor:pointer;touch-action:pan-y}
  .show-timeline input::-webkit-slider-thumb{appearance:none;width:18px;height:18px;border-radius:50%;background:var(--brand-hi);border:2px solid var(--bg-0)}
  .show-timeline input::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:var(--brand-hi);border:2px solid var(--bg-0)}
  .is-autorun .page-nav>[data-go-page]{display:none!important}
  .is-autorun .show-timeline{display:flex}
  .page-nav .show-timeline button{flex:1;position:relative;border:0;border-radius:0;padding:.7rem .4rem 1rem;font-size:.8rem;white-space:nowrap;background:transparent;color:var(--ink)}
  .show-timeline button::before,.show-timeline button::after{content:'';position:absolute;left:0;bottom:.35rem;height:3px;border-radius:2px}
  .show-timeline button::before{width:100%;background:var(--brand-line)}
  .show-timeline button::after{width:var(--progress,0%);background:var(--brand-hi)}
  .show-timeline button.is-current{font-weight:700;color:var(--brand-hi)}
  .show-timeline button:focus-visible{outline:2px solid var(--brand-hi)}
  `;document.head.append(style);
  const skin=nav.querySelector('#skin-toggle');
  if(skin){const label=()=>skin.title=skin.getAttribute('aria-label')||'切換深淺色';label();new MutationObserver(label).observe(skin,{attributes:true,attributeFilter:['aria-label']});}
}

const nav = document.querySelector('.page-nav');
if (nav) mount(nav);
else {
  const observer = new MutationObserver(() => {
    const found = document.querySelector('.page-nav');
    if (found) { mount(found); observer.disconnect(); }
  });
  observer.observe(document.getElementById('app') || document.body, { childList: true, subtree: true });
}

// 手動接手就讓自動展演讓位：按 Esc、或自己點導覽切頁
addEventListener('keydown', (e) => { if (e.code === 'Escape') stop(); });
addEventListener('click', (e) => {
  const target = e.target?.closest?.('[data-go-page]');
  if (target && document.documentElement.classList.contains('is-autorun')) stop();
}, true);

Object.assign(window, { __autorun: { play, stop, NARRATION, STEP } });
