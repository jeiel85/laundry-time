import './style.css';
import { createLaundryScene } from './scene.js';
import { LaundryAudio } from './audio.js';
import { DEFAULT_SETTINGS, STORAGE_KEY, createState, formatTime, localDay, restoreState, startTimer, pauseTimer, updateTimer, selectMode } from './timer.js';

const icons = {
  play: '<path d="m9 5 11 7-11 7z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M8 5v14M16 5v14" stroke-width="4"/>',
  reset: '<path d="M3 10a9 9 0 1 1 2.7 8M3 4v6h6"/>',
  settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="var(--paper)"/><circle cx="15" cy="17" r="3" fill="var(--paper)"/>',
  sound: '<path d="m11 5-6 4H2v6h3l6 4zM15 8a6 6 0 0 1 0 8M18 4a11 11 0 0 1 0 16"/>',
  mute: '<path d="m11 5-6 4H2v6h3l6 4zM16 9l6 6m0-6-6 6"/>',
  expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  moon: '<path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const tomato = (cls = '') => `<svg class="tomato ${cls}" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 13C7 5 3 24 9 35c5 10 25 11 31-1 6-13-2-27-16-21Z" fill="currentColor"/><path d="m24 16-9-7 8 2 3-7 2 8 9-2-7 7-3-3-3 5Z" fill="#7e9365"/><path d="M15 24q1-5 5-5" fill="none" stroke="#fff4df" stroke-width="3" stroke-linecap="round" opacity=".6"/></svg>`;

let restored;
let storageAvailable = true;
try { restored = restoreState(JSON.parse(localStorage.getItem(STORAGE_KEY))); }
catch { restored = { settings: { ...DEFAULT_SETTINGS }, state: createState() }; storageAvailable = false; }
const { settings, state } = restored;
const audio = new LaundryAudio();
const completedOnRestore = updateTimer(state, settings);
let immersive = false;
let toastTimeout;
let storageWarned = false;

document.querySelector('#app').innerHTML = `
  <header class="site-header">
    <a class="wordmark" href="./" aria-label="laundry time 홈">${tomato()}<span>laundry time<span class="wordmark-dot">.</span></span></a>
    <span class="header-note">조금 느리게, 조금 보송하게.</span>
    <div class="header-actions">
      <button class="icon-button sound-button" aria-label="세탁기 소리 켜기" aria-pressed="false">${icon('mute')}</button>
      <button class="icon-button" id="settings-button" aria-label="타이머 설정">${icon('settings')}</button>
    </div>
  </header>
  <main id="main">
    <section class="intro" aria-labelledby="main-title">
      <div class="eyebrow"><span class="tiny-flower">✳</span> LITTLE LAUNDRY, LITTLE BREAK</div>
      <h1 id="main-title">마음까지 <span>보송해지는</span> 시간</h1>
      <p>복잡한 생각은 잠깐 넣어두고, 한 번에 하나씩 돌려봐요.</p>
    </section>
    <div class="laundry-layout">
      <section class="scene-section" aria-label="토마토 친구들이 있는 작은 3D 세탁기">
        <div class="scene-topline"><span class="scene-label"><span class="status-dot"></span><span id="scene-state">오늘도 느긋하게 영업 중</span></span><span class="small-script">made for slow days</span></div>
        <div id="scene" class="scene"><div class="scene-loader" id="scene-loader"><span class="loader-drum"></span>작은 세탁소를 여는 중…</div></div>
        <div class="scene-caption"><span class="sparkle">✧</span><p id="scene-caption">오늘의 고민도 같이 넣어둘까요?</p><span class="sparkle last">✧</span></div>
        <button class="poke-hint" id="poke-button">세탁기를 톡 건드려보세요 <span>↗</span></button>
      </section>
      <section class="timer-section" aria-label="뽀모도로 타이머">
        <div class="timer-card">
          <div class="mode-tabs" role="group" aria-label="타이머 종류">
            <button data-mode="focus" aria-pressed="true">집중 세탁</button>
            <button data-mode="short" aria-pressed="false">짧은 휴식</button>
            <button data-mode="long" aria-pressed="false">긴 휴식</button>
          </div>
          <div class="cycle-label"><span id="cycle-symbol">✳</span><span id="cycle-label">한 번에 하나, 가볍게 집중해요</span></div>
          <div class="timer-display" id="timer-display" role="timer" aria-label="남은 시간">25:00</div>
          <div class="progress-track" role="progressbar" aria-label="현재 세탁 진행률" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span id="progress-fill"></span></div>
          <p class="timer-description" id="timer-description">집중할 준비가 되면 돌려주세요.</p>
          <div class="timer-actions">
            <button id="start-button" class="start-button">${icon('play')}<span>세탁 시작</span></button>
            <button id="reset-button" class="reset-button" aria-label="현재 타이머 처음으로">${icon('reset')}</button>
          </div>
          <div class="keyboard-note"><kbd>space</kbd> 시작 / 일시정지</div>
          <div class="session-divider"><span>나의 작은 세탁 기록</span></div>
          <div class="session-stamps" role="group" aria-label="집중 세탁 4회마다 긴 휴식">${[0, 1, 2, 3].map(i => `<span class="session-stamp" data-stamp="${i}">${tomato()}</span>`).join('')}</div>
          <p class="session-note"><strong id="session-count">0</strong>번의 집중 세탁 <span>·</span> 4번 돌리면 길게 쉬어요</p>
        </div>
        <button id="zen-button" class="zen-button" aria-pressed="false">${icon('moon')}<span>아무것도 안 하고, 멍 때리기</span>${icon('arrow')}</button>
      </section>
    </div>
    <section class="bottom-strip" aria-label="오늘의 기록과 보기 설정">
      <div class="daily-record"><span class="record-flower">✳</span><span>오늘의 보송함</span><strong id="daily-minutes">0분</strong><span class="record-divider"></span><span id="daily-message">작은 시작도 충분해요.</span></div>
      <button class="view-button" id="immersive-button" aria-pressed="false">${icon('expand')}<span>몰입해서 보기</span></button>
    </section>
  </main>
  <footer><span>할 일은 가볍게. 마음은 보송하게.</span><span>한 바퀴씩, 나의 속도로 ${icon('heart')}</span></footer>
  <dialog id="settings-dialog" aria-labelledby="settings-title">
    <form id="settings-form">
      <div class="dialog-heading"><div><div class="eyebrow">YOUR LITTLE ROUTINE</div><h2 id="settings-title">나에게 맞는 세탁 코스</h2></div><button class="icon-button" type="button" id="close-settings" aria-label="설정 닫기">${icon('close')}</button></div>
      <p class="dialog-intro">무리하지 말고, 편안한 리듬을 찾아봐요.</p>
      <div class="settings-fields">
        <label>집중 세탁 <span><input name="focus" type="number" min="1" max="90" required inputmode="numeric" /> 분</span></label>
        <label>짧은 휴식 <span><input name="short" type="number" min="1" max="60" required inputmode="numeric" /> 분</span></label>
        <label>긴 휴식 <span><input name="long" type="number" min="1" max="60" required inputmode="numeric" /> 분</span></label>
      </div>
      <label class="motion-field"><span>세탁기 회전과 덜컹거림<small>기기의 동작 줄이기 설정도 함께 적용돼요.</small></span><input type="checkbox" name="motion" /></label>
      <p class="settings-footnote">저장하면 현재 타이머가 처음부터 시작돼요.<br>완료한 세탁 기록은 그대로 보관해요.</p>
      <button type="submit" class="start-button save-settings">내 코스로 저장 ${icon('arrow')}</button>
    </form>
  </dialog>
  <div id="toast" role="status" aria-live="polite"></div>
  <button class="exit-immersive" id="exit-immersive">${icon('close')} 몰입 모드 나가기 <kbd>esc</kbd></button>
`;

const $ = selector => document.querySelector(selector);
const dialog = $('#settings-dialog');
const form = $('#settings-form');
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => $('#toast').classList.remove('visible'), 4200);
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings, state })); }
  catch { storageAvailable = false; }
  if (!storageAvailable && !storageWarned) {
    storageWarned = true;
    toast('이 브라우저에서는 기록을 저장할 수 없어요. 타이머는 계속 사용할 수 있어요.');
  }
}
function finished(mode) {
  if (!mode) return;
  audio.chime();
  toast(mode === 'focus' ? '띵! 집중 세탁 완료. 이제 잠깐 쉬어가요.' : '보송하게 충전 완료! 다음 세탁을 시작해볼까요?');
  save();
}
function render() {
  const zen = state.mode === 'zen';
  const resting = state.mode === 'short' || state.mode === 'long';
  const display = zen ? 'slow' : formatTime(state.remaining);
  $('#timer-display').textContent = display;
  $('#timer-display').classList.toggle('zen-display', zen);
  $('#timer-display').setAttribute('aria-label', zen ? '시간 없이 멍 때리기' : `남은 시간 ${display}`);
  document.title = zen ? '느긋하게, laundry time' : `${display} · ${state.running ? '세탁 중' : 'laundry time'}`;
  document.body.dataset.mode = state.mode;
  document.body.classList.toggle('is-running', state.running || zen);
  document.querySelectorAll('button[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === state.mode)));
  $('#cycle-label').textContent = zen ? '지금은 아무것도 하지 않아도 괜찮아요' : resting ? '쉬는 것도 소중한 루틴이니까요' : '한 번에 하나, 가볍게 집중해요';
  $('#cycle-symbol').textContent = resting || zen ? '☾' : '✳';
  $('#timer-description').textContent = zen ? '시간은 잊고, 돌아가는 세탁기를 구경해요.' : state.running ? resting ? '어깨를 내리고, 한숨 돌려봐요.' : '토마토 친구들이 열심히 돌고 있어요.' : state.remaining < settings[state.mode] * 60 ? '잠깐 멈춰도 괜찮아요. 준비되면 이어가요.' : resting ? '쉬어갈 준비가 되면 눌러주세요.' : '집중할 준비가 되면 돌려주세요.';
  $('#start-button').innerHTML = `${icon(zen ? 'arrow' : state.running ? 'pause' : 'play')}<span>${zen ? '집중하러 돌아가기' : state.running ? '잠깐 멈추기' : resting ? '휴식 시작' : state.remaining < settings.focus * 60 ? '이어서 세탁' : '세탁 시작'}</span>`;
  $('#reset-button').disabled = zen;
  const progress = zen ? 0 : Math.max(0, Math.min(100, (1 - state.remaining / (settings[state.mode] * 60)) * 100));
  $('#progress-fill').style.width = `${progress}%`;
  $('.progress-track').setAttribute('aria-valuenow', String(Math.round(progress)));
  $('#zen-button').setAttribute('aria-pressed', String(zen));
  $('#zen-button span').textContent = zen ? '멍 때리기 끝내고, 집중하러 가기' : '아무것도 안 하고, 멍 때리기';
  $('#scene-state').textContent = zen ? '시간을 잊고, 느긋하게 돌아가요' : state.running ? resting ? '보송한 휴식을 만드는 중' : '마음을 보송하게 세탁 중' : '오늘도 느긋하게 영업 중';
  $('#scene-caption').textContent = zen ? '가만히 바라보는 것도 좋은 시간이니까.' : state.running ? resting ? '잘 쉬어야, 다시 잘 돌아가죠.' : '빙글빙글, 생각은 가볍게.' : '오늘의 고민도 같이 넣어둘까요?';
  $('#session-count').textContent = state.sessions;
  const stamps = state.sessions === 0 ? 0 : ((state.sessions - 1) % 4) + 1;
  document.querySelectorAll('[data-stamp]').forEach(el => el.classList.toggle('filled', Number(el.dataset.stamp) < stamps));
  $('#daily-minutes').textContent = `${Math.floor(state.focusSeconds / 60)}분`;
  $('#daily-message').textContent = state.sessions > 0 ? '차곡차곡, 잘하고 있어요.' : '작은 시작도 충분해요.';
  $('.sound-button').innerHTML = icon(audio.enabled ? 'sound' : 'mute');
  $('.sound-button').setAttribute('aria-label', `세탁기 소리 ${audio.enabled ? '끄기' : '켜기'}`);
  $('.sound-button').setAttribute('aria-pressed', String(audio.enabled));
  audio.setRunning(state.running || zen);
}

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
  dialog.close(); save(); render(); toast('나만의 세탁 코스를 저장했어요.');
});
function toggleImmersive() {
  immersive = !immersive;
  document.body.classList.toggle('immersive', immersive);
  $('#immersive-button').setAttribute('aria-pressed', String(immersive));
  if (immersive) $('#exit-immersive').focus(); else $('#immersive-button').focus();
}
$('#immersive-button').addEventListener('click', toggleImmersive);
$('#exit-immersive').addEventListener('click', toggleImmersive);
document.addEventListener('keydown', event => {
  if (dialog.open || /INPUT|TEXTAREA|BUTTON|SELECT|A/.test(event.target.tagName) || event.target.isContentEditable) return;
  if (event.code === 'Space') { event.preventDefault(); if (!event.repeat) toggleTimer(); }
});
document.addEventListener('keydown', event => { if (event.key === 'Escape' && immersive && !dialog.open) toggleImmersive(); });
let scene;
try {
  scene = createLaundryScene($('#scene'), () => ({ ...state, motion: settings.motion, display: formatTime(state.remaining) }), () => {
    toast('앗, 간지러워요! 조금만 더 돌고 올게요.');
  });
  $('#scene-loader').remove();
} catch (error) {
  console.error('3D scene initialization failed:', error);
  $('#scene-loader').textContent = '3D 화면을 열 수 없어요. 브라우저의 하드웨어 가속을 확인해 주세요. 타이머는 그대로 사용할 수 있어요.';
  $('#poke-button').hidden = true;
}
$('#scene').addEventListener('scene-error', event => toast(event.detail));
$('#poke-button').addEventListener('click', () => $('#scene').click());
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
if (import.meta.hot) import.meta.hot.dispose(() => { clearInterval(interval); scene?.dispose(); audio.context?.close(); });
render(); save(); finished(completedOnRestore);
