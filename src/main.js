import './style.css';
import { createLaundryScene } from './scene.js';
import { LaundryAudio } from './audio.js';
import { createInstallController, registerServiceWorker } from './pwa.js';
import { DEFAULT_SETTINGS, STORAGE_KEY, createState, formatTime, localDay, restoreState, startTimer, pauseTimer, updateTimer, selectMode } from './timer.js';

const icons = {
  play: '<path d="m9 5 11 7-11 7z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M8 5v14M16 5v14" stroke-width="4"/>',
  reset: '<path d="M3 10a9 9 0 1 1 2.7 8M3 4v6h6"/>',
  settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="var(--paper)"/><circle cx="15" cy="17" r="3" fill="var(--paper)"/>',
  install: '<path d="M12 4v11m-4-4 4 4 4-4M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2"/>',
  sound: '<path d="m11 5-6 4H2v6h3l6 4zM15 8a6 6 0 0 1 0 8M18 4a11 11 0 0 1 0 16"/>',
  mute: '<path d="m11 5-6 4H2v6h3l6 4zM16 9l6 6m0-6-6 6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  moon: '<path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"/>',
  laundry: '<rect x="4" y="2" width="16" height="20" rx="3"/><circle cx="12" cy="14" r="5"/><path d="M7 6h1m4 0h5M8 14q2-2 4 0t4 0"/>',
  train: '<rect x="5" y="2" width="14" height="17" rx="4"/><path d="M5 11h14M12 3v8M8 22l2-3m6 3-2-3M8 15h1m6 0h1"/>',
  solar: '<circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="6" transform="rotate(-30 12 12)"/><circle cx="19" cy="6" r="1.5" fill="var(--paper)"/>',
  aquarium: '<path d="M3 4h18v16H3zM3 7h18m-7 7q-4-5-7 0 3 5 7 0l3 2v-4zM19 10h.01"/>',
  coffee: '<path d="M5 9h12v6a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5zm12 1h2a3 3 0 0 1 0 6h-2M3 23h17M8 5V2m5 3V2"/>',
  oven: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 8h18M7 6h.01M11 6h.01M7 11h10v7H7zM9 14h6"/>',
  rain: '<rect x="3" y="2" width="18" height="20" rx="2"/><path d="M12 2v20M3 12h18M7 6l-1 3m11-3-1 3M8 16l-1 3m10-3-1 3"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const tomato = (cls = '') => `<svg class="tomato ${cls}" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 13C7 5 3 24 9 35c5 10 25 11 31-1 6-13-2-27-16-21Z" fill="currentColor"/><path d="m24 16-9-7 8 2 3-7 2 8 9-2-7 7-3-3-3 5Z" fill="#7e9365"/><path d="M15 24q1-5 5-5" fill="none" stroke="#fff4df" stroke-width="3" stroke-linecap="round" opacity=".6"/></svg>`;

const themes = {
  laundry: { name: '작은 세탁소', short: '세탁소', caption: '한 바퀴씩, 나의 속도로.', description: '토마토 친구들이 있는 작은 3D 세탁기', sound: '세탁기', active: '세탁 중' },
  train: { name: '느긋한 기차', short: '기차', caption: '서두르지 않아도, 조금씩 멀리.', description: '나무가 지나는 창밖과 커피가 놓인 작은 3D 기차 객실', sound: '기차', active: '여행 중' },
  solar: { name: '작은 태양계', short: '태양계', caption: '저마다의 궤도, 저마다의 속도.', description: '웃는 태양과 여덟 행성, 지구를 도는 달이 있는 작은 3D 태양계 모형', sound: '우주', active: '공전 중' },
  aquarium: { name: '작은 어항', short: '어항', caption: '가만히 바라보는, 물빛의 시간.', description: '수초 사이를 헤엄치는 세 물고기와 작은 기포가 있는 3D 어항', sound: '물', active: '물멍 중' },
  coffee: { name: '커피 한 잔', short: '커피', caption: '한 방울씩, 여유가 내려와요.', description: '드리퍼에서 커피가 떨어지고 잔에서 김이 피어오르는 작은 3D 커피 테이블', sound: '커피', active: '커피 내리는 중' },
  oven: { name: '작은 오븐', short: '오븐', caption: '천천히 익어가는, 따뜻한 시간.', description: '따뜻한 불빛 아래 빵이 구워지는 작은 3D 오븐', sound: '오븐', active: '빵 굽는 중' },
  rain: { name: '비 오는 창가', short: '창가', caption: '빗소리에 기대어, 잠깐 쉬어가요.', description: '나무 창틀과 화분 너머 유리를 따라 빗방울이 흐르는 작은 3D 창가', sound: '빗', active: '빗소리와 함께' },
};
let theme = 'laundry';

let restored;
let storageAvailable = true;
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  restored = restoreState(saved);
  if (Object.hasOwn(themes, saved?.theme)) theme = saved.theme;
}
catch { restored = { settings: { ...DEFAULT_SETTINGS }, state: createState() }; storageAvailable = false; }
const { settings, state } = restored;
const audio = new LaundryAudio();
const completedOnRestore = updateTimer(state, settings);
let toastTimeout;
let storageWarned = false;

