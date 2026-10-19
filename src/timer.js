export const DEFAULT_SETTINGS = { focus: 25, short: 5, long: 15, sound: false, motion: true };
export const STORAGE_KEY = 'little-laundry-v1';

export function localDay(now = new Date()) {
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

export function createState(settings = DEFAULT_SETTINGS) {
  return { mode: 'focus', remaining: settings.focus * 60, running: false, deadline: null, sessions: 0, focusSeconds: 0, day: localDay() };
}

export function formatTime(seconds) {
  const value = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

export function startTimer(state, now = Date.now()) {
  if (state.running || state.mode === 'zen') return;
  state.running = true;
  state.deadline = now + state.remaining * 1000;
}

export function updateTimer(state, settings, now = Date.now()) {
  if (!state.running || state.mode === 'zen') return null;
  state.remaining = Math.max(0, Math.ceil((state.deadline - now) / 1000));
  if (state.remaining > 0) return null;
  const completed = state.mode;
  state.running = false;
  state.deadline = null;
  if (state.day !== localDay()) {
    state.day = localDay();
    state.sessions = 0;
    state.focusSeconds = 0;
  }
  if (completed === 'focus') {
    state.sessions += 1;
    state.focusSeconds += settings.focus * 60;
  }
  state.mode = completed === 'focus' ? (state.sessions % 4 === 0 ? 'long' : 'short') : 'focus';
  state.remaining = settings[state.mode] * 60;
  return completed;
}

export function pauseTimer(state, settings, now = Date.now()) {
  const completed = updateTimer(state, settings, now);
  state.running = false;
  state.deadline = null;
  return completed;
}

export function selectMode(state, mode, settings) {
  state.mode = mode;
  state.running = false;
  state.deadline = null;
  state.remaining = mode === 'zen' ? 0 : settings[mode] * 60;
}

export function restoreState(raw, now = Date.now()) {
  const settings = { ...DEFAULT_SETTINGS };
  const state = createState(settings);
  if (!raw || typeof raw !== 'object') return { settings, state };
  for (const key of ['focus', 'short', 'long']) {
    const value = raw.settings?.[key];
    if (Number.isInteger(value) && value >= 1 && value <= (key === 'focus' ? 90 : 60)) settings[key] = value;
  }
  for (const key of ['sound', 'motion']) {
    if (typeof raw.settings?.[key] === 'boolean') settings[key] = raw.settings[key];
  }
  state.remaining = settings.focus * 60;
  const saved = raw.state;
  if (!saved || typeof saved !== 'object') return { settings, state };
  if (['focus', 'short', 'long', 'zen'].includes(saved.mode)) state.mode = saved.mode;
  const maxSeconds = state.mode === 'zen' ? 0 : settings[state.mode] * 60;
  state.remaining = Number.isFinite(saved.remaining) ? Math.min(maxSeconds, Math.max(0, saved.remaining)) : maxSeconds;
  if (saved.day === localDay()) {
    state.sessions = Number.isSafeInteger(saved.sessions) && saved.sessions >= 0 ? saved.sessions : 0;
    state.focusSeconds = Number.isSafeInteger(saved.focusSeconds) && saved.focusSeconds >= 0 ? saved.focusSeconds : 0;
  }
  if (state.mode !== 'zen' && saved.running === true && Number.isFinite(saved.deadline) && saved.deadline <= now + maxSeconds * 1000) {
    state.deadline = saved.deadline;
    state.running = true;
  }
  return { settings, state };
}
