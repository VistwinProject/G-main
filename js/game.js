import { LEVELS } from './game-levels.js';
export function createGame({ enter, stop, ready, play, scene, configure }) {
  const app = document.getElementById('app');
  const panel = document.createElement('section');
  panel.className = 'game-panel';
  panel.hidden = true;
  panel.setAttribute('aria-label', '30秒逃生挑戰');
  app.append(panel);
  let active = false, phase = 'intro', timer = null, deadline = 0;
  let remaining = 30, generation = 0;
  let levelIndex = 0, scores = [];
  const level = () => LEVELS[levelIndex];
  const clearTimer = () => { clearInterval(timer); timer = null; };
  function close() {
    if (!active) return;
    active = false; generation++; clearTimer(); stop();
    delete app.dataset.game;
    panel.hidden = true;
    document.getElementById('game-open').focus();
  }
  function frame(content, step = '任務簡報') {
    delete panel.dataset.preview;
    panel.innerHTML = `<header class="game-header"><span>ESCAPE LAB / 互動試作</span><button type="button" data-action="close" aria-label="退出挑戰">×</button></header>
      <div class="game-meta"><span>第 ${levelIndex + 1} / 2 關 · ${step}</span><span class="game-clock" aria-label="剩餘挑戰時間">${remaining}<small> 秒</small></span></div>
      <div class="game-content">${content}</div><p class="game-disclaimer">模擬情境・倒數為作答時間，非真實火災安全時限。</p>`;
    const heading = panel.querySelector('h2');
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  }
  function intro() {
    clearTimer(); generation++; stop(); configure(level()); phase = 'intro'; remaining = level().seconds;
    scene('intro');
    frame(`<p class="game-kicker">兩階逃生挑戰</p><h2>${level().title}</h2>
      <p>${level().brief}</p>
      <div class="game-brief"><b>本關 ${remaining} 秒・一次選擇</b><span>滑過預覽　→　點選看結果</span><span>兩關換位置、換封鎖方向。共 2 分，不比誰衝得快。</span></div>
      <button class="game-primary" data-action="start">開始第 ${levelIndex + 1} 關 →</button>
      <p class="game-note" role="status"></p>`);
  }
  function result(kind) {
    clearTimer(); phase = 'result';
    scores[levelIndex] = kind === 'great' ? 1 : 0;
    if (kind === 'blocked') scene('blocked');
    const outcomes = {
      great: ['觀察到位，判斷完成', '1 / 1', `你的判斷引導到 ${level().safe} 出口。${level().feedback}`],
      blocked: ['這條路，需要重新判斷', '0 / 1', `本關 ${level().blocked} 方向已封鎖，可通行方向是 ${level().safe}。${level().feedback}`],
      timeout: ['時間到，先看懂再試一次', '未完成', '本輪作答時間結束。觀察警報資訊與路線狀態，再重試；不需要靠亂猜搶時間。'],
    };
    const [title, score, detail] = outcomes[kind];
    frame(`<p class="game-kicker">${kind === 'great' ? '挑戰完成' : '學習回饋'}</p><h2>${title}</h2>
      <div class="game-score">${score}<small>判斷完成度</small></div><p>${detail}</p>
      <button class="game-primary" data-action="next">${levelIndex < 1 ? '下一關 →' : '查看兩關總成績 →'}</button>
      <button class="game-secondary" data-action="retry">重試本關 ↻</button>`, '本關結果');
  }
  function tick() {
    remaining = Math.max(0, Math.ceil((deadline - performance.now()) / 1000));
    const clock = panel.querySelector('.game-clock');
    if (clock) { clock.innerHTML = `${remaining}<small> 秒</small>`; clock.classList.toggle('is-urgent', remaining <= 10); }
    if (!remaining) result('timeout');
  }
  function start() {
    if (!ready()) { panel.querySelector('.game-note').textContent = '3D 動線載入中，請稍候再開始。'; return; }
    phase = 'observe'; deadline = performance.now() + level().seconds * 1000;
    scene('observe');
    const good = `<button class="game-choice" data-action="observe"><b>${level().good}</b><span>${level().goodNote}</span></button>`;
    const bad = `<button class="game-choice" data-action="rush"><b>${level().bad}</b><span>${level().badNote}</span></button>`;
    frame(`<p class="game-kicker">${level().title}</p><h2>${level().question}</h2><p>滑過選項，預覽路線；點選才正式作答。</p>
      ${levelIndex === 1 ? bad + good : good + bad}
      <p class="game-preview-hint" role="status">比較兩個選擇，看看 3D 會如何回應。</p>`, '本關選擇');
    timer = setInterval(tick, 200);
  }
  function preview(button) {
    if (!active || phase !== 'observe') return;
    const action = button?.dataset.action;
    const state = action === 'observe' ? 'safe' : action === 'rush' ? 'danger' : '';
    if ((panel.dataset.preview || '') === state) return;
    panel.dataset.preview = state;
    scene(state ? `preview-${state}` : 'observe');
    const hint = panel.querySelector('.game-preview-hint');
    if (hint) hint.textContent = state === 'safe'
      ? `✓ 正確方向預覽：確認資訊後，辨識 ${level().safe} 路線。尚未作答。`
      : state === 'danger' ? `× 錯誤方向預覽：${level().blocked} 方向已被煙霧封鎖。尚未作答。`
      : '比較兩個選擇，看看 3D 會如何回應。';
  }
  panel.addEventListener('pointerover', event => {
    if (event.pointerType !== 'touch') preview(event.target.closest('.game-choice'));
  });
  panel.addEventListener('pointerout', event => {
    if (event.pointerType !== 'touch' && event.target.closest('.game-choice') &&
        !event.target.closest('.game-choice').contains(event.relatedTarget)) {
      preview(event.relatedTarget?.closest?.('.game-choice'));
    }
  });
  panel.addEventListener('focusin', event => preview(event.target.closest('.game-choice')));
  panel.addEventListener('focusout', event => {
    if (event.target.closest('.game-choice')) preview(event.relatedTarget?.closest?.('.game-choice'));
  });
  panel.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!active || !action) return;
    if (action === 'close') return close();
    if (phase === 'observe' && performance.now() >= deadline) return result('timeout');
    if (phase === 'intro' && action === 'start') return start();
    if (phase === 'result' && action === 'retry') return intro();
    if (phase === 'result' && action === 'next') {
      if (levelIndex < 1) { levelIndex++; return intro(); }
      phase = 'summary';
      frame(`<p class="game-kicker">兩階挑戰完成</p><h2>每次判斷，都有進步。</h2><div class="game-score">${scores.reduce((a,b)=>a+b,0)} / 2<small>兩關總成績</small></div>
        <p>${LEVELS.map((item,i)=>`${item.title}：${scores[i]} / 1`).join('<br>')}</p>
        <button class="game-primary" data-action="restart">重新挑戰兩關 ↻</button><button class="game-secondary" data-action="close">返回展示</button>`, '總成績');
      return;
    }
    if (phase === 'summary' && action === 'restart') { levelIndex=0; scores=[]; return intro(); }
    if (phase === 'observe' && ['observe', 'rush'].includes(action)) {
      if (action === 'rush') return result('blocked');
      tick();
      if (phase === 'result') return;
      clearTimer(); phase = 'playing';
      frame(`<p class="game-kicker">選擇已送出</p><h2>跟著動線，<br>看見你的選擇。</h2><p>3D 正在示範通往 ${level().safe} 出口的路線。播放完成後，查看本關回饋。</p><div class="game-playing">● 路線示範中</div>`, '3D / 路線回放');
      const run = ++generation;
      play(() => { if (active && run === generation) result('great'); });
    }
  });
  document.getElementById('game-open').addEventListener('click', () => {
    if (active) return;
    levelIndex=0; scores=[]; enter(); active = true; app.dataset.game = 'active'; panel.hidden = false; intro();
  });
  document.querySelectorAll('[data-go-page]').forEach(button => button.addEventListener('click', close));
  addEventListener('keydown', (event) => {
    if (active && event.code === 'Escape') { event.preventDefault(); close(); }
  });
  return { isActive: () => active, onPage(id) { if (id !== 'home') close(); } };
}