document.querySelector('#app').innerHTML = `
  <header class="site-header">
    <a class="wordmark" href="./" aria-label="laundry time 홈">${tomato()}<span>laundry time<span class="wordmark-dot">.</span></span></a>
    <div class="header-actions">
      <button class="icon-button install-button" id="install-button" aria-label="앱 설치" title="앱 설치" hidden>${icon('install')}</button>
      <button class="icon-button sound-button" aria-label="세탁기 소리 켜기" aria-pressed="false">${icon('mute')}</button>
      <button class="icon-button" id="settings-button" aria-label="타이머 설정">${icon('settings')}</button>
      <a class="icon-button github-link" href="https://github.com/jeiel85/laundry-time" target="_blank" rel="noopener noreferrer" aria-label="GitHub에서 소스 코드 보기" title="GitHub에서 소스 코드 보기"><svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.39-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/></svg></a>
    </div>
  </header>
  <main id="main">
    <h1 class="sr-only">작은 풍경과 함께하는 뽀모도로 타이머</h1>
    <div class="scene-tabs" role="group" aria-label="풍경 선택">
      ${Object.entries(themes).map(([key, item]) => `<button data-theme="${key}" aria-label="${item.name}" aria-pressed="${theme === key}">${icon(key, 'scene-symbol')}<span class="theme-long" aria-hidden="true">${item.name}</span><span class="theme-short" aria-hidden="true">${item.short}</span></button>`).join('')}
    </div>
    <div class="laundry-layout">
      <section class="scene-section" aria-label="토마토 친구들이 있는 작은 3D 세탁기">
        <div id="scene" class="scene"><div class="scene-loader" id="scene-loader"><span class="loader-drum"></span>${themes[theme].name} 여는 중…</div></div>
        <p class="scene-caption"></p>
      </section>
      <section class="timer-section" aria-label="뽀모도로 타이머">
        <div class="timer-card">
          <div class="mode-tabs" role="group" aria-label="타이머 종류">
            <button data-mode="focus" aria-pressed="true">집중</button>
            <button data-mode="short" aria-pressed="false">짧은 휴식</button>
            <button data-mode="long" aria-pressed="false">긴 휴식</button>
          </div>
          <div class="timer-display" id="timer-display" role="timer" aria-label="남은 시간">25:00</div>
          <div class="timer-actions">
            <button id="start-button" class="start-button">${icon('play')}<span>세탁 시작</span></button>
            <button id="reset-button" class="reset-button" aria-label="현재 타이머 처음으로">${icon('reset')}</button>
          </div>
        </div>
        <button id="zen-button" class="zen-button" aria-pressed="false">${icon('moon')}<span>그냥 멍 때리기</span></button>
      </section>
    </div>
  </main>
  <dialog id="settings-dialog" aria-labelledby="settings-title">
    <form id="settings-form">
      <div class="dialog-heading"><h2 id="settings-title">타이머 설정</h2><button class="icon-button" type="button" id="close-settings" aria-label="설정 닫기">${icon('close')}</button></div>
      <div class="settings-fields">
        <label>집중 시간 <span><input name="focus" type="number" min="1" max="90" required inputmode="numeric" /> 분</span></label>
        <label>짧은 휴식 <span><input name="short" type="number" min="1" max="60" required inputmode="numeric" /> 분</span></label>
        <label>긴 휴식 <span><input name="long" type="number" min="1" max="60" required inputmode="numeric" /> 분</span></label>
      </div>
      <label class="motion-field"><span>풍경 속 움직임<small>기기의 동작 줄이기 설정도 함께 적용돼요.</small></span><input type="checkbox" name="motion" /></label>
      <p class="settings-footnote">저장하면 현재 타이머가 초기화돼요.</p>
      <button type="submit" class="start-button save-settings">저장</button>
    </form>
  </dialog>
  <div id="toast" role="status" aria-live="polite"></div>
`;

