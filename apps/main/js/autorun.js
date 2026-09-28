/* =========================================================================
   自動展演：按一次「▶ 自動展演」，01 → 05 整場跑完
   -------------------------------------------------------------------------
   01 前言介紹 → 02 黃金30秒 → 03 逃生動線（隨機兩條）→ 04 先行預防（隨機兩個主題）
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
  countdown: 32,        // 黃金30秒：倒數 30 秒 + 收尾
  routeIntroHold: 1.2,  // 動線頁進場旁白之後的緩衝
  routeCount: 2,        // 隨機示範幾條動線
  routeStart: 4,        // 按下切換之後，等介面離開綠色（新的一條開跑）最久等多久
  routeTimeout: 25,     // 等通關（轉綠）最久等多久，逾時就放行
  routeClearHold: 3.5,  // 通關畫面停多久
  topicCount: 2,        // 隨機看幾個科普主題
  topicSettle: 1.6,     // 點了災害之後等主題按鈕長出來
  topicHold: 26,        // 每個主題停多久（最長的 fire-evacuation 是 24.98 秒）
  preventionEnter: 3,   // 進科普頁等模型載入
  outroHold: 2.2,       // 結語頁跟前言頁一樣有收尾停頓＋0.93 倍速，緩衝要留夠
};

const STOP = Symbol('stop');
let current = 0;        // 每按一次 +1；awaits 醒來發現變了就中止
let timer = null;
let button = null;

const rand = (n) => Math.floor(Math.random() * n);
const $$ = (sel) => [...document.querySelectorAll(sel)];

function sleep(seconds, mine) {
  return new Promise((resolve, reject) => {
    clearTimeout(timer);
    timer = setTimeout(() => (mine === current ? resolve() : reject(STOP)), seconds * 1000);
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
const isGreen = () => document.documentElement.dataset.theme === 'green';
const page = () => document.querySelector('.page.is-active')?.dataset.page;

function setRunning(on) {
  if (!button) return;
  button.textContent = on ? '■ 停止展演' : '▶ 自動展演';
  button.classList.toggle('is-running', on);
  document.documentElement.classList.toggle('is-autorun', on);
}

function stop() {
  current += 1;            // 讓所有還在等的 await 醒來時中止
  clearTimeout(timer);
  setRunning(false);
}

async function play() {
  const mine = ++current;
  setRunning(true);
  try {
    // 01 前言介紹＝**兩頁**：welcome（開場）旁白播完，narration.js 會自己 navigate('intro')。
    //    導覽上的 01 對這兩頁都會亮（main.js 的 goto 有特別處理），所以只播 welcome 等於沒演完。
    // ⚠️ 不要用計時等 welcome —— 音檔要先下載 + decodeAudioData 算字幕斷點，真正開始播的時間
    //    比 17.6 秒的長度晚，計時一定會提早切走。改成**等它自己換頁到 intro**。
    // ⚠️ 按下按鈕時常常本來就停在 welcome，那時 goto() 會因為 id === current 直接 return，
    //    旁白**不會從頭播**，開場就等於演一半。所以這種情況改叫 narration 的「重播」。
    const onWelcome = page() === 'welcome';
    go('welcome');
    if (onWelcome) document.querySelector('.voice-replay')?.click();
    if (!(await until(() => page() === 'intro', STEP.welcomeMax, mine))) go('intro');  // 旁白沒播成功就自己接手
    await sleep(NARRATION.intro + STEP.introHold, mine);

    // 02 黃金30秒：倒數自己會跑，等它一輪
    // ⚠️ 倒數跑完 main.js 本來就會自動跳首頁（onEnd → WELCOME_TO），比這裡早約 2 秒。
    //    不衝突：goto() 有 `id === current` 就 return，下面那句等於 no-op，不會重跑一次進場。
    go('first');
    await sleep(STEP.countdown, mine);

    // 03 逃生動線：進場旁白之後，隨機示範 routeCount 條
    go('home');
    await sleep(NARRATION.routeIntro + STEP.routeIntroHold, mine);
    for (let i = 0; i < STEP.routeCount; i++) {
      // 「切換逃生動線」本來就會隨機挑一條並避開目前這條，不用自己抽
      document.getElementById('route-next')?.click();
      // ⚠️ 上一條剛通關時主題還是綠的，直接等 isGreen 會立刻成立、整條被跳過。
      //    所以先等它離開綠色（轉紅＝新的一條開跑），再等它轉回綠色。
      await until(() => !isGreen(), STEP.routeStart, mine);
      await until(isGreen, STEP.routeTimeout, mine);   // 跑到出口＝介面轉綠
      await sleep(STEP.routeClearHold, mine);
    }

    // 04 先行預防：隨機挑 topicCount 個主題，盡量不重複同一個災害
    go('prevention');
    await sleep(STEP.preventionEnter, mine);
    let lastDisaster = -1;
    for (let i = 0; i < STEP.topicCount; i++) {
      const disasters = $$('.information-nav > button');
      if (!disasters.length) break;
      let pick = rand(disasters.length);
      if (disasters.length > 1 && pick === lastDisaster) pick = (pick + 1) % disasters.length;
      lastDisaster = pick;
      disasters[pick].click();
      await sleep(STEP.topicSettle, mine);
      const topics = $$('.information-topics button');
      if (topics.length) topics[rand(topics.length)].click();
      await sleep(STEP.topicHold, mine);
    }

    // 05 結語
    go('outro');
    await sleep(NARRATION.outro + STEP.outroHold, mine);
  } catch (error) {
    if (error !== STOP) throw error;
    return;                                   // 被停掉：setRunning 已經在 stop() 做過
  }
  if (mine === current) setRunning(false);    // 正常跑完
}

/* ---------- 掛上按鈕 ----------
   ⚠️ .page-nav 是 information.js 在模組載入時建的，這支可能比它早跑，
      所以用 MutationObserver 等它出現，不要假設當下就在。 */
function mount(nav) {
  if (button) return;
  button = document.createElement('button');
  button.type = 'button';
  button.className = 'autorun-toggle';
  button.textContent = '▶ 自動展演';
  button.onclick = () => (document.documentElement.classList.contains('is-autorun') ? stop() : play());
  nav.prepend(button);
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