const $ = selector => document.querySelector(selector);
const dialog = $('#settings-dialog');
const form = $('#settings-form');
const installButton = $('#install-button');
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => $('#toast').classList.remove('visible'), 4200);
}
const installController = createInstallController({
  onStateChange({ canInstall }) {
    installButton.hidden = !canInstall;
  },
  onInstalled() {
    toast('앱을 설치했어요. 홈 화면이나 바탕화면에서 바로 열 수 있어요.');
  },
});
installButton.addEventListener('click', () => {
  installController.promptInstall();
});
registerServiceWorker();
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings, state, theme })); }
  catch { storageAvailable = false; }
  if (!storageAvailable && !storageWarned) {
    storageWarned = true;
    toast('이 브라우저에서는 기록을 저장할 수 없어요. 타이머는 계속 사용할 수 있어요.');
  }
}
function finished(mode) {
  if (!mode) return;
  audio.chime();
  toast(mode === 'focus' ? '띵! 집중 완료. 이제 잠깐 쉬어가요.' : '충전 완료! 다시 천천히 시작해볼까요?');
  save();
}
function render() {
  const zen = state.mode === 'zen';
  const display = zen ? 'slow' : formatTime(state.remaining);
  $('#timer-display').textContent = display;
  $('#timer-display').classList.toggle('zen-display', zen);
  $('#timer-display').setAttribute('aria-label', zen ? '시간 없이 멍 때리기' : `남은 시간 ${display}`);
  document.title = zen ? `느긋하게, ${themes[theme].name}` : `${display} · ${state.running ? themes[theme].active : themes[theme].name}`;
  document.body.dataset.theme = theme;
  $('.scene-section').setAttribute('aria-label', themes[theme].description);
  $('.scene-caption').textContent = themes[theme].caption;
  document.querySelectorAll('button[data-theme]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.theme === theme)));
  document.body.dataset.mode = state.mode;
  document.body.classList.toggle('is-running', state.running || zen);
  document.querySelectorAll('button[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === state.mode)));
  $('#start-button').innerHTML = `${icon(zen ? 'arrow' : state.running ? 'pause' : 'play')}<span>${zen ? '타이머로 돌아가기' : state.running ? '일시정지' : state.remaining < settings[state.mode] * 60 ? '계속하기' : '시작'}</span>`;
  $('#reset-button').disabled = zen;
  $('#zen-button').setAttribute('aria-pressed', String(zen));
  $('#zen-button span').textContent = zen ? '타이머로 돌아가기' : '그냥 멍 때리기';
  $('.sound-button').innerHTML = icon(audio.enabled ? 'sound' : 'mute');
  $('.sound-button').setAttribute('aria-label', `${themes[theme].sound} 소리 ${audio.enabled ? '끄기' : '켜기'}`);
  $('.sound-button').setAttribute('aria-pressed', String(audio.enabled));
  audio.setTheme(theme);
  audio.setRunning(state.running || zen);
}

document.querySelectorAll('button[data-theme]').forEach(button => button.addEventListener('click', () => {
  theme = button.dataset.theme;
  save(); render();
}));

async function resumeSound() {
  if (settings.sound && !audio.enabled) {
    try { await audio.enable(true); }
    catch (error) { settings.sound = false; toast(error.message || '소리를 켤 수 없어요. 다시 눌러주세요.'); }
  }
}
async function toggleTimer() {
  if (state.mode === 'zen') selectMode(state, 'focus', settings);
  else if (state.running) finished(pauseTimer(state, settings));
  else {
    // Establish the deadline synchronously, before waiting for audio permissions.
    startTimer(state);
    await resumeSound();
  }
  save(); render();
}
$('#start-button').addEventListener('click', toggleTimer);
$('#reset-button').addEventListener('click', () => {
  selectMode(state, state.mode, settings); save(); render(); toast('새로운 마음으로, 처음부터 준비했어요.');
});
document.querySelectorAll('button[data-mode]').forEach(button => button.addEventListener('click', () => {
  finished(updateTimer(state, settings));
  selectMode(state, button.dataset.mode, settings); save(); render();
}));
$('#zen-button').addEventListener('click', async () => {
  finished(updateTimer(state, settings));
  selectMode(state, state.mode === 'zen' ? 'focus' : 'zen', settings);
  await resumeSound();
  save(); render();
});
$('.sound-button').addEventListener('click', async () => {
  try { await audio.enable(!audio.enabled); settings.sound = audio.enabled; save(); render(); }
  catch (error) { await audio.enable(false); settings.sound = false; save(); render(); toast(error.message || '소리를 켤 수 없어요.'); }
});
$('#settings-button').addEventListener('click', () => {
  for (const key of ['focus', 'short', 'long']) form.elements[key].value = settings[key];
  form.elements.motion.checked = settings.motion;
  dialog.showModal();
});
$('#close-settings').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  finished(updateTimer(state, settings));
  for (const key of ['focus', 'short', 'long']) settings[key] = Number(form.elements[key].value);
  settings.motion = form.elements.motion.checked;
  selectMode(state, state.mode, settings);
  dialog.close(); save(); render(); toast('나만의 집중 시간을 저장했어요.');
});
document.addEventListener('keydown', event => {
  if (dialog.open || /INPUT|TEXTAREA|BUTTON|SELECT|A/.test(event.target.tagName) || event.target.isContentEditable) return;
  if (event.code === 'Space') { event.preventDefault(); if (!event.repeat) toggleTimer(); }
});
let scene;
try {
  scene = createLaundryScene($('#scene'), () => ({
    ...state, theme, motion: settings.motion, display: formatTime(state.remaining),
    progress: state.mode === 'zen' ? null : Math.max(0, Math.min(1, 1 - state.remaining / (settings[state.mode] * 60))),
  }), () => {
    toast('앗, 간지러워요! 조금만 더 돌고 올게요.');
  });
  $('#scene-loader').remove();
} catch (error) {
  console.error('3D scene initialization failed:', error);
  $('#scene-loader').textContent = '3D 화면을 열 수 없어요. 브라우저의 하드웨어 가속을 확인해 주세요. 타이머는 그대로 사용할 수 있어요.';
}
$('#scene').addEventListener('scene-error', event => toast(event.detail));
const interval = setInterval(() => {
  if (state.day !== localDay()) {
    state.day = localDay(); state.sessions = 0; state.focusSeconds = 0; save();
  }
  finished(updateTimer(state, settings)); render();
}, 250);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) { finished(updateTimer(state, settings)); render(); }
});
window.addEventListener('pagehide', save);
if (import.meta.hot) import.meta.hot.dispose(() => { clearInterval(interval); installController.dispose(); scene?.dispose(); audio.context?.close(); });
render(); save(); finished(completedOnRestore);
